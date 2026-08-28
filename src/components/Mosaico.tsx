import { TarjetaNota, type NotaResumen, type VarianteTarjeta } from "@/components/TarjetaNota";

/**
 * Mosaico de portada: la nota principal y las destacadas en una grilla
 * modular de diario.
 *
 * El peso de cada celda lo da la POSICIÓN en el curador, no un campo en la
 * base: la 1.ª destacada queda arriba a la derecha y las demás bajan. Mover
 * una nota hacia arriba en /admin/portada la agranda.
 *
 * Disposición a ancho completo (xl):
 *
 *   ┌───────────────────────┬───────────┐
 *   │                       │    d0     │
 *   │      PRINCIPAL        ├───────────┤
 *   │       (2 × 2)         │    d1     │
 *   ├───────────┬───────────┼───────────┤
 *   │    d2     │    d3     │    d4     │
 *   ├───────────┴───────────┴───────────┤
 *   │        d5  (ancha, horizontal)    │
 *   └───────────────────────────────────┘
 *
 * La colocación la resuelve el auto-flow de CSS Grid: alcanza con que la
 * principal declare su span para que las demás caigan solas en su lugar.
 */
export function Mosaico({
  principal,
  destacadas,
}: {
  principal: NotaResumen | null;
  destacadas: NotaResumen[];
}) {
  if (!principal && destacadas.length === 0) return null;

  // Con menos de dos destacadas la columna alta de la derecha quedaría a
  // medio llenar y se vería un hueco al lado de la principal: en ese caso la
  // principal pasa a ocupar el ancho completo.
  const columnaAlta = destacadas.length >= 2;

  return (
    <section
      aria-label="Portada"
      className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3"
    >
      {principal && (
        <TarjetaNota
          nota={principal}
          variante="principal"
          className={
            columnaAlta
              ? "sm:col-span-2 xl:row-span-2"
              : "sm:col-span-2 xl:col-span-3"
          }
        />
      )}
      {destacadas.map((nota, i) => {
        const { variante, clases } = celda(i, destacadas.length);
        return (
          <TarjetaNota
            key={nota.id}
            nota={nota}
            variante={variante}
            className={clases}
          />
        );
      })}
    </section>
  );
}

/**
 * Peso y colocación de la destacada número `i`.
 *
 * Las dos primeras van en la columna alta junto a la principal; de la tercera
 * en adelante fluyen en bandas de tres. Si la última quedara sola en su banda,
 * se convierte en tarjeta ancha y ocupa el renglón entero en lugar de dejar
 * dos huecos.
 */
function celda(i: number, total: number): { variante: VarianteTarjeta; clases: string } {
  const esUltima = i === total - 1;
  // (total - 2) son las que caen en las bandas de tres; resto 1 = una sola
  // en la última banda.
  const ultimaBandaIncompleta = total > 2 && (total - 2) % 3 === 1;

  if (esUltima && ultimaBandaIncompleta) {
    return { variante: "ancha", clases: "sm:col-span-2 xl:col-span-3" };
  }

  // Filete vertical entre columnas: las celdas de la 1.ª columna del mosaico
  // van al ras del margen; las demás llevan la línea a su izquierda. Sólo en
  // xl, que es donde la grilla tiene sus tres columnas.
  const primeraColumna = i >= 2 && (i - 2) % 3 === 0;
  const filete = primeraColumna ? "" : "xl:border-l xl:border-hielo xl:pl-6";

  return { variante: "media", clases: filete };
}
