import { CriteriaExplorer } from "@/componentes/criteria-explorer";
import { criterios, grupos, painelPublico } from "@/lib/data";

export default function CriteriosPage() {
  return <div className="container page-shell"><header className="page-header"><div><p className="kicker">Matriz oficial</p><h1>Matriz de critérios</h1><p>Os 73 critérios preservam a redação, a fonte e o fundamento da planilha oficial. Filtros operacionais não alteram nem inferem resultados finais.</p></div><div className="header-stat"><strong>73</strong><span>critérios únicos</span><small>35 · 24 · 14 por questão</small></div></header><div className="scope-strip"><span><strong>17</strong> grupos</span><span><strong>66</strong> passos de roteiro</span><span><strong>{painelPublico.resultados.validados}</strong> resultados validados</span><span><strong>{painelPublico.coleta.evidenciasPublicadas}</strong> capturas públicas</span></div><CriteriaExplorer criterios={criterios} grupos={grupos} situacoes={painelPublico.situacoes} /></div>;
}
