import Link from "next/link";
import { Masthead } from "@/components/Masthead";
import { PiePagina } from "@/components/PiePagina";

/* 404 público con la marca: reemplaza la página genérica de Next para toda
   ruta inexistente y para los notFound() de nota/sección/vista previa. */
export default function NotFound() {
  return (
    <div>
      <Masthead />
      <main className="contenedor py-28 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gris">
          Error 404
        </p>
        <h1 className="mt-4 font-display text-3xl text-azul">
          Esta página no existe o ya no está disponible.
        </h1>
        <p className="mt-3 text-sm text-gris">
          Puede que la nota se haya despublicado o que el enlace esté mal
          escrito.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded bg-azul-medio px-5 py-2.5 text-sm font-medium text-white"
        >
          Ir a la portada
        </Link>
      </main>
      <PiePagina />
    </div>
  );
}
