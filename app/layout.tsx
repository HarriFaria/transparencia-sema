import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fiscalização da Transparência — SEMA-MT",
  description: "Painel local de apoio à fiscalização de transparência ativa da SEMA-MT.",
};

const links = [
  ["/", "Visão geral"],
  ["/resultados", "Resultados"],
  ["/criterios", "Critérios"],
  ["/roteiro", "Roteiro"],
  ["/documentos", "Documentos"],
  ["/metodologia", "Metodologia"],
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
        <header className="topbar">
          <div className="topbar-inner">
            <a className="brand" href="/" aria-label="Página inicial">
              <span className="brand-mark" aria-hidden="true">TC</span>
              <span><strong>Transparência SEMA-MT</strong><small>Apoio à fiscalização · OS nº 4618/2026</small></span>
            </a>
            <nav aria-label="Navegação principal">
              {links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
            </nav>
          </div>
        </header>
        <main id="conteudo">{children}</main>
        <footer><div className="container">Ambiente local · Dados preliminares não constituem parecer final · Sem banco de dados</div></footer>
      </body>
    </html>
  );
}
