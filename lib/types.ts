export type ResultadoFinal = "Atendido" | "Não atendido" | "Atendido parcialmente";
export type StatusOperacional =
  | "nao_iniciado"
  | "executando"
  | "localizado"
  | "nao_localizado"
  | "acesso_restrito"
  | "falha_tecnica"
  | "indisponivel"
  | "revisao_pendente"
  | "validado";

export interface ReferenciaCriterio {
  documento_id: string;
  arquivo: string;
  paginas_pdf: number[];
  artigos: string[];
  relacao: string;
  status: string;
}

export interface Criterio {
  ordem: number;
  questao: number;
  id: string;
  grupo_id: string;
  redacao_literal: string;
  norma_dispositivo_literal: string;
  fonte_informacao_literal: string;
  url_confirmada: string | null;
  exigibilidade: string;
  periodo_previsto: string;
  orientacao_ti_literal: string;
  origem_xlsx: { arquivo: string; sha256: string; aba: string; linha: number; colunas_referencia: string };
  passos_roteiro: string[];
  referencias_documentais: ReferenciaCriterio[];
  referencias_ausentes_ou_a_confirmar: Array<{ status: string; documento: string; motivo: string }>;
  automacao: { nivel: string; limites: string };
  evidencia_exigida: string[];
  verificacao_humana_obrigatoria: boolean;
  pendencias_documentais: string[];
  status_operacional: StatusOperacional;
  resultado_final: ResultadoFinal | null;
}

export interface Grupo {
  id: string;
  item_roteiro: number;
  questao: number;
  titulo: string;
  quantidade_criterios: number;
  criterios: string[];
  passos: string[];
}

export interface NavegacaoColeta {
  timestamp_utc: string;
  texto_link: string | null;
  url_candidata: string;
  url_final: string;
  criterios: string[];
  observacao: string;
}

export interface EvidenciaPainel {
  id: string;
  execucao_id: string;
  timestamp_utc: string;
  criterios: string[];
  url: string;
  sha256: string;
  integridade_confirmada: boolean;
  visualizacao_autorizada: boolean;
  url_visualizacao: string | null;
  compartilhada: boolean;
}

export interface ExecucaoPainel {
  execucao_id: string;
  grupo: string;
  modo: "descoberta" | "coleta" | string;
  criado_em_utc: string;
  encerrado_em_utc: string | null;
  situacao: "concluida" | "interrompida" | "incompleta";
  homepage: string;
  candidatos: number;
  criterios_associados: string[];
  navegacoes: NavegacaoColeta[];
  evidencias: EvidenciaPainel[];
  erros_tecnicos: Array<{ url: string; erro: string; ocorrencias: number }>;
  resultado_final: null;
}

export interface ResultadoCriterioPainel {
  criterio_id: string;
  situacao: "nao_verificado" | "coleta_tecnica_sem_verificacao" | "verificado";
  execucoes: string[];
  navegacoes: NavegacaoColeta[];
  evidencias: EvidenciaPainel[];
  informacao_encontrada: string | null;
  primeira_verificacao: Record<string, unknown> | null;
  segunda_verificacao: Record<string, unknown> | null;
  resultado_final: ResultadoFinal | null;
  responsavel_validacao: string | null;
  observacao: string;
}

export interface PainelColetas {
  schema_version: number;
  gerado_em_utc: string;
  aviso: string;
  totais: {
    execucoes: number;
    execucoes_concluidas: number;
    grupos_com_coleta: number;
    criterios_com_coleta_tecnica: number;
    criterios_efetivamente_verificados: number;
    criterios_sem_verificacao: number;
    resultados_preliminares: number;
    resultados_finais_validados: number;
    evidencias_registradas: number;
    evidencias_autorizadas: number;
  };
  questoes: Array<{ questao: number; total: number; com_coleta_tecnica: number; verificados: number; pendentes: number }>;
  ultima_execucao: ExecucaoPainel | null;
  execucoes: ExecucaoPainel[];
  criterios: Record<string, ResultadoCriterioPainel>;
}

export interface EvidenciaPublica {
  id: string;
  execucaoId: string;
  grupoId: string;
  criteriosIds: string[];
  nivelAssociacao: "execucao" | "grupo" | "criterio";
  titulo: string;
  descricao: string;
  urlOrigem: string;
  capturadoEm: string;
  arquivo: string;
  miniatura: string;
  statusRevisao: "aprovado";
  saneada: boolean;
  sha256Original: string;
  sha256Publicado: string;
  sha256Miniatura: string;
  tamanhoBytes: number;
  tamanhoMiniaturaBytes: number;
}

export interface EvidenciasPublicas {
  schemaVersion: number;
  revisadoEm: string;
  geradoEm: string | null;
  nota: string;
  totais: { encontradas: number; aprovadas: number; publicadas: number; retidas: number };
  retencao: string;
  evidencias: EvidenciaPublica[];
}

export interface PainelPublico {
  schemaVersion: number;
  geradoEm: string;
  escopo: { criterios: number; questoes: Record<string, number>; grupos: number; passos: number };
  resultados: { validados: number; atendidos: number; parciais: number; naoAtendidos: number; naoApurados: number; percentualOficial: number };
  coleta: { ultimaColetaEm: string | null; ultimaValidacaoEm: string | null; gruposComColeta: number; criteriosComColetaTecnica: number; evidenciasRegistradas: number; evidenciasPublicadas: number; execucoes: number };
  situacoes: Record<string, { situacaoOperacional: "nao_iniciado" | "coleta_realizada" | "validado"; resultadoFinal: ResultadoFinal | null; evidenciasPublicas: number; ultimaVerificacao: string | null }>;
}
