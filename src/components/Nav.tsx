import Link from "next/link";
import { API_URL } from "@/lib/env";
import { colorCategoria, slugCategoria } from "@/lib/categorias";
import { REDES, SECCIONES_NAV, SITIO } from "@/lib/sitio";
import { IconoRed } from "@/components/IconoRed";

type Seccion = { nombre: string; slug: string; color: string };

/* Secciones desde la API (tabla Category, inNav=true, ordenadas). Se cachean
   5 minutos; si la API no responde, cae al catálogo estático local. */
async function seccionesNav(): Promise<Seccion[]> {
  try {
    const r = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 300 },
    });
    if (!r.ok) throw new Error(`API ${r.status}`);
    const categorias: {
      name: string;
      slug: string;
      color: string;
      inNav: boolean;
    }[] = await r.json();
    const nav = categorias
      .filter((c) => c.inNav)
      .map((c) => ({ nombre: c.name, slug: c.slug, color: c.color }));
    if (nav.length > 0) return nav;
  } catch {
    // API caída: el nav estático mantiene el sitio usable
  }
  return SECCIONES_NAV.map((s) => ({
    nombre: s,
    slug: slugCategoria(s),
    color: colorCategoria(s),
  }));
}

/**
 * Barra de secciones. Queda fija arriba al hacer scroll y mantiene visible la
 * marca; en mobile las secciones se desplazan en horizontal.
 */
export async function Nav({ activa }: { activa?: string }) {
  const secciones = await seccionesNav();
  return (
    <nav className="sticky top-0 z-40 border-b border-hielo bg-white/95 backdrop-blur">
      {/* Laterales de igual ancho (1fr) para que las secciones caigan en el
          centro exacto de la caja, en eje con el wordmark del masthead: a la
          derecha van las redes y a la izquierda un hueco espejo que las
          compensa. En mobile las redes se ocultan y las secciones ocupan todo
          el ancho. */}
      <div className="contenedor grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="hidden md:block" />

        <ul className="sin-barra flex items-stretch gap-1 overflow-x-auto sm:gap-2">
          {secciones.map((seccion) => {
            const esActiva = activa === seccion.nombre;
            return (
              <li key={seccion.slug} className="shrink-0">
                {/* Tinta uniforme al estilo de tapa curada: el color de la
                    sección queda reservado para la pestaña activa. */}
                <Link
                  href={`/seccion/${seccion.slug}`}
                  aria-current={esActiva ? "page" : undefined}
                  className="flex h-full items-center border-b-2 px-3 py-3 text-[12px] uppercase tracking-[0.12em] decoration-2 underline-offset-4 hover:underline"
                  style={{
                    color: esActiva ? seccion.color : "var(--color-carbon)",
                    borderColor: esActiva ? seccion.color : "transparent",
                    fontWeight: esActiva ? 800 : 700,
                  }}
                >
                  {seccion.nombre}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden shrink-0 items-center gap-1 md:flex md:justify-self-end">
          {REDES.map((red) => (
            <a
              key={red.nombre}
              href={red.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITIO.nombre} en ${red.nombre}`}
              className="p-1.5 text-gris transition-colors hover:text-azul"
            >
              <IconoRed icono={red.icono} size={16} />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
