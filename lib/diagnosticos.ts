import { z } from "zod";

export const diagnosticoPreliminarSchema = z.object({
  criterioId: z.string().regex(/^Q(?:1\.1|2\.[1-7])\.\d+$/),
  grupoId: z.string().regex(/^Q(?:1\.1|2\.[1-7])$/),
  execucaoId: z.string().min(8),
  geradoEm: z.iso.datetime(),
  metodo: z.string().min(10),
  versaoSchema: z.literal(1),
  requisitosAtomicos: z.array(z.object({
    id: z.string().min(3),
    texto: z.string().min(2),
    origemMatriz: z.string().min(5),
  })).min(1),
  observacoes: z.array(z.object({
    id: z.string().min(3),
    fato: z.string().min(5),
    trecho: z.string().min(2),
    fonte: z.string().min(3),
    url: z.url(),
    consultadoEm: z.iso.datetime(),
    evidenciasIds: z.array(z.string()),
  })),
  localizacao: z.enum(["localizada", "nao_localizada_nesta_busca", "inconclusiva", "acesso_restrito", "erro_tecnico"]),
  completude: z.enum(["completa", "parcial", "nao_demonstrada", "nao_avaliavel"]),
  atualidade: z.enum(["aparentemente_atual", "indicio_desatualizacao", "sem_data_comprovada", "nao_avaliavel"]),
  aderenciaPreliminar: z.enum(["evidencia_compativel", "indicios_de_lacuna", "insuficiente_para_concluir", "nao_avaliavel"]),
  fundamentosNormativos: z.array(z.string()).min(1),
  limitacoes: z.array(z.string()).min(1),
  pendencias: z.array(z.string()),
  necessidadeSegundaVerificacao: z.boolean(),
  situacaoValidacao: z.literal("aguardando_validacao_humana"),
  resultadoFinal: z.null(),
});

export const diagnosticosQ11Schema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
  geradoEm: z.iso.datetime(),
  execucaoId: z.string().min(8),
  grupoId: z.string().min(2),
  execucoesIds: z.array(z.string().min(8)).optional(),
  gruposIds: z.array(z.string()).optional(),
  metodo: z.string().min(10),
  totais: z.object({ analisados: z.number().int(), aguardandoValidacao: z.number().int(), homologados: z.literal(0) }),
  diagnosticos: z.array(diagnosticoPreliminarSchema).min(10),
});

export type DiagnosticoPreliminar = z.infer<typeof diagnosticoPreliminarSchema>;
export type DiagnosticosQ11 = z.infer<typeof diagnosticosQ11Schema>;
export type DiagnosticosPreliminares = DiagnosticosQ11;
