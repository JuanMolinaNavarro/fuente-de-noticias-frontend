/**
 * Cotizaciones (dólares, Merval, riesgo país) vía la API propia, que las
 * captura cada 15 min y calcula la variación contra 24 h atrás.
 * Solo se usa del lado servidor (BFF), igual que el resto de `api.ts`.
 */
import { ApiError } from "@/lib/api";
import { API_URL } from "@/lib/env";

export type TipoIndicador = "DOLAR" | "INDEX" | "RISK";

export type Indicador = {
  id: string;
  label: string;
  kind: TipoIndicador;
  unit: "ARS" | "points";
  /** Venta en dólares; puntos en índices. */
  value: number;
  buy: number | null;
  sell: number | null;
  sourceAt: Date | null;
  capturedAt: Date;
  /** null mientras no haya una captura de hace 24 h con qué comparar. */
  variation: { absolute: number; percent: number; referenceAt: Date } | null;
  /** Capturas de las últimas 24 h, para el mini-gráfico. */
  history: { t: Date; v: number }[];
};

export type ResumenMercado = {
  updatedAt: Date | null;
  indicators: Indicador[];
};

type Wire = {
  updatedAt: string | null;
  indicators: Array<
    Omit<Indicador, "sourceAt" | "capturedAt" | "variation" | "history"> & {
      sourceAt: string | null;
      capturedAt: string;
      variation: {
        absolute: number;
        percent: number;
        referenceAt: string;
      } | null;
      history: { t: string; v: number }[];
    }
  >;
};

/**
 * Cacheado 5 min: el backend ya cachea 60 s y refresca cada 15 min, así que
 * más frecuencia no aporta. Si la API falla devolvemos null y la home
 * simplemente no muestra el bloque (una caída de cotizaciones no debe
 * tumbar la portada).
 */
export async function obtenerMercado(): Promise<ResumenMercado | null> {
  try {
    const res = await fetch(`${API_URL}/market/summary`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new ApiError(res.status, "API /market/summary");
    const j = (await res.json()) as Wire;
    return {
      updatedAt: j.updatedAt ? new Date(j.updatedAt) : null,
      indicators: j.indicators.map((i) => ({
        ...i,
        sourceAt: i.sourceAt ? new Date(i.sourceAt) : null,
        capturedAt: new Date(i.capturedAt),
        variation: i.variation
          ? { ...i.variation, referenceAt: new Date(i.variation.referenceAt) }
          : null,
        history: i.history.map((p) => ({ t: new Date(p.t), v: p.v })),
      })),
    };
  } catch {
    return null;
  }
}

/* ── Formateo ─────────────────────────────────────────────────────────── */

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const enteros = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const porcentaje = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

/** Valor principal según el tipo: "$ 1.545,00" | "2.947.349" | "480". */
export function formatearValor(i: Pick<Indicador, "kind" | "value">): string {
  if (i.kind === "DOLAR") return pesos.format(i.value);
  return enteros.format(i.value);
}

export function formatearPesos(n: number): string {
  return pesos.format(n);
}

/** "+0,3 %" / "−0,4 %" / "0,0 %" */
export function formatearPorcentaje(pct: number): string {
  return `${porcentaje.format(pct)} %`.replace("-", "−");
}
