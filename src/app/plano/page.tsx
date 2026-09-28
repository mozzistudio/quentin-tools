import Image from 'next/image'
import Link from 'next/link'
import PlanoViewer from '@/components/plano/PlanoViewer'
import { ROOMS } from '@/components/plano/geometry'

export const metadata = {
  title: 'Plano 3D — Quentin Tools',
  description: 'Restitution 3D et projet d\'aménagement du piso, à partir du croquis coté',
}

const TOTAL = ROOMS.reduce((sum, r) => sum + r.a, 0)

const FURNITURE = [
  ['Cama matrimonial', '1,40 × 1,90', 'Cuarto'],
  ['Armario a techo, puertas correderas', '0,60 × 2,30 × h 2,30', 'Cuarto'],
  ['Mesilla', '0,40 × 0,40', 'Cuarto'],
  ['Ducha de obra, panel fijo', '0,90 × 1,28', 'Baño'],
  ['Mueble lavabo suspendido', '0,55 × 0,42', 'Baño'],
  ['Inodoro con cisterna empotrada', '0,38 × 0,58', 'Baño'],
  ['Columna de almacenaje', '0,28 × 1,38 × h 2,30', 'Pasillo'],
  ['Sofá tres plazas', '2,00 × 0,88', 'Sala'],
  ['Mesa de comedor, bajo la ventana', '1,40 × 0,80', 'Sala'],
  ['Velador', '0,44 × 0,44', 'Sala'],
  ['Frente de cocina en línea', '3,32 × 0,68', 'Cocina'],
  ['Nevera integrada', '0,62 × 0,68 × h 1,90', 'Cocina'],
]

const CLEARANCES = [
  ['Paso central sala', '1,14 m'],
  ['Frente de cocina', '0,85 m'],
  ['Lado libre de cama', '0,85 m'],
  ['Pasillo', '0,80 m'],
  ['Paso en baño', '0,66 m'],
]

const FINISHES = [
  ['#9c7238', 'Suelo seco', 'Roble natural, lama ancha — cuarto, pasillo y sala'],
  ['#8c9499', 'Suelo húmedo', 'Microcemento gris continuo — baño y cocina'],
  ['#e9e4da', 'Paramentos', 'Blanco cal mate, paredes y techo'],
  ['#47513c', 'Carpintería', 'Lacado verde oliva — armario, columna, cocina'],
  ['#d8d3c6', 'Encimera', 'Cuarzo blanco arena, canto recto 40 mm'],
  ['#2f5b66', 'Alicatado', 'Gres verde azulado — ducha y frente de cocina'],
  ['#6e8190', 'Tapicería', 'Lino azul grisáceo'],
  ['#b5813a', 'Textil', 'Ocre — alfombra y cojines'],
  ['#b08d4f', 'Herrajes', 'Latón envejecido — tiradores, griferías, luminarias'],
  ['#2c2f31', 'Perfilería', 'Acero negro — patas, espejo, carpintería exterior'],
]

const RENDERS = [
  ['/plano/sala.jpg', 'Sala hacia la cocina', 'Sofá de lino azul grisáceo con cojines ocre, alfombra ocre, mesa de roble pegada a la nueva ventana y lámpara de latón encima.'],
  ['/plano/cocina.jpg', 'Cocina abierta', 'Frente único de 3,32 m: nevera integrada al extremo, encimera de cuarzo blanco arena, alicatado de gres verde azulado, dos baldas de roble.'],
  ['/plano/cuarto.jpg', 'Cuarto', 'Cama con cabecero de roble contra el muro oeste, armario a techo en lacado verde oliva con tiradores de latón, suelo de roble de lama ancha.'],
  ['/plano/bano.jpg', 'Baño', 'Ducha de obra a toda la profundidad, gres verde azulado, panel fijo de vidrio, mueble suspendido de roble y grifería de latón envejecido.'],
]

const DECISIONS: Array<{ title: string; body: string; accent?: boolean }> = [
  {
    title: 'El espesor de los muros sale de las cotas',
    body: 'El croquis da 3,61 m abajo y 3,32 m arriba sobre el mismo ancho. La diferencia, 0,29 m, son los dos muros de fachada: 0,145 m cada uno. Los tabiques interiores se han fijado en 0,10 m.',
  },
  {
    title: 'El baño no toca el muro oeste',
    body: 'La línea vertical del croquis deja 1,08 m libres a la izquierda: es el pasillo que une la sala con el cuarto. Por eso la sala es un L y la cota de 5,25 m se mide sobre el muro oeste.',
  },
  {
    title: 'La cama va contra el muro oeste',
    body: 'Con 2,93 m de fondo no caben armario (0,60) + cama (1,90) + circulación en el mismo eje. Cama al oeste, armario a techo en el muro este: queda un pasillo de 0,85 m. La hoja de la puerta, tal como está dibujada, barre justo por delante del pie de la cama.',
  },
  {
    title: 'La mesa se pone bajo la nueva ventana',
    body: 'Es el único aporte de luz natural del piso, y comer es el uso que más la necesita. El sofá enfrente, contra el muro oeste. Reparto en el ancho: 0,88 + 1,14 de paso + 0,80 = 2,82 m sobre 3,32.',
    accent: true,
  },
  {
    title: 'El baño necesita una puerta',
    body: 'El croquis no la dibuja. Se abre hacia el pasillo, que está libre: con sólo 1,28 m de fondo, una hoja hacia adentro se comería la única circulación del baño. Hueco de 0,70 m en el tabique del pasillo.',
  },
  {
    title: 'Cocina en un solo frente',
    body: 'La franja dibujada tiene 0,68 m contra el muro sur: no admite península. Nevera, fregadero y placa alineados, con 0,60 m de plano de trabajo entre fregadero y placa y 0,85 m libres hasta el sofá.',
  },
  {
    title: 'Nada de la obra se ha movido',
    body: 'Muros, tabiques, la puerta del cuarto con su abatimiento y la nueva ventana siguen donde los sitúa el croquis, con las mismas cotas. El botón «Obra bruta» devuelve la coca desnuda para comprobarlo.',
  },
]

export default function PlanoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-full object-cover ring-2 ring-gray-200"
            />
            <span className="text-lg font-bold text-gray-900">Quentin Tools</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Plano 3D
            </span>
          </div>
          <Link
            href="/comparador"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Ouvrir le comparateur
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <section className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400">
              Proyecto de interiorismo · croquis a escala
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Piso Cuarto &amp; Sala</h1>
            <p className="mt-3 max-w-2xl text-gray-500">
              Restitución 3D del croquis a mano y proyecto de interiorismo dentro de su geometría exacta.
              Ni un muro, ni un tabique, ni la puerta, ni la nueva ventana se han movido.
            </p>
          </div>
          <dl className="flex flex-wrap gap-6">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Hors-tout</dt>
              <dd className="mt-1 font-mono text-lg tabular-nums text-gray-900">3,61 × 8,57</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Sup. útil</dt>
              <dd className="mt-1 font-mono text-lg tabular-nums text-gray-900">
                {TOTAL.toFixed(2).replace('.', ',')} m²
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-gray-400">Altura</dt>
              <dd className="mt-1 font-mono text-lg tabular-nums text-gray-900">2,50 m</dd>
            </div>
          </dl>
        </section>

        <PlanoViewer />

        <section>
          <SectionTitle>Renders de ambiente</SectionTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            {RENDERS.map(([src, title, body]) => (
              <figure key={src}>
                <Image
                  src={src}
                  alt={title}
                  width={1600}
                  height={900}
                  className="w-full rounded-lg border border-gray-200 object-cover"
                />
                <figcaption className="mt-2 text-sm leading-relaxed text-gray-500">
                  <b className="block font-semibold text-gray-900">{title}</b>
                  {body}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 border-t border-gray-200 pt-3 font-mono text-xs leading-relaxed text-gray-400">
            Los renders fijan materiales, color y luz. La geometría exacta es la del modelo 3D: el render
            del cuarto añade una ventana que el croquis no dibuja.
          </p>
        </section>

        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
          <div className="space-y-10">
            <section>
              <SectionTitle>Cuadro de superficies</SectionTitle>
              <table className="w-full text-sm">
                <thead>
                  <tr className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    <th className="pb-2 text-left font-medium">Ambiente</th>
                    <th className="pb-2 text-right font-medium">Ancho</th>
                    <th className="pb-2 text-right font-medium">Fondo</th>
                    <th className="pb-2 text-right font-medium">Superficie</th>
                  </tr>
                </thead>
                <tbody>
                  {ROOMS.map((r) => (
                    <tr key={r.key} className="border-t border-gray-200">
                      <td className="py-2 text-gray-900">{r.name}</td>
                      <td className="py-2 text-right font-mono tabular-nums text-gray-600">
                        {r.w.toFixed(2).replace('.', ',')} m
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums text-gray-600">
                        {r.d.toFixed(2).replace('.', ',')} m
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums text-gray-600">
                        {r.a.toFixed(2).replace('.', ',')} m²
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 font-semibold">
                    <td className="py-2 text-gray-900">Superficie útil</td>
                    <td />
                    <td />
                    <td className="py-2 text-right font-mono tabular-nums text-gray-900">
                      {TOTAL.toFixed(2).replace('.', ',')} m²
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <SectionTitle>Programa de mobiliario</SectionTitle>
              <table className="w-full text-sm">
                <thead>
                  <tr className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
                    <th className="pb-2 text-left font-medium">Pieza</th>
                    <th className="pb-2 text-right font-medium">Dimensiones</th>
                    <th className="pb-2 text-right font-medium">Ambiente</th>
                  </tr>
                </thead>
                <tbody>
                  {FURNITURE.map(([name, size, room]) => (
                    <tr key={name} className="border-t border-gray-200">
                      <td className="py-2 text-gray-900">{name}</td>
                      <td className="py-2 text-right font-mono tabular-nums text-gray-600">{size}</td>
                      <td className="py-2 text-right font-mono text-gray-600">{room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex flex-wrap gap-2">
                {CLEARANCES.map(([label, value]) => (
                  <span
                    key={label}
                    className="rounded border border-gray-200 bg-white px-2 py-1 font-mono text-[11px] text-gray-500"
                  >
                    {label} <b className="font-medium text-gray-900">{value}</b>
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-10">
            <section>
              <SectionTitle>Acabados</SectionTitle>
              <div className="grid">
                {FINISHES.map(([color, name, body]) => (
                  <div key={name} className="flex items-center gap-3 border-t border-gray-200 py-2 first:border-t-0 text-sm">
                    <span
                      className="h-6 w-6 flex-none rounded ring-1 ring-black/15"
                      style={{ backgroundColor: color }}
                    />
                    <b className="w-28 flex-none font-medium text-gray-900">{name}</b>
                    <span className="text-[13px] text-gray-500">{body}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>Decisiones de proyecto</SectionTitle>
              <div className="grid gap-3">
                {DECISIONS.map((d) => (
                  <div
                    key={d.title}
                    className={`rounded border border-gray-200 border-l-[3px] bg-white p-3 ${
                      d.accent ? 'border-l-[#c23b1e] bg-orange-50' : 'border-l-gray-300'
                    }`}
                  >
                    <b className="block text-[13px] font-semibold text-gray-900">{d.title}</b>
                    <p className={`mt-1 text-[13px] leading-relaxed ${d.accent ? 'text-gray-700' : 'text-gray-500'}`}>
                      {d.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="border-t border-gray-200 pt-4 font-mono text-xs text-gray-400">
          Modelo a escala 1:1 en metros · altura libre supuesta 2,50 m · cotas de obra según croquis ·
          mobiliario acotado en el programa
        </footer>
      </main>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b border-gray-200 pb-2 font-mono text-[11px] font-medium uppercase tracking-widest text-gray-400">
      {children}
    </h2>
  )
}
