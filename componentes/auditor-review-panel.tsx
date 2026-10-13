"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ResultadoFinal } from "@/lib/types";
import {
  REVIEW_SCHEMA_VERSION,
  REVIEW_STORAGE_KEY,
  REVIEW_TIMEZONE,
  canonicalExportBody,
  emptyReviewStore,
  latestReview,
  localReviewStoreSchema,
  makeRevisionId,
  reviewExportSchema,
  reviewStatus,
  sha256Browser,
  validateConclusion,
  type LocalReviewStore,
  type ReviewEvent,
} from "@/lib/revisoes";

const formatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: REVIEW_TIMEZONE });

function readStore(): LocalReviewStore {
  const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
  if (!raw) return emptyReviewStore();
  const parsed = localReviewStoreSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) throw new Error("O armazenamento local existe, mas não corresponde ao schema esperado.");
  return parsed.data;
}

function writeStore(store: LocalReviewStore) {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("sema-review-store-changed"));
}

export function AuditorReviewPanel({
  criterioId,
  diagnosticoId,
  execucaoId,
  hasDiagnostic,
  hasEvidence,
  secondVerificationRequired,
  knownCriterionIds,
}: {
  criterioId: string;
  diagnosticoId: string | null;
  execucaoId: string | null;
  hasDiagnostic: boolean;
  hasEvidence: boolean;
  secondVerificationRequired: boolean;
  knownCriterionIds: string[];
}) {
  const [store, setStore] = useState<LocalReviewStore>(emptyReviewStore());
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [message, setMessage] = useState("");
  const [parecer, setParecer] = useState<ResultadoFinal | "">("");
  const [justificativa, setJustificativa] = useState("");
  const [validatedCheck, setValidatedCheck] = useState(false);
  const [diagnosticRead, setDiagnosticRead] = useState(false);
  const [independentReview, setIndependentReview] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [showReopen, setShowReopen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const current = useMemo(() => latestReview(store.revisions, criterioId), [store.revisions, criterioId]);
  const hasConflict = store.conflicts.some((entry) => entry.criterio_id === criterioId);

  useEffect(() => {
    try {
      const restored = readStore();
      setStore(restored);
      const latest = latestReview(restored.revisions, criterioId);
      if (latest) {
        setParecer(latest.parecer ?? "");
        setJustificativa(latest.justificativa);
        setValidatedCheck(latest.validado_pelo_auditor && latest.estado === "validado");
        setDiagnosticRead(latest.diagnostico_visualizado);
        setIndependentReview(latest.revisao_independente_declarada);
      }
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Não foi possível ler o armazenamento local.");
    } finally {
      setLoaded(true);
    }
  }, [criterioId]);

  const append = (event: ReviewEvent) => {
    const next = { ...store, revisions: [...store.revisions, event], last_exported_hash: null };
    try {
      writeStore(next);
      setStore(next);
      setMessage("Validação salva neste navegador. Exporte o JSON para compartilhar ou consolidar.");
      setStorageError("");
    } catch {
      setStorageError("O navegador bloqueou o armazenamento. A alteração não foi salva.");
    }
  };

  const event = (estado: ReviewEvent["estado"], validated: boolean, reason: string | null): ReviewEvent => ({
    schema_version: REVIEW_SCHEMA_VERSION,
    revision_id: makeRevisionId(),
    base_revision_id: current?.revision_id ?? null,
    criterio_id: criterioId,
    diagnostico_id: diagnosticoId,
    execucao_id: execucaoId,
    registrado_em: new Date().toISOString(),
    timezone: REVIEW_TIMEZONE,
    estado,
    parecer: parecer || null,
    justificativa: justificativa.trim(),
    validado_pelo_auditor: validated,
    revisao_independente_declarada: independentReview,
    diagnostico_visualizado: diagnosticRead,
    evidencias_disponiveis: hasEvidence,
    segunda_verificacao_pendente: secondVerificationRequired,
    motivo_reabertura: reason,
  });

  const saveDraft = () => append(event("revisado_sem_conclusao", false, null));
  const validate = () => {
    const errors = validateConclusion({ checked: validatedCheck, parecer, justificativa, diagnosticoVisualizado: hasDiagnostic && diagnosticRead, evidenciasDisponiveis: hasEvidence, segundaVerificacaoPendente: secondVerificationRequired, revisaoIndependenteDeclarada: independentReview });
    if (hasConflict) errors.push("Resolva o conflito de versões antes de validar.");
    if (errors.length) { setMessage(errors.join(" ")); return; }
    append(event("validado", true, null));
  };

  const reopen = () => {
    if (reopenReason.trim().length < 3) { setMessage("Informe o motivo da reabertura."); return; }
    append(event("reaberto", false, reopenReason.trim()));
    setValidatedCheck(false);
    setShowReopen(false);
    setReopenReason("");
  };

  const exportReviews = async () => {
    const body = { schema_version: REVIEW_SCHEMA_VERSION, tipo: "sema-validacoes-locais" as const, exportado_em: new Date().toISOString(), timezone: REVIEW_TIMEZONE, aviso: "Registro local sem identidade verificada, assinatura digital ou homologação institucional.", revisions: store.revisions, conflicts: store.conflicts };
    const hash = await sha256Browser(canonicalExportBody(body));
    const payload = { ...body, sha256_conteudo: hash };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `validacoes-sema-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
    const next = { ...store, last_exported_hash: hash };
    writeStore(next);
    setStore(next);
    setMessage(`Exportação gerada com SHA-256 ${hash.slice(0, 12)}⬦`);
  };

  const importReviews = async (file: File) => {
    try {
      const parsed = reviewExportSchema.parse(JSON.parse(await file.text()));
      const { sha256_conteudo, ...body } = parsed;
      if (await sha256Browser(canonicalExportBody(body)) !== sha256_conteudo) throw new Error("Hash do arquivo importado não confere.");
      const known = new Set(knownCriterionIds);
      if (parsed.revisions.some((entry) => !known.has(entry.criterio_id))) throw new Error("O arquivo contém critério fora da matriz oficial.");
      const revisions = [...store.revisions];
      const conflicts = [...store.conflicts];
      for (const imported of parsed.revisions) {
        const sameId = revisions.find((entry) => entry.revision_id === imported.revision_id);
        if (sameId) {
          if (JSON.stringify(sameId) !== JSON.stringify(imported)) conflicts.push({ criterio_id: imported.criterio_id, local_revision_id: sameId.revision_id, imported_revision_id: imported.revision_id, detectado_em: new Date().toISOString() });
          continue;
        }
        const localLatest = latestReview(revisions, imported.criterio_id);
        if (localLatest && imported.base_revision_id !== localLatest.revision_id && localLatest.base_revision_id !== imported.revision_id) {
          conflicts.push({ criterio_id: imported.criterio_id, local_revision_id: localLatest.revision_id, imported_revision_id: imported.revision_id, detectado_em: new Date().toISOString() });
        }
        revisions.push(imported);
      }
      const uniqueConflicts = conflicts.filter((entry, index, list) => list.findIndex((other) => other.criterio_id === entry.criterio_id && other.local_revision_id === entry.local_revision_id && other.imported_revision_id === entry.imported_revision_id) === index);
      const next = { ...store, revisions, conflicts: uniqueConflicts, last_exported_hash: null };
      writeStore(next);
      setStore(next);
      setMessage(uniqueConflicts.length ? `Importação preservada com ${uniqueConflicts.length} conflito(s); nenhuma versão foi sobrescrita.` : "Importação concluída sem sobrescrita de histórico.");
    } catch (error) {
      setMessage(error instanceof Error ? `Importação recusada: ${error.message}` : "Importação recusada.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const status = reviewStatus(current, hasConflict);
  return <section className="surface auditor-review" id="revisao-auditor" aria-labelledby="auditor-review-title">
    <div className="surface-head"><div><p className="kicker">Parecer humano local</p><h2 id="auditor-review-title">Revisão do auditor</h2></div><span className={`badge ${status === "Validado" ? "badge-success" : hasConflict ? "badge-danger" : "badge-pending"}`}>{loaded ? status : "Carregando"}</span></div>
    <div className="local-mode-warning"><strong>Modo de revisão local</strong><p>As alterações ficam somente neste navegador. Não há autenticação, identificação pessoal, assinatura digital, sincronização automática ou homologação institucional verificada.</p></div>
    <div className="review-layout"><div className="review-form">
      <label className="field"><span>Resultado proposto pelo auditor</span><select value={parecer} onChange={(e) => setParecer(e.target.value as ResultadoFinal | "")}><option value="">Selecione</option><option>Atendido</option><option>Não atendido</option><option>Atendido parcialmente</option></select></label>
      <label className="field"><span>Observação / justificativa</span><textarea rows={5} value={justificativa} onChange={(e) => setJustificativa(e.target.value)} placeholder="Obrigatória para Não atendido e Atendido parcialmente" /></label>
      <label className="check-field"><input type="checkbox" checked={diagnosticRead} onChange={(e) => setDiagnosticRead(e.target.checked)} disabled={!hasDiagnostic} /><span>Examinei o diagnóstico técnico identificado nesta página.</span></label>
      <label className="check-field"><input type="checkbox" checked={independentReview} onChange={(e) => setIndependentReview(e.target.checked)} /><span>Declaro que esta revisão foi realizada de forma independente do levantamento inicial. Esta autodeclaração não comprova identidade.</span></label>
      <label className="check-field primary-check"><input type="checkbox" checked={validatedCheck} onChange={(e) => setValidatedCheck(e.target.checked)} /><span><strong>Validado pelo auditor</strong> — confirma a decisão humana neste navegador; não significa resultado positivo.</span></label>
      {secondVerificationRequired && <p className="blocking-note"><strong>Conclusão bloqueada:</strong> a segunda verificação em outra data ainda é obrigatória. É permitido salvar uma revisão sem conclusão.</p>}
      {message && <p className="review-message" role="status">{message}</p>}
      {storageError && <p className="review-error" role="alert">{storageError}</p>}
      <div className="review-actions"><button className="button button-secondary" type="button" onClick={saveDraft} disabled={!!storageError}>Salvar revisão</button><button className="button" type="button" onClick={validate} disabled={!!storageError || secondVerificationRequired}>Validar critério</button>{current?.estado === "validado" && <button className="text-button" type="button" onClick={() => setShowReopen(true)}>Reabrir validação</button>}</div>
      {showReopen && <div className="reopen-box"><label className="field"><span>Motivo da reabertura</span><textarea rows={3} value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} /></label><div className="review-actions"><button className="button button-secondary" type="button" onClick={reopen}>Confirmar reabertura</button><button className="text-button" type="button" onClick={() => setShowReopen(false)}>Cancelar</button></div></div>}
    </div><aside className="review-side">
      <dl className="review-metadata"><div><dt>Critério</dt><dd>{criterioId}</dd></div><div><dt>Diagnóstico</dt><dd>{diagnosticoId ?? "Não disponível"}</dd></div><div><dt>Coleta</dt><dd>{execucaoId ?? "Não vinculada"}</dd></div><div><dt>Último registro local</dt><dd>{current ? formatter.format(new Date(current.registrado_em)) : "Sem registro"}</dd></div><div><dt>Histórico local</dt><dd>{store.revisions.filter((entry) => entry.criterio_id === criterioId).length} evento(s)</dd></div></dl>
      <div className="transfer-actions"><button className="button button-secondary" type="button" onClick={exportReviews}>Exportar validações</button><button className="button button-secondary" type="button" onClick={() => importRef.current?.click()}>Importar JSON</button><input ref={importRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(e) => e.target.files?.[0] && void importReviews(e.target.files[0])} /></div>
      <p className="sync-note">{store.last_exported_hash ? "Backup exportado; o arquivo ainda precisa ser consolidado para compartilhamento." : store.revisions.length ? "Alterações locais — não compartilhadas. Exportação necessária." : "Nenhuma validação local registrada."}</p>
    </aside></div>
  </section>;
}
