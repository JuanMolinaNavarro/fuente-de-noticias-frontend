import { notFound } from "next/navigation";
import { esEditor, requireSession } from "@/lib/auth";
import { ApiError, obtenerCategorias } from "@/lib/api";
import {
  directorioUsuarios,
  listarRevisiones,
  obtenerBorradorPortada,
  obtenerNotaAdmin,
} from "@/lib/admin-api";
import { EditorNota } from "@/components/admin/editor/EditorNota";

export const dynamic = "force-dynamic";

export default async function EditarNota({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { token, user } = await requireSession();
  const { id } = await params;

  let nota;
  try {
    nota = await obtenerNotaAdmin(token, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const [categorias, usuarios, { revisiones }, portada] = await Promise.all([
    obtenerCategorias(),
    directorioUsuarios(token),
    listarRevisiones(token, id),
    // El endpoint de portada es sólo ADMIN/EDITOR; para un redactor no se consulta
    esEditor(user.role) ? obtenerBorradorPortada(token).catch(() => null) : null,
  ]);

  return (
    <EditorNota
      // key: si se navega de una nota a otra, el editor se remonta con estado limpio
      key={nota.id}
      nota={nota}
      categorias={categorias}
      usuarios={usuarios}
      usuario={user}
      revisiones={revisiones}
      esPrincipalActual={portada?.zonas.PRINCIPAL[0]?.article.id === id}
    />
  );
}
