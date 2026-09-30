import { useState, useEffect, useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { MapPin, Accessibility, Star, X, Trash2, CheckCircle2, XCircle, MessageSquare, Pencil, Save, Lightbulb, Share2, Image as ImageIcon, Navigation, Phone, Globe, Instagram, Facebook } from "lucide-react";
import * as db from "../db";
import CONTACTOS from "../contactos.json";
import { CRITERIA, TYPE_LABELS, TYPE_COLORS, WHEELCHAIR_LABELS, hasAnyData } from "../data/constants";
import { reverseGeocode } from "../lib/geo";
import SuggestionForm from "./SuggestionForm";

export default function DetailPanel({ place, onClose, reviews, onAddReview, onDeleteReview, onDeletePlace, onSaveAccess, onAddSuggestion, onRoute, routingEnabled, avgRating, admin, onAnnounce }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [kind, setKind] = useState("experiencia"); // "experiencia" | "sugerencia"
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(place.a);
  const [draftW, setDraftW] = useState(place.wheelchair ?? null);

  useEffect(() => { setDraft(place.a); setDraftW(place.wheelchair ?? null); setEditing(false); }, [place.id, place.a, place.wheelchair]);

  // Fotos del lugar (Supabase Storage): se cargan al abrir la ficha.
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    let ok = true;
    db.loadPhotos(place.id).then((ph) => { if (ok) setPhotos(ph); });
    return () => { ok = false; };
  }, [place.id]);
  const addPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { error } = await db.uploadPhoto(place.id, file);
    if (!error) setPhotos(await db.loadPhotos(place.id));
    else window.alert("No se pudo subir la foto. ¿Está creado el bucket en Supabase?");
    setUploading(false);
    e.target.value = "";
  };
  const removePhoto = async (p) => {
    if (!window.confirm("¿Borrar esta foto?")) return;
    await db.deletePhoto(p.path);
    setPhotos((list) => list.filter((x) => x.path !== p.path));
  };

  // Contacto y ubicación: dirección/teléfono/web/redes de OSM; la dirección se completa por
  // geolocalización inversa si no está en los datos.
  const contact = CONTACTOS[place.id] || {};
  const [addr, setAddr] = useState(contact.direccion || null);
  useEffect(() => {
    const c = CONTACTOS[place.id] || {};
    if (c.direccion) { setAddr(c.direccion); return; }
    setAddr(null);
    reverseGeocode(place.lat, place.lng).then(setAddr);
  }, [place.id]);

  // Freno anti-spam: campo trampa (los robots lo completan, las personas no lo ven) y
  // una pausa de 2 minutos entre opiniones en el mismo lugar desde este navegador.
  const [trap, setTrap] = useState("");
  const [coolMsg, setCoolMsg] = useState("");
  const submit = () => {
    if (!text.trim()) return; // las estrellas son opcionales (una sugerencia puede no llevar puntaje)
    if (trap) return;         // robot
    const key = `rev_last_${place.id}`;
    try {
      const last = Number(localStorage.getItem(key) || 0);
      if (Date.now() - last < 2 * 60 * 1000) { setCoolMsg("Ya dejaste una opinión hace un ratito. Esperá un par de minutos para mandar otra."); return; }
      localStorage.setItem(key, String(Date.now()));
    } catch (e) {}
    setCoolMsg("");
    onAddReview({ stars, kind, name: name.trim() || "Anónimo", text: text.trim(), date: new Date().toLocaleDateString("es-AR") });
    setStars(0); setName(""); setText(""); setKind("experiencia");
  };

  const saveEdit = () => { onSaveAccess(draft, draftW); setEditing(false); };
  const cancelEdit = () => { setDraft(place.a); setDraftW(place.wheelchair ?? null); setEditing(false); };

  // Compartir: usa el menú nativo del celular si existe; si no, copia el link al portapapeles.
  const [shared, setShared] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?lugar=${place.id}`;
    try {
      if (navigator.share) await navigator.share({ title: place.name, text: `Accesibilidad de ${place.name} en Rosario Access Map`, url });
      else { await navigator.clipboard.writeText(url); setShared(true); onAnnounce && onAnnounce("Link copiado."); setTimeout(() => setShared(false), 2000); }
    } catch (e) { /* cancelado por el usuario */ }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Ficha de ${place.name}`}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white sm:rounded-2xl rounded-t-2xl border border-sky-200 shadow-2xl outline-none">
        <div className="h-1.5 bg-gradient-to-r from-sky-400 via-sky-300 to-orange-400 sm:rounded-t-2xl rounded-t-2xl" />
        <div className="sticky top-0 bg-sky-50 p-5 border-b border-sky-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{place.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: TYPE_COLORS[place.type] + "22", color: TYPE_COLORS[place.type] }}>{TYPE_LABELS[place.type]}</span>
              {place.gRating && <span className="text-xs text-slate-500 flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {place.gRating} Google</span>}
              {avgRating && <span className="text-xs text-amber-600 flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {avgRating} usuarios</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={share} title="Compartir este lugar" aria-label="Compartir este lugar"
              className="relative p-1.5 rounded-lg hover:bg-sky-100 text-sky-600">
              <Share2 size={18} />
              {shared && <span className="absolute -bottom-6 right-0 whitespace-nowrap text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">¡Link copiado!</span>}
            </button>
            <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
          </div>
        </div>

        <div className="p-5">
          {routingEnabled && !editing && (
            <button onClick={() => onRoute(place)}
              className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-600 text-white text-sm font-semibold shadow-sm transition">
              <Navigation size={16} /> Cómo llego (ruta accesible)
            </button>
          )}
          {place.wheelchair && !editing && (
            <div className={`mb-4 p-3 rounded-xl border text-sm ${place.wheelchair === "si" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
              <div className="flex items-center gap-2 font-medium">
                <Accessibility size={18} /> {WHEELCHAIR_LABELS[place.wheelchair]}
              </div>
              {place.src && (
                <a href={place.src} target="_blank" rel="noreferrer" className="text-xs underline opacity-80 hover:opacity-100 mt-1 inline-block">
                  Dato verificable en OpenStreetMap ↗
                </a>
              )}
            </div>
          )}

          {/* Contacto y ubicación */}
          {!editing && (addr || contact.telefono || contact.web || contact.instagram || contact.facebook) && (
            <div className="mb-4 p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              {addr && (
                <div className="flex items-start gap-2 text-sm text-slate-700">
                  <MapPin size={15} className="text-slate-500 shrink-0 mt-0.5" />
                  <span>{addr}{!contact.direccion && <span className="text-xs text-slate-500"> (aprox.)</span>}</span>
                </div>
              )}
              {contact.telefono && (
                <a href={`tel:${contact.telefono.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm text-sky-700 hover:underline">
                  <Phone size={15} className="text-slate-500 shrink-0" /> {contact.telefono}
                </a>
              )}
              {contact.web && (
                <a href={contact.web} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-sky-700 hover:underline">
                  <Globe size={15} className="text-slate-500 shrink-0" /> Sitio web
                </a>
              )}
              <div className="flex items-center gap-3 pt-0.5">
                {contact.instagram && (
                  <a href={contact.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-pink-600 hover:underline">
                    <Instagram size={15} /> Instagram
                  </a>
                )}
                {contact.facebook && (
                  <a href={contact.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                    <Facebook size={15} /> Facebook
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Detalle de accesibilidad</h3>
            {editing ? (
              <div className="flex items-center gap-2">
                <button onClick={cancelEdit} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-600 transition">Cancelar</button>
                <button onClick={saveEdit} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-600 text-white text-xs font-medium transition">
                  <Save size={13} /> Guardar
                </button>
              </div>
            ) : admin ? (
              <div className="flex items-center gap-2">
                {onDeletePlace && (
                  <button onClick={onDeletePlace} title="Borrar este lugar del mapa (solo lugares agregados desde la app)"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-xs text-rose-700 border border-rose-200 transition">
                    <Trash2 size={13} /> Borrar lugar
                  </button>
                )}
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-xs text-sky-700 border border-sky-200 transition">
                  <Pencil size={13} /> Editar
                </button>
              </div>
            ) : null}
          </div>

          {editing && (
            <div className="mb-3 p-2.5 rounded-lg border bg-sky-50 border-sky-200">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2"><Accessibility size={16} className="text-sky-600" /> Accesibilidad general (silla de ruedas)</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[["si", "Accesible"], ["parcial", "Parcial"], ["no", "Sin acceso"], [null, "Sin datos"]].map(([v, l]) => (
                  <button key={l} onClick={() => setDraftW(v)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${draftW === v ? (v === "si" ? "bg-emerald-600 text-white border-emerald-600" : v === "parcial" ? "bg-amber-600 text-white border-amber-600" : v === "no" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-600 text-white border-slate-600") : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 mb-3">
            {CRITERIA.map((c) => {
              const val = editing ? draft[c.key] : place.a[c.key];
              const Icon = c.icon;
              if (editing) {
                const opts = [["si", "Sí"], ["no", "No"], [null, "—"]];
                return (
                  <div key={c.key} className="flex items-center justify-between p-2.5 rounded-lg border bg-slate-50 border-slate-200">
                    <span className="flex items-center gap-2 text-sm"><Icon size={16} className="text-slate-500" /> {c.label}</span>
                    <div className="flex gap-1">
                      {opts.map(([v, l]) => (
                        <button key={l} onClick={() => setDraft({ ...draft, [c.key]: v })}
                          className={`px-2 py-0.5 rounded text-xs font-medium border transition ${val === v ? (v === "si" ? "bg-emerald-600 text-white border-emerald-600" : v === "no" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-600 text-white border-slate-600") : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={c.key} className={`flex items-center justify-between p-2.5 rounded-lg border ${val === "si" ? "bg-emerald-50 border-emerald-200" : val === "no" ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
                  <span className="flex items-center gap-2 text-sm"><Icon size={16} className="text-slate-500" /> {c.label}</span>
                  {val === "si" ? <CheckCircle2 size={18} className="text-emerald-500" /> : val === "no" ? <XCircle size={18} className="text-rose-400" /> : <span className="text-xs text-slate-500 italic">sin datos</span>}
                </div>
              );
            })}
            {editing && <p className="text-xs text-slate-500 italic">Elegí Sí / No / — (sin datos) en cada criterio y tocá "Guardar". {db.cloud ? "Tus datos se comparten con toda la comunidad (se guardan en la nube)." : "Tus datos se guardan en este navegador como relevamiento manual."}</p>}
            {admin && !editing && !hasAnyData(place) && <p className="text-xs text-slate-500 italic">Todavía no hay datos verificados de este lugar. Podés cargarlos con "Editar".</p>}
            {/* Fuente y última actualización */}
            {!editing && (place.src || place.updatedAt) && (
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {place.src && <a href={place.src} target="_blank" rel="noreferrer" className="underline hover:text-slate-600">Fuente: OpenStreetMap ↗</a>}
                {place.updatedAt && <span>Actualizado el {new Date(place.updatedAt).toLocaleDateString("es-AR")}</span>}
              </p>
            )}
          </div>

          {/* Fotos del lugar */}
          {!editing && (photos.length > 0 || admin) && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><ImageIcon size={15} /> Fotos</h3>
              {photos.length === 0 && <p className="text-xs text-slate-500 italic mb-2">Todavía no hay fotos de este lugar.</p>}
              {photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {photos.map((ph) => (
                    <div key={ph.path} className="relative shrink-0">
                      <a href={ph.url} target="_blank" rel="noreferrer">
                        <img src={ph.url} alt={`Foto de ${place.name}`} loading="lazy" className="h-28 w-28 object-cover rounded-lg border border-slate-200" />
                      </a>
                      {admin && <button onClick={() => removePhoto(ph)} aria-label="Borrar foto" className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5"><X size={12} /></button>}
                    </div>
                  ))}
                </div>
              )}
              {admin && (
                <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-medium cursor-pointer transition">
                  <ImageIcon size={13} /> {uploading ? "Subiendo…" : "Agregar foto"}
                  <input type="file" accept="image/*" onChange={addPhoto} disabled={uploading} className="hidden" />
                </label>
              )}
            </div>
          )}

          {/* Sugerir datos de accesibilidad (público, no admin) */}
          {!admin && !editing && <SuggestionForm onSubmit={(s) => onAddSuggestion(place.id, s)} />}

          {/* Opiniones y sugerencias */}
          <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><MessageSquare size={15} /> Opiniones y sugerencias ({reviews.length})</h3>
          <p className="text-xs text-slate-500 mb-2">Contá tu experiencia o dejá una recomendación para mejorar la app.</p>
          <div className="space-y-2 mb-4 max-h-44 overflow-y-auto">
            {reviews.length === 0 && <p className="text-xs text-slate-500 italic">Todavía no hay opiniones. ¡Sé el primero!</p>}
            {reviews.map((r, i) => {
              const esSug = r.kind === "sugerencia";
              return (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{r.name}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 whitespace-nowrap ${esSug ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-sky-100 text-sky-800 border-sky-200"}`}>
                        {esSug ? <><Lightbulb size={10} /> Sugerencia</> : <><MessageSquare size={10} /> Experiencia</>}
                      </span>
                      {admin && onDeleteReview && (
                        <button onClick={() => onDeleteReview(r)} aria-label="Borrar esta opinión" title="Borrar esta opinión"
                          className="p-1 rounded-md text-rose-600 hover:bg-rose-50"><Trash2 size={13} /></button>
                      )}
                    </span>
                  </div>
                  {r.stars > 0 && <span className="flex gap-0.5 mt-1" role="img" aria-label={`${r.stars} de 5 estrellas`}>{[1,2,3,4,5].map((s) => <Star key={s} size={12} aria-hidden="true" className={s <= r.stars ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}</span>}
                  <p className="text-xs text-slate-600 mt-1">{r.text}</p>
                  <span className="text-[11px] text-slate-500">{r.date}</span>
                </div>
              );
            })}
          </div>

          {/* Formulario de feedback */}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
            {/* Tipo de feedback */}
            <div className="flex gap-2 mb-2">
              {[["experiencia", "Experiencia", MessageSquare], ["sugerencia", "Sugerencia", Lightbulb]].map(([k, l, Ic]) => (
                <button key={k} onClick={() => setKind(k)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition ${kind === k ? "bg-sky-600 text-white border-sky-600" : "bg-white text-slate-600 border-slate-200 hover:bg-sky-100"}`}>
                  <Ic size={13} /> {l}
                </button>
              ))}
            </div>
            {/* Puntuación (opcional) */}
            <div className="flex items-center gap-1 mb-2" role="group" aria-label="Puntuación (opcional)">
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button" onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setStars(stars === s ? 0 : s)}
                  aria-label={`${s} ${s === 1 ? "estrella" : "estrellas"}`} aria-pressed={stars === s} className="rounded">
                  <Star size={24} aria-hidden="true" className={(hover || stars) >= s ? "fill-amber-400 text-amber-400" : "text-slate-400"} />
                </button>
              ))}
              <span className="text-xs text-slate-500 ml-2">{stars ? `${stars}/5` : "Puntuación (opcional)"}</span>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre (opcional)" aria-label="Tu nombre (opcional)" maxLength={60}
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-600" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={600} aria-label={kind === "sugerencia" ? "Tu sugerencia" : "Tu experiencia"}
              placeholder={kind === "sugerencia" ? "¿Qué te gustaría que mejoremos o agreguemos?" : "Contanos tu experiencia con la accesibilidad del lugar…"}
              rows={2} className="w-full mb-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-600 resize-none" />
            {/* Campo trampa anti-robots: invisible para las personas */}
            <input value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} name="website" />
            {coolMsg && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">{coolMsg}</p>}
            <button onClick={submit} disabled={!text.trim()}
              className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-600 text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition">
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
