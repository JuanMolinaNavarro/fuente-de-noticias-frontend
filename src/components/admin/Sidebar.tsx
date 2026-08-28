"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Rol } from "@/lib/auth";
import {
  IcoActividad,
  IcoCategorias,
  IcoCerrar,
  IcoCuenta,
  IcoFeeds,
  IcoImagen,
  IcoMenu,
  IcoNotas,
  IcoNueva,
  IcoSitio,
  IcoTablero,
  IcoUsuarios,
} from "./Iconos";

type Item = {
  href: string;
  label: string;
  icono: React.ComponentType<{ className?: string }>;
  roles?: Rol[]; // sin roles = todos
  exacto?: boolean;
};

const REDACCION: Item[] = [
  { href: "/admin", label: "Tablero", icono: IcoTablero, exacto: true },
  { href: "/admin/notas", label: "Notas", icono: IcoNotas },
  { href: "/admin/notas/nueva", label: "Nueva nota", icono: IcoNueva, exacto: true },
  { href: "/admin/media", label: "Medios", icono: IcoImagen },
  { href: "/admin/portada", label: "Portada", icono: IcoTablero, roles: ["ADMIN", "EDITOR"] },
];

const GESTION: Item[] = [
  { href: "/admin/feeds", label: "Feeds RSS", icono: IcoFeeds, roles: ["ADMIN"] },
  { href: "/admin/categorias", label: "Secciones", icono: IcoCategorias, roles: ["ADMIN", "EDITOR"] },
  { href: "/admin/usuarios", label: "Usuarios", icono: IcoUsuarios, roles: ["ADMIN"] },
  { href: "/admin/actividad", label: "Actividad", icono: IcoActividad, roles: ["ADMIN"] },
];

const CUENTA: Item[] = [
  { href: "/admin/cuenta", label: "Mi cuenta", icono: IcoCuenta },
  { href: "/", label: "Ver el sitio", icono: IcoSitio },
];

function Grupo({ titulo, items, rol, pathname }: { titulo: string; items: Item[]; rol: Rol; pathname: string }) {
  const lista = items.filter((i) => !i.roles || i.roles.includes(rol));
  if (!lista.length) return null;
  return (
      <div>
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.3em] text-tiza/40">
          {titulo}
        </p>
        <ul className="mt-2 space-y-0.5">
          {lista.map((i) => {
            const activo = i.exacto
              ? pathname === i.href
              : pathname === i.href || pathname.startsWith(i.href + "/");
            const Ico = i.icono;
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={activo ? "page" : undefined}
                  className={`flex items-center gap-3 rounded px-3 py-2 text-sm font-semibold transition-colors ${
                    activo
                      ? "bg-azul-medio/30 text-white"
                      : "text-tiza/75 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Ico className="shrink-0 opacity-80" />
                  {i.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
  );
}

/** Los tres grupos del menú. Compartido entre el sidebar fijo y el drawer mobile. */
function NavGrupos({ rol }: { rol: Rol }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
      <Grupo titulo="Redacción" items={REDACCION} rol={rol} pathname={pathname} />
      <Grupo titulo="Gestión" items={GESTION} rol={rol} pathname={pathname} />
      <Grupo titulo="Cuenta" items={CUENTA} rol={rol} pathname={pathname} />
    </nav>
  );
}

export function Sidebar({ rol }: { rol: Rol }) {
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-noche text-tiza max-lg:hidden">
      <Link
        href="/admin"
        className="block px-5 py-5 text-xs font-bold uppercase tracking-[0.2em] text-azul-claro"
      >
        Sala de redacción
      </Link>
      <NavGrupos rol={rol} />
    </aside>
  );
}

/** Menú del panel en pantallas chicas: botón hamburguesa + drawer lateral.
 *  Vive en el Topbar (el sidebar fijo desaparece bajo lg). */
export function MenuMobile({ rol }: { rol: Rol }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  // Navegar cierra el drawer; el menú no debe quedar tapando la página nueva.
  useEffect(() => setAbierto(false), [pathname]);

  // Sin scroll de fondo mientras el drawer está abierto.
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={abierto}
        onClick={() => setAbierto(true)}
        className="rounded border border-azul/15 p-2 text-gris transition-colors hover:border-azul-medio hover:text-azul-medio"
      >
        <IcoMenu />
      </button>
      {/* Portal al body: el Topbar tiene backdrop-blur, que convierte al header
          en containing block de los descendientes `fixed` — sin el portal, el
          drawer queda confinado a la caja del header y detrás de su stacking. */}
      {abierto && createPortal(
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menú del panel">
          <div className="absolute inset-0 bg-noche/60" onClick={() => setAbierto(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-noche text-tiza shadow-xl">
            <div className="flex items-center justify-between px-5 py-5">
              <Link
                href="/admin"
                className="text-xs font-bold uppercase tracking-[0.2em] text-azul-claro"
              >
                Sala de redacción
              </Link>
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setAbierto(false)}
                className="rounded p-2 text-tiza/75 hover:bg-white/5 hover:text-white"
              >
                <IcoCerrar />
              </button>
            </div>
            <NavGrupos rol={rol} />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
