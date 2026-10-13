import { notFound } from "next/navigation";
import { EvidenceGallery } from "@/componentes/evidence-gallery";
import { coletas, criterios, evidenciasPublicas, painelPublico, roteiro } from "@/lib/data";

export const dynamicParams = false;
export function generateStaticParams() { return criterios.map((item) => ({ id: item.id })); }

const dateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
const operationalLabel = { nao_iniciado: "Não iniciado", coleta_realizada: "Coleta realizada", validado: "Validado" } as const;

function VerificationCard({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  if (!value) return <article className="verification-card empty"><span>○</span><div><strong>{title}</strong><p>Não registrada</p></div></article>;
  return <article className="verification-card"><span>✓</span><div><strong>{title}</strong><dl><div><dt>Data e hora</dt><dd>{String(value.data ?? "")} {String(value.hora ?? "")}</dd></div><div><dt>Situação</dt><dd>{String(value.status_operacional ?? "não informada")}</dd></div><div><dt>Endereço ou justificativa</dt><dd>{String(value.endereco_ou_justificativa ?? "não informada")}</dd></div></dl></div></article>;
}

export default async function CriterioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = criterios.find((criterion) => criterion.id === id);
  if (!item) notFound();
  const collected = coletas.criterios[item.id];
  const state = painelPublico.situacoes[item.id];
  const steps = roteiro.passos.filter((step) => item.passos_roteiro.includes(step.id));
  const criterionEvidence = evidenciasPublicas.evidencias.filter((entry) => entry.criteriosIds.includes(item.id));
  const groupEvidence = evidenciasPublicas.evidencias.filter((entry) => entry.grupoId === item.grupo_id && entry.nivelAssociacao !== "criterio");
  return <div className="container page-shell detail-page">
    <a className="back-link" href="/criterios/">← Voltar à matriz</a>
    <header className="detail-header"><div><div className="detail-labels"><span className="criterion-code">{item.id}</span><span>Questão {item.questao}</span><span>{item.grupo_id}</span></div><h1>{item.redacao_literal}</h1><p>{item.fonte_informacao_literal}</p></div><aside className="detail-status"><div><span>Situação operacional</span><strong>{operationalLabel[state.situacaoOperacional]}</strong></div><div><span>Resultado final validado</span><strong>{state.resultadoFinal ?? "Não apurado"}</strong></div><small>{state.ultimaVerificacao ? `Último registro técnico: ${dateTime(state.ultimaVerificacao)}` : "Sem verificação registrada"}</small></aside></header>

    <section className="detail-summary"><article><span>Fundamento</span><strong>{item.norma_dispositivo_literal}</strong></article><article><span>Exigibilidade</span><strong>{item.exigibilidade}</strong></article><article><span>Período previsto</span><strong>{item.periodo_previsto}</strong></article><article><span>Evidências públicas</span><strong>{criterionEvidence.length}</strong></article></section>

    <div className="detail-columns"><div>
      <section className="surface prose-card"><div className="surface-head"><div><p className="kicker">Critério oficial</p><h2>Redação integral e rastreabilidade</h2></div><span className="badge badge-neutral">linha {item.origem_xlsx.linha}</span></div><p className="criterion-full">{item.redacao_literal}</p><dl className="definition-list"><div><dt>Norma / dispositivo</dt><dd>{item.norma_dispositivo_literal}</dd></div><div><dt>Fonte prevista</dt><dd>{item.fonte_informacao_literal}</dd></div><div><dt>Orientação técnica</dt><dd>{item.orientacao_ti_literal}</dd></div><div><dt>Origem controlada</dt><dd>{item.origem_xlsx.aba}, linha {item.origem_xlsx.linha}, colunas {item.origem_xlsx.colunas_referencia}</dd></div></dl></section>
      <section className="surface section-block"><div className="surface-head"><div><p className="kicker">Histórico real</p><h2>Coleta e verificações</h2></div><span className="badge badge-info">sem inferência automática</span></div>{collected.navegacoes.length ? <ol className="timeline">{collected.navegacoes.map((navigation, index) => <li key={`${navigation.timestamp_utc}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{navigation.texto_link ?? "Navegação técnica"}</strong><time>{dateTime(navigation.timestamp_utc)}</time><a href={navigation.url_final} target="_blank" rel="noreferrer">{navigation.url_final}</a><p>{navigation.observacao}</p></div></li>)}</ol> : <div className="empty-state compact"><strong>Ainda não verificado</strong><p>O roteiro prevê busca na fonte indicada, registro da navegação e captura positiva ou negativa. Nenhuma coleta individual foi comprovadamente vinculada a este critério.</p></div>}</section>
    </div><aside className="detail-aside">
      <section className="surface"><p className="kicker">Resultado</p><h2>Conclusão validada</h2><div className="decision-empty"><span>—</span><strong>{collected.resultado_final ?? "Não registrada"}</strong><p>A coleta técnica não substitui o julgamento do auditor.</p></div></section>
      <section className="surface"><p className="kicker">Evidência exigida</p><h2>Checklist metodológico</h2><ul className="clean-list">{item.evidencia_exigida.map((entry) => <li key={entry}><span>✓</span>{entry}</li>)}</ul></section>
    </aside></div>

    <section className="section-block"><div className="section-title"><div><p className="kicker">Capturas associadas</p><h2>Evidências técnicas do critério</h2></div><p>{criterionEvidence.length} vínculo(s) individual(is)</p></div>{criterionEvidence.length ? <EvidenceGallery evidencias={criterionEvidence} /> : <div className="empty-state"><strong>Nenhum print vinculado individualmente</strong><p>Há {groupEvidence.length} captura(s) publicada(s) no grupo {item.grupo_id}, mantidas no nível do grupo para evitar associação arbitrária.</p>{groupEvidence.length > 0 && <a className="inline-link" href="/resultados/#capturas">Ver capturas do grupo →</a>}</div>}</section>

    <section className="surface section-block"><div className="surface-head"><div><p className="kicker">Revisão independente</p><h2>Verificações e decisão</h2></div><span className="badge badge-pending">pendente</span></div><div className="verification-grid"><VerificationCard title="Primeiro levantamento" value={collected.primeira_verificacao} /><VerificationCard title="Segunda verificação" value={collected.segunda_verificacao} /><article className="verification-card final"><span>3</span><div><strong>Resultado final</strong><p>{collected.resultado_final ?? "Não registrado"}</p><small>{collected.responsavel_validacao ? "Validação registrada" : "Nenhum validador registrado"}</small></div></article></div></section>

    <section className="detail-bottom-grid section-block"><article className="surface"><div className="surface-head"><h2>Passos correspondentes</h2><span>{steps.length}</span></div><ol className="compact-steps">{steps.map((step) => <li key={step.id}><strong>{step.id}</strong><p>{step.texto_literal}</p></li>)}</ol></article><article className="surface"><div className="surface-head"><h2>Referências documentais</h2><span>{item.referencias_documentais.length}</span></div>{item.referencias_documentais.length ? <ul className="reference-list">{item.referencias_documentais.map((reference) => <li key={`${reference.documento_id}-${reference.paginas_pdf.join()}`}><strong>{reference.arquivo.replace(/\.pdf$/i, "")}</strong><span>Páginas {reference.paginas_pdf.join(", ")}{reference.artigos.length ? ` · ${reference.artigos.join(", ")}` : ""}</span><p>{reference.relacao}</p></li>)}</ul> : <div className="empty-state compact"><strong>Sem referência adicional confirmada</strong></div>}</article></section>
  </div>;
}
