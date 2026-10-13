import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auditoria de Transparência — SEMA-MT",
  description: "Relatório executivo da fiscalização de transparência ativa da SEMA-MT — OS nº 4618/2026.",
};

const links = [
  ["/", "Visão geral"],
  ["/criterios/", "Matriz de critérios"],
  ["/resultados/", "Achados e evidências"],
  ["/recomendacoes/", "Recomendações"],
  ["/metodologia/", "Metodologia e documentos"],
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header className="site-header">
      <div className="header-inner">
        <a className="wordmark" href="/" aria-label="Auditoria de Transparência SEMA-MT — página inicial"><span className="wordmark-symbol" aria-hidden="true">TCE</span><span><strong>Auditoria de Transparência</strong><small>SEMA-MT · OS nº 4618/2026</small></span></a>
        <nav className="main-nav" aria-label="Navegação principal">{links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav>
      </div>
    </header>
    <main id="conteudo">{children}</main>
    <footer className="site-footer"><div className="container"><div><strong>Tribunal de Contas do Estado de Mato Grosso</strong><span>Relatório de apoio à fiscalização · dados estáticos e rastreáveis</span></div><p>Coleta técnica não equivale a conclusão de auditoria. Resultados finais dependem de validação humana independente.</p></div></footer>
  </body></html>;
}
