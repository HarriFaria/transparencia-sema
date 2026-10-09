"use client";

import { useMemo, useState } from "react";
import type { Criterio, Grupo, ResultadoCriterioPainel } from "@/lib/types";
import { formatAutomation } from "@/lib/data";

export function CriteriaExplorer({ criterios, grupos, situacoes }: { criterios: Criterio[]; grupos: Grupo[]; situacoes: Record<string, ResultadoCriterioPainel["situacao"]> }) {
  const [query, setQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [group, setGroup] = useState("");
  const [automation, setAutomation] = useState("");
  const filtered = useMemo(() => criterios.filter((item) => {
    const haystack = [item.id, item.redacao_literal, item.fonte_informacao_literal, item.norma_dispositivo_literal, ...item.referencias_documentais.map((ref) => ref.arquivo)].join(" ").toLocaleLowerCase("pt-BR");
    return (!query || haystack.includes(query.toLocaleLowerCase("pt-BR"))) && (!question || String(item.questao) === question) && (!group || item.grupo_id === group) && (!automation || item.automacao.nivel === automation);
  }), [query, question, group, automation, criterios]);
  return <>
    <div className="filters" aria-label="Filtros dos critérios">
      <label className="search"><span>Buscar</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID, descrição, fonte, norma ou documento" /></label>
      <label><span>Questão</span><select value={question} onChange={(e) => setQuestion(e.target.value)}><option value="">Todas</option><option value="1">Questão 1</option><option value="2">Questão 2</option><option value="3">Questão 3</option></select></label>
      <label><span>Grupo</span><select value={group} onChange={(e) => setGroup(e.target.value)}><option value="">Todos</option>{grupos.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.titulo}</option>)}</select></label>
      <label><span>Execução</span><select value={automation} onChange={(e) => setAutomation(e.target.value)}><option value="">Todas</option><option value="automatizavel_com_validacao_humana">Automatizável</option><option value="parcialmente_automatizavel">Apoio automatizável</option><option value="humana">Humana</option></select></label>
    </div>
    <div className="list-count" aria-live="polite"><strong>{filtered.length}</strong> de {criterios.length} critérios</div>
    <div className="criteria-list">
      {filtered.map((item) => <article className="criterion-card" key={item.id}>
        <div className="criterion-order">{String(item.ordem).padStart(2, "0")}</div>
        <div><div className="card-meta"><span className="criterion-id">{item.id}</span><span>Questão {item.questao}</span><span>{item.periodo_previsto}</span></div><h2><a href={`/criterios/${item.id}/`}>{item.redacao_literal}</a></h2><p>{item.fonte_informacao_literal}</p><div className="card-foot"><span className="tag neutral">{formatAutomation(item.automacao.nivel)}</span><span className={`status-label ${situacoes[item.id] === "coleta_tecnica_sem_verificacao" ? "technical" : ""}`}><i /> {situacoes[item.id] === "coleta_tecnica_sem_verificacao" ? "Coleta técnica; não verificado" : situacoes[item.id] === "verificado" ? "Verificado" : "Não verificado"}</span></div></div>
        <a className="arrow-link" aria-label={`Abrir ${item.id}`} href={`/criterios/${item.id}/`}>→</a>
      </article>)}
      {!filtered.length && <div className="empty-state"><strong>Nenhum critério encontrado.</strong><p>Revise os filtros ou o texto da busca.</p></div>}
    </div>
  </>;
}
