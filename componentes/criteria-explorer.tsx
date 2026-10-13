"use client";

import { useMemo, useState } from "react";
import type { Criterio, Grupo, PainelPublico } from "@/lib/types";

type SortKey = "ordem" | "id" | "grupo" | "situacao";
const operationalLabel = { nao_iniciado: "Não iniciado", coleta_realizada: "Coleta realizada", analise_preliminar: "Análise preliminar", validado: "Validado" } as const;

export function CriteriaExplorer({ criterios, grupos, situacoes }: { criterios: Criterio[]; grupos: Grupo[]; situacoes: PainelPublico["situacoes"] }) {
  const [query, setQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [group, setGroup] = useState("");
  const [operational, setOperational] = useState("");
  const [result, setResult] = useState("");
  const [requirement, setRequirement] = useState("");
  const [evidence, setEvidence] = useState("");
  const [sort, setSort] = useState<SortKey>("ordem");

  const filtered = useMemo(() => criterios.filter((item) => {
    const state = situacoes[item.id];
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const exactIdQuery = /^q[123]\.\d+\.\d+$/.test(normalizedQuery);
    const haystack = [item.id, item.redacao_literal, item.fonte_informacao_literal, item.norma_dispositivo_literal, item.exigibilidade, item.grupo_id, ...item.referencias_documentais.map((ref) => ref.arquivo)].join(" ").toLocaleLowerCase("pt-BR");
    const expectedResult = result === "nao_apurado" ? null : result;
    return (!normalizedQuery || (exactIdQuery ? item.id.toLocaleLowerCase("pt-BR") === normalizedQuery : haystack.includes(normalizedQuery)))
      && (!question || String(item.questao) === question)
      && (!group || item.grupo_id === group)
      && (!operational || state.situacaoOperacional === operational)
      && (!result || state.resultadoFinal === expectedResult)
      && (!requirement || item.exigibilidade === requirement)
      && (!evidence || (evidence === "com" ? state.evidenciasPublicas > 0 : state.evidenciasPublicas === 0));
  }).sort((a, b) => {
    if (sort === "id") return a.id.localeCompare(b.id, "pt-BR", { numeric: true });
    if (sort === "grupo") return a.grupo_id.localeCompare(b.grupo_id, "pt-BR", { numeric: true }) || a.ordem - b.ordem;
    if (sort === "situacao") return situacoes[a.id].situacaoOperacional.localeCompare(situacoes[b.id].situacaoOperacional) || a.ordem - b.ordem;
    return a.ordem - b.ordem;
  }), [query, question, group, operational, result, requirement, evidence, sort, criterios, situacoes]);

  const requirements = [...new Set(criterios.map((item) => item.exigibilidade))].sort();
  const reset = () => { setQuery(""); setQuestion(""); setGroup(""); setOperational(""); setResult(""); setRequirement(""); setEvidence(""); setSort("ordem"); };

  return <>
    <div className="filter-panel" aria-label="Filtros da matriz">
      <label className="field field-search"><span>Buscar na matriz</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, critério, norma, fonte ou documento" /></label>
      <label className="field"><span>Questão</span><select value={question} onChange={(event) => setQuestion(event.target.value)}><option value="">Todas</option><option value="1">Questão 1</option><option value="2">Questão 2</option><option value="3">Questão 3</option></select></label>
      <label className="field"><span>Grupo</span><select value={group} onChange={(event) => setGroup(event.target.value)}><option value="">Todos</option>{grupos.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.titulo}</option>)}</select></label>
      <label className="field"><span>Situação operacional</span><select value={operational} onChange={(event) => setOperational(event.target.value)}><option value="">Todas</option><option value="nao_iniciado">Não iniciado</option><option value="coleta_realizada">Coleta realizada</option><option value="analise_preliminar">Análise preliminar</option><option value="validado">Validado</option></select></label>
      <label className="field"><span>Resultado final</span><select value={result} onChange={(event) => setResult(event.target.value)}><option value="">Todos</option><option value="nao_apurado">Não apurado</option><option value="Atendido">Atendido</option><option value="Atendido parcialmente">Atendido parcialmente</option><option value="Não atendido">Não atendido</option></select></label>
      <label className="field"><span>Exigibilidade</span><select value={requirement} onChange={(event) => setRequirement(event.target.value)}><option value="">Todas</option>{requirements.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span>Evidência publicada</span><select value={evidence} onChange={(event) => setEvidence(event.target.value)}><option value="">Todas</option><option value="com">Com evidência</option><option value="sem">Sem evidência</option></select></label>
      <label className="field"><span>Ordenar por</span><select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}><option value="ordem">Ordem oficial</option><option value="id">Código</option><option value="grupo">Grupo</option><option value="situacao">Situação</option></select></label>
    </div>
    <div className="matrix-toolbar"><p aria-live="polite"><strong>{filtered.length}</strong> de {criterios.length} critérios exibidos</p><button className="text-button" type="button" onClick={reset}>Limpar filtros</button></div>
    <div className="matrix" role="table" aria-label="Matriz de critérios">
      <div className="matrix-head" role="row"><span>ID</span><span>Critério e fundamento</span><span>Situação operacional</span><span>Resultado final</span><span>Evidências</span><span>Ação</span></div>
      {filtered.map((item) => {
        const state = situacoes[item.id];
        return <article className="matrix-row" role="row" key={item.id}>
          <div className="matrix-id" role="cell"><strong>{item.id}</strong><small>{item.grupo_id}</small></div>
          <div className="matrix-criterion" role="cell"><strong>{item.redacao_literal}</strong><span>{item.norma_dispositivo_literal}</span><small>{item.fonte_informacao_literal}</small></div>
          <div role="cell" data-label="Situação"><span className={`badge ${state.situacaoOperacional === "analise_preliminar" ? "badge-warning" : state.situacaoOperacional === "coleta_realizada" ? "badge-info" : state.situacaoOperacional === "validado" ? "badge-success" : "badge-neutral"}`}>{operationalLabel[state.situacaoOperacional]}</span><small>{state.ultimaVerificacao ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(state.ultimaVerificacao)) : "Sem verificação"}</small></div>
          <div role="cell" data-label="Resultado"><span className="badge badge-pending">{state.resultadoFinal ?? "Não apurado"}</span></div>
          <div role="cell" data-label="Evidências"><strong>{state.evidenciasPublicas}</strong><small>{state.evidenciasPublicas === 1 ? "print público" : "prints públicos"}</small></div>
          <div role="cell"><a className="row-action" href={`/criterios/${item.id}/`}>Ver detalhes <span aria-hidden="true">→</span></a></div>
        </article>;
      })}
      {!filtered.length && <div className="empty-state"><strong>Nenhum critério encontrado</strong><p>Revise a busca ou limpe os filtros aplicados.</p><button className="button button-secondary" type="button" onClick={reset}>Limpar filtros</button></div>}
    </div>
  </>;
}
