"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EvidenciaPublica } from "@/lib/types";

const dateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Cuiaba" }).format(new Date(value));

export function EvidenceGallery({ evidencias, compact = false }: { evidencias: EvidenciaPublica[]; compact?: boolean }) {
  const [group, setGroup] = useState("");
  const [criterion, setCriterion] = useState("");
  const [execution, setExecution] = useState("");
  const [date, setDate] = useState("");
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const filtered = useMemo(() => evidencias.filter((item) => (!group || item.grupoId === group)
    && (!criterion || item.criteriosIds.includes(criterion))
    && (!execution || item.execucaoId === execution)
    && (!date || item.capturadoEm.slice(0, 10) === date)), [evidencias, group, criterion, execution, date]);
  const visible = compact ? filtered.slice(0, 3) : filtered;
  const selected = active === null ? null : filtered[active];

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") setActive((current) => current === null ? null : (current + 1) % filtered.length);
      if (event.key === "ArrowLeft") setActive((current) => current === null ? null : (current - 1 + filtered.length) % filtered.length);
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", keydown); };
  }, [selected, filtered.length]);

  const groups = [...new Set(evidencias.map((item) => item.grupoId))];
  const criteria = [...new Set(evidencias.flatMap((item) => item.criteriosIds))].sort();
  const executions = [...new Set(evidencias.map((item) => item.execucaoId))];
  const dates = [...new Set(evidencias.map((item) => item.capturadoEm.slice(0, 10)))].sort().reverse();

  return <>
    {!compact && <div className="gallery-filters" aria-label="Filtros das capturas">
      <label className="field"><span>Grupo</span><select value={group} onChange={(event) => setGroup(event.target.value)}><option value="">Todos</option>{groups.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span>Critério comprovado</span><select value={criterion} onChange={(event) => setCriterion(event.target.value)}><option value="">Todos</option>{criteria.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span>Execução</span><select value={execution} onChange={(event) => setExecution(event.target.value)}><option value="">Todas</option>{executions.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field"><span>Data</span><select value={date} onChange={(event) => setDate(event.target.value)}><option value="">Todas</option>{dates.map((item) => <option key={item} value={item}>{new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Cuiaba" }).format(new Date(`${item}T12:00:00-04:00`))}</option>)}</select></label>
    </div>}
    {!compact && <p className="gallery-count" aria-live="polite"><strong>{filtered.length}</strong> capturas públicas disponíveis</p>}
    <div className={`evidence-gallery ${compact ? "evidence-gallery-compact" : ""}`}>
      {visible.map((item) => {
        const index = filtered.indexOf(item);
        return <article className="evidence-tile" key={item.id}>
          <button className="evidence-preview" type="button" onClick={() => setActive(index)} aria-label={`Abrir captura ${item.id}: ${item.titulo}`}><img src={item.miniatura} alt={`Miniatura da captura ${item.titulo}`} loading="lazy" /><span className="zoom-label">Ampliar</span></button>
          <div className="evidence-caption"><div><span className="evidence-id">{item.id}</span><span className="badge badge-info">{item.grupoId}</span></div><h3>{item.titulo}</h3><p>{dateTime(item.capturadoEm)} · {item.nivelAssociacao === "criterio" ? item.criteriosIds.join(" · ") : `vínculo no nível ${item.nivelAssociacao}`}</p></div>
        </article>;
      })}
      {!visible.length && <div className="empty-state"><strong>Nenhuma captura corresponde aos filtros</strong><p>As evidências não aprovadas permanecem preservadas localmente e não geram links públicos.</p></div>}
    </div>
    {selected && <div className="lightbox" role="dialog" aria-modal="true" aria-labelledby="lightbox-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setActive(null); }}>
      <div className="lightbox-panel">
        <div className="lightbox-head"><div><span>{selected.id} · {active! + 1} de {filtered.length}</span><h2 id="lightbox-title">{selected.titulo}</h2></div><button ref={closeRef} type="button" className="icon-button" onClick={() => setActive(null)} aria-label="Fechar visualizador">×</button></div>
        <div className="lightbox-image"><img src={selected.arquivo} alt={`Captura completa: ${selected.titulo}`} /></div>
        <div className="lightbox-meta"><p>{selected.descricao}</p><dl><div><dt>Capturada em</dt><dd>{dateTime(selected.capturadoEm)}</dd></div><div><dt>Associação</dt><dd>{selected.nivelAssociacao === "criterio" ? selected.criteriosIds.join(", ") : `Nível da ${selected.nivelAssociacao}`}</dd></div><div><dt>Integridade</dt><dd><code>{selected.sha256Publicado.slice(0, 20)}…</code></dd></div></dl><div className="lightbox-links"><a href={selected.urlOrigem} target="_blank" rel="noreferrer">Abrir página de origem</a><a href={selected.arquivo} target="_blank" rel="noreferrer">Abrir print em nova aba</a></div></div>
        <div className="lightbox-nav"><button type="button" onClick={() => setActive((active! - 1 + filtered.length) % filtered.length)}>← Anterior</button><button type="button" onClick={() => setActive((active! + 1) % filtered.length)}>Próximo →</button></div>
      </div>
    </div>}
  </>;
}
