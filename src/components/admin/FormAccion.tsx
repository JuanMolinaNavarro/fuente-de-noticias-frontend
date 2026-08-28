"use client";

import { useActionState, useEffect, useRef } from "react";
import { BotonPendiente } from "./BotonPendiente";

/** Resultado que devuelven las server actions de formularios de gestión. */
export type EstadoForm = { ok?: boolean; error?: string; mensaje?: string } | null;

/**
 * Formulario genérico para acciones de gestión (crear usuario, feed, etc.):
 * useActionState maneja pending + resultado, y muestra el error o el éxito
 * al lado del botón sin recargar la página. Si `limpiarAlOk`, resetea los
 * campos tras un éxito (típico de "crear").
 */
export function FormAccion({
  action,
  children,
  textoBoton,
  pendiente = "Guardando…",
  variante = "primario",
  limpiarAlOk = false,
  className = "",
  compacto = false,
}: {
  action: (prev: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  children?: React.ReactNode;
  textoBoton: string;
  pendiente?: string;
  variante?: "primario" | "secundario" | "peligro" | "fantasma";
  limpiarAlOk?: boolean;
  className?: string;
  compacto?: boolean;
}) {
  const [estado, dispatch] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (limpiarAlOk && estado?.ok) ref.current?.reset();
  }, [estado, limpiarAlOk]);

  return (
    <form ref={ref} action={dispatch} className={className}>
      {children}
      <div className={`flex flex-wrap items-center gap-3 ${compacto ? "" : "pt-2"}`}>
        <BotonPendiente
          pendiente={pendiente}
          variante={variante}
          className={compacto ? "px-3 py-1.5 text-[10px]" : ""}
        >
          {textoBoton}
        </BotonPendiente>
        {estado?.error && (
          <span role="alert" className="text-xs font-semibold text-urgente">
            {estado.error}
          </span>
        )}
        {estado?.ok && estado.mensaje && (
          <span role="status" className="text-xs font-semibold text-emerald-700">
            {estado.mensaje}
          </span>
        )}
      </div>
    </form>
  );
}
