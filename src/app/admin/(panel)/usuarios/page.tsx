import { requireSession } from "@/lib/auth";
import { listarUsuarios } from "@/lib/admin-api";
import { FormAccion } from "@/components/admin/FormAccion";
import { fechaCorta } from "@/lib/fechas";
import {
  actualizarUsuarioAction,
  blanquearPasswordAction,
  crearUsuarioAction,
} from "../gestion-actions";

export const dynamic = "force-dynamic";

const input =
  "rounded border border-azul/15 bg-white px-3 py-2 text-sm text-carbon outline-none focus:border-azul-medio";
const label = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gris";

const ROLES = [
  { v: "REDACTOR", l: "Redactor/a — crea y edita sus notas, las envía a revisión" },
  { v: "EDITOR", l: "Editor/a — revisa, edita todo, publica" },
  { v: "ADMIN", l: "Administración — además gestiona usuarios, feeds y secciones" },
];

export default async function Usuarios() {
  const { token, user } = await requireSession("ADMIN");
  const usuarios = await listarUsuarios(token);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-medio">Gestión</p>
      <h1 className="font-display text-3xl tracking-tight text-carbon">Usuarios</h1>
      <div className="regla-marca mt-3 w-20" />
      <p className="mt-1 text-sm text-gris">
        Los usuarios no se borran: se desactivan, para no romper el historial ni la auditoría.
      </p>

      <section className="mt-6 border border-hielo bg-white p-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-azul-medio">Nuevo usuario</h2>
        <FormAccion action={crearUsuarioAction} textoBoton="Crear" pendiente="Creando…" limpiarAlOk className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>Nombre<input name="name" required className={`${input} mt-1 w-full`} /></label>
            <label className={label}>Email<input name="email" type="email" required className={`${input} mt-1 w-full`} /></label>
            <label className={label}>Contraseña inicial (mín. 8)<input name="password" type="text" required minLength={8} className={`${input} mt-1 w-full`} /></label>
            <label className={label}>Rol
              <select name="role" defaultValue="REDACTOR" className={`${input} mt-1 w-full`}>
                {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </label>
          </div>
        </FormAccion>
      </section>

      <ul className="mt-6 space-y-3">
        {usuarios.map((u) => (
          <li key={u.id} className={`border bg-white p-4 ${u.isActive ? "border-hielo" : "border-dashed border-gris/40 opacity-70"}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-lg text-carbon">{u.name} {u.id === user.id && <span className="text-xs font-sans font-semibold text-gris">(vos)</span>}</p>
                <p className="text-xs text-gris">{u.email} · alta {fechaCorta(u.createdAt)}{!u.isActive && " · DESACTIVADO"}</p>
              </div>
              <FormAccion action={actualizarUsuarioAction} textoBoton="Guardar" variante="secundario" compacto className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={u.id} />
                <label className={label}>Nombre<input name="name" defaultValue={u.name} className={`${input} mt-1 w-40`} /></label>
                <label className={label}>Rol
                  <select name="role" defaultValue={u.role} className={`${input} mt-1`} disabled={u.id === user.id}>
                    {ROLES.map((r) => <option key={r.v} value={r.v}>{r.v}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-carbon">
                  <input type="checkbox" name="isActive" defaultChecked={u.isActive} disabled={u.id === user.id} /> Activo
                </label>
              </FormAccion>
              <FormAccion action={blanquearPasswordAction} textoBoton="Blanquear" variante="peligro" compacto limpiarAlOk className="flex items-end gap-2">
                <input type="hidden" name="id" value={u.id} />
                <label className={label}>Nueva contraseña<input name="password" type="text" minLength={8} required className={`${input} mt-1 w-40`} placeholder="mín. 8 caracteres" /></label>
              </FormAccion>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
