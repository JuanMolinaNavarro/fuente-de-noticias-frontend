import Link from "next/link";
import type { Usuario } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";
import { Wordmark } from "@/components/Marca";
import { MenuMobile } from "./Sidebar";
import { IcoSalir } from "./Iconos";

const ROLES: Record<Usuario["role"], string> = {
  ADMIN: "Administración",
  EDITOR: "Editor/a",
  REDACTOR: "Redactor/a",
};

export function Topbar({ user }: { user: Usuario }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-hielo bg-white/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3 lg:hidden">
        <MenuMobile rol={user.role} />
        <Link href="/admin">
          <Wordmark className="text-lg" />
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <Link href="/admin/cuenta" className="text-right leading-tight">
          <span className="block text-sm font-semibold text-carbon">{user.name}</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gris">
            {ROLES[user.role]}
          </span>
        </Link>
        <form action={logoutAction}>
          <button
            title="Salir"
            className="rounded border border-azul/15 p-2 text-gris transition-colors hover:border-azul-medio hover:text-azul-medio"
          >
            <IcoSalir />
            <span className="sr-only">Salir</span>
          </button>
        </form>
      </div>
    </header>
  );
}
