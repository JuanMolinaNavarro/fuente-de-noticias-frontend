import Link from "next/link";
import { Isotipo } from "@/components/Marca";
import { IconoRed } from "@/components/IconoRed";
import { obtenerCategorias } from "@/lib/api";
import { NOMBRES_CATEGORIAS, slugCategoria } from "@/lib/categorias";
import { REDES, SITIO } from "@/lib/sitio";

/* Todas las secciones del diario, en el orden definido por la redacción
   (campo `order` de Category). Si la API no responde, cae al catálogo
   estático local. */
async function listarSecciones(): Promise<{ nombre: string; slug: string }[]> {
  try {
    const categorias = await obtenerCategorias();
    if (categorias.length > 0) {
      return [...categorias]
        .sort((a, b) => a.order - b.order)
        .map((c) => ({ nombre: c.name, slug: c.slug }));
    }
  } catch {
    // fallback abajo
  }
  return NOMBRES_CATEGORIAS.map((nombre) => ({
    nombre,
    slug: slugCategoria(nombre),
  }));
}

export async function PiePagina() {
  const secciones = await listarSecciones();

  const legales = [
    SITIO.editorResponsable && `Editor responsable: ${SITIO.editorResponsable}`,
    SITIO.domicilio && `Domicilio legal: ${SITIO.domicilio}`,
    SITIO.registroPropiedadIntelectual &&
      `Registro de Propiedad Intelectual N.º ${SITIO.registroPropiedadIntelectual}`,
  ].filter(Boolean) as string[];

  return (
    <footer className="mt-20 bg-white">
      <div className="regla-marca" />

      <div className="contenedor py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
          {/* Identidad y contacto */}
          <div>
            <div className="flex items-center gap-3">
              <Isotipo size={40} />
            </div>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gris">
              {SITIO.lema}
            </p>
            <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-gris-oscuro">
              {SITIO.descripcion}
            </p>

            <div className="mt-6 flex items-center gap-2">
              {REDES.map((red) => (
                <a
                  key={red.nombre}
                  href={red.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${SITIO.nombre} en ${red.nombre}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-hielo text-gris transition-colors hover:border-azul-claro hover:bg-azul-claro hover:text-white"
                >
                  <IconoRed icono={red.icono} size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Secciones */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-azul">
              Secciones
            </h3>
            <ul className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2.5 sm:grid-cols-3">
              {secciones.map((seccion) => (
                <li key={seccion.slug}>
                  <Link
                    href={`/seccion/${seccion.slug}`}
                    className="text-[13px] text-gris-oscuro transition-colors hover:text-azul-medio"
                  >
                    {seccion.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Franja legal */}
        <div className="mt-12 border-t border-hielo pt-8">
          <p className="text-[12px] leading-relaxed text-gris-oscuro">
            © {new Date().getFullYear()} {SITIO.nombre} · {SITIO.ciudad} ·{" "}
            {SITIO.provincia}. Todos los derechos reservados.
          </p>
          {legales.length > 0 && (
            <p className="mt-2 text-[12px] leading-relaxed text-gris">
              {legales.join(" · ")}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
