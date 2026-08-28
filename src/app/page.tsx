import { obtenerPortadaAmpliada } from "@/lib/api";
import { Masthead } from "@/components/Masthead";
import { Mercados } from "@/components/Mercados";
import { PiePagina } from "@/components/PiePagina";
import { UltimaHora } from "@/components/UltimaHora";
import { MuroInstagram } from "@/components/Social";
import { Mosaico } from "@/components/Mosaico";
import { FilaNota, TarjetaNota } from "@/components/TarjetaNota";

/**
 * La portada es una ruta estática con ISR: next build la prerenderiza sin
 * backend disponible (Docker), y en runtime se regenera sola según el
 * revalidate de sus fetch (60 s) o al instante cuando el panel publica
 * (updateTag). Si el backend no responde durante una regeneración, el
 * catch devuelve la tapa vacía y Next sigue sirviendo la última versión
 * buena que tenga cacheada.
 */
async function cargarPortada() {
  try {
    return await obtenerPortadaAmpliada();
  } catch {
    return {
      principal: null,
      destacadas: [],
      mas: [],
      extra: [],
      breaking: [],
      curadaAt: null,
    };
  }
}

export default async function Portada() {
  // La home la arma la redacción (curación por zonas, /admin/portada) y el
  // backend rellena con lo último publicado donde no haya nada curado. Los
  // módulos extra (En foco, Últimas, Seguí leyendo) toman lo publicado que
  // quedó fuera de la curación; la versión con avisos vive en /ads.
  const { principal, destacadas, mas: secundarias, extra, breaking } =
    await cargarPortada();

  const enFoco = extra.slice(0, 3);
  const ultimas = extra.slice(3, 11);
  const seguiLeyendo = extra.slice(11, 19);

  return (
    <div>
      <Masthead titular />
      <UltimaHora notas={breaking} />
      {/* Franja de cotizaciones pegada a la navegación, como en la tapa */}
      <Mercados />

      <main className="contenedor pt-8">
        {!principal && (
          <div className="py-28 text-center">
            <p className="font-display text-3xl text-azul">
              La redacción está trabajando.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-gris">
              Todavía no hay notas aprobadas — pasá por el panel de
              administración
            </p>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_332px]">
          {/* ── Columna editorial ─────────────────────────────────────── */}
          <div className="min-w-0">
            <Mosaico principal={principal} destacadas={destacadas} />

            {enFoco.length > 0 && (
              <section className="my-8 grid gap-6 sm:grid-cols-3">
                {enFoco.map((nota) => (
                  <TarjetaNota key={nota.id} nota={nota} variante="media" />
                ))}
              </section>
            )}

            {secundarias.length > 0 && (
              <>
                <div className="regla-marca" />
                <h2 className="mt-8 text-[11px] font-bold uppercase tracking-[0.34em] text-azul">
                  Más noticias
                </h2>
                <section className="grid gap-x-8 gap-y-5 py-6 sm:grid-cols-2">
                  {secundarias.map((nota) => (
                    <FilaNota key={nota.id} nota={nota} />
                  ))}
                </section>
              </>
            )}
          </div>

          {/* ── Columna lateral: últimas noticias y redes ─────────────── */}
          <aside className="space-y-8 lg:border-l lg:border-hielo lg:pl-8">
            {ultimas.length > 0 && (
              <section>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.34em] text-azul">
                  Últimas noticias
                </h2>
                <div className="mt-4 space-y-5">
                  {ultimas.map((nota) => (
                    <FilaNota key={nota.id} nota={nota} />
                  ))}
                </div>
              </section>
            )}
            <MuroInstagram />
          </aside>
        </div>
      </main>

      {seguiLeyendo.length > 0 && (
        <section className="contenedor py-10">
          <div className="regla-marca" />
          <h2 className="mt-8 text-[11px] font-bold uppercase tracking-[0.34em] text-azul">
            Seguí leyendo
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {seguiLeyendo.map((nota) => (
              <TarjetaNota key={nota.id} nota={nota} variante="media" />
            ))}
          </div>
        </section>
      )}

      <PiePagina />
    </div>
  );
}
