import Link from 'next/link'

export const metadata = {
  title: 'Documentation — Quentin Tools',
  description: 'Guide d\'utilisation du Comparador Amazon USA vs Proveedor',
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-900">Quentin Tools</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Docs</span>
          </div>
          <Link
            href="/comparador"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ouvrir l&apos;outil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-12">

        {/* Hero */}
        <section>
          <h1 className="text-3xl font-bold text-gray-900">
            Comparador Amazon USA vs Proveedor
          </h1>
          <p className="mt-3 text-lg text-gray-500 leading-relaxed">
            Outil de comparaison de prix en temps réel : comparez automatiquement les prix
            de votre fournisseur avec les prix Amazon USA, produit par produit, via le numéro MPN.
          </p>

          {/* Quick badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {['34 produits Anker Brands', 'Recherche par MPN', 'Export Excel', 'Temps réel'].map(b => (
              <span key={b} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">{b}</span>
            ))}
          </div>
        </section>

        <Divider />

        {/* Table of contents */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Table des matières</h2>
          <nav className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { href: '#apercu', label: '1. Aperçu de l\'interface' },
              { href: '#recherche', label: '2. Lancer une recherche Amazon' },
              { href: '#couleurs', label: '3. Comprendre les couleurs' },
              { href: '#colonnes', label: '4. Détail des colonnes' },
              { href: '#export', label: '5. Exporter en Excel' },
              { href: '#technique', label: '6. Comment ça fonctionne' },
              { href: '#limites', label: '7. Limites & bonnes pratiques' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                <span className="text-blue-400">→</span>
                {item.label}
              </a>
            ))}
          </nav>
        </section>

        <Divider />

        {/* 1. Aperçu */}
        <section id="apercu">
          <SectionTitle number="1" title="Aperçu de l'interface" />
          <p className="mt-3 text-gray-600 leading-relaxed">
            La page principale est divisée en quatre zones :
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoCard
              icon="📊"
              title="Cartes de résumé"
              desc="En haut : 4 compteurs en temps réel — Total produits, Trouvés sur Amazon, Amazon moins cher, Amazon plus cher."
            />
            <InfoCard
              icon="⏳"
              title="Barre de progression"
              desc="Apparaît pendant la recherche. Affiche X / 34 produits traités et se remplit au fur et à mesure."
            />
            <InfoCard
              icon="🔘"
              title="Boutons d'action"
              desc="'Buscar en Amazon' lance la recherche. 'Descargar Excel' télécharge le fichier enrichi. Disponible uniquement après une recherche."
            />
            <InfoCard
              icon="📋"
              title="Tableau comparatif"
              desc="Liste complète des produits avec leurs prix. Les lignes se colorent au fur et à mesure que les prix Amazon arrivent."
            />
          </div>
        </section>

        <Divider />

        {/* 2. Recherche */}
        <section id="recherche">
          <SectionTitle number="2" title="Lancer une recherche Amazon" />
          <p className="mt-3 text-gray-600 leading-relaxed">
            Un simple clic suffit. La recherche s&apos;effectue séquentiellement, produit par produit,
            pour éviter d&apos;être bloqué par Amazon.
          </p>

          <div className="mt-5 space-y-3">
            <Step number={1} title="Cliquer sur « Buscar en Amazon »">
              Le bouton bleu en haut du tableau lance la recherche. Il devient grisé et affiche un spinner pendant l&apos;opération.
            </Step>
            <Step number={2} title="Attendre la progression">
              Chaque ligne passe par l&apos;état <Badge color="yellow">Buscando…</Badge> avant de recevoir son prix.
              La barre de progression indique l&apos;avancement (ex. 12 / 34).
            </Step>
            <Step number={3} title="Lire les résultats">
              À la fin, un message de confirmation indique combien de produits ont été trouvés sur Amazon.
              Les lignes non trouvées restent avec un tiret « — ».
            </Step>
            <Step number={4} title="Relancer si nécessaire">
              Si certains produits n&apos;ont pas été trouvés, vous pouvez relancer une recherche avec « Buscar de nuevo ».
              Amazon peut occasionnellement bloquer quelques requêtes.
            </Step>
          </div>

          <Callout type="info" className="mt-5">
            La recherche dure environ <strong>30–50 secondes</strong> pour 34 produits (400 ms de délai entre chaque
            requête pour ne pas déclencher les protections Amazon).
          </Callout>
        </section>

        <Divider />

        {/* 3. Couleurs */}
        <section id="couleurs">
          <SectionTitle number="3" title="Comprendre les couleurs" />
          <p className="mt-3 text-gray-600 leading-relaxed">
            Chaque ligne du tableau est colorée en fonction de la comparaison entre le <strong>Prix Proveedor</strong> (votre coût fournisseur)
            et le <strong>Prix Amazon</strong> (prix public Amazon USA).
          </p>

          <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Couleur</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Condition</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Signification</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Action recommandée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-green-50">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-green-700">
                      <span className="h-3 w-3 rounded-sm bg-green-400" /> Vert
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">Amazon &lt; Proveedor</td>
                  <td className="px-4 py-3 text-gray-700">Amazon est <strong>moins cher</strong> que votre fournisseur</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">Renégocier le prix fournisseur</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-red-700">
                      <span className="h-3 w-3 rounded-sm bg-red-400" /> Rouge
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">Amazon &gt; Proveedor</td>
                  <td className="px-4 py-3 text-gray-700">Amazon est <strong>plus cher</strong> — bonne marge possible</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">Opportunité de revente</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium text-gray-500">
                      <span className="h-3 w-3 rounded-sm bg-gray-300" /> Neutre
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">Non trouvé ou égal</td>
                  <td className="px-4 py-3 text-gray-700">Produit absent sur Amazon ou même prix</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">Vérifier manuellement</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Divider />

        {/* 4. Colonnes */}
        <section id="colonnes">
          <SectionTitle number="4" title="Détail des colonnes" />
          <div className="mt-5 space-y-2">
            {[
              { col: 'Marca', desc: 'Marque du fabricant (Soundcore, Eufy, Nebula…)' },
              { col: 'MPN', desc: 'Manufacturer Part Number — identifiant exact utilisé pour chercher sur Amazon' },
              { col: 'Producto', desc: 'Nom du produit dans l\'inventaire fournisseur' },
              { col: 'Inv.', desc: 'Quantité en stock' },
              { col: 'Precio Proveedor', desc: 'Prix d\'achat fournisseur (Precio Venta dans le fichier Excel)' },
              { col: 'MSRP', desc: 'Prix conseillé fabricant (Manufacturer Suggested Retail Price)' },
              { col: 'Precio Amazon', desc: 'Prix public Amazon USA récupéré en temps réel. Affiché en vert ou rouge selon la comparaison.' },
              { col: 'Diferencia', desc: 'Écart entre Amazon et le prix fournisseur, en $ et en %. Positif = Amazon plus cher.' },
              { col: 'Link', desc: 'Lien direct vers la page produit Amazon (s\'ouvre dans un nouvel onglet)' },
            ].map(({ col, desc }) => (
              <div key={col} className="flex gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3">
                <code className="w-36 shrink-0 font-mono text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 self-start">{col}</code>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        {/* 5. Export */}
        <section id="export">
          <SectionTitle number="5" title="Exporter en Excel" />
          <p className="mt-3 text-gray-600 leading-relaxed">
            Après une recherche, le bouton <strong className="text-emerald-700">Descargar Excel</strong> devient actif.
            Il génère un fichier <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">.xlsx</code> avec toutes les données enrichies.
          </p>

          <div className="mt-5 space-y-3">
            <Step number={1} title="Lancer la recherche Amazon" />
            <Step number={2} title="Cliquer sur « Descargar Excel »">
              Le fichier se nomme automatiquement <code className="text-xs bg-gray-100 rounded px-1">comparacion_amazon_2026-05-07.xlsx</code> (avec la date du jour).
            </Step>
            <Step number={3} title="Ouvrir dans Excel ou Google Sheets">
              Le fichier contient les colonnes : Marca, MPN, Produit, Inventario, Precio Venta, MSRP,
              Precio Amazon, Diferencia $, Diferencia %, Estado, Link Amazon.
            </Step>
          </div>

          <Callout type="warning" className="mt-5">
            Le bouton reste désactivé (grisé) tant qu&apos;aucun prix Amazon n&apos;a été récupéré.
            Il est aussi désactivé pendant la recherche.
          </Callout>
        </section>

        <Divider />

        {/* 6. Technique */}
        <section id="technique">
          <SectionTitle number="6" title="Comment ça fonctionne" />
          <p className="mt-3 text-gray-600 leading-relaxed">
            L&apos;outil est conçu pour contourner les limitations qui faisaient échouer les approches précédentes (HTML artifacts, navigateur côté client).
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoCard
              icon="🖥️"
              title="Requêtes côté serveur"
              desc="Les appels vers Amazon sont effectués par le serveur Next.js, pas le navigateur. Cela évite les erreurs CORS et les blocages liés aux scripts navigateur."
            />
            <InfoCard
              icon="🔍"
              title="Recherche par MPN"
              desc="Chaque produit est cherché avec « Marque + MPN » sur amazon.com. Le MPN est l'identifiant fabricant exact, ce qui maximise la précision des résultats."
            />
            <InfoCard
              icon="⏱️"
              title="Délai anti-blocage"
              desc="400 ms de délai entre chaque requête pour éviter d'être identifié comme robot. La recherche complète (34 produits) prend environ 40 secondes."
            />
            <InfoCard
              icon="📄"
              title="Parsing HTML"
              desc="Le prix est extrait du span caché .a-offscreen dans les résultats de recherche Amazon — le format machine-readable qu'Amazon expose dans son HTML."
            />
          </div>

          <Callout type="info" className="mt-5">
            <strong>Stack technique :</strong> Next.js 14 (App Router) · TypeScript · Tailwind CSS · xlsx · Cheerio — déployé sur Vercel.
          </Callout>
        </section>

        <Divider />

        {/* 7. Limites */}
        <section id="limites">
          <SectionTitle number="7" title="Limites & bonnes pratiques" />

          <div className="mt-5 space-y-3">
            <LimitRow
              type="warning"
              title="Amazon peut bloquer temporairement"
              desc="Si Amazon détecte trop de requêtes, il peut retourner une page CAPTCHA. Dans ce cas, relancez la recherche après quelques minutes. Le délai de 400 ms réduit ce risque significativement."
            />
            <LimitRow
              type="warning"
              title="Le prix affiché est celui du premier résultat"
              desc="L'outil prend le prix du premier produit trouvé sur Amazon pour ce MPN. Si Amazon retourne un autre produit en premier, le prix peut être incorrect. Vérifiez via le lien « Ver → »."
            />
            <LimitRow
              type="info"
              title="Les prix changent en temps réel"
              desc="Les prix Amazon fluctuent constamment. Les données sont valides au moment de la recherche. Pour comparer à une autre date, relancez simplement une nouvelle recherche."
            />
            <LimitRow
              type="info"
              title="Produits non trouvés"
              desc="Certains produits peuvent ne pas apparaître si le MPN n'est pas indexé par Amazon ou si le produit n'est pas vendu aux USA. La colonne Diferencia affichera « — » pour ces produits."
            />
          </div>
        </section>

        <Divider />

        {/* CTA */}
        <section className="rounded-2xl bg-blue-600 p-8 text-center text-white">
          <h2 className="text-xl font-bold">Prêt à comparer ?</h2>
          <p className="mt-2 text-blue-200">L&apos;inventaire Anker Brands est pré-chargé. Un clic suffit pour démarrer.</p>
          <Link
            href="/comparador"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 transition-colors"
          >
            Ouvrir le comparateur →
          </Link>
        </section>

      </main>

      <footer className="mt-12 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Quentin Tools · Comparador Amazon USA vs Proveedor
      </footer>
    </div>
  )
}

/* ─── Helpers ─────────────────────────────────────────── */

function Divider() {
  return <hr className="border-gray-200" />
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        {number}
      </span>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  )
}

function InfoCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-2 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function Step({ number, title, children }: { number: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
        {number}
      </span>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        {children && <p className="mt-1 text-sm text-gray-500 leading-relaxed">{children}</p>}
      </div>
    </div>
  )
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-rounded px-2 py-0.5 text-xs font-medium rounded ${styles[color] ?? 'bg-gray-100 text-gray-700'}`}>
      {children}
    </span>
  )
}

function Callout({ type, children, className = '' }: { type: 'info' | 'warning'; children: React.ReactNode; className?: string }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  }
  const icons = { info: 'ℹ️', warning: '⚠️' }
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${styles[type]} ${className}`}>
      <span className="shrink-0">{icons[type]}</span>
      <div>{children}</div>
    </div>
  )
}

function LimitRow({ type, title, desc }: { type: 'info' | 'warning'; title: string; desc: string }) {
  const icon = type === 'warning' ? '⚠️' : 'ℹ️'
  const titleColor = type === 'warning' ? 'text-amber-800' : 'text-blue-800'
  const border = type === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${border}`}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className={`font-semibold ${titleColor}`}>{title}</p>
        <p className="mt-1 text-sm text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
