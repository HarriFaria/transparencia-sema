import { notFound } from "next/navigation";
import { coletas, criterios, roteiro, formatAutomation } from "@/lib/data";

export const dynamicParams = false;
export function generateStaticParams() { return criterios.map((item) => ({ id: item.id })); }

const dateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Cuiaba" }).format(new Date(value));
const statusText = {
  nao_verificado: "Não verificado",
  coleta_tecnica_sem_verificacao: "Coleta técnica sem verificação",
  verificado: "Verificado por auditor",
} as const;

function VerificationCard({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  if (!value) return <div className="verification-card empty"><strong>{title}</strong><span>Não registrada</span></div>;
  return <div className="verification-card"><strong>{title}</strong><dl><div><dt>Data e hora</dt><dd>{String(value.data ?? "")} {String(value.hora ?? "")}</dd></div><div><dt>Situação</dt><dd>{String(value.status_operacional ?? "não informada")}</dd></div><div><dt>Responsável</dt><dd>{String(value.responsavel ?? "não informado")}</dd></div><div><dt>Endereço ou justificativa</dt><dd>{String(value.endereco_ou_justificativa ?? "não informada")}</dd></div></dl></div>;
}

export default async function CriterioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = criterios.find((criterion) => criterion.id === id);
  if (!item) notFound();
  const collected = coletas.criterios[item.id];
  const evidenceEnabled = process.env.PAINEL_DESTINO === "local" || process.env.PAINEL_DESTINO === "publicacao";
  const steps = roteiro.passos.filter((step) => item.passos_roteiro.includes(step.id));
  const executionErrors = coletas.execucoes.filter((execution) => collected.execucoes.includes(execution.execucao_id)).reduce((sum, execution) => sum + execution.erros_tecnicos.reduce((subtotal, error) => subtotal + error.ocorrencias, 0), 0);
  return <div className="container page detail-page">
    <a className="back-link" href="/criterios/">← Voltar aos critérios</a>
    <div className="detail-head"><div><p className="eyebrow">{item.grupo_id} · Questão {item.questao}</p><h1>{item.id} — {item.redacao_literal}</h1><p>{item.fonte_informacao_literal}</p></div><div className="state-box"><span>Situação</span><strong>{statusText[collected.situacao]}</strong><span>Resultado final</span><strong>{collected.resultado_final ?? "Não registrado"}</strong></div></div>

    <div className="detail-grid">
      <section className="panel"><h2>Fundamentação e origem</h2><dl><div><dt>Norma / dispositivo</dt><dd>{item.norma_dispositivo_literal}</dd></div><div><dt>Exigibilidade</dt><dd>{item.exigibilidade}</dd></div><div><dt>Período</dt><dd>{item.periodo_previsto}</dd></div><div><dt>Origem</dt><dd>{item.origem_xlsx.aba}, linha {item.origem_xlsx.linha}, colunas {item.origem_xlsx.colunas_referencia}</dd></div></dl></section>
      <section className="panel"><h2>Fontes e sistemas</h2><dl><div><dt>Fonte prevista</dt><dd>{item.fonte_informacao_literal}</dd></div><div><dt>URL confirmada na matriz</dt><dd>{item.url_confirmada ? <a href={item.url_confirmada} target="_blank" rel="noreferrer">{item.url_confirmada}</a> : "Não informada"}</dd></div><div><dt>Apoio da TI</dt><dd><span className="tag neutral">{formatAutomation(item.automacao.nivel)}</span> {item.orientacao_ti_literal}</dd></div><div><dt>Limites</dt><dd>{item.automacao.limites}</dd></div></dl></section>
    </div>

    <section className="panel section"><div className="panel-title"><h2>Coleta técnica associada</h2><span>{collected.navegacoes.length} navegação(ões)</span></div>
      {collected.situacao === "nao_verificado" ? <div className="empty-state compact"><strong>Não verificado.</strong><p>Nenhuma coleta ou verificação foi registrada para este critério.</p></div> : <>
        <p className="notice">{collected.observacao} A associação abaixo veio dos eventos originais; não representa confirmação do conteúdo exigido.</p>
        <div className="navigation-list">{collected.navegacoes.map((navigation, index) => <article key={`${navigation.timestamp_utc}-${index}`}><div><strong>{navigation.texto_link ?? "Navegação"}</strong><a href={navigation.url_final} target="_blank" rel="noreferrer">{navigation.url_final}</a></div><time>{dateTime(navigation.timestamp_utc)}</time><p>{navigation.observacao}</p></article>)}</div>
        <p className="muted">{executionErrors} falha(s) de recurso auxiliar foram registradas nas execuções relacionadas, mas não foram atribuídas individualmente a este critério. Consulte a página <a href="/resultados/">Resultados</a>.</p>
      </>}
    </section>

    <section className="panel section"><div className="panel-title"><h2>Informação encontrada ou não localizada</h2><span className="tag warning">sem inferência automática</span></div><p>{collected.informacao_encontrada ?? (collected.situacao === "nao_verificado" ? "Não verificado." : "Não determinada pela coleta técnica. Os registros comprovam navegação e captura, mas não contêm fundamentação suficiente para afirmar presença ou ausência da informação exigida.")}</p></section>

    <section className="section"><div className="section-heading"><div><p className="eyebrow">Capturas associadas</p><h2>Evidências da coleta</h2></div><p>{collected.evidencias.length} registrada(s)</p></div>
      {collected.evidencias.length ? <div className="evidence-grid">{collected.evidencias.map((evidence) => <figure className="evidence-card" key={evidence.id}>{evidenceEnabled && evidence.visualizacao_autorizada ? <a href={evidence.url_visualizacao!} target="_blank" rel="noreferrer"><img src={evidence.url_visualizacao!} alt={`Captura associada ao critério ${item.id}`} loading="lazy" /></a> : <div className="restricted-evidence">Visualização não autorizada neste build</div>}<figcaption><strong>{dateTime(evidence.timestamp_utc)}</strong><a href={evidence.url} target="_blank" rel="noreferrer">URL capturada</a><small>Execução <code>{evidence.execucao_id}</code></small><small>SHA-256 {evidence.sha256.slice(0, 16)}… · integridade {evidence.integridade_confirmada ? "confirmada" : "não confirmada"}</small></figcaption></figure>)}</div> : <div className="empty-state compact"><strong>Nenhuma captura associada.</strong><p>O critério permanece não verificado.</p></div>}
    </section>

    <section className="panel section"><div className="panel-title"><h2>Verificações e decisão</h2><span>validação humana independente</span></div><div className="verification-grid"><VerificationCard title="Primeira verificação" value={collected.primeira_verificacao} /><VerificationCard title="Segunda verificação" value={collected.segunda_verificacao} /><div className="verification-card final"><strong>Resultado final validado</strong><span>{collected.resultado_final ?? "Não registrado"}</span><small>{collected.responsavel_validacao ? `Responsável: ${collected.responsavel_validacao}` : "Nenhum validador registrado"}</small></div></div></section>

    <section className="panel section"><div className="panel-title"><h2>Etapas correspondentes</h2><span>{steps.length} passos</span></div><ol className="steps">{steps.map((step) => <li key={step.id}><span>{step.id}</span><p>{step.texto_literal}</p><small>DOCX · parágrafo {step.origem_docx.paragrafo}</small></li>)}</ol></section>
    <section className="panel section"><div className="panel-title"><h2>Documentos correlatos</h2><span>{item.referencias_documentais.length} confirmados</span></div>{item.referencias_documentais.length ? <div className="reference-list">{item.referencias_documentais.map((ref) => <article key={`${ref.documento_id}-${ref.paginas_pdf.join()}`}><strong>{ref.arquivo}</strong><span>Páginas PDF {ref.paginas_pdf.join(", ")}{ref.artigos.length ? ` · ${ref.artigos.join(", ")}` : ""}</span><p>{ref.relacao}</p></article>)}</div> : <p className="empty-inline">Sem referência documental adicional confirmada no acervo.</p>}{item.referencias_ausentes_ou_a_confirmar.map((ref) => <div className="pending-ref" key={ref.documento}><strong>A verificar: {ref.documento}</strong><span>{ref.motivo}</span></div>)}</section>
    <section className="panel section"><h2>Evidência exigida pela metodologia</h2><ul className="check-list">{item.evidencia_exigida.map((entry) => <li key={entry}>{entry}</li>)}</ul></section>
  </div>;
}
