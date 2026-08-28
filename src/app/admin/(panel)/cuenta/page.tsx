import { requireSession } from "@/lib/auth";
import { FormAccion } from "@/components/admin/FormAccion";
import { cambiarPasswordAction } from "../gestion-actions";

export const dynamic = "force-dynamic";

const input =
  "mt-1 w-full rounded border border-azul/15 bg-white px-3 py-2 text-sm text-carbon outline-none focus:border-azul-medio";
const label = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gris";

export default async function Cuenta() {
  const { user } = await requireSession();
  return (
    <div className="mx-auto max-w-lg">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-medio">Cuenta</p>
      <h1 className="font-display text-3xl tracking-tight text-carbon">{user.name}</h1>
      <div className="regla-marca mt-3 w-20" />
      <p className="mt-1 text-sm text-gris">{user.email} · rol {user.role}</p>

      <section className="mt-6 border border-hielo bg-white p-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-azul-medio">Cambiar contraseña</h2>
        <FormAccion action={cambiarPasswordAction} textoBoton="Cambiar" pendiente="Cambiando…" limpiarAlOk className="mt-3 space-y-3">
          <label className={label}>Contraseña actual<input name="currentPassword" type="password" required autoComplete="current-password" className={input} /></label>
          <label className={label}>Nueva (mín. 8)<input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className={input} /></label>
          <label className={label}>Repetir la nueva<input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={input} /></label>
        </FormAccion>
      </section>
    </div>
  );
}
