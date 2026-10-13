"use client";

import { useEffect, useMemo, useState } from "react";
import { REVIEW_STORAGE_KEY, emptyReviewStore, latestReview, localReviewStoreSchema } from "@/lib/revisoes";

export function LocalReviewSummary({ criterionIds }: { criterionIds: string[] }) {
  const [store, setStore] = useState(emptyReviewStore());
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
        if (raw) setStore(localReviewStoreSchema.parse(JSON.parse(raw)));
      } catch { /* A página de detalhe exibe o erro de armazenamento. */ }
    };
    load();
    window.addEventListener("sema-review-store-changed", load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener("sema-review-store-changed", load); window.removeEventListener("storage", load); };
  }, []);
  const totals = useMemo(() => {
    const latest = criterionIds.map((id) => latestReview(store.revisions, id)).filter(Boolean);
    const validated = latest.filter((entry) => entry?.estado === "validado" && entry.validado_pelo_auditor);
    return {
      drafts: latest.filter((entry) => entry?.estado === "revisado_sem_conclusao").length,
      validated: validated.length,
      attended: validated.filter((entry) => entry?.parecer === "Atendido").length,
      partial: validated.filter((entry) => entry?.parecer === "Atendido parcialmente").length,
      unmet: validated.filter((entry) => entry?.parecer === "Não atendido").length,
      conflicts: new Set(store.conflicts.map((entry) => entry.criterio_id)).size,
    };
  }, [criterionIds, store]);
  return <section className="local-review-summary" aria-label="Validações locais deste navegador">
    <div><p className="kicker">Estado privado deste navegador</p><h2>Revisões locais</h2><p>Estes números não alteram o snapshot público e não comprovam identidade ou homologação institucional.</p></div>
    <dl><div><dt>Revisados sem conclusão</dt><dd>{totals.drafts}</dd></div><div><dt>Validados localmente</dt><dd>{totals.validated}</dd></div><div><dt>Atendidos</dt><dd>{totals.attended}</dd></div><div><dt>Parciais</dt><dd>{totals.partial}</dd></div><div><dt>Não atendidos</dt><dd>{totals.unmet}</dd></div><div><dt>Conflitos</dt><dd>{totals.conflicts}</dd></div></dl>
  </section>;
}
