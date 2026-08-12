import { Isotipo } from "@/components/Masthead";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-noche text-tiza">
      <div className="w-full max-w-sm rounded-2xl border border-azul-medio/25 bg-white/[0.02] p-8">
        <div className="flex items-center gap-3">
          <Isotipo size={40} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-claro">
              Sala de redacción
            </p>
            <h1 className="font-display text-2xl font-black">
              Fuente <span className="text-azul-claro">de Noticias</span>
            </h1>
          </div>
        </div>
        <form action={loginAction} className="mt-8 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-widest text-tiza/60">
            Clave de acceso
            <input
              type="password"
              name="password"
              autoFocus
              className="mt-2 w-full rounded-lg border border-azul-medio/30 bg-noche-2 px-3 py-2.5 text-sm text-tiza outline-none focus:border-azul-claro"
            />
          </label>
          {error && (
            <p className="text-xs font-semibold text-urgente">
              Clave incorrecta.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-azul-medio px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-azul-claro"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
