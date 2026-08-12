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
    <div className="flex min-h-screen items-center justify-center bg-carbon text-tiza">
      <div className="w-full max-w-sm border border-borde bg-panel p-8">
        <div className="flex items-center gap-3">
          <Isotipo size={38} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-azul-claro">
              Sala de redacción
            </p>
            <h1 className="font-display text-2xl font-bold">
              Fuente de Noticias
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
              className="mt-2 w-full border border-borde bg-carbon px-3 py-2.5 text-sm text-tiza outline-none focus:border-azul-claro"
            />
          </label>
          {error && (
            <p className="text-xs font-semibold text-urgente">
              Clave incorrecta.
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-azul-medio px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-azul-claro"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
