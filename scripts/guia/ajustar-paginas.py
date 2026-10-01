# AJUSTAR PÁGINAS DE LA GUÍA
# Busca el alto de cada captura de guia.html para que ninguna página (salvo la última) quede con espacio
# en blanco al pie. Prueba varios altos por captura con Chrome (6 a la vez), mide el hueco de cada página
# y guarda en guia.html el bloque <style id="ajustes"> con la mejor combinación. Tarda entre 5 y 15 minutos.
#
# Cuándo correrlo: después de cambiar textos o capturas de la guía (si aparecen páginas con hueco).
# Requisitos: Python con pypdfium2 y numpy (pip install pypdfium2 numpy) y Google Chrome.
# Uso: python ajustar-paginas.py   (desde esta carpeta). Después, doble clic en "GENERAR PDF.bat".
import subprocess, os, re, sys, time, threading, shutil
from concurrent.futures import ThreadPoolExecutor
import pypdfium2 as pdfium
import numpy as np

GDIR = os.path.dirname(os.path.abspath(__file__)).replace(os.sep, '/') + '/'
G = GDIR + 'guia.html'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
TMP = os.path.join(os.environ.get('TEMP', GDIR), 'ajustar-guia')
os.makedirs(TMP, exist_ok=True)
PT = 72 / 25.4
TOP_MM, BOT_MM = 23, 20
TOL = 10            # hueco que no se cuenta (mm)
PREF = 60           # por debajo de este alto, una captura empieza a "costar" (para no dejarlas ilegibles)

html = open(G, encoding='utf-8').read()
html = re.sub(r'\n?<style id="ajustes">.*?</style>', '', html, flags=re.S)
if 'id="f1"' not in html:
    k = [0]
    def num(m):
        k[0] += 1
        return '<figure id="f%d"' % k[0]
    html = re.sub(r'<figure(?= |>)', num, html)
NF = len(re.findall(r'<figure id="f\d+"', html))

def armar(alt):
    reglas = '\n'.join('  #f%d img { max-height: %.1fmm !important; }' % (i, h) for i, h in sorted(alt.items()))
    bloque = '<style id="ajustes">\n  /* Altos de las capturas calculados para que ninguna página quede con hueco al pie */\n%s\n</style>' % reglas
    return html.replace('</head>', bloque + '\n</head>', 1)

cache = {}
lock = threading.Lock()
pdf_lock = threading.Lock()   # PDFium no se puede usar desde varios hilos a la vez
cont = [0]

def medir(alt):
    clave = tuple(sorted((k, round(v)) for k, v in alt.items()))
    with lock:
        if clave in cache:
            return cache[clave]
        cont[0] += 1
        n = cont[0]
    tmp = GDIR + '_b%04d.html' % n
    out = os.path.join(TMP, 'b%04d.pdf' % n)
    open(tmp, 'w', encoding='utf-8').write(armar(alt))
    perfil = os.path.join(TMP, 'perfil%04d' % n)          # perfil propio: dos Chrome no pueden compartirlo
    for intento in range(3):
        subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-pdf-header-footer', '--user-data-dir=' + perfil,
                        '--print-to-pdf=' + out, 'file:///' + tmp.replace(' ', '%20')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(out) and os.path.getsize(out) > 10000:
            break
    os.remove(tmp)
    shutil.rmtree(perfil, ignore_errors=True)
    with pdf_lock:
        pdf = pdfium.PdfDocument(out)
        huecos = []
        for i in range(len(pdf)):
            a = np.asarray(pdf[i].render(scale=0.8).to_pil().convert('L'))
            y0, y1 = int(TOP_MM * PT * 0.8), int((297 - BOT_MM) * PT * 0.8)
            rows = np.where((a[y0:y1] < 245).any(axis=1))[0]
            huecos.append(((y1 - y0) - (rows.max() if len(rows) else 0)) / (PT * 0.8))
        pdf.close()
    medio = huecos[1:-1]
    costo = sum(max(0, h - TOL) ** 2 for h in medio) + 400 * len(huecos) + 2 * sum(max(0, PREF - v) for v in alt.values())
    r = (costo, [round(h) for h in huecos])
    with lock:
        cache[clave] = r
    return r

OPC = [40, 46, 52, 58, 64, 70, 76, 82, 90, 98, 106]
base = {}
inicio = time.time()
mejor_c, mejor_h = medir(base)
print('inicio: costo %.0f  huecos %s' % (mejor_c, mejor_h)); sys.stdout.flush()
with ThreadPoolExecutor(max_workers=6) as ex:
    for vuelta in range(6):
        mejoro = False
        for f in range(1, NF + 1):
            pruebas = []
            for h in OPC:
                p = dict(base); p[f] = h
                pruebas.append(p)
            sin = dict(base); sin.pop(f, None)          # también probar "sin ajuste" (su tamaño natural)
            pruebas.append(sin)
            res = list(ex.map(medir, pruebas))
            c, hs, p = min(((r[0], r[1], p) for r, p in zip(res, pruebas)), key=lambda x: x[0])
            if c < mejor_c - 1:
                mejor_c, mejor_h, base = c, hs, p
                mejoro = True
                print('  figura %2d -> %s   costo %.0f  huecos %s' % (f, p.get(f, 'natural'), c, hs)); sys.stdout.flush()
        print('fin de vuelta %d (%d renders, %.0f s)' % (vuelta + 1, cont[0], time.time() - inicio)); sys.stdout.flush()
        if not mejoro:
            break

open(G, 'w', encoding='utf-8').write(armar(base))
print('\nRESULTADO  huecos %s\nalturas %s' % (mejor_h, base))
shutil.rmtree(TMP, ignore_errors=True)
