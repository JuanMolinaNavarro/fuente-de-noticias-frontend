"use client";

import { useFormStatus } from "react-dom";

/**
 * Botón de submit que se deshabilita mientras la server action del <form>
 * padre está en vuelo. useFormStatus sólo funciona en un componente cliente
 * hijo del <form>; por eso es un componente aparte y no un <button> suelto.
 */
export function BotonPendiente({
  children,
  pendiente,
  variante = "primario",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendiente?: string;
  variante?: "primario" | "secundario" | "peligro" | "fantasma";
}) {
  const { pending } = useFormStatus();
  const estilos = {
    primario:
      "bg-azul-medio text-white hover:bg-azul disabled:hover:bg-azul-medio",
    secundario:
      "border border-azul/20 text-carbon hover:border-azul hover:text-azul",
    peligro:
      "border border-azul/15 text-gris hover:border-urgente hover:text-urgente",
    fantasma: "text-gris hover:text-azul-medio",
  }[variante];
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
      {...props}
      className={`inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-colors disabled:cursor-wait disabled:opacity-60 ${estilos} ${className}`}
    >
      {pending && pendiente ? pendiente : children}
    </button>
  );
}
