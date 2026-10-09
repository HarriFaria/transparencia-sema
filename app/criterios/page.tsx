import { coletas, criterios, grupos } from "@/lib/data";
import { CriteriaExplorer } from "@/componentes/criteria-explorer";

export default function CriteriosPage() {
  const situacoes = Object.fromEntries(Object.entries(coletas.criterios).map(([id, item]) => [id, item.situacao]));
  return <div className="container page"><p className="eyebrow">Matriz de rastreabilidade</p><div className="page-title"><div><h1>73 critérios, na ordem original</h1><p>Campos de referência da planilha preservados; resultados permanecem vazios até validação humana.</p></div><span className="tag warning">73 não apurados</span></div><CriteriaExplorer criterios={criterios} grupos={grupos} situacoes={situacoes} /></div>;
}
