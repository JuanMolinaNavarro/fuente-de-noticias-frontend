import {
  formatearPorcentaje,
  obtenerMercado,
  type Indicador,
} from "@/lib/mercado";

/**
 * Franja de cotizaciones bajo la navegación, al estilo de la tapa curada:
 * una sola línea centrada con filete inferior. Muestra solo los cinco
 * indicadores de la portada (oficial, blue, MEP, Merval y riesgo país);
 * el detalle completo vive en la API. Server Component cacheado; si la
 * API no responde, no renderiza nada.
 */
export async function Mercados() {
  const mercado = await obtenerMercado();
  if (!mercado || mercado.indicators.length === 0) return null;

  const dolar = (patron: RegExp) =>
    mercado.indicators.find((i) => i.kind === "DOLAR" && patron.test(i.label));
  // Orden editorial: lo más consultado primero, para que en mobile quede
  // visible sin scrollear (oficial, riesgo, Merval; blue y MEP después).
  const items: { etiqueta: string; valor: React.ReactNode }[] = [];

  const oficial = dolar(/oficial/i);
  if (oficial) items.push({ etiqueta: "Dólar oficial", valor: pesos(oficial) });

  const riesgo = mercado.indicators.find((i) => i.kind === "RISK");
  if (riesgo) {
    items.push({ etiqueta: "Riesgo país", valor: `${enteros.format(riesgo.value)} pb` });
  }

  const merval = mercado.indicators.find((i) => i.kind === "INDEX");
  if (merval) {
    // Como en los diarios: del índice interesa la variación del día, no el
    // puntaje. Verde sube, rojo baja; sin comparación de 24 h, el puntaje.
    items.push({
      etiqueta: "Merval",
      valor: merval.variation ? (
        <span
          style={{
            color:
              merval.variation.percent >= 0 ? "#1A7A4A" : "var(--color-urgente)",
          }}
        >
          {formatearPorcentaje(merval.variation.percent)}
        </span>
      ) : (
        enteros.format(merval.value)
      ),
    });
  }

  const blue = dolar(/blue/i);
  if (blue) items.push({ etiqueta: "Blue", valor: pesos(blue) });
  const mep = dolar(/mep/i);
  if (mep) items.push({ etiqueta: "MEP", valor: pesos(mep) });

  if (items.length === 0) return null;

  return (
    <section aria-label="Mercados" className="border-b border-hielo">
      <div className="contenedor sin-barra flex items-center justify-start gap-6 overflow-x-auto py-2 text-[11px] tracking-[0.05em] text-gris-oscuro lg:justify-center">
        {items.map((item) => (
          <span key={item.etiqueta} className="shrink-0 whitespace-nowrap">
            <strong className="text-[10px] font-bold uppercase tracking-[0.14em] text-gris">
              {item.etiqueta}
            </strong>{" "}
            {item.valor}
          </span>
        ))}
      </div>
    </section>
  );
}

/* Valores compactos de la franja: sin centavos, como en tapa. */
const pesosEnteros = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const enteros = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });

function pesos(i: Indicador): string {
  return pesosEnteros.format(i.value);
}
