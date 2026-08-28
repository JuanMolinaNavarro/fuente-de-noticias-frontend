import type { Metadata } from "next";
import { obtenerPortada } from "@/lib/api";
import { Masthead } from "@/components/Masthead";
import { Mercados } from "@/components/Mercados";
import { PiePagina } from "@/components/PiePagina";
import { Publicidad } from "@/components/Publicidad";
import { UltimaHora } from "@/components/UltimaHora";
import { MuroInstagram } from "@/components/Social";
import { Mosaico } from "@/components/Mosaico";
import { FilaNota } from "@/components/TarjetaNota";

// Versión con inventario publicitario de la portada. El root (/) es la tapa
// canónica sin avisos; esta ruta no se indexa para no duplicar contenido.
export const metadata: Metadata = {
  title: "Portada con avisos",
  robots: { index: false, follow: false },
};

export default async function PortadaConAvisos() {
  // La home la arma la redacción (curación por zonas, /admin/portada) y el
  // backend rellena con lo último publicado donde no haya nada curado.
  // Ruta estática con ISR: mismo fallback que la tapa canónica (/) para que
  // next build no dependa del backend.
  const { principal, destacadas, mas: secundarias, breaking } =
    await obtenerPortada().catch(() => ({
      principal: null,
      destacadas: [],
      mas: [],
      breaking: [],
      curadaAt: null,
    }));

  return (
    <div>
      <Masthead titular />
      <UltimaHora notas={breaking} />
      {/* Franja de cotizaciones pegada a la navegación, como en la tapa */}
      <Mercados />

      {/* Megabanner de cabecera */}
      <div className="contenedor pt-6">
        <Publicidad id="portada-cabecera" formato="megabanner" />
      </div>

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

            {/* Banner intercalado en el flujo de notas */}
            <Publicidad
              id="portada-intercalado"
              formato="banner"
              className="my-8"
            />

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

          {/* ── Columna lateral: publicidad y redes ───────────────────── */}
          <aside className="space-y-8 lg:border-l lg:border-hielo lg:pl-8">
            <Publicidad id="portada-lateral-1" formato="caja" />
            <MuroInstagram />
            <Publicidad id="portada-lateral-2" formato="caja" />
            <Publicidad id="portada-lateral-3" formato="rascacielos" />
          </aside>
        </div>
      </main>

      {/* Zócalo publicitario de cierre */}
      <div className="contenedor py-10">
        <Publicidad id="portada-zocalo" formato="megabanner" />
      </div>

      <PiePagina />
    </div>
  );
}
