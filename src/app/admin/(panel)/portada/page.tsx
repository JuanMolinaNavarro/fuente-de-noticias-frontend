import { requireSession } from "@/lib/auth";
import { obtenerBorradorPortada, versionesPortada } from "@/lib/admin-api";
import { Curador } from "@/components/admin/portada/Curador";

export const dynamic = "force-dynamic";

export default async function Portada() {
  const { token } = await requireSession("ADMIN", "EDITOR");
  const [borrador, versiones] = await Promise.all([obtenerBorradorPortada(token), versionesPortada(token)]);
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-azul-medio">Redacción</p>
      <h1 className="font-display text-3xl tracking-tight text-carbon">Portada</h1>
      <div className="regla-marca mt-3 w-20" />
      <p className="mt-1 mb-6 text-sm text-gris">
        Armá las zonas arrastrando notas publicadas. Lo que armes es un borrador hasta que toques
        <strong> Publicar portada</strong>. Donde no cures nada, el sitio pone lo último publicado.
      </p>
      <Curador inicial={borrador} versiones={versiones} />
    </div>
  );
}
