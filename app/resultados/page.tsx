import { coletas } from "@/lib/data";

const dateTime = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Cuiaba" }).format(new Date(value))
  : "não registrado";
const statusLabel = { concluida: "Concluída", interrompida: "Interrompida", incompleta: "Incompleta" } as const;

export default function ResultadosPage() {
  const latest = coletas.ultima_execucao;
  const evidenceEnabled = process.env.PAINEL_DESTINO === "local" || process.env.PAINEL_DESTINO === "publicacao";
  const selectedEvidence = latest?.evidencias.filter((item) => evidenceEnabled && item.visualizacao_autorizada) ?? [];
  return <div className="container page results-page">
    <div className="page-title"><div><p className="eyebrow">Resultados reais</p><h1>Acompanhamento das verificações</h1><p>Consolidação estática dos JSON e JSONL preservados. Os sinais técnicos abaixo não constituem conclusão de auditoria.</p></div><span className="tag warning">sem resultado final</span></div>

    <section className="stage-grid" aria-label="Camadas de apuração">
      <article className="stage active"><span>1</span><strong>Coleta técnica</strong><p>{coletas.totais.criterios_com_coleta_tecnica} critérios possuem URLs ou capturas associadas.</p></article>
      <article className="stage"><span>2</span><strong>Critério verificado</strong><p>{coletas.totais.criterios_efetivamente_verificados} verificações de conteúdo registradas.</p></article>
      <article className="stage"><span>3</span><strong>Resultado final</strong><p>{coletas.totais.resultados_finais_validados} decisões validadas por auditor.</p></article>
    </section>

    <section className="metrics compact-metrics section">
      <article><span>Grupos coletados</span><strong>{coletas.totais.grupos_com_coleta}</strong><small>Q1.1</small></article>
      <article><span>Sem verificação</span><strong>{coletas.totais.criterios_sem_verificacao}</strong><small>de 73 critérios</small></article>
      <article><span>Preliminares</span><strong>{coletas.totais.resultados_preliminares}</strong><small>nenhuma conclusão presumida</small></article>
      <article><span>Evidências</span><strong>{coletas.totais.evidencias_registradas}</strong><small>{coletas.totais.evidencias_autorizadas} autorizadas para visualização</small></article>
    </section>

    {latest && <section className="panel section execution-detail">
      <div className="panel-title"><div><p className="eyebrow">Última execução</p><h2>{latest.grupo} · {latest.modo}</h2></div><span className="tag success">{statusLabel[latest.situacao]}</span></div>
      <dl className="execution-meta"><div><dt>Identificador</dt><dd><code>{latest.execucao_id}</code></dd></div><div><dt>Início</dt><dd>{dateTime(latest.criado_em_utc)}</dd></div><div><dt>Navegações</dt><dd>{latest.navegacoes.length}</dd></div><div><dt>Critérios associados</dt><dd>{latest.criterios_associados.length}</dd></div><div><dt>Capturas</dt><dd>{latest.evidencias.length}</dd></div><div><dt>Resultado final</dt><dd>Não registrado</dd></div></dl>
      <p className="notice">Foram encontrados candidatos de navegação para Q1.1. O robô não registrou se o conteúdo exigido estava presente ou ausente.</p>
      <div className="navigation-list">{latest.navegacoes.map((item, index) => <article key={`${item.timestamp_utc}-${index}`}><div><span className="tag neutral">{item.criterios.join(" · ")}</span><strong>{item.texto_link ?? "Navegação sem rótulo"}</strong><a href={item.url_final} target="_blank" rel="noreferrer">{item.url_final}</a></div><time>{dateTime(item.timestamp_utc)}</time><p>{item.observacao}</p></article>)}</div>
      {latest.erros_tecnicos.length > 0 && <details className="technical-errors"><summary>{latest.erros_tecnicos.reduce((sum, item) => sum + item.ocorrencias, 0)} falhas de recursos auxiliares registradas</summary>{latest.erros_tecnicos.map((item) => <p key={`${item.url}-${item.erro}`}><code>{item.url}</code> · {item.erro} · {item.ocorrencias} ocorrência(s)</p>)}</details>}
    </section>}

    <section className="section">
      <div className="section-heading"><div><p className="eyebrow">Visualizador controlado</p><h2>Evidências autorizadas da coleta</h2></div><p>{selectedEvidence.length} cópias locais · hashes conferidos</p></div>
      <div className="evidence-grid">{selectedEvidence.map((item) => <figure className="evidence-card" key={item.id}><a href={item.url_visualizacao!} target="_blank" rel="noreferrer"><img src={item.url_visualizacao!} alt={`Captura da execução ${item.execucao_id} em ${item.url}`} loading="lazy" /></a><figcaption><span>{item.criterios.join(" · ")}</span><strong>{dateTime(item.timestamp_utc)}</strong><a href={item.url} target="_blank" rel="noreferrer">URL capturada</a><small>Execução <code>{item.execucao_id}</code></small><small>SHA-256 {item.sha256.slice(0, 16)}… · {item.compartilhada ? "evidência compartilhada" : "associação individual"}</small></figcaption></figure>)}</div>
    </section>

    <section className="panel section"><div className="panel-title"><h2>Histórico de execuções</h2><span>{coletas.execucoes.length} registros preservados</span></div><div className="history-table" role="table">{coletas.execucoes.map((execution) => <article role="row" key={execution.execucao_id}><div><span className={`tag ${execution.situacao === "concluida" ? "success" : "warning"}`}>{statusLabel[execution.situacao]}</span><strong>{execution.grupo} · {execution.modo}</strong><code>{execution.execucao_id}</code></div><div><span>{dateTime(execution.criado_em_utc)}</span><small>{execution.navegacoes.length} navegações · {execution.evidencias.length} capturas · {execution.criterios_associados.length} critérios associados</small></div></article>)}</div></section>
  </div>;
}
