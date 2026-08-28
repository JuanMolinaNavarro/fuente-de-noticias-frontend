/* Isotipo de marca: plumín con "f".
   `variante="marca"` (por defecto) es el plumín azul sobre fondo transparente,
   para superficies claras. `variante="placa"` es la versión calada sobre placa
   azul. `variante="blanco"` toma el plumín transparente y lo pasa a blanco
   pleno con `brightness(0) invert(1)`: lleva cualquier píxel opaco a negro y
   lo invierte, conservando el canal alfa. Para fondos oscuros sin placa. */
export function Isotipo({
  size = 56,
  variante = "marca",
}: {
  size?: number;
  variante?: "marca" | "placa" | "blanco";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variante === "placa" ? "/logo.png" : "/logo-marca.png"}
      alt="Fuente de Noticias"
      width={size}
      height={size}
      className={`inline-block shrink-0 select-none ${
        variante === "blanco" ? "brightness-0 invert" : ""
      }`}
    />
  );
}

/* Wordmark del manual. `tono="oscuro"` (por defecto) es el monotono azul para
   superficies claras; `tono="claro"` es la variante bitonal para fondos noche
   (sidebar y login del panel). */
export function Wordmark({
  className = "",
  tono = "oscuro",
}: {
  className?: string;
  tono?: "oscuro" | "claro";
}) {
  return (
    <span className={`font-display tracking-tight ${className}`}>
      {tono === "claro" ? (
        <>
          <span className="text-tiza">Fuente </span>
          <span className="text-azul-claro">de Noticias</span>
        </>
      ) : (
        <span className="text-azul">Fuente de Noticias</span>
      )}
    </span>
  );
}
