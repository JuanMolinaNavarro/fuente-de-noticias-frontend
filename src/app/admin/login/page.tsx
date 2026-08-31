import { Isotipo, Wordmark } from "@/components/Marca";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; clave?: string }>;
}) {
  const { error, next, clave } = await searchParams;
  return (
    <div className="panel-admin flex min-h-screen items-center justify-center bg-noche text-tiza">
      <div className="w-full max-w-sm border border-azul-medio/25 bg-white/[0.02] p-8">
        <div className="flex items-center gap-3">
          <Isotipo size={40} variante="placa" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-claro">
              Sala de redacción
            </p>
            <h1>
              <Wordmark tono="claro" className="text-2xl" />
            </h1>
          </div>
        </div>
        {clave === "actualizada" && (
          <p className="mt-6 border border-azul-medio/40 bg-azul-medio/10 px-3 py-2 text-xs text-tiza/90">
            Contraseña actualizada. Por seguridad se cerraron todas tus
            sesiones: entrá de nuevo con la contraseña nueva.
          </p>
        )}
        <form action={loginAction} className="mt-8 space-y-4">
          {next && <input type="hidden" name="next" value={next} />}
          <label className="block text-xs font-semibold uppercase tracking-widest text-tiza/60">
            Email
            <input
              type="email"
              name="email"
              autoFocus
              autoComplete="username"
              className="mt-2 w-full rounded border border-azul-medio/30 bg-noche-2 px-3 py-2.5 text-sm text-tiza outline-none focus:border-azul-claro"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-widest text-tiza/60">
            Contraseña
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="mt-2 w-full rounded border border-azul-medio/30 bg-noche-2 px-3 py-2.5 text-sm text-tiza outline-none focus:border-azul-claro"
            />
          </label>
          {error && (
            <p className="text-xs font-semibold text-urgente">
              Credenciales incorrectas.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded bg-azul-medio px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-azul-claro"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
