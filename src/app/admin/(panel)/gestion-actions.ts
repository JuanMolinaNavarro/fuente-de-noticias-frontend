"use server";

import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, TAGS } from "@/lib/api";
import { clearSession, requireSession, type Rol } from "@/lib/auth";
import {
  actualizarCategoria,
  actualizarFeed,
  actualizarUsuario,
  blanquearPassword,
  cambiarPassword,
  correrIngesta,
  crearCategoria,
  crearFeed,
  crearUsuario,
} from "@/lib/admin-api";
import type { EstadoForm } from "@/components/admin/FormAccion";

/**
 * Server actions de las pantallas de gestión (usuarios, feeds, secciones,
 * cuenta). Todas devuelven EstadoForm para FormAccion. Reciben FormData
 * porque son formularios HTML clásicos: sin JS siguen funcionando.
 */

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const b = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

async function intentar(fn: () => Promise<unknown>, mensaje: string, revalidar: string): Promise<EstadoForm> {
  try {
    await fn();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 401) redirect("/admin/login");
    return { ok: false, error: error.message };
  }
  revalidatePath(revalidar);
  return { ok: true, mensaje };
}

/* ── Usuarios (ADMIN) ────────────────────────────────────────────────── */

export async function crearUsuarioAction(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const { token } = await requireSession("ADMIN");
  return intentar(
    () =>
      crearUsuario(token, {
        email: s(fd, "email"),
        name: s(fd, "name"),
        password: s(fd, "password"),
        role: (s(fd, "role") || "REDACTOR") as Rol,
      }),
    "Usuario creado.",
    "/admin/usuarios",
  );
}

export async function actualizarUsuarioAction(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const { token } = await requireSession("ADMIN");
  const id = s(fd, "id");
  return intentar(
    () =>
      actualizarUsuario(token, id, {
        name: s(fd, "name") || undefined,
        role: (s(fd, "role") || undefined) as Rol | undefined,
        isActive: b(fd, "isActive"),
      }),
    "Guardado.",
    "/admin/usuarios",
  );
}

export async function blanquearPasswordAction(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const { token } = await requireSession("ADMIN");
  return intentar(
    () => blanquearPassword(token, s(fd, "id"), s(fd, "password")),
    "Contraseña cambiada.",
    "/admin/usuarios",
  );
}

/* ── Cuenta (cualquier rol) ──────────────────────────────────────────── */

export async function cambiarPasswordAction(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const { token } = await requireSession();
  const nueva = s(fd, "newPassword");
  if (nueva !== s(fd, "confirm")) return { ok: false, error: "Las contraseñas nuevas no coinciden." };
  try {
    await cambiarPassword(token, s(fd, "currentPassword"), nueva);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    if (error.status === 401) return { ok: false, error: "La contraseña actual no es correcta." };
    return { ok: false, error: error.message };
  }
  // El backend revoca TODAS las sesiones al cambiar la clave (si alguien robó
  // el token, muere acá). La actual también: cookie afuera y a loguearse de
  // nuevo con la contraseña nueva.
  await clearSession();
  redirect("/admin/login?clave=actualizada");
}

/* ── Feeds (ADMIN) ───────────────────────────────────────────────────── */

export async function crearFeedAction(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const { token } = await requireSession("ADMIN");
  return intentar(
    () =>
      crearFeed(token, {
        url: s(fd, "url"),
        categoryId: s(fd, "categoryId") || null,
        enabled: true,
      }),
    "Feed agregado.",
    "/admin/feeds",
  );
}

export async function actualizarFeedAction(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const { token } = await requireSession("ADMIN");
  return intentar(
    () =>
      actualizarFeed(token, s(fd, "id"), {
        categoryId: s(fd, "categoryId") || null,
        enabled: b(fd, "enabled"),
      }),
    "Guardado.",
    "/admin/feeds",
  );
}

export async function correrIngestaAction(): Promise<EstadoForm> {
  const { token } = await requireSession("ADMIN");
  try {
    const r = await correrIngesta(token);
    revalidatePath("/admin");
    return {
      ok: true,
      mensaje: `Listo: ${r.feeds} feeds, ${r.nuevos} nuevas, ${r.borradores} a borrador, ${r.fallidos} fallidas.`,
    };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return { ok: false, error: error.message };
  }
}

/* ── Secciones (ADMIN) ───────────────────────────────────────────────── */

export async function crearCategoriaAction(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  // Un editor puede crear secciones; editarlas sigue siendo de ADMIN
  const { token } = await requireSession("ADMIN", "EDITOR");
  const r = await intentar(
    () =>
      crearCategoria(token, {
        name: s(fd, "name"),
        slug: s(fd, "slug"),
        color: s(fd, "color"),
        order: Number(s(fd, "order")) || 0,
        inNav: b(fd, "inNav"),
      }),
    "Sección creada.",
    "/admin/categorias",
  );
  if (r?.ok) updateTag(TAGS.categorias);
  return r;
}

export async function actualizarCategoriaAction(_p: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const { token } = await requireSession("ADMIN");
  const r = await intentar(
    () =>
      actualizarCategoria(token, s(fd, "id"), {
        name: s(fd, "name") || undefined,
        color: s(fd, "color") || undefined,
        order: Number(s(fd, "order")) || 0,
        inNav: b(fd, "inNav"),
      }),
    "Guardado.",
    "/admin/categorias",
  );
  if (r?.ok) updateTag(TAGS.categorias);
  return r;
}
