"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { validPassword, setSession, clearSession, isAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!validPassword(password)) {
    redirect("/admin/login?error=1");
  }
  await setSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/admin/login");
}

export async function reviewAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");

  const id = String(formData.get("id"));
  const intent = String(formData.get("intent"));

  const edits = {
    title: String(formData.get("title") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || null,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
  };

  if (intent === "reject") {
    await prisma.article.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date() },
    });
  } else if (intent === "approve") {
    if (!edits.title || !edits.content) redirect("/admin?error=incompleto");
    await prisma.article.update({
      where: { id },
      data: {
        ...edits,
        slug: `${slugify(edits.title)}-${id.slice(-6)}`,
        status: "APPROVED",
        publishedAt: new Date(),
        reviewedAt: new Date(),
      },
    });
  } else {
    // guardar cambios sin publicar
    await prisma.article.update({ where: { id }, data: edits });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function unpublishAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id"));
  await prisma.article.update({
    where: { id },
    data: { status: "DRAFT", publishedAt: null },
  });
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}
