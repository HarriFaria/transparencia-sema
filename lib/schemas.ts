import { z } from "zod";

export const operationalStatusSchema = z.enum([
  "nao_iniciado", "executando", "localizado", "nao_localizado", "acesso_restrito",
  "falha_tecnica", "indisponivel", "revisao_pendente", "validado",
]);

export const finalResultSchema = z.enum(["Atendido", "Não atendido", "Atendido parcialmente"]);

export const verificationSchema = z.object({
  data: z.iso.date(),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endereco_ou_justificativa: z.string().min(3),
  responsavel: z.string().min(2),
  status_operacional: operationalStatusSchema.exclude(["nao_iniciado", "executando", "revisao_pendente", "validado"]),
  evidencias: z.array(z.object({ sha256: z.string().regex(/^[a-f0-9]{64}$/), arquivo_execucao: z.string().min(1) })).default([]),
});

export const reviewInputSchema = z.object({
  criterio_id: z.string().regex(/^Q[123]\.\d+\.\d+$/),
  execucao_id: z.string().min(3),
  primeira_verificacao: verificationSchema,
  segunda_verificacao: verificationSchema.optional(),
  responsavel_validacao: z.string().min(2),
  captura_tela_anexada: z.boolean(),
  resultado_final: finalResultSchema,
  observacoes_achado: z.string().default(""),
  declaracao_revisao_humana: z.literal(true),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
