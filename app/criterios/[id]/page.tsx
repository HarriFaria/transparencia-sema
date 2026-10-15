import { notFound } from "next/navigation";
import { EvidenceGallery } from "@/componentes/evidence-gallery";
import { AuditorReviewPanel } from "@/componentes/auditor-review-panel";
import { coletas, criterios, diagnosticosPreliminares, evidenciasPublicas, painelPublico, roteiro } from "@/lib/data";

export const dynamicParams = false;
export function generateStaticParams() { return criterios.map((item) => ({ id: item.id })); }

const dateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));
const operationalLabel = { nao_iniciado: "Não iniciado", coleta_realizada: "Coleta realizada", analise_preliminar: "Análise preliminar", validado: "Validado" } as const;
const dimensionLabel = { completa: "Completa", parcial: "Parcial", nao_demonstrada: "Não demonstrada", nao_avaliavel: "Não avaliável", aparentemente_atual: "Aparentemente atual", indicio_desatualizacao: "Indício de desatualização", sem_data_comprovada: "Sem data comprovada", evidencia_compativel: "Evidência compatível", indicios_de_lacuna: "Indícios de lacuna", insuficiente_para_concluir: "Insuficiente para concluir" } as const;

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
  const diagnostic = diagnosticosPreliminares.diagnosticos.find((entry) => entry.criterioId === item.id);
  const steps = roteiro.passos.filter((step) => item.passos_roteiro.includes(step.id));
  const criterionEvidence = evidenciasPublicas.evidencias.filter((entry) => entry.criteriosIds.includes(item.id));
  const groupEvidence = evidenciasPublicas.evidencias.filter((entry) => entry.grupoId === item.grupo_id && entry.nivelAssociacao !== "criterio");
  return <div className="container page-shell detail-page">
    <a className="back-link" href="/criterios/">← Voltar à matriz</a>
    <header className="detail-header"><div><div className="detail-labels"><span className="criterion-code">{item.id}</span><span>Questão {item.questao}</span><span>{item.grupo_id}</span></div><h1>{item.redacao_literal}</h1><p>{item.fonte_informacao_literal}</p></div><aside className="detail-status"><div><span>Situação operacional</span><strong>{operationalLabel[state.situacaoOperacional]}</strong></div><div><span>Resultado final validado</span><strong>{state.resultadoFinal ?? "Não apurado"}</strong></div><small>{state.ultimaVerificacao ? `Último registro técnico: ${dateTime(state.ultimaVerificacao)}` : "Sem verificação registrada"}</small></aside></header>

    <section className="detail-summary"><article><span>Fundamento</span><strong>{item.norma_dispositivo_literal}</strong></article><article><span>Exigibilidade</span><strong>{item.exigibilidade}</strong></article><article><span>Período previsto</span><strong>{item.periodo_previsto}</strong></article><article><span>Evidências públicas</span><strong>{criterionEvidence.length}</strong></article></section>

    <section className="surface preliminary-analysis" id="analise-preliminar"><div className="surface-head"><div><p className="kicker">Análise preliminar</p><h2>{diagnostic ? "Conteúdo confrontado com o requisito" : "Ainda não analisado"}</h2></div><span className={`badge ${diagnostic ? "badge-warning" : "badge-neutral"}`}>{diagnostic ? "aguardando validação" : "não verificado"}</span></div>{diagnostic ? <><div className="dimension-grid"><article><span>Localização</span><strong>{diagnostic.localizacao === "nao_localizada_nesta_busca" ? "Não localizada nesta busca" : diagnostic.localizacao === "inconclusiva" ? "Inconclusiva" : diagnostic.localizacao === "acesso_restrito" ? "Acesso restrito" : diagnostic.localizacao === "erro_tecnico" ? "Erro técnico" : "Localizada"}</strong></article><article><span>Completude</span><strong>{dimensionLabel[diagnostic.completude]}</strong></article><article><span>Atualidade</span><strong>{dimensionLabel[diagnostic.atualidade]}</strong></article><article><span>Aderência</span><strong>{dimensionLabel[diagnostic.aderenciaPreliminar]}</strong></article></div><div className="analysis-columns"><div><h3>O que a matriz exige</h3><ul>{diagnostic.requisitosAtomicos.map((requirement) => <li key={requirement.id}><strong>{requirement.texto}</strong><small>{requirement.origemMatriz}</small></li>)}</ul><h3>O que foi encontrado</h3>{diagnostic.observacoes.length ? <ul>{diagnostic.observacoes.map((observation) => <li key={observation.id}><p>{observation.fato}</p><blockquote>“{observation.trecho}”</blockquote><a href={observation.url} target="_blank" rel="noreferrer">Abrir fonte pública ↗</a></li>)}</ul> : <p className="analysis-empty">Nenhum elemento material foi localizado nesta busca.</p>}</div><div><h3>Limitações e pendências</h3><ul>{[...diagnostic.limitacoes, ...diagnostic.pendencias].map((entry) => <li key={entry}>{entry}</li>)}</ul><div className="second-check"><span>Segunda verificação</span><strong>{diagnostic.necessidadeSegundaVerificacao ? "Obrigatória em outra data" : "Não acionada por ausência"}</strong></div><p className="analysis-disclaimer">Resultado final: <strong>não registrado</strong>. A análise técnica não substitui validação humana independente.</p></div></div></> : <div className="empty-state compact"><strong>Não verificado</strong><p>Este critério ainda não integra o escopo substantivo analisado.</p></div>}</section>

    <AuditorReviewPanel
      criterioId={item.id}
      diagnosticoId={diagnostic ? `${diagnostic.criterioId}:${diagnostic.execucaoId}` : null}
      execucaoId={diagnostic?.execucaoId ?? collected.execucoes.at(-1) ?? null}
      hasDiagnostic={Boolean(diagnostic)}
      hasEvidence={criterionEvidence.length + groupEvidence.length > 0}
      secondVerificationRequired={diagnostic?.necessidadeSegundaVerificacao ?? false}
      knownCriterionIds={criterios.map((criterion) => criterion.id)}
    />

    <div className="detail-columns"><div>
      <section className="surface prose-card"><div className="surface-head"><div><p className="kicker">Critério oficial</p><h2>Redação integral e rastreabilidade</h2></div><span className="badge badge-neutral">linha {item.origem_xlsx.linha}</span></div><p className="criterion-full">{item.redacao_literal}</p><dl className="definition-list"><div><dt>Norma / dispositivo</dt><dd>{item.norma_dispositivo_literal}</dd></div><div><dt>Fonte prevista</dt><dd>{item.fonte_informacao_literal}</dd></div><div><dt>Orientação técnica</dt><dd>{item.orientacao_ti_literal}</dd></div><div><dt>Origem controlada</dt><dd>{item.origem_xlsx.aba}, linha {item.origem_xlsx.linha}, colunas {item.origem_xlsx.colunas_referencia}</dd></div></dl></section>
      <section className="surface section-block"><div className="surface-head"><div><p className="kicker">Histórico real</p><h2>Coleta e verificações</h2></div><span className="badge badge-info">sem inferência automática</span></div>{collected.navegacoes.length ? <ol className="timeline">{collected.navegacoes.map((navigation, index) => <li key={`${navigation.timestamp_utc}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{navigation.texto_link ?? "Navegação técnica"}</strong><time>{dateTime(navigation.timestamp_utc)}</time><a href={navigation.url_final} target="_blank" rel="noreferrer">{navigation.url_final}</a><p>{navigation.observacao}</p></div></li>)}</ol> : <div className="empty-state compact"><strong>Ainda não verificado</strong><p>O roteiro prevê busca na fonte indicada, registro da navegação e captura positiva ou negativa. Nenhuma coleta individual foi comprovadamente vinculada a este critério.</p></div>}</section>
    </div><aside className="detail-aside">
      <section className="surface"><p className="kicker">Resultado publicado</p><h2>Snapshot compartilhado</h2><div className="decision-empty"><span>—</span><strong>{collected.resultado_final ?? "Não registrado"}</strong><p>Revisões locais só aparecem aqui após exportação, consolidação controlada e novo deploy.</p></div></section>
      <section className="surface"><p className="kicker">Evidência exigida</p><h2>Checklist metodológico</h2><ul className="clean-list">{item.evidencia_exigida.map((entry) => <li key={entry}><span>✓</span>{entry}</li>)}</ul></section>
    </aside></div>

    <section className="section-block"><div className="section-title"><div><p className="kicker">Capturas associadas</p><h2>Evidências técnicas do critério</h2></div><p>{criterionEvidence.length} vínculo(s) individual(is)</p></div>{criterionEvidence.length ? <EvidenceGallery evidencias={criterionEvidence} /> : <div className="empty-state"><strong>Nenhum print vinculado individualmente</strong><p>Há {groupEvidence.length} captura(s) publicada(s) no grupo {item.grupo_id}, mantidas no nível do grupo para evitar associação arbitrária.</p>{groupEvidence.length > 0 && <a className="inline-link" href="/resultados/#capturas">Ver capturas do grupo →</a>}</div>}</section>

    <section className="surface section-block"><div className="surface-head"><div><p className="kicker">Trilha metodológica</p><h2>Verificações e publicação</h2></div><span className="badge badge-pending">snapshot público</span></div><div className="verification-grid"><VerificationCard title="Primeiro levantamento" value={collected.primeira_verificacao} /><VerificationCard title="Segunda verificação" value={collected.segunda_verificacao} /><article className="verification-card final"><span>3</span><div><strong>Resultado publicado</strong><p>{collected.resultado_final ?? "Não registrado"}</p><small>Sem identidade pessoal ou assinatura digital no painel.</small></div></article></div></section>

    <section className="detail-bottom-grid section-block"><article className="surface"><div className="surface-head"><h2>Passos correspondentes</h2><span>{steps.length}</span></div><ol className="compact-steps">{steps.map((step) => <li key={step.id}><strong>{step.id}</strong><p>{step.texto_literal}</p></li>)}</ol></article><article className="surface"><div className="surface-head"><h2>Referências documentais</h2><span>{item.referencias_documentais.length}</span></div>{item.referencias_documentais.length ? <ul className="reference-list">{item.referencias_documentais.map((reference) => <li key={`${reference.documento_id}-${reference.paginas_pdf.join()}`}><strong>{reference.arquivo.replace(/\.pdf$/i, "")}</strong><span>Páginas {reference.paginas_pdf.join(", ")}{reference.artigos.length ? ` · ${reference.artigos.join(", ")}` : ""}</span><p>{reference.relacao}</p></li>)}</ul> : <div className="empty-state compact"><strong>Sem referência adicional confirmada</strong></div>}</article></section>
  </div>;
}
