import { coletas, criterios, grupos, roteiro } from "@/lib/data";

const formatDate = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value))
  : "não registrada";

export default function Dashboard() {
  const latest = coletas.ultima_execucao;
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Ordem de Serviço nº 4618/2026</p>
            <h1>Coleta real visível, conclusão sob responsabilidade humana.</h1>
            <p className="lede">O painel agora acompanha as execuções técnicas, as URLs visitadas e as evidências selecionadas. Navegação bem-sucedida não equivale a atendimento do critério.</p>
            <div className="actions"><a className="button primary" href="/resultados/">Consultar resultados</a><a className="button" href="/criterios/">Explorar critérios</a></div>
          </div>
          <div className="hero-note" role="note"><span className="status-dot" /> <strong>Coleta técnica realizada</strong><p>Última execução: {formatDate(latest?.criado_em_utc)}. Ainda não há critério efetivamente verificado nem resultado final validado.</p></div>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading"><div><p className="eyebrow">Execução real</p><h2>Estado atual da fiscalização</h2></div><p>Dados gerados em <strong>{formatDate(coletas.gerado_em_utc)}</strong></p></div>
        <div className="metrics">
          <article><span>Execuções</span><strong>{coletas.totais.execucoes}</strong><small>{coletas.totais.execucoes_concluidas} concluídas no histórico</small></article>
          <article><span>Com coleta técnica</span><strong>{coletas.totais.criterios_com_coleta_tecnica}</strong><small>de {criterios.length} critérios</small></article>
          <article><span>Verificados</span><strong>{coletas.totais.criterios_efetivamente_verificados}</strong><small>com verificação de conteúdo registrada</small></article>
          <article><span>Evidências</span><strong>{coletas.totais.evidencias_registradas}</strong><small>{coletas.totais.evidencias_autorizadas} cópias visíveis localmente</small></article>
        </div>
      </section>
      <section className="container section two-columns">
        <div className="panel">
          <div className="panel-title"><h2>Evolução por questão</h2><span className="tag neutral">coleta ≠ verificação</span></div>
          {coletas.questoes.map((item) => (
            <div className="coverage" key={item.questao}><div><strong>Questão {item.questao}</strong><span>{item.total} critérios</span></div><div><div className="bar" title={`${item.com_coleta_tecnica} com coleta técnica`}><span style={{ width: `${(item.com_coleta_tecnica / item.total) * 100}%` }} /></div><small>{item.com_coleta_tecnica} com coleta · {item.verificados} verificados</small></div><small>{item.pendentes} pendentes</small></div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-title"><h2>Camadas de resultado</h2><span className="tag warning">decisão do auditor</span></div>
          <div className="result-grid">
            <div><strong>{coletas.totais.criterios_com_coleta_tecnica}</strong><span>Coleta técnica associada</span></div>
            <div><strong>{coletas.totais.criterios_efetivamente_verificados}</strong><span>Critérios verificados</span></div>
            <div><strong>{coletas.totais.resultados_preliminares}</strong><span>Resultados preliminares</span></div>
            <div><strong>{coletas.totais.resultados_finais_validados}</strong><span>Resultados finais</span></div>
            <div><strong>{coletas.totais.criterios_sem_verificacao}</strong><span>Sem verificação</span></div>
            <div><strong>{coletas.totais.grupos_com_coleta}</strong><span>Grupo com coleta</span></div>
          </div>
        </div>
      </section>
      <section className="container section callout"><div><p className="eyebrow">Escopo preservado</p><h2>{criterios.length} critérios · {grupos.length} grupos · {roteiro.total_passos} passos</h2><p>A segunda verificação continua obrigatória quando a informação não for localizada; a validação final exige responsável diferente.</p></div><a className="button" href="/metodologia/">Ver metodologia</a></section>
    </>
  );
}
