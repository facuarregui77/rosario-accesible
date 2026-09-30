// Lugares base de la app (Rosario). Se pueden sumar más desde la app (modo admin → se guardan en Supabase).
// Lugares REALES de Rosario (nombre, coords y rating de Google reales).
//
// DATOS DE ACCESIBILIDAD — política de honestidad:
//   - Cada criterio puede ser "si" | "no" | null (null = SIN DATOS / a relevar).
//   - Solo se cargan datos REALES y COMPROBABLES. La fuente es OpenStreetMap (ODbL);
//     el campo `wheelchair` ("si"|"parcial") y `src` (link al objeto OSM) permiten verificarlos.
//   - El resto queda en null ("sin datos") y puede completarse manualmente desde la app
//     (relevamiento colaborativo); esas ediciones se guardan en el navegador.
// Nada de esto se inventa: si no hay fuente, dice "sin datos".
const SIN_DATOS = { bano: null, rampa: null, ascensor: null, braille: null, senas: null };
const osm = (type, id) => `https://www.openstreetmap.org/${type}/${id}`;
export const PLACES = [
  { id: "elcairo", name: "El Cairo", type: "bar", lat: -32.9450198, lng: -60.6379576, gRating: 4.2, a: { ...SIN_DATOS } },
  { id: "theclub", name: "The Club", type: "restaurant", lat: -32.9460359, lng: -60.6480806, gRating: 4.2, a: { ...SIN_DATOS } },
  { id: "hoxton", name: "Hoxton House", type: "bar", lat: -32.9576484, lng: -60.6401811, gRating: 4.1, a: { ...SIN_DATOS } },
  { id: "brooklyn", name: "Brooklyn | Crafters' Garden", type: "bar", lat: -32.9412465, lng: -60.6396895, gRating: 4.0, a: { ...SIN_DATOS } },
  { id: "elpatio", name: "El Patio Multiespacio", type: "bar", lat: -32.9497944, lng: -60.647806, gRating: 4.2, a: { ...SIN_DATOS } },
  { id: "craft", name: "CRAFT", type: "bar", lat: -32.9574577, lng: -60.6389648, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "manush", name: "Manush Rosario", type: "bar", lat: -32.9328069, lng: -60.6523911, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "granlago", name: "Gran Lago - Resto Bar", type: "restaurant", lat: -32.955596, lng: -60.6585203, gRating: 4.1, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("node", "12724554649") },
  { id: "losjardines", name: "Los Jardines", type: "restaurant", lat: -32.934148, lng: -60.6433216, gRating: 4.3, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("node", "4513797894") },
  { id: "riomio", name: "Riomío", type: "restaurant", lat: -32.933136, lng: -60.6464189, gRating: 4.2, a: { ...SIN_DATOS } },
  { id: "wembley", name: "Wembley", type: "restaurant", lat: -32.9647649, lng: -60.6217325, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "rockfellers", name: "Rock&Feller's Savoy", type: "restaurant", lat: -32.9446607, lng: -60.636258, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "escauriza", name: "Escauriza Parrilla", type: "restaurant", lat: -32.880531, lng: -60.6883401, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "donferro", name: "Parrilla Don Ferro", type: "restaurant", lat: -32.9343572, lng: -60.6435197, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "rooftop", name: "Rooftop", type: "bar", lat: -32.9320322, lng: -60.6636827, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "roxy", name: "Roxy Club Rosario", type: "boliche", lat: -32.9310926, lng: -60.657733, gRating: 3.8, a: { ...SIN_DATOS } },
  { id: "decada", name: "Década Disco", type: "boliche", lat: -32.9364977, lng: -60.6697425, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "bound", name: "Bound", type: "boliche", lat: -32.9364439, lng: -60.6516674, gRating: 3.6, a: { ...SIN_DATOS } },
  { id: "switch", name: "Switch Club", type: "boliche", lat: -32.939125, lng: -60.6506263, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "lotus", name: "Lotus Night Club", type: "boliche", lat: -32.9292618, lng: -60.6713676, gRating: 3.2, a: { ...SIN_DATOS } },
  { id: "manushcentro", name: "Manush Centro", type: "bar", lat: -32.9445, lng: -60.6425, gRating: 4.5, a: { ...SIN_DATOS } },
  // Instituciones educativas de Rosario (ubicaciones reales)
  { id: "unr_rectorado", name: "UNR · Rectorado", type: "educativo", lat: -32.9468, lng: -60.6393, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "unr_derecho", name: "UNR · Facultad de Derecho", type: "educativo", lat: -32.9447, lng: -60.6485, gRating: 4.5, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "409067763") },
  { id: "unr_economicas", name: "UNR · Cs. Económicas", type: "educativo", lat: -32.9521, lng: -60.6537, gRating: 4.4, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "188609144") },
  { id: "unr_medicina", name: "UNR · Facultad de Medicina", type: "educativo", lat: -32.9486, lng: -60.6595, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "utn_rosario", name: "UTN · Facultad Regional Rosario", type: "educativo", lat: -32.9466, lng: -60.6432, gRating: 4.5, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "187591366") },
  { id: "austral_rosario", name: "Universidad Austral · Rosario", type: "educativo", lat: -32.9398, lng: -60.6470, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "uca_rosario", name: "UCA · Rosario", type: "educativo", lat: -32.9585, lng: -60.6680, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "uai_rosario", name: "UAI · Rosario", type: "educativo", lat: -32.9530, lng: -60.6510, gRating: 4.2, a: { ...SIN_DATOS } },
  // Escuelas y colegios de Rosario (ubicaciones aproximadas)
  { id: "ips_rosario", name: "Instituto Politécnico Superior (UNR)", type: "educativo", lat: -32.9466, lng: -60.6360, gRating: 4.7, a: { ...SIN_DATOS } },
  { id: "superior_comercio", name: "Esc. Superior de Comercio (UNR)", type: "educativo", lat: -32.9495, lng: -60.6360, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "normal_1", name: "Escuela Normal Superior N°1 Avellaneda", type: "educativo", lat: -32.9479, lng: -60.6386, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "normal_2", name: "Escuela Normal N°2 J. M. Gutiérrez", type: "educativo", lat: -32.9490, lng: -60.6470, gRating: 4.3, a: { ...SIN_DATOS }, wheelchair: "parcial", src: osm("way", "409067764") },
  { id: "lasalle", name: "Colegio La Salle Rosario", type: "educativo", lat: -32.9520, lng: -60.6560, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "inmaculada", name: "Colegio Inmaculada Concepción", type: "educativo", lat: -32.9430, lng: -60.6420, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "sanbartolome", name: "Colegio San Bartolomé", type: "educativo", lat: -32.9550, lng: -60.6580, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "dante", name: "Colegio Dante Alighieri", type: "educativo", lat: -32.9505, lng: -60.6500, gRating: 4.4, a: { ...SIN_DATOS } },
  // Clubes deportivos y gimnasios de Rosario (ubicaciones reales)
  { id: "central", name: "Club Atlético Rosario Central", type: "deportivo", lat: -32.9080, lng: -60.6303, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "newells", name: "Club Atlético Newell's Old Boys", type: "deportivo", lat: -32.9582, lng: -60.6655, gRating: 4.6, a: { ...SIN_DATOS }, wheelchair: "parcial", src: osm("way", "1375044787") },
  { id: "regatas", name: "Club de Regatas Rosario", type: "deportivo", lat: -32.9286, lng: -60.6281, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "gimnasia_ros", name: "Club Gimnasia y Esgrima de Rosario", type: "deportivo", lat: -32.9499, lng: -60.6790, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "provincial", name: "Club Atlético Provincial", type: "deportivo", lat: -32.9618, lng: -60.6520, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "plaza_jewell", name: "Club Atlético del Rosario (Plaza Jewell)", type: "deportivo", lat: -32.9466, lng: -60.6700, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "nautico_ave", name: "Club Náutico Avellaneda", type: "deportivo", lat: -32.8830, lng: -60.6960, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "megatlon", name: "Megatlón Rosario", type: "deportivo", lat: -32.9445, lng: -60.6390, gRating: 4.2, a: { ...SIN_DATOS } },
  { id: "sportclub", name: "SportClub Rosario", type: "deportivo", lat: -32.9486, lng: -60.6470, gRating: 4.1, a: { ...SIN_DATOS } },
  { id: "always_ready", name: "Always Ready Gym", type: "deportivo", lat: -32.9412, lng: -60.6520, gRating: 4.3, a: { ...SIN_DATOS } },
  // Centros culturales de Rosario (ubicaciones reales)
  { id: "cc_fontanarrosa", name: "Centro Cultural Roberto Fontanarrosa", type: "cultural", lat: -32.9476, lng: -60.6304, gRating: 4.6, a: { ...SIN_DATOS }, wheelchair: "parcial", src: osm("way", "187592426") },
  { id: "cc_parque_espana", name: "Centro Cultural Parque de España", type: "cultural", lat: -32.9407, lng: -60.6283, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "cc_lavarden", name: "Plataforma Lavardén", type: "cultural", lat: -32.9519, lng: -60.6361, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "cec", name: "Centro de Expresiones Contemporáneas (CEC)", type: "cultural", lat: -32.9268, lng: -60.6286, gRating: 4.4, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "186984803") },
  { id: "cc_la_toma", name: "Centro Cultural La Toma", type: "cultural", lat: -32.9543, lng: -60.6533, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "distrito_siete", name: "Distrito Siete", type: "cultural", lat: -32.9606, lng: -60.6486, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "cc_lumiere", name: "Centro Cultural Cine Lumière", type: "cultural", lat: -32.9486, lng: -60.6340, gRating: 4.5, a: { ...SIN_DATOS } },
  // Salud (ubicaciones y dato de accesibilidad reales de OpenStreetMap)
  { id: "hosp_centenario", name: "Hospital Provincial del Centenario", type: "salud", lat: -32.938543, lng: -60.664759, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "190050427") },
  { id: "heca", name: "Hospital de Emergencias Dr. Clemente Álvarez (HECA)", type: "salud", lat: -32.952783, lng: -60.670521, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "304102717") },
  { id: "hosp_provincial", name: "Hospital Provincial de Rosario", type: "salud", lat: -32.956172, lng: -60.63106, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "383917122") },
  { id: "hosp_italiano", name: "Hospital Italiano Garibaldi", type: "salud", lat: -32.970095, lng: -60.646303, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "414243785") },
  { id: "hosp_espanol", name: "Hospital Español", type: "salud", lat: -32.973801, lng: -60.645766, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "475554302") },
  { id: "sanatorio_parque", name: "Sanatorio Parque", type: "salud", lat: -32.944263, lng: -60.653745, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("node", "4030806363") },
  { id: "sanatorio_ninos", name: "Sanatorio de Niños", type: "salud", lat: -32.944224, lng: -60.654669, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("node", "4030806362") },
  // Transporte (ubicaciones reales; accesibilidad a relevar)
  { id: "terminal", name: "Terminal de Ómnibus Mariano Moreno", type: "transporte", lat: -32.9606, lng: -60.6790, a: { ...SIN_DATOS } },
  { id: "est_rosario_norte", name: "Estación Rosario Norte", type: "transporte", lat: -32.930733, lng: -60.657531, a: { ...SIN_DATOS } },
  { id: "aeropuerto", name: "Aeropuerto Internacional de Rosario (Islas Malvinas)", type: "transporte", lat: -32.9036, lng: -60.7846, a: { ...SIN_DATOS } },
  // Gobierno / trámites
  { id: "palacio_leones", name: "Municipalidad de Rosario (Palacio de los Leones)", type: "gobierno", lat: -32.947129, lng: -60.632202, a: { ...SIN_DATOS }, wheelchair: "no", src: osm("way", "187197923") },
  { id: "concejo", name: "Concejo Municipal de Rosario", type: "gobierno", lat: -32.9483, lng: -60.63011, a: { ...SIN_DATOS } },
  // Espacios verdes
  { id: "parque_independencia", name: "Parque Independencia", type: "verde", lat: -32.9636, lng: -60.6755, a: { ...SIN_DATOS } },
  { id: "parque_urquiza", name: "Parque Urquiza", type: "verde", lat: -32.957749, lng: -60.623346, a: { ...SIN_DATOS } },
  { id: "parque_italia", name: "Parque Italia", type: "verde", lat: -32.97208, lng: -60.624632, a: { ...SIN_DATOS } },
  { id: "plaza_montenegro", name: "Plaza Montenegro", type: "verde", lat: -32.9476, lng: -60.6386, a: { ...SIN_DATOS } },
  // ===== Lugares emblemáticos agregados (ubicaciones reales de OpenStreetMap; wheelchair/src verificables) =====
  // Cultural
  { id: "museo_castagnino", name: "Museo Castagnino (Bellas Artes)", type: "cultural", lat: -32.953872, lng: -60.656595, a: { ...SIN_DATOS } },
  { id: "macro", name: "Museo de Arte Contemporáneo (MACRO)", type: "cultural", lat: -32.930124, lng: -60.650628, a: { ...SIN_DATOS } },
  { id: "museo_marc", name: "Museo Histórico Provincial Julio Marc", type: "cultural", lat: -32.956671, lng: -60.659848, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "186904987") },
  { id: "museo_memoria", name: "Museo de la Memoria", type: "cultural", lat: -32.944304, lng: -60.651009, a: { ...SIN_DATOS } },
  { id: "teatro_circulo", name: "Teatro El Círculo", type: "cultural", lat: -32.952543, lng: -60.635059, a: { ...SIN_DATOS } },
  { id: "teatro_comedia", name: "Teatro La Comedia", type: "cultural", lat: -32.948058, lng: -60.640207, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("node", "4549337118") },
  { id: "teatro_vorterix", name: "Teatro Vorterix Rosario", type: "cultural", lat: -32.933611, lng: -60.669631, a: { ...SIN_DATOS } },
  { id: "monumento_bandera", name: "Monumento Nacional a la Bandera", type: "cultural", lat: -32.947587, lng: -60.630524, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("relation", "6804977") },
  { id: "casa_che", name: "Casa natal de Ernesto Che Guevara", type: "cultural", lat: -32.942117, lng: -60.640103, a: { ...SIN_DATOS } },
  // Educativo
  { id: "ucel", name: "Universidad UCEL", type: "educativo", lat: -32.956198, lng: -60.644333, a: { ...SIN_DATOS } },
  { id: "univ_gran_rosario", name: "Universidad del Gran Rosario", type: "educativo", lat: -32.951308, lng: -60.644125, a: { ...SIN_DATOS } },
  { id: "fceia", name: "UNR · Cs. Exactas, Ingeniería y Agrimensura", type: "educativo", lat: -32.958963, lng: -60.628577, a: { ...SIN_DATOS, bano: "no" }, wheelchair: "si", src: osm("way", "383917146") },
  // Salud
  { id: "hosp_ninos_vilela", name: "Hospital de Niños Víctor J. Vilela", type: "salud", lat: -32.968649, lng: -60.654601, a: { ...SIN_DATOS } },
  { id: "hosp_saenz_pena", name: "Hospital Roque Sáenz Peña", type: "salud", lat: -32.999247, lng: -60.646419, a: { ...SIN_DATOS } },
  { id: "sanatorio_mujer", name: "Sanatorio de la Mujer", type: "salud", lat: -32.945904, lng: -60.657868, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "1200690659") },
  { id: "hosp_privado", name: "Hospital Privado de Rosario", type: "salud", lat: -32.964599, lng: -60.650557, a: { ...SIN_DATOS, bano: "si" }, wheelchair: "parcial", src: osm("way", "489463349") },
  { id: "cemar", name: "CEMAR (Especialidades Médicas)", type: "salud", lat: -32.946405, lng: -60.651850, a: { ...SIN_DATOS } },
  { id: "hosp_carrasco", name: "Hospital Intendente Carrasco", type: "salud", lat: -32.946424, lng: -60.681742, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "475554308") },
  // Espacios verdes
  { id: "parque_espana", name: "Parque de España", type: "verde", lat: -32.939808, lng: -60.636117, a: { ...SIN_DATOS } },
  { id: "parque_scalabrini", name: "Parque Scalabrini Ortiz", type: "verde", lat: -32.930017, lng: -60.667668, a: { ...SIN_DATOS } },
  { id: "parque_colectividades", name: "Parque de las Colectividades", type: "verde", lat: -32.932318, lng: -60.647165, a: { ...SIN_DATOS } },
  { id: "parque_moreno", name: "Parque Mariano Moreno", type: "verde", lat: -32.939027, lng: -60.675550, a: { ...SIN_DATOS } },
  { id: "plaza_san_martin", name: "Plaza San Martín", type: "verde", lat: -32.943635, lng: -60.649713, a: { ...SIN_DATOS } },
  { id: "plaza_sarmiento", name: "Plaza Sarmiento", type: "verde", lat: -32.948971, lng: -60.642402, a: { ...SIN_DATOS } },
  { id: "plaza_25mayo", name: "Plaza 25 de Mayo", type: "verde", lat: -32.947081, lng: -60.633218, a: { ...SIN_DATOS } },
  { id: "plaza_pringles", name: "Plaza Pringles", type: "verde", lat: -32.945096, lng: -60.644353, a: { ...SIN_DATOS } },
];
