// ---- Viaje en colectivo (estimado) con los recorridos de OpenStreetMap ----
// Busca qué línea (o qué combinación de dos líneas) conviene para ir de A a B: cuánto se camina hasta la
// parada, dónde subir, dónde bajar y cuánto tarda en total. No hay horarios públicos de Rosario, así que el
// tiempo es una estimación: velocidad promedio del colectivo y una espera típica en la parada.

const VEL_PIE = 1.2;          // m/s caminando (unos 4,3 km/h, tranquilo)
const DESVIO = 1.3;           // las calles no van en línea recta: se camina un 30% más que la distancia directa
const VEL_COLE = 4.4;         // m/s del colectivo en la ciudad, con paradas y semáforos (unos 16 km/h)
const ESPERA = 8 * 60;        // espera típica en la parada (segundos)
const MAX_PIE = 800;          // hasta cuánto se camina hasta / desde una parada (metros en línea recta)
const MAX_TRASBORDO = 300;    // distancia máxima a pie entre dos paradas para combinar

const rad = Math.PI / 180;
export const distancia = (a, b) => {
  const x = (b[1] - a[1]) * rad * Math.cos(((a[0] + b[0]) / 2) * rad), y = (b[0] - a[0]) * rad;
  return Math.sqrt(x * x + y * y) * 6371000;
};
const pie = (m) => (m * DESVIO) / VEL_PIE;

let datos = null;
// El archivo de recorridos (unos 370 KB) se baja recién la primera vez que alguien pide un viaje en colectivo
export async function cargarLineas() {
  if (!datos) datos = (await import("../data/colectivos.json")).default.lineas;
  return datos;
}

// Tramo del recorrido entre dos paradas (para dibujarlo en el mapa)
function tramo(linea, i, j) {
  const a = linea.paradas[i], b = linea.paradas[j];
  return [[a[0], a[1]], ...linea.forma.filter((p) => p[2] > a[3] && p[2] < b[3]).map((p) => [p[0], p[1]]), [b[0], b[1]]];
}
// Las paradas de Rosario llevan su número oficial (el de "Cuándo llega"); le sumamos la calle donde está
const nombreParada = (p) => {
  const nombre = p[2] ? (/^\d+$/.test(p[2]) ? `parada ${p[2]}` : p[2]) : "la parada";
  return p[4] && !nombre.includes(p[4]) ? `${nombre} (${p[4]})` : nombre;
};
const CASTIGO_TRASBORDO = 4 * 60; // para ordenar: a igual tiempo, mejor sin combinar

// Plan: devuelve hasta 3 opciones ordenadas por tiempo total. Cada opción = { total, caminaM, tramos: [...] }.
export function planificar(lineas, origen, destino) {
  const opciones = [];
  // Para cada línea: llegada a cada parada si subo cerca del origen (A) y tiempo desde cada parada hasta el destino (B)
  const info = lineas.map((l) => {
    const n = l.paradas.length, cum = l.paradas.map((p) => p[3]);
    const dO = l.paradas.map((p) => distancia(origen, [p[0], p[1]]));
    const dD = l.paradas.map((p) => distancia([p[0], p[1]], destino));
    // A[k] = segundos desde que salgo hasta llegar a la parada k arriba de esta línea (subiendo en subeA[k])
    const A = new Array(n).fill(Infinity), subeA = new Array(n).fill(-1);
    let mejor = Infinity, mejorI = -1;
    for (let k = 0; k < n; k++) {
      if (mejorI >= 0) { A[k] = mejor + cum[k] / VEL_COLE; subeA[k] = mejorI; }
      if (dO[k] <= MAX_PIE) { const v = pie(dO[k]) + ESPERA - cum[k] / VEL_COLE; if (v < mejor) { mejor = v; mejorI = k; } }
    }
    // B[m] = segundos desde que estoy arriba en la parada m hasta llegar al destino (bajando en bajaB[m])
    const B = new Array(n).fill(Infinity), bajaB = new Array(n).fill(-1);
    mejor = Infinity; mejorI = -1;
    for (let m = n - 1; m >= 0; m--) {
      if (mejorI >= 0) { B[m] = mejor - cum[m] / VEL_COLE; bajaB[m] = mejorI; }
      if (dD[m] <= MAX_PIE) { const v = pie(dD[m]) + cum[m] / VEL_COLE; if (v < mejor) { mejor = v; mejorI = m; } }
    }
    return { l, cum, dO, dD, A, subeA, B, bajaB, usaA: subeA.some((x) => x >= 0), usaB: bajaB.some((x) => x >= 0) };
  });

  const armarTramoCole = (x, i, j) => ({
    tipo: "colectivo", ref: x.l.ref, nombre: x.l.nombre, hacia: x.l.hasta, color: x.l.color,
    sube: nombreParada(x.l.paradas[i]), baja: nombreParada(x.l.paradas[j]), paradas: j - i,
    m: x.cum[j] - x.cum[i], seg: (x.cum[j] - x.cum[i]) / VEL_COLE, forma: tramo(x.l, i, j),
    desdeP: [x.l.paradas[i][0], x.l.paradas[i][1]], hastaP: [x.l.paradas[j][0], x.l.paradas[j][1]],
  });

  // 1) Una sola línea
  for (const x of info) {
    if (!x.usaA || !x.usaB) continue;
    let mejor = Infinity, bi = -1, bj = -1;
    for (let j = 0; j < x.l.paradas.length; j++) {
      if (x.dD[j] > MAX_PIE || x.subeA[j] < 0) continue;
      const t = x.A[j] + pie(x.dD[j]);
      if (t < mejor && x.cum[j] - x.cum[x.subeA[j]] > 300) { mejor = t; bi = x.subeA[j]; bj = j; }
    }
    if (bi < 0) continue;
    const c = armarTramoCole(x, bi, bj);
    opciones.push({ total: mejor, lineas: [x.l.ref], caminaM: (x.dO[bi] + x.dD[bj]) * DESVIO, tramos: [
      { tipo: "pie", m: x.dO[bi] * DESVIO, seg: pie(x.dO[bi]), hacia: c.sube, forma: [origen, c.desdeP] },
      { tipo: "espera", seg: ESPERA },
      c,
      { tipo: "pie", m: x.dD[bj] * DESVIO, seg: pie(x.dD[bj]), hacia: "el destino", forma: [c.hastaP, destino] },
    ] });
  }

  // 2) Dos líneas con un trasbordo (cuando ninguna sola anda, o si ahorra tiempo)
  const conA = info.filter((x) => x.usaA), conB = info.filter((x) => x.usaB);
  // grilla de paradas de las líneas que llegan al destino, para buscar trasbordos cercanos rápido
  const grilla = new Map(), celda = (p) => `${Math.floor(p[0] / 0.003)},${Math.floor(p[1] / 0.003)}`;
  conB.forEach((x, bi) => x.l.paradas.forEach((p, m) => {
    if (!isFinite(x.B[m])) return;
    const k = celda(p); if (!grilla.has(k)) grilla.set(k, []); grilla.get(k).push([bi, m]);
  }));
  const mejorPar = new Map();
  for (const xa of conA) {
    xa.l.paradas.forEach((p, k) => {
      if (!isFinite(xa.A[k]) || xa.cum[k] - xa.cum[xa.subeA[k]] < 800) return;
      const [cy, cx] = celda(p).split(",").map(Number);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        for (const [bi, m] of grilla.get(`${cy + dy},${cx + dx}`) || []) {
          const xb = conB[bi]; if (xb.l.ref === xa.l.ref) continue;
          const d = distancia([p[0], p[1]], [xb.l.paradas[m][0], xb.l.paradas[m][1]]);
          if (d > MAX_TRASBORDO || xb.cum[xb.bajaB[m]] - xb.cum[m] < 800) continue;
          const t = xa.A[k] + pie(d) + ESPERA + xb.B[m];
          const clave = xa.l.ref + ">" + xb.l.ref;
          if (!mejorPar.has(clave) || t < mejorPar.get(clave).t) mejorPar.set(clave, { t, xa, k, xb, m, d });
        }
      }
    });
  }
  for (const { t, xa, k, xb, m, d } of mejorPar.values()) {
    const i = xa.subeA[k], j = xb.bajaB[m];
    const c1 = armarTramoCole(xa, i, k), c2 = armarTramoCole(xb, m, j);
    opciones.push({ total: t, lineas: [xa.l.ref, xb.l.ref], caminaM: (xa.dO[i] + d + xb.dD[j]) * DESVIO, tramos: [
      { tipo: "pie", m: xa.dO[i] * DESVIO, seg: pie(xa.dO[i]), hacia: c1.sube, forma: [origen, c1.desdeP] },
      { tipo: "espera", seg: ESPERA },
      c1,
      { tipo: "pie", m: d * DESVIO, seg: pie(d), hacia: c2.sube, forma: [c1.hastaP, c2.desdeP], trasbordo: true },
      { tipo: "espera", seg: ESPERA },
      c2,
      { tipo: "pie", m: xb.dD[j] * DESVIO, seg: pie(xb.dD[j]), hacia: "el destino", forma: [c2.hastaP, destino] },
    ] });
  }

  // Mejores primero; sin repetir la misma línea (ida/vuelta o variantes) ni combinaciones mucho peores
  const orden = (o) => o.total + (o.lineas.length - 1) * CASTIGO_TRASBORDO;
  opciones.sort((a, b) => orden(a) - orden(b));
  const vistas = new Set(), elegidas = [];
  const base = opciones.length ? opciones[0].total : 0;
  for (const o of opciones) {
    // misma línea aunque cambie la variante o el sentido (122 Roja / Verde, 145 133 Soldini / Cabin 9…)
    const clave = o.lineas.map((r) => r.split(" ")[0].replace(/[A-Z]+$/i, "")).join(">");
    if (vistas.has(clave)) continue;
    if (o.lineas.length > 1 && o.total > base + 20 * 60) continue;
    vistas.add(clave); elegidas.push(o);
    if (elegidas.length === 3) break;
  }
  return { opciones: elegidas, aPie: pie(distancia(origen, destino)) };
}
