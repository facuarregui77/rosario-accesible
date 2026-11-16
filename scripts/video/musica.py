# MÚSICA DE FONDO DE LOS VIDEOS PROMOCIONALES
# Compone una pista alegre y tranquila (pop suave, 96 pulsos por minuto, en sol mayor) con el largo justo del video.
# Es música propia: no tiene derechos de autor de nadie, así que Instagram, Facebook y TikTok no la bloquean.
#   python scripts/video/musica.py <segundos> <salida.wav>
# Si se quiere otra música, alcanza con dejar un archivo "musica.mp3" en esta carpeta: los videos usan ese.
import sys, wave
import numpy as np

SR = 44100
BPM = 96
NEGRA = 60 / BPM
COMPAS = 4 * NEGRA
rng = np.random.default_rng(7)

segundos = float(sys.argv[1])
salida = sys.argv[2]
compases = int(np.ceil(segundos / COMPAS)) + 1
N = int(compases * COMPAS * SR)
izq, der = np.zeros(N), np.zeros(N)

hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)

def poner(senal, t, vol=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    s = senal[: N - i] * vol
    izq[i : i + len(s)] += s * (1 - pan) / 2 * 2 ** 0.5
    der[i : i + len(s)] += s * (1 + pan) / 2 * 2 ** 0.5

# Acordes: sol, re, mi menor, do (I-V-vi-IV), con las notas cerca para que suene parejo
ACORDES = [[55, 59, 62], [54, 57, 62], [55, 59, 64], [55, 60, 64]]
BAJOS = [43, 38, 40, 36]

def colchon(notas, dur):
    t = np.arange(int((dur + 1.2) * SR)) / SR
    s = np.zeros_like(t)
    for m in notas:
        for desafine in (-0.06, 0.0, 0.06):
            f = hz(m) * 2 ** (desafine / 12)
            for n in range(1, 7):
                s += np.sin(2 * np.pi * f * n * t + rng.uniform(0, 6.28)) / n ** 1.6
    env = np.minimum(1, t / 0.5) * np.where(t > dur, np.exp(-(t - dur) * 4), 1)
    return s * env / 22

def campana(m, dur=1.6):
    t = np.arange(int(dur * SR)) / SR
    f = hz(m)
    s = sum(np.sin(2 * np.pi * f * n * t) * np.exp(-t * (2.5 + n * 2.2)) / n ** 1.2 for n in (1, 2, 3, 4))
    s += 0.3 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t * 9)   # brillo de marimba
    return s * np.minimum(1, t / 0.004)

def bajo(m, dur):
    t = np.arange(int(dur * SR)) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return s * np.minimum(1, t / 0.01) * np.exp(-t * 1.6)

def bombo():
    t = np.arange(int(0.35 * SR)) / SR
    fase = 2 * np.pi * np.cumsum(45 + 90 * np.exp(-t * 30)) / SR
    return np.sin(fase) * np.exp(-t * 9)

def platillo():
    t = np.arange(int(0.09 * SR)) / SR
    r = np.diff(rng.standard_normal(len(t) + 1))
    return r * np.exp(-t * 55) * 0.5

def palmas():
    t = np.arange(int(0.25 * SR)) / SR
    r = rng.standard_normal(len(t))
    r = np.convolve(r, np.ones(6) / 6, mode="same") - np.convolve(r, np.ones(40) / 40, mode="same")
    env = sum(np.exp(-np.maximum(0, t - d) * 60) * (t >= d) for d in (0, 0.012, 0.024)) / 3 + np.exp(-t * 18) * 0.5
    return r * env

ARPEGIO = [0, 1, 2, 3, 2, 1, 2, 1]
ultimo = compases - 2   # los dos últimos compases quedan solo con el colchón, apagándose
for c in range(compases):
    t0 = c * COMPAS
    k = c % 4
    notas = ACORDES[k]
    poner(colchon(notas, COMPAS if c < ultimo else COMPAS * 2), t0, 0.9)
    if c >= ultimo:
        poner(campana(notas[0] + 12, 3.0), t0, 0.5)
        break
    tonos = [notas[0] + 12, notas[1] + 12, notas[2] + 12, notas[0] + 24]
    for i, j in enumerate(ARPEGIO):
        poner(campana(tonos[j]), t0 + i * NEGRA / 2, 0.22 if i % 2 else 0.3, pan=-0.35 if i % 2 else 0.35)
    if c >= 4:   # entra el bajo y el ritmo
        for b, d in ((0, 1.4), (1.5, 0.45), (2, 1.4), (3.5, 0.4)):
            poner(bajo(BAJOS[k], d * NEGRA + 0.1), t0 + b * NEGRA, 0.55)
        for b in range(4):
            poner(bombo(), t0 + b * NEGRA, 0.55)
            poner(platillo(), t0 + (b + 0.5) * NEGRA, 0.18, pan=0.3)
    if c >= 8:   # palmas en 2 y 4, y una campanita arriba en cada compás
        for b in (1, 3):
            poner(palmas(), t0 + b * NEGRA, 0.32, pan=-0.1)
        poner(campana(notas[2] + 24, 2.0), t0, 0.12, pan=0.5)

estereo = np.stack([izq, der], axis=1)[: int((segundos + 0.05) * SR)]
fin = int(min(3.0, segundos / 4) * SR)
estereo[-fin:] *= np.linspace(1, 0, fin)[:, None] ** 1.5
estereo /= np.max(np.abs(estereo)) / 0.89
with wave.open(salida, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((estereo * 32767).astype("<i2").tobytes())
