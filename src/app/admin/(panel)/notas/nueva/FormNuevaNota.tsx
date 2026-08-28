"use client";

import { useActionState } from "react";
import type { Categoria } from "@/lib/api";
import { BotonPendiente } from "@/components/admin/BotonPendiente";
import { crearNotaAction, type EstadoCrear } from "../actions";

const input =
  "mt-1.5 w-full rounded border border-azul/15 bg-white px-3 py-2.5 text-sm text-carbon outline-none focus:border-azul-medio";
const label = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gris";

export function FormNuevaNota({ categorias }: { categorias: Categoria[] }) {
  const [estado, action] = useActionState<EstadoCrear, FormData>(crearNotaAction, {});
  return (
    <form action={action} className="space-y-5">
      <label className={label}>
        Volanta <span className="font-normal normal-case tracking-normal">(opcional)</span>
        <input name="kicker" className={input} placeholder="Ej.: Política monetaria" />
      </label>
      <label className={label}>
        Título
        <textarea
          name="title"
          required
          autoFocus
          rows={2}
          className={`${input} font-display text-2xl leading-tight tracking-tight text-carbon`}
          placeholder="Un título claro, la noticia primero"
        />
        {estado.fieldErrors?.title && (
          <span className="mt-1 block text-xs font-semibold normal-case tracking-normal text-urgente">
            {estado.fieldErrors.title}
          </span>
        )}
      </label>
      <label className={label}>
        Bajada <span className="font-normal normal-case tracking-normal">(opcional)</span>
        <textarea name="summary" rows={2} className={input} placeholder="Una o dos oraciones que resumen el hecho" />
      </label>
      <label className={label}>
        Sección
        <select name="categoryId" className={input} defaultValue="">
          <option value="">Elegir después…</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      {estado.error && (
        <p role="alert" className="rounded border border-urgente/40 bg-urgente/5 px-3 py-2 text-sm font-semibold text-urgente">
          {estado.error}
        </p>
      )}
      <div className="flex items-center gap-3 pt-2">
        <BotonPendiente pendiente="Creando…">Crear y abrir el editor</BotonPendiente>
        <span className="text-xs text-gris">El cuerpo, la firma y el SEO se cargan en el editor.</span>
      </div>
    </form>
  );
}
