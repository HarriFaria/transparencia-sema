import { z } from "zod";

export const operationalStatusSchema = z.enum([
  "nao_iniciado", "executando", "localizado", "nao_localizado", "acesso_restrito",
  "falha_tecnica", "indisponivel", "revisao_pendente", "validado",
]);

export const finalResultSchema = z.enum(["Atendido", "Não atendido", "Atendido parcialmente"]);
