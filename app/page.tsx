import { EvidenceGallery } from "@/componentes/evidence-gallery";
import { LocalReviewSummary } from "@/componentes/local-review-summary";
import { criterios, evidenciasPublicas, painelPublico } from "@/lib/data";

const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value)) : "Sem registro";

export default function Dashboard() {
  const metrics = [
    ["Critérios oficiais", painelPublico.escopo.criterios, "Base da planilha, linhas 2–74", "default"],
    ["Parecer validado", painelPublico.resultados.validados, `de ${painelPublico.escopo.criterios} critérios`, "default"],
    ["Atendidos", painelPublico.resultados.atendidos, `${painelPublico.resultados.percentualOficial.toFixed(1)}% do total oficial`, "success"],
    ["Parcialmente atendidos", painelPublico.resultados.parciais, "somente após validação humana", "warning"],
    ["Não atendidos", painelPublico.resultados.naoAtendidos, "somente após validação humana", "danger"],
    ["Não apurados", painelPublico.resultados.naoApurados, "sem parecer final registrado", "muted"],
  ] as const;
  return <>
    <section className="report-hero"><div className="container report-hero-grid"><div><p className="kicker">Relatório executivo de fiscalização</p><h1>Auditoria de Transparência — SEMA‑MT</h1><p className="hero-subtitle">Levantamento de transparência ativa <span>•</span> OS nº 4618/2026</p><p className="hero-summary">Consulta consolidada da matriz oficial, do estágio das verificações e das capturas técnicas aprovadas para publicação. O painel preserva a diferença entre navegar, coletar, verificar e concluir.</p></div><aside className="report-meta" aria-label="Atualização do relatório"><span className="report-status"><i /> Em apuração</span><dl><div><dt>Última coleta real</dt><dd>{dateTime(painelPublico.coleta.ultimaColetaEm)}</dd></div><div><dt>Última validação humana</dt><dd>{dateTime(painelPublico.coleta.ultimaValidacaoEm)}</dd></div><div><dt>Recorte temporal</dt><dd>set.–out./2026</dd></div></dl></aside></div></section>

    <div className="container report-body">
      <section aria-labelledby="indicators-title"><div className="section-title"><div><p className="kicker">Síntese do levantamento</p><h2 id="indicators-title">Resultados finais e cobertura</h2></div><p>Percentual oficial: atendidos ÷ 73 critérios</p></div><div className="kpi-grid">{metrics.map(([label, value, note, tone]) => <article className={`kpi kpi-${tone}`} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div></section>

      <LocalReviewSummary criterionIds={criterios.map((item) => item.id)} />

      <nav className="section-tabs" aria-label="Áreas do relatório"><a className="active" href="/criterios/">Matriz de critérios</a><a href="/resultados/">Achados e evidências</a><a href="/recomendacoes/">Recomendações</a></nav>

      <section className="overview-grid">
        <article className="surface result-overview"><div className="surface-head"><div><p className="kicker">Situação dos pareceres</p><h2>Distribuição de resultados</h2></div><span className="badge badge-pending">{painelPublico.resultados.validados} validados</span></div>{painelPublico.resultados.validados === 0 ? <div className="empty-chart"><span aria-hidden="true">○</span><div><strong>Ainda não há pareceres finais</strong><p>As classes “Atendido”, “Atendido parcialmente” e “Não atendido” permanecem zeradas. Os 73 critérios estão corretamente apresentados como não apurados.</p></div></div> : null}<div className="result-notes"><div><strong>{painelPublico.coleta.criteriosComColetaTecnica}</strong><span>critérios com coleta técnica</span></div><div><strong>{painelPublico.coleta.criteriosComDiagnostico}</strong><span>com análise preliminar</span></div><div><strong>{painelPublico.coleta.pendentesSegundaVerificacao}</strong><span>segunda verificação pendente</span></div><div><strong>{painelPublico.coleta.aguardandoValidacao}</strong><span>aguardando validação</span></div></div></article>
        <article className="surface collection-card"><div className="surface-head"><div><p className="kicker">Cobertura técnica</p><h2>Análise Q1.1 e Q2</h2></div><span className="badge badge-warning">preliminar</span></div><p>Os 10 critérios de Q1.1 e os 24 critérios do Q2 foram confrontados individualmente com conteúdo público coletado. São diagnósticos técnicos rastreáveis, ainda sem homologação ou resultado final.</p><div className="collection-stat"><span>{painelPublico.coleta.evidenciasPublicadas}</span><div><strong>prints aprovados</strong><small>de {evidenciasPublicas.totais.encontradas} encontrados em todas as execuções</small></div></div><a className="inline-link" href="/resultados/">Examinar diagnósticos e evidências →</a></article>
      </section>

      <section className="section-block" aria-labelledby="evidence-title"><div className="section-title"><div><p className="kicker">Capturas de tela</p><h2 id="evidence-title">Evidências públicas da execução</h2></div><a className="inline-link" href="/resultados/#capturas">Ver galeria completa →</a></div><p className="section-intro">Cópias inspecionadas, allowlisted e verificadas por SHA-256. Capturas vinculadas ao grupo não são atribuídas artificialmente a um subcritério.</p><EvidenceGallery evidencias={[...evidenciasPublicas.evidencias].sort((a, b) => b.capturadoEm.localeCompare(a.capturadoEm))} compact /></section>

      <section className="integrity-banner"><div><p className="kicker">Integridade fiscalizatória</p><h2>O que o painel afirma — e o que ainda não afirma</h2></div><div className="integrity-items"><p><span>01</span><strong>Coleta registrada</strong> comprova a navegação técnica e a existência da captura.</p><p><span>02</span><strong>Verificação de conteúdo</strong> depende do procedimento e do registro do auditor.</p><p><span>03</span><strong>Resultado final</strong> somente aparece após validação humana independente.</p></div></section>
    </div>
  </>;
}
