import { requireSession } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";

/**
 * Shell del panel: valida la sesión contra el backend (una vez por render,
 * gracias al cache() de getSession) y arma sidebar + barra superior.
 * Las páginas hijas vuelven a pedir la sesión con requireSession() —no
 * confían en el layout— porque en Next un layout y una page se renderizan
 * en paralelo y la page podría ejecutarse aunque el layout redirija.
 */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireSession();
  return (
    <div className="panel-admin flex min-h-screen bg-white text-carbon">
      <Sidebar rol={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
