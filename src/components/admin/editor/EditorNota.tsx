"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Categoria } from "@/lib/api";
import type { Usuario } from "@/lib/auth";
import type {
  EdicionNota,
  Media,
  MediaRef,
  NotaDetalle,
  Persona,
  Revision,
  Transicion,
} from "@/lib/admin-api";
import { Fecha } from "../Fecha";
import {
  crearVistaPreviaAction,
  guardarNotaAction,
  obtenerRevisionAction,
  ponerComoPrincipalAction,
  restaurarRevisionAction,
  transicionAction,
  type Resultado,
} from "@/app/admin/(panel)/notas/actions";
import { ChipEstado } from "../ChipEstado";
import { IcoAlerta, IcoCheck, IcoChispa, IcoOjo, IcoReloj } from "../Iconos";
import { CuerpoTiptap } from "./CuerpoTiptap";
import { Acordeon } from "./Acordeon";
import { SelectorMedia } from "../media/SelectorMedia";
import { PreviewHome } from "./PreviewHome";
import { actualizarMediaAction } from "@/app/admin/(panel)/media/actions";

/* ── Tipos y helpers ─────────────────────────────────────────────────── */

type Form = {
  kicker: string;
  title: string;
  summary: string;
  categoryId: string;
  tagsTexto: string;
  authorIds: string[];
  imageUrl: string;
  featuredMediaId: string;
  seoTitle: string;
  seoDescription: string;
  socialTitle: string;
  isBreaking: boolean;
  breakingUntil: string; // datetime-local
  note: string; // motivo de la corrección (sólo publicadas)
};

type Campo = keyof Form | "contentJson";

const UMBRAL_SIMILARIDAD = 0.25;

/** Date -> valor de <input type="datetime-local"> en hora local. */
function aLocal(d: Date | null): string {
  if (!d) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formDesde(n: NotaDetalle): Form {
  return {
    kicker: n.kicker ?? "",
    title: n.title ?? "",
    summary: n.summary ?? "",
    categoryId: n.categoryId ?? "",
    tagsTexto: n.tags.map((t) => t.tag.name).join(", "),
    authorIds: n.authors.map((a) => a.user.id),
    imageUrl: n.imageUrl ?? "",
    featuredMediaId: n.featuredMediaId ?? "",
    seoTitle: n.seoTitle ?? "",
    seoDescription: n.seoDescription ?? "",
    socialTitle: n.socialTitle ?? "",
    isBreaking: n.isBreaking,
    breakingUntil: aLocal(n.breakingUntil),
    note: "",
  };
}

const inputCls =
  "w-full rounded border border-azul/15 bg-white px-3 py-2 text-sm text-carbon outline-none focus:border-azul-medio disabled:bg-gris-claro/60 disabled:text-gris";
const labelCls = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gris";

function Contador({ n, max }: { n: number; max: number }) {
  return (
    <span className={`ml-2 text-[10px] font-normal normal-case tracking-normal ${n > max ? "text-urgente" : "text-gris"}`}>
      {n}/{max}
    </span>
  );
}

/* ── Componente ──────────────────────────────────────────────────────── */

export function EditorNota({
  nota: inicial,
  categorias,
  usuarios,
  usuario,
  revisiones: revisionesIniciales,
  esPrincipalActual = false,
}: {
  nota: NotaDetalle;
  categorias: Categoria[];
  usuarios: Persona[];
  usuario: Usuario;
  revisiones: Revision[];
  /** true si la nota ya ocupa la zona PRINCIPAL del borrador de portada. */
  esPrincipalActual?: boolean;
}) {
  const router = useRouter();
  const [nota, setNota] = useState(inicial);
  const [form, setForm] = useState<Form>(() => formDesde(inicial));
  const [doc, setDoc] = useState<unknown>(inicial.contentJson);
  const [texto, setTexto] = useState(inicial.content ?? "");
  const [docKey, setDocKey] = useState(0); // remonta Tiptap sólo al restaurar
  const [sucios, setSucios] = useState<Set<Campo>>(new Set());
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);
  const [conflicto, setConflicto] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error" | "info"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null); // transición en curso
  const [programando, setProgramando] = useState(false);
  const [horaProgramada, setHoraProgramada] = useState("");
  const [comoPrincipal, setComoPrincipal] = useState(false);
  const [esPrincipal, setEsPrincipal] = useState(esPrincipalActual);
  const [previewHome, setPreviewHome] = useState(false);
  const [confirmandoPreview, setConfirmandoPreview] = useState(false);
  const [devolviendo, setDevolviendo] = useState(false);
  const [notaDevolucion, setNotaDevolucion] = useState("");
  const [revisiones] = useState(revisionesIniciales);
  const [destacada, setDestacada] = useState<MediaRef | null>(inicial.featuredMedia);
  const [eligiendoDestacada, setEligiendoDestacada] = useState(false);
  const [revisionVista, setRevisionVista] = useState<{
    rev: Revision;
    snapshot: Record<string, unknown>;
  } | null>(null);
  // Campos tocados desde que arrancó el último guardado: son los que siguen
  // sucios si el usuario escribió mientras el PATCH estaba en vuelo.
  const tocadosEnVueloRef = useRef<Set<Campo>>(new Set());

  /* ── Permisos (espejo de src/domain/article-policy.ts del backend) ── */
  const esEditor = usuario.role === "ADMIN" || usuario.role === "EDITOR";
  const propia = nota.createdBy?.id === usuario.id;
  const puedeEditar = esEditor || (propia && nota.status === "DRAFT");
  const puedeEnviar = puedeEditar && nota.status === "DRAFT";
  const puedeDescartar =
    (esEditor && ["INGESTED", "DRAFT", "IN_REVIEW"].includes(nota.status)) ||
    (propia && nota.status === "DRAFT");
  const puedePublicar = esEditor && ["INGESTED", "DRAFT", "IN_REVIEW"].includes(nota.status);

  // Urgente sin vencimiento futuro: estado inválido, el guardado se bloquea
  // si el usuario tocó estos campos (espejo de la validación del backend)
  const breakingInvalida =
    form.isBreaking &&
    (!form.breakingUntil || new Date(form.breakingUntil).getTime() <= Date.now());

  const palabras = useMemo(() => texto.split(/\s+/).filter(Boolean).length, [texto]);
  const similitud = nota.sourceSimilarity;
  const similitudAlta = nota.origin === "FEED" && (similitud ?? 0) > UMBRAL_SIMILARIDAD;

  /* ── Edición de campos ─────────────────────────────────────────── */
  const marcar = useCallback((campo: Campo) => {
    tocadosEnVueloRef.current.add(campo);
    setSucios((s) => new Set(s).add(campo));
  }, []);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    marcar(k);
  };

  const onDoc = useCallback(
    (d: unknown, t: string) => {
      setDoc(d);
      setTexto(t);
      marcar("contentJson");
    },
    [marcar],
  );

  /* ── Guardado ──────────────────────────────────────────────────── */
  const guardar = useCallback(async (): Promise<Resultado<NotaDetalle> | null> => {
    if (sucios.size === 0 || !puedeEditar || conflicto) return null;
    // Devuelve un Resultado fallido (no null) para que transicion() aborte
    // el Publicar/Enviar. Los campos quedan sucios: no se pierde nada.
    if (breakingInvalida && (sucios.has("isBreaking") || sucios.has("breakingUntil"))) {
      const error = "Elegí hasta cuándo es urgente (fecha futura) o desmarcá Última hora.";
      setMensaje({ tipo: "error", texto: error });
      return { ok: false, status: 400, error };
    }
    const campos = new Set(sucios);
    tocadosEnVueloRef.current = new Set();
    const payload: EdicionNota = { expectedUpdatedAt: nota.updatedAt.toISOString() };
    for (const c of campos) {
      switch (c) {
        case "contentJson":
          payload.contentJson = doc;
          break;
        case "tagsTexto":
          payload.tagNames = form.tagsTexto.split(",").map((t) => t.trim()).filter(Boolean);
          break;
        case "breakingUntil":
          payload.breakingUntil = form.breakingUntil ? new Date(form.breakingUntil).toISOString() : null;
          break;
        case "note":
          if (form.note) payload.note = form.note;
          break;
        default:
          (payload as Record<string, unknown>)[c] = form[c];
      }
    }
    // El backend valida el par completo: si viaja uno, viaja el otro
    if (payload.isBreaking !== undefined && payload.breakingUntil === undefined) {
      payload.breakingUntil = form.breakingUntil ? new Date(form.breakingUntil).toISOString() : null;
    }
    if (payload.breakingUntil !== undefined && payload.isBreaking === undefined) {
      payload.isBreaking = form.isBreaking;
    }
    setGuardando(true);
    const r = await guardarNotaAction(nota.id, payload);
    setGuardando(false);
    if (r.ok) {
      setNota(r.data);
      setUltimoGuardado(new Date());
      // Sólo queda sucio lo que se tocó mientras guardábamos
      setSucios(new Set(tocadosEnVueloRef.current));
      setMensaje(null);
    } else if (r.status === 409) {
      setConflicto(true);
    } else {
      setMensaje({ tipo: "error", texto: r.error });
    }
    return r;
  }, [sucios, puedeEditar, conflicto, breakingInvalida, nota.updatedAt, nota.id, doc, form]);

  // Ctrl/Cmd+S = guardar ya
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void guardar();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [guardar]);

  // Escape cierra el modal de confirmación de la vista previa
  useEffect(() => {
    if (!confirmandoPreview) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setConfirmandoPreview(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [confirmandoPreview]);

  // Aviso al cerrar con cambios sin guardar
  useEffect(() => {
    if (sucios.size === 0) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [sucios]);

  /* ── Transiciones ──────────────────────────────────────────────── */
  const transicion = async (accion: Transicion, body: Record<string, unknown> = {}, etiqueta: string = accion) => {
    setOcupado(etiqueta);
    setMensaje(null);
    // Primero persistimos lo que haya en pantalla: la transición aplica sobre lo guardado
    if (sucios.size > 0) {
      const g = await guardar();
      if (g && !g.ok) {
        setOcupado(null);
        return;
      }
    }
    const r = await transicionAction(nota.id, accion, body);
    if (r.ok) {
      setNota(r.data);
      setForm((f) => ({ ...formDesde(r.data), note: f.note }));
      setProgramando(false);
      setDevolviendo(false);
      // El backend decide: si la fecha era futura queda SCHEDULED; si no, publica ya
      const quedoProgramada = r.data.status === "SCHEDULED" && r.data.scheduledAt !== null;
      const cuando = quedoProgramada
        ? `el ${r.data.scheduledAt!.toLocaleDateString("es-AR", { day: "numeric", month: "long" })} a las ${r.data.scheduledAt!.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}`
        : null;
      let final: { tipo: "ok" | "error" | "info"; texto: string } = quedoProgramada
        ? { tipo: "info", texto: `Programada para ${cuando}.` }
        : { tipo: "ok", texto: MENSAJES_OK[accion] };
      if (accion === "publish" && comoPrincipal) {
        const p = await ponerComoPrincipalAction(nota.id);
        if (p.ok) {
          setComoPrincipal(false);
          setEsPrincipal(true);
          final = quedoProgramada
            ? { tipo: "info", texto: `Programada para ${cuando}. Quedará como principal en la portada al publicarse.` }
            : { tipo: "ok", texto: "Publicada y colocada como principal en la portada." };
        } else {
          final = {
            tipo: "error",
            texto: `La nota quedó ${quedoProgramada ? "programada" : "publicada"}, pero no se pudo poner como principal: ${p.error}`,
          };
        }
      }
      setMensaje(final);
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: r.error });
    }
    setOcupado(null);
  };

  /** Atajo para una nota ya publicada o programada: principal en un clic. */
  const ponerPrincipalAhora = async () => {
    if (esPrincipal) return;
    if (!window.confirm("¿Poner esta nota como principal? Reemplaza la principal actual y publica la portada al instante.")) return;
    setOcupado("principal");
    const p = await ponerComoPrincipalAction(nota.id);
    setOcupado(null);
    if (p.ok) {
      setEsPrincipal(true);
      setMensaje({
        tipo: "ok",
        texto:
          nota.status === "SCHEDULED"
            ? "Reservada como principal: aparecerá en la portada cuando se publique."
            : "Colocada como principal en la portada.",
      });
    } else {
      setMensaje({ tipo: "error", texto: p.error });
    }
  };

  const elegirDestacada = (m: Media) => {
    setEligiendoDestacada(false);
    setDestacada(m);
    set("featuredMediaId", m.id);
  };

  const quitarDestacada = () => {
    setDestacada(null);
    set("featuredMediaId", "");
  };

  /** Punto focal: clic sobre la miniatura → (0..1, 0..1) guardado en la Media. */
  const fijarFocal = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!destacada || !puedeEditar) return;
    const r = e.currentTarget.getBoundingClientRect();
    const focalX = Math.round(((e.clientX - r.left) / r.width) * 100) / 100;
    const focalY = Math.round(((e.clientY - r.top) / r.height) * 100) / 100;
    setDestacada({ ...destacada, focalX, focalY });
    const res = await actualizarMediaAction(destacada.id, { focalX, focalY });
    if (!res.ok) setMensaje({ tipo: "error", texto: res.error });
  };

  /** Crea el token y abre la pestaña; guarda antes sólo si se lo pide. */
  const abrirPreview = async (guardarAntes: boolean) => {
    setConfirmandoPreview(false);
    setOcupado("preview");
    if (guardarAntes) {
      const g = await guardar();
      if (g && !g.ok) {
        setOcupado(null);
        return;
      }
    }
    const r = await crearVistaPreviaAction(nota.id);
    setOcupado(null);
    if (r.ok) window.open(r.data.url, "_blank", "noopener");
    else setMensaje({ tipo: "error", texto: r.error });
  };

  const vistaPrevia = () => {
    // La vista previa muestra lo GUARDADO: con cambios en pantalla, primero
    // se le pregunta al usuario si quiere persistirlos (nada de guardar solo).
    if (sucios.size > 0) setConfirmandoPreview(true);
    else void abrirPreview(false);
  };

  const verRevision = async (rev: Revision) => {
    const r = await obtenerRevisionAction(nota.id, rev.id);
    if (r.ok) setRevisionVista({ rev, snapshot: r.data.snapshot });
    else setMensaje({ tipo: "error", texto: r.error });
  };

  /** Reemplaza TODO el estado local por la nota que devolvió el servidor
   *  (tras restaurar una versión). */
  const adoptarNota = (n: NotaDetalle, texto: string) => {
    setNota(n);
    setForm(formDesde(n));
    setDestacada(n.featuredMedia);
    setDoc(n.contentJson);
    setTexto(n.content ?? "");
    setDocKey((k) => k + 1);
    setSucios(new Set());
    setMensaje({ tipo: "ok", texto });
    router.refresh();
  };

  const restaurar = async (rev: Revision) => {
    if (!window.confirm(`¿Restaurar la versión ${rev.version}? Lo actual queda guardado como una versión más.`)) return;
    setOcupado("restore");
    const r = await restaurarRevisionAction(nota.id, rev.id);
    setOcupado(null);
    if (r.ok) {
      setRevisionVista(null);
      adoptarNota(r.data, `Versión ${rev.version} restaurada.`);
    } else {
      setMensaje({ tipo: "error", texto: r.error });
    }
  };

  /* ── Render ────────────────────────────────────────────────────── */
  const estadoGuardado = conflicto
    ? null
    : guardando
      ? "Guardando…"
      : sucios.size > 0
        ? "Cambios sin guardar"
        : ultimoGuardado
          ? `Guardado ${ultimoGuardado.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
          : null;

  const btn = (variante: "primario" | "secundario" | "peligro") =>
    `inline-flex items-center gap-1.5 rounded px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors disabled:cursor-wait disabled:opacity-50 ${
      {
        primario: "bg-azul-medio text-white hover:bg-azul",
        secundario: "border border-azul/20 text-carbon hover:border-azul hover:text-azul",
        peligro: "border border-azul/15 text-gris hover:border-urgente hover:text-urgente",
      }[variante]
    }`;

  return (
    <div className="mx-auto max-w-[88rem]">
      {/* ── Barra superior ─────────────────────────────────────────── */}
      <div className="sticky top-14 z-10 -mx-6 mb-6 flex flex-wrap items-center gap-3 border-b border-hielo bg-white/95 px-6 py-3 backdrop-blur">
        <Link href="/admin/notas" className="text-xs font-semibold text-gris hover:text-azul-medio">
          ← Notas
        </Link>
        <ChipEstado estado={nota.status} />
        {puedePublicar && (
          <label
            className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-carbon"
            title="Al publicar (o programar), reemplaza la nota principal actual y publica la portada"
          >
            <input type="checkbox" checked={comoPrincipal} onChange={(e) => setComoPrincipal(e.target.checked)} />
            Como principal
          </label>
        )}
        <span className="text-[11px] text-gris">
          {nota.origin === "FEED" ? (
            <span className="inline-flex items-center gap-1">
              <IcoChispa className="h-3 w-3 text-azul-claro" /> Curada de {nota.source?.sourceName}
            </span>
          ) : (
            `Original · ${nota.createdBy?.name ?? "Redacción"}`
          )}
        </span>
        <span className="text-[11px] text-gris">· {palabras} palabras</span>
        {estadoGuardado && (
          <span className={`text-[11px] ${sucios.size > 0 && !guardando ? "text-amber-700" : "text-gris"}`}>
            · {estadoGuardado}
          </span>
        )}
        {!puedeEditar && (
          <span className="rounded-full bg-hielo px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-azul">
            Sólo lectura
          </span>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {puedeEditar && (
            <button type="button" onClick={() => void guardar()} disabled={guardando || sucios.size === 0} className={btn(sucios.size > 0 ? "primario" : "secundario")}>
              Guardar
            </button>
          )}
          <button type="button" onClick={vistaPrevia} disabled={ocupado !== null} className={btn("secundario")}>
            <IcoOjo className="h-3.5 w-3.5" /> Vista previa
          </button>
          <button type="button" onClick={() => setPreviewHome(true)} className={btn("secundario")}>
            <IcoOjo className="h-3.5 w-3.5" /> Vista en portada
          </button>
          {puedeEnviar && (
            <button type="button" onClick={() => transicion("submit")} disabled={ocupado !== null} className={btn(esEditor ? "secundario" : "primario")}>
              Enviar a revisión
            </button>
          )}
          {esEditor && nota.status === "IN_REVIEW" && (
            <button type="button" onClick={() => setDevolviendo((v) => !v)} disabled={ocupado !== null} className={btn("secundario")}>
              Devolver…
            </button>
          )}
          {puedePublicar && (
            <>
              <button type="button" onClick={() => setProgramando((v) => !v)} disabled={ocupado !== null} className={btn("secundario")}>
                <IcoReloj className="h-3.5 w-3.5" /> Programar…
              </button>
              <button type="button" onClick={() => transicion("publish")} disabled={ocupado !== null} className={btn("primario")}>
                <IcoCheck className="h-3.5 w-3.5" /> Publicar
              </button>
            </>
          )}
          {esEditor && ["PUBLISHED", "SCHEDULED"].includes(nota.status) && (
            <button
              type="button"
              onClick={ponerPrincipalAhora}
              disabled={ocupado !== null || esPrincipal}
              title={esPrincipal ? "Ya es la nota principal de la portada" : undefined}
              className={
                esPrincipal
                  ? "inline-flex cursor-not-allowed items-center gap-1.5 rounded border border-azul/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-gris opacity-50"
                  : btn("secundario")
              }
            >
              Poner como principal
            </button>
          )}
          {esEditor && nota.status === "SCHEDULED" && (
            <button type="button" onClick={() => transicion("unschedule")} disabled={ocupado !== null} className={btn("secundario")}>
              Desprogramar
            </button>
          )}
          {esEditor && nota.status === "PUBLISHED" && (
            <button type="button" onClick={() => transicion("unpublish")} disabled={ocupado !== null} className={btn("peligro")}>
              Despublicar
            </button>
          )}
          {esEditor && nota.status === "SPIKED" && (
            <button type="button" onClick={() => transicion("restore")} disabled={ocupado !== null} className={btn("primario")}>
              Restaurar
            </button>
          )}
          {puedeDescartar && (
            <button
              type="button"
              onClick={() => window.confirm("¿Descartar esta nota? Va a la papelera; un editor puede restaurarla.") && transicion("spike")}
              disabled={ocupado !== null}
              className={btn("peligro")}
            >
              Descartar
            </button>
          )}
        </div>
      </div>

      {/* ── Avisos ─────────────────────────────────────────────────── */}
      {conflicto && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-4 rounded border border-urgente/40 bg-urgente/5 px-4 py-3 text-sm text-urgente">
          <span className="font-semibold">Otra persona guardó esta nota mientras la editabas. Recargá para ver los cambios (lo tuyo sin guardar se pierde).</span>
          <button type="button" onClick={() => window.location.reload()} className="rounded bg-urgente px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
            Recargar
          </button>
        </div>
      )}
      {mensaje && (
        <p
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`mb-4 rounded border px-4 py-3 text-sm font-semibold ${
            mensaje.tipo === "error"
              ? "border-urgente/40 bg-urgente/5 text-urgente"
              : mensaje.tipo === "info"
                ? "border-violet-300 bg-violet-50 text-violet-800"
                : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          {mensaje.texto}
        </p>
      )}
      {nota.status === "DRAFT" && nota.reviewNote && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Devuelta por {nota.reviewedBy?.name ?? "el editor"}</span>
          <p className="mt-1">{nota.reviewNote}</p>
        </div>
      )}
      {similitudAlta && nota.status !== "PUBLISHED" && (
        <div className="mb-4 flex items-center gap-2 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <IcoAlerta className="h-4 w-4 shrink-0" />
          <span>
            <strong>{Math.round((similitud ?? 0) * 100)} %</strong> del texto coincide con la fuente. Se puede publicar igual, pero conviene reescribir con más palabras propias.
          </span>
        </div>
      )}
      {programando && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded border border-violet-300 bg-violet-50 px-4 py-3 text-sm">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-800">
            Publicar el
            <input type="datetime-local" value={horaProgramada} onChange={(e) => setHoraProgramada(e.target.value)} className="ml-2 rounded border border-violet-300 bg-white px-2 py-1 text-sm normal-case tracking-normal text-carbon" />
          </label>
          <button
            type="button"
            disabled={!horaProgramada || ocupado !== null}
            onClick={() => transicion("publish", { scheduledAt: new Date(horaProgramada).toISOString() }, "schedule")}
            className={btn("primario")}
          >
            Programar
          </button>
          <button type="button" onClick={() => setProgramando(false)} className="text-xs text-gris hover:text-carbon">Cancelar</button>
          <span className="text-xs text-violet-800">Hora local de tu equipo. Si es pasada, se publica ya.</span>
        </div>
      )}
      {devolviendo && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800">
            Motivo para el redactor
            <textarea value={notaDevolucion} onChange={(e) => setNotaDevolucion(e.target.value)} rows={2} className={`${inputCls} mt-1 normal-case tracking-normal`} placeholder="Qué falta o qué hay que corregir" />
          </label>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={!notaDevolucion.trim() || ocupado !== null} onClick={() => transicion("return", { note: notaDevolucion.trim() })} className={btn("primario")}>
              Devolver al redactor
            </button>
            <button type="button" onClick={() => setDevolviendo(false)} className="text-xs text-gris hover:text-carbon">Cancelar</button>
          </div>
        </div>
      )}

      {/* minmax(0,…) también en mobile: sin él, la pista auto crece al ancho
          de cualquier contenido inquebrable (URLs de fuente) y toda la página
          scrollea horizontal */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ── Columna principal ────────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          <input
            value={form.kicker}
            onChange={(e) => set("kicker", e.target.value)}
            disabled={!puedeEditar}
            placeholder="Volanta"
            className="w-full rounded border border-azul/15 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.25em] text-azul-medio outline-none focus:border-azul-medio disabled:bg-gris-claro/60 placeholder:text-gris/60"
          />
          <textarea
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            disabled={!puedeEditar}
            rows={2}
            placeholder="Título"
            className="w-full resize-none rounded border border-azul/15 bg-white px-3 py-2 font-display text-4xl leading-[1.1] tracking-tight text-carbon outline-none focus:border-azul-medio disabled:bg-gris-claro/60 placeholder:text-carbon/30"
          />
          <p className="px-1 text-right text-[10px] text-gris">
            <Contador n={form.title.length} max={90} />
          </p>
          <textarea
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            disabled={!puedeEditar}
            rows={2}
            placeholder="Bajada: una o dos oraciones que resumen el hecho"
            className="w-full resize-none rounded border border-azul/15 bg-white px-3 py-2 text-xl font-light leading-relaxed text-gris-oscuro outline-none focus:border-azul-medio disabled:bg-gris-claro/60 placeholder:text-gris/60"
          />
          <CuerpoTiptap key={docKey} contenido={doc} onChange={onDoc} editable={puedeEditar} />
          {nota.status === "PUBLISHED" && puedeEditar && (
            <label className={labelCls}>
              Motivo de la corrección <span className="font-normal normal-case tracking-normal">(queda en el historial)</span>
              <input value={form.note} onChange={(e) => set("note", e.target.value)} className={`${inputCls} mt-1.5`} placeholder="Ej.: se corrigió la cifra del segundo párrafo" />
            </label>
          )}
        </div>

        {/* ── Barra lateral ────────────────────────────────────────── */}
        <aside className="space-y-3">
          <Acordeon titulo="Publicación" abierto>
            <label className={labelCls}>
              Sección
              <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} disabled={!puedeEditar} className={`${inputCls} mt-1.5`}>
                <option value="">Sin sección</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className={labelCls}>
              Firma
              <select
                multiple
                value={form.authorIds}
                onChange={(e) => set("authorIds", [...e.target.selectedOptions].map((o) => o.value))}
                disabled={!puedeEditar}
                className={`${inputCls} mt-1.5 h-24`}
              >
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-gris">Ctrl+clic para varios. Sin firma se muestra el medio de origen o “Redacción”.</span>
            </label>
            <label className={labelCls}>
              Etiquetas
              <input value={form.tagsTexto} onChange={(e) => set("tagsTexto", e.target.value)} disabled={!puedeEditar} className={`${inputCls} mt-1.5`} placeholder="separadas por coma" />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-carbon">
              <input
                type="checkbox"
                checked={form.isBreaking}
                onChange={(e) => {
                  set("isBreaking", e.target.checked);
                  // Desmarcar limpia el vencimiento (el PATCH manda el par junto)
                  if (!e.target.checked) set("breakingUntil", "");
                }}
                disabled={!puedeEditar}
              />
              Última hora (URGENTE)
            </label>
            {form.isBreaking && (
              <p className="text-[10px] font-normal text-gris">
                Vencimiento obligatorio. Cupo de 3: si ya está lleno, la urgente más vieja sale sola al guardar.
              </p>
            )}
            {form.isBreaking && (
              <label className={labelCls}>
                Hasta
                <input
                  type="datetime-local"
                  value={form.breakingUntil}
                  onChange={(e) => set("breakingUntil", e.target.value)}
                  min={aLocal(new Date())}
                  disabled={!puedeEditar}
                  className={`${inputCls} mt-1.5 ${breakingInvalida ? "border-urgente" : ""}`}
                />
                {breakingInvalida && (
                  <span className="mt-1 block text-[10px] font-semibold normal-case tracking-normal text-urgente">
                    Obligatorio: fecha y hora futuras
                  </span>
                )}
              </label>
            )}
            <div>
              <p className={labelCls}>Imagen destacada</p>
              {destacada ? (
                <div className="mt-1.5 overflow-hidden rounded border border-hielo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={destacada.thumbUrl ?? destacada.url}
                    alt={destacada.alt ?? ""}
                    onClick={fijarFocal}
                    title={puedeEditar ? "Clic para fijar el punto focal (centro del recorte en tarjetas)" : undefined}
                    className={`aspect-[4/3] w-full object-cover ${puedeEditar ? "cursor-crosshair" : ""}`}
                    style={{ objectPosition: `${(destacada.focalX ?? 0.5) * 100}% ${(destacada.focalY ?? 0.5) * 100}%` }}
                  />
                  <div className="space-y-0.5 px-2.5 py-2 text-[11px]">
                    {destacada.caption && <p className="text-gris-oscuro">{destacada.caption}</p>}
                    {destacada.focalX !== null && (
                      <p className="text-[10px] text-gris">Foco: {Math.round((destacada.focalX ?? 0.5) * 100)} % · {Math.round((destacada.focalY ?? 0.5) * 100)} %</p>
                    )}
                  </div>
                  {puedeEditar && (
                    <div className="flex gap-3 border-t border-hielo px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest">
                      <button type="button" onClick={() => setEligiendoDestacada(true)} className="text-azul-medio hover:underline">Cambiar</button>
                      <button type="button" onClick={quitarDestacada} className="text-gris hover:text-urgente">Quitar</button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!puedeEditar}
                  onClick={() => setEligiendoDestacada(true)}
                  className="mt-1.5 w-full rounded border-2 border-dashed border-azul/20 px-3 py-5 text-xs font-semibold text-azul-medio hover:border-azul-medio disabled:opacity-50"
                >
                  + Elegir de la biblioteca o subir
                </button>
              )}
            </div>
            {nota.status === "SCHEDULED" && nota.scheduledAt && (
              <p className="text-xs text-violet-800">Programada para el <Fecha d={nota.scheduledAt} />.</p>
            )}
            {nota.slug && (
              <p className="break-all text-[10px] text-gris">
                URL: /noticia/{nota.slug}
                {nota.status === "PUBLISHED" && (
                  <> · <a href={`/noticia/${nota.slug}`} target="_blank" rel="noopener" className="font-semibold text-azul-medio">ver</a></>
                )}
              </p>
            )}
          </Acordeon>

          <Acordeon titulo="SEO y redes">
            <label className={labelCls}>
              Título SEO <Contador n={form.seoTitle.length} max={70} />
              <input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} disabled={!puedeEditar} className={`${inputCls} mt-1.5`} placeholder={form.title || "Por defecto, el título"} />
            </label>
            <label className={labelCls}>
              Meta descripción <Contador n={form.seoDescription.length} max={155} />
              <textarea value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} disabled={!puedeEditar} rows={3} className={`${inputCls} mt-1.5`} placeholder={form.summary || "Por defecto, la bajada"} />
            </label>
            <label className={labelCls}>
              Título para redes <Contador n={form.socialTitle.length} max={100} />
              <input value={form.socialTitle} onChange={(e) => set("socialTitle", e.target.value)} disabled={!puedeEditar} className={`${inputCls} mt-1.5`} />
            </label>
          </Acordeon>

          {nota.origin === "FEED" && nota.source && (
            <Acordeon titulo="Fuente" abierto={similitudAlta}>
              <p className="text-sm font-semibold text-carbon">{nota.source.sourceName}</p>
              <a href={nota.source.sourceUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-azul-medio underline underline-offset-2">
                {nota.source.sourceUrl}
              </a>
              <div>
                <p className={labelCls}>Similaridad con la fuente</p>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-hielo">
                  <div
                    className={`h-full rounded-full ${similitudAlta ? "bg-amber-500" : (similitud ?? 0) > 0.15 ? "bg-amber-400" : "bg-emerald-500"}`}
                    style={{ width: `${Math.round((similitud ?? 0) * 100)}%` }}
                  />
                </div>
                <p className={`mt-1 text-xs ${similitudAlta ? "font-semibold text-amber-700" : "text-gris"}`}>
                  {similitud === null ? "Sin medir" : `${Math.round(similitud * 100)} % de las frases coinciden`}
                  {similitudAlta && " — conviene reescribir con más palabras propias"}
                </p>
              </div>
              {nota.source.originalImageUrl && (
                <div>
                  <p className={labelCls}>Imagen del feed</p>
                  <a href={nota.source.originalImageUrl} target="_blank" rel="noopener noreferrer" title="Abrir la imagen original">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={nota.source.originalImageUrl}
                      alt="Imagen original del feed"
                      onError={(e) => { e.currentTarget.parentElement!.parentElement!.style.display = "none"; }}
                      className="mt-1.5 aspect-video w-full rounded border border-amber-300 object-cover"
                    />
                  </a>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                    <IcoAlerta className="h-3 w-3 shrink-0" /> Sólo referencia: no publicarla sin licencia. Elegí una de la biblioteca.
                  </p>
                </div>
              )}
              <details className="text-xs">
                <summary className="cursor-pointer font-semibold text-gris">Material original</summary>
                <p className="mt-2 font-semibold text-carbon">{nota.source.originalTitle}</p>
                <p className="mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap break-words font-light leading-relaxed text-gris-oscuro">
                  {nota.source.originalContent || "(el feed no trajo cuerpo de texto)"}
                </p>
              </details>
            </Acordeon>
          )}

          <Acordeon titulo={`Historial (${nota._count.revisions})`}>
            {revisiones.length === 0 ? (
              <p className="text-xs text-gris">Todavía no hay versiones guardadas.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {revisiones.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-2">
                    <span>
                      <span className="font-semibold text-carbon">v{r.version}</span>{" "}
                      <span className="text-gris">{RAZONES[r.reason]}</span>
                      {r.note && <span className="block text-gris">“{r.note}”</span>}
                      <span className="block text-[10px] text-gris">
                        {r.createdBy?.name ?? "Sistema"} · <Fecha d={r.createdAt} />
                      </span>
                    </span>
                    <button type="button" onClick={() => verRevision(r)} className="shrink-0 font-semibold text-azul-medio hover:underline">
                      Ver
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {revisionVista && (
              <div className="mt-3 rounded border border-azul/15 bg-hielo/40 p-3 text-xs">
                <p className="font-bold text-azul">Versión {revisionVista.rev.version}</p>
                <p className="mt-1 font-semibold text-carbon">{String(revisionVista.snapshot.title ?? "(sin título)")}</p>
                <p className="mt-1 text-gris-oscuro">{String(revisionVista.snapshot.summary ?? "")}</p>
                <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words font-light text-gris-oscuro">
                  {String(revisionVista.snapshot.content ?? "")}
                </p>
                <div className="mt-2 flex gap-3">
                  {(esEditor || (propia && nota.status === "DRAFT")) && (
                    <button type="button" onClick={() => restaurar(revisionVista.rev)} disabled={ocupado !== null} className="font-bold text-azul-medio hover:underline">
                      Restaurar esta versión
                    </button>
                  )}
                  <button type="button" onClick={() => setRevisionVista(null)} className="text-gris hover:text-carbon">Cerrar</button>
                </div>
              </div>
            )}
          </Acordeon>

          <Acordeon titulo="Datos">
            <dl className="space-y-1 text-xs text-gris">
              <div><dt className="inline font-semibold text-carbon">Creada:</dt> <dd className="inline"><Fecha d={nota.createdAt} />{nota.createdBy && ` por ${nota.createdBy.name}`}</dd></div>
              <div><dt className="inline font-semibold text-carbon">Última edición:</dt> <dd className="inline"><Fecha d={nota.updatedAt} />{nota.lastEditedBy && ` por ${nota.lastEditedBy.name}`}</dd></div>
              {nota.reviewedBy && <div><dt className="inline font-semibold text-carbon">Última revisión:</dt> <dd className="inline"><Fecha d={nota.reviewedAt} /> por {nota.reviewedBy.name}</dd></div>}
              {nota.firstPublishedAt && <div><dt className="inline font-semibold text-carbon">Primera publicación:</dt> <dd className="inline"><Fecha d={nota.firstPublishedAt} /></dd></div>}
            </dl>
          </Acordeon>
        </aside>
      </div>
      {confirmandoPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Guardar antes de la vista previa"
          className="fixed inset-0 z-50 flex items-center justify-center bg-noche/60 p-4"
          onClick={() => setConfirmandoPreview(false)}
        >
          <div className="w-full max-w-md rounded border border-hielo bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-carbon">
              Para ver la vista previa necesitas guardar. ¿Guardar últimos cambios?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmandoPreview(false)} className={btn("secundario")}>
                No
              </button>
              <button type="button" onClick={() => void abrirPreview(true)} className={btn("primario")}>
                Sí
              </button>
            </div>
          </div>
        </div>
      )}
      <SelectorMedia abierto={eligiendoDestacada} onCerrar={() => setEligiendoDestacada(false)} onElegir={elegirDestacada} />
      <PreviewHome
        abierto={previewHome}
        onCerrar={() => setPreviewHome(false)}
        nota={nota}
        form={form}
        destacada={destacada}
        categorias={categorias}
        usuarios={usuarios}
      />
    </div>
  );
}

const MENSAJES_OK: Record<Transicion, string> = {
  submit: "Enviada a revisión.",
  return: "Devuelta al redactor.",
  publish: "Publicada. Ya está visible en el sitio.",
  unschedule: "Programación cancelada; vuelve a borrador.",
  unpublish: "Despublicada; ya no se ve en el sitio.",
  spike: "Descartada. Un editor puede restaurarla desde la papelera.",
  restore: "Restaurada como borrador.",
};

const RAZONES: Record<Revision["reason"], string> = {
  AUTOSAVE: "guardado",
  MANUAL: "creación",
  SUBMIT: "enviada a revisión",
  PUBLISH: "publicada",
  UNPUBLISH: "despublicada",
  CORRECTION: "corrección",
  RESTORE: "restaurada",
};
