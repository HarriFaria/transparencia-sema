import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { diagnosticosQ11Schema } from "@/lib/diagnosticos";
import { projectRoot } from "@/lib/persistencia";

type Dimension = "completa" | "parcial" | "nao_demonstrada" | "nao_avaliavel";
type Location = "localizada" | "nao_localizada_nesta_busca" | "inconclusiva";
type Currency = "aparentemente_atual" | "indicio_desatualizacao" | "sem_data_comprovada" | "nao_avaliavel";
type Adherence = "evidencia_compativel" | "indicios_de_lacuna" | "insuficiente_para_concluir" | "nao_avaliavel";
type ObservationSeed = { target: string; fato: string; trecho: string; evidence?: string };
type Seed = {
  id: string;
  observation?: ObservationSeed;
  location: Location;
  completeness: Dimension;
  currency: Currency;
  adherence: Adherence;
  limitation: string;
  pending: string;
  secondCheck?: boolean;
};

const readJson = async <T>(file: string) => JSON.parse(await readFile(file, "utf8")) as T;
const executionsRoot = path.join(projectRoot, "private", "execucoes");
const entries = await readdir(executionsRoot, { withFileTypes: true });
const q2ExecutionId = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith("q2-conteudo-"))
  .map((entry) => entry.name).sort().at(-1);
if (!q2ExecutionId) throw new Error("Nenhuma coleta Q2 encontrada. Execute collect:q2-content primeiro.");

const collected = await readJson<any>(path.join(executionsRoot, q2ExecutionId, "conteudo-visivel.json"));
const records = new Map(collected.registros.map((item: any) => [item.id, item]));
const criteria = (await readJson<{ criterios: any[] }>(path.join(projectRoot, "data", "criterios.json"))).criterios;
const criteriaById = new Map(criteria.map((item) => [item.id, item]));
const existing = await readJson<any>(path.join(projectRoot, "data", "diagnosticos-preliminares.json"));
const q11 = existing.diagnosticos.filter((item: any) => item.criterioId.startsWith("Q1.1."));
if (q11.length !== 10) throw new Error("Os dez diagnósticos Q1.1 precisam estar preservados antes da expansão.");

const seeds: Seed[] = [
  { id: "Q2.1.1", observation: { target: "portal-transparencia", evidence: "EV-Q2-001", fato: "O portal reúne sistemas e categorias de documentos ambientais, inclusive licenças, autorizações e estudos.", trecho: "Licenças, Autorizações, Outorgas, Autos de Infração" }, location: "localizada", completeness: "parcial", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "A coleta confirmou categorias e pontos de acesso, não a integralidade de todos os documentos administrativos ambientais.", pending: "Revisar amostra documental e cobertura temporal por categoria." },
  { id: "Q2.1.2", observation: { target: "autos-infracao", evidence: "EV-Q2-004", fato: "A página orienta a consulta do trâmite processual pelo número do processo e publica conjuntos de julgamentos.", trecho: "consultar o sistema de protocolo ... utilizando o n° do processo" }, location: "localizada", completeness: "parcial", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "Não foi verificada a publicidade integral dos autos de cada processo administrativo.", pending: "Testar amostra de processos nos sistemas indicados e conferir documentos acessíveis." },
  { id: "Q2.1.3", observation: { target: "geoportal", evidence: "EV-Q2-003", fato: "O Geoportal declara disponibilizar licenças e autorizações com consulta e download.", trecho: "visualização, consulta e download de dados geográficos" }, location: "localizada", completeness: "parcial", currency: "sem_data_comprovada", adherence: "evidencia_compativel", limitation: "A captura comprova o ponto de acesso, mas não inventaria todas as listagens nem testa a exportação.", pending: "Validar camadas, formatos de download e atualização das listagens de licenciamento." },
  { id: "Q2.1.4", observation: { target: "geoportal", evidence: "EV-Q2-003", fato: "O Geoportal oferece autorizações e dados geográficos; a associação específica com supressão vegetal depende de inspeção das camadas.", trecho: "Licenças, Autorizações, Outorgas" }, location: "localizada", completeness: "parcial", currency: "sem_data_comprovada", adherence: "insuficiente_para_concluir", limitation: "A página de apresentação não enumera explicitamente, no texto capturado, a camada de supressão de vegetação.", pending: "Abrir o visualizador, localizar as camadas de supressão e testar consulta e download." },
  { id: "Q2.1.5", observation: { target: "autos-infracao", evidence: "EV-Q2-004", fato: "Há orientação para consultar duas bases de autos de infração no Geoportal e conjuntos de julgamentos e arrecadação.", trecho: "o cidadão deve consultar as duas bases" }, location: "localizada", completeness: "parcial", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "A navegação não aferiu completude, atualização de cada base ou correspondência entre auto e julgamento.", pending: "Testar as bases SEMA e SIGA e confrontar amostra com editais e decisões." },
  { id: "Q2.1.6", observation: { target: "tacs-iomat", fato: "A consulta oficial do Diário do Estado retorna extratos de TAC firmados pela SEMA-MT em 2026.", trecho: "Extrato TAC N° 025-2026-SEMA" }, location: "localizada", completeness: "parcial", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "A captura foi mantida somente no acervo privado porque a listagem contém nomes, imóveis e identificadores pessoais; não foi aferida a integralidade dos TACs.", pending: "Conferir a série anual, os campos publicados e a correspondência com processos administrativos." },
  { id: "Q2.1.7", observation: { target: "editais-decisoes", evidence: "EV-Q2-005", fato: "A seção publica editais, notificações e decisões administrativas por ano, incluindo 2026.", trecho: "2026 2025 2024 2023 2022 -2018" }, location: "localizada", completeness: "parcial", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "A coleta não distinguiu decisões de primeira instância, recursos e acórdãos para todos os processos.", pending: "Conferir a série de recursos administrativos e acórdãos do CONSEMA." },
  { id: "Q2.1.8", observation: { target: "eia-rima", evidence: "EV-Q2-006", fato: "A seção EIA/RIMA reúne estudos, relatórios, termos de referência e dispensas, com processos inclusive de 2026.", trecho: "informações sobre os licenciamentos com Estudos de Impactos Ambientais" }, location: "localizada", completeness: "completa", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "A disponibilidade e integridade de cada arquivo compactado não foram testadas.", pending: "Validar amostra de downloads e confrontar a lista com os processos de licenciamento." },
  { id: "Q2.2.1", observation: { target: "qualidade-ar", evidence: "EV-Q2-007", fato: "A página publica relatórios de qualidade do ar de 2018 a 2023 e registra interrupções operacionais.", trecho: "2023 2022 2021 2020 2019 2018" }, location: "localizada", completeness: "parcial", currency: "indicio_desatualizacao", adherence: "indicios_de_lacuna", limitation: "Não há relatório anual visível posterior a 2023 e a própria página informa indisponibilidades do modelo fonte.", pending: "Confirmar se existem relatórios de 2024 a 2026 em outra seção ou fonte." },
  { id: "Q2.2.2", observation: { target: "qualidade-agua", evidence: "EV-Q2-008", fato: "A página publica relatórios e planilhas de qualidade da água, incluindo dados de estações até 2024.", trecho: "Dados de qualidade da água ... Anos 2020-2024" }, location: "localizada", completeness: "parcial", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "Os documentos estão agregados em períodos plurianuais, não necessariamente como relatório anual individual.", pending: "Validar os arquivos e a cobertura dos anos de 2024 a 2026." },
  { id: "Q2.2.3", observation: { target: "qualidade-agua", evidence: "EV-Q2-008", fato: "A série hídrica cobre diversos intervalos entre 2003 e 2024, mas com publicações agregadas e lacunas aparentes.", trecho: "Relatório Monitoramento Água - 2020-2023" }, location: "localizada", completeness: "parcial", currency: "indicio_desatualizacao", adherence: "indicios_de_lacuna", limitation: "A sequência observada não demonstra periodicidade anual contínua para ar e água.", pending: "Montar série ano a ano dos dois temas e confirmar formalmente as lacunas." },
  { id: "Q2.3.1", observation: { target: "simcar", evidence: "EV-Q2-009", fato: "A SEMA mantém link público direto para o SIMCAR sem exigir autenticação na página inicial.", trecho: "SIMCAR PÚBLICO" }, location: "localizada", completeness: "parcial", currency: "sem_data_comprovada", adherence: "evidencia_compativel", limitation: "Não foi avaliado se o conjunto exibido omite corretamente dados sigilosos nem se cobre todos os cadastros.", pending: "Validar amostra de resultados e revisar os campos expostos sob a ótica de sigilo." },
  { id: "Q2.3.2", observation: { target: "simcar-publico", evidence: "EV-Q2-010", fato: "O portal público exibe busca por número do CAR, filtros e mapa sem tela de login.", trecho: "Pesquisar pelo Número do CAR" }, location: "localizada", completeness: "parcial", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "A coleta não utilizou identificador real, para evitar incorporar dados pessoais à evidência pública.", pending: "Executar teste funcional controlado com cadastro público autorizado e registrar resposta saneada." },
  { id: "Q2.3.3", observation: { target: "simcar-publico", evidence: "EV-Q2-010", fato: "A interface pública oferece busca, filtros e mapa sem autenticação prévia.", trecho: "Buscar  Filtros" }, location: "inconclusiva", completeness: "parcial", currency: "aparentemente_atual", adherence: "insuficiente_para_concluir", limitation: "A interface é acessível, mas não foi produzido resultado de consulta sem usar um identificador de imóvel real.", pending: "Comprovar acesso ao resultado em teste controlado e verificar quais campos são apresentados." },
  { id: "Q2.4.1", observation: { target: "unidades-conservacao", evidence: "EV-Q2-011", fato: "A página atualizada em 2026 lista 48 unidades estaduais e indica planos de manejo em diversas fichas.", trecho: "acessar os planos de manejo e legislações pertinentes" }, location: "localizada", completeness: "parcial", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "A captura não comprova plano publicado para cada uma das 48 unidades nem justifica individualmente as ausências.", pending: "Inventariar as 48 fichas e classificar plano disponível, inexistente, em elaboração ou não aplicável." },
  { id: "Q2.4.2", observation: { target: "compensacao-ambiental", evidence: "EV-Q2-012", fato: "A seção publica atas, legislação, processos, termos vigentes, quitados e unidades beneficiadas, com itens de 2024 e 2025.", trecho: "informações sobre os processos de compensação ambiental" }, location: "localizada", completeness: "completa", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "Os arquivos vinculados não foram integralmente lidos ou confrontados com o universo de processos.", pending: "Validar amostra dos documentos e confirmar atualização de 2026." },
  { id: "Q2.5.1", observation: { target: "busca-femam", evidence: "EV-Q2-013", fato: "A busca institucional retorna referências ao Fundo Estadual do Meio Ambiente e ao seu regime normativo.", trecho: "Fundo Estadual do Meio Ambiente – FEMAM" }, location: "localizada", completeness: "parcial", currency: "sem_data_comprovada", adherence: "evidencia_compativel", limitation: "Não foi localizada página temática consolidada do FEMAM; os resultados são notícias e atos dispersos.", pending: "Localizar página institucional do Fundo, governança, finalidade e atos vigentes." },
  { id: "Q2.5.2", observation: { target: "busca-femam", evidence: "EV-Q2-013", fato: "Um resultado informa que receitas de taxas de serviços e licenciamento constituem receita do FEMAM.", trecho: "constituirá receita do Fundo Estadual do Meio Ambiente" }, location: "localizada", completeness: "parcial", currency: "sem_data_comprovada", adherence: "evidencia_compativel", limitation: "Foi identificada uma fonte de receita, sem demonstração do rol completo previsto na legislação.", pending: "Confrontar todas as fontes legais com a informação ativa publicada." },
  { id: "Q2.5.3", location: "nao_localizada_nesta_busca", completeness: "nao_demonstrada", currency: "nao_avaliavel", adherence: "insuficiente_para_concluir", limitation: "A busca retornou menção a balanço anual em norma, mas não localizou execução financeira, receitas, despesas ou balanços do Fundo.", pending: "Pesquisar demonstrativos do FEMAM no portal institucional e no sistema estadual de transparência.", secondCheck: true },
  { id: "Q2.6.1", observation: { target: "recursos-hidricos", evidence: "EV-Q2-014", fato: "A seção reúne política, quantidade e qualidade da água, planos, outorgas, barragens, comitês e relatórios de gestão.", trecho: "informações e relatórios sobre quantidade e qualidade da água" }, location: "localizada", completeness: "completa", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "A coleta avaliou a organização e presença das categorias, não a completude de cada acervo.", pending: "Validar amostra dos documentos e a atualização de cada subtema." },
  { id: "Q2.6.2", observation: { target: "recursos-hidricos", evidence: "EV-Q2-014", fato: "Existe seção própria com links para sistemas, documentos, planos e relatórios de recursos hídricos.", trecho: "Recursos Hídricos" }, location: "localizada", completeness: "completa", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "Não foram testados todos os links e sistemas externos listados.", pending: "Executar teste amostral de navegação e downloads." },
  { id: "Q2.7.1", observation: { target: "portal-transparencia", evidence: "EV-Q2-001", fato: "O portal estadual organiza SIMLAM, SIMCAR, Geoportal e outros sistemas ambientais de acesso público.", trecho: "Sistemas ... SIMLAM ... SIMCAR ... GEOPORTAL" }, location: "localizada", completeness: "completa", currency: "aparentemente_atual", adherence: "evidencia_compativel", limitation: "A existência do conjunto de sistemas não comprova integração, governança ou completude dos dados.", pending: "Validar arquitetura, responsabilidades e atualização dos sistemas estaduais." },
  { id: "Q2.7.2", observation: { target: "sinima-pnla", evidence: "EV-Q2-015", fato: "A página federal descreve o SINIMA e a obrigação geral de integração das bases das autoridades licenciadoras.", trecho: "bases de dados integradas ao SINIMA" }, location: "inconclusiva", completeness: "nao_demonstrada", currency: "aparentemente_atual", adherence: "insuficiente_para_concluir", limitation: "A fonte nacional não identifica, na captura, prestação específica e atualizada de dados pela SEMA-MT.", pending: "Obter evidência técnica ou administrativa do fluxo de dados de Mato Grosso ao SINIMA.", secondCheck: true },
  { id: "Q2.7.3", observation: { target: "sinima-pnla", evidence: "EV-Q2-015", fato: "O MMA informa que o PNLA sistematiza informações de licenciamento para acompanhamento social.", trecho: "O Portal Nacional de Licenciamento Ambiental ... atua na sistematização" }, location: "inconclusiva", completeness: "nao_demonstrada", currency: "aparentemente_atual", adherence: "insuficiente_para_concluir", limitation: "A página não comprova que a SEMA-MT alimenta atualmente o PNLA nem permite aferir adequação ou periodicidade.", pending: "Consultar o PNLA por Mato Grosso e solicitar confirmação do envio e atualização pela SEMA-MT.", secondCheck: true },
];

const generatedAt = collected.gerado_em_utc as string;
const diagnostics = seeds.map((seed) => {
  const criterion: any = criteriaById.get(seed.id);
  if (!criterion) throw new Error(`Critério inexistente: ${seed.id}`);
  const record: any = seed.observation ? records.get(seed.observation.target) : null;
  if (seed.observation && !record) throw new Error(`Registro de coleta ausente: ${seed.observation.target}`);
  return {
    criterioId: seed.id,
    grupoId: criterion.grupo_id,
    execucaoId: q2ExecutionId,
    geradoEm: generatedAt,
    metodo: "Leitura controlada da fonte oficial e confronto com a redação literal da matriz do Q2.",
    versaoSchema: 1,
    requisitosAtomicos: [{ id: `${seed.id}-R1`, texto: criterion.redacao_literal, origemMatriz: `Lista de Verificação, linha ${criterion.origem_xlsx.linha}, critério ${seed.id}` }],
    observacoes: seed.observation ? [{
      id: `${seed.id}-O1`,
      fato: seed.observation.fato,
      trecho: seed.observation.trecho,
      fonte: record.titulo || seed.observation.target,
      url: record.url_final,
      consultadoEm: record.capturado_em_utc,
      evidenciasIds: seed.observation.evidence ? [seed.observation.evidence] : [],
    }] : [],
    localizacao: seed.location,
    completude: seed.completeness,
    atualidade: seed.currency,
    aderenciaPreliminar: seed.adherence,
    fundamentosNormativos: [criterion.norma_dispositivo_literal],
    limitacoes: [seed.limitation],
    pendencias: [seed.pending],
    necessidadeSegundaVerificacao: seed.secondCheck ?? false,
    situacaoValidacao: "aguardando_validacao_humana",
    resultadoFinal: null,
  };
});

const payload = diagnosticosQ11Schema.parse({
  schemaVersion: 2,
  geradoEm: generatedAt,
  execucaoId: q2ExecutionId,
  grupoId: "Q1.1+Q2",
  execucoesIds: [...new Set([...q11.map((item: any) => item.execucaoId), q2ExecutionId])],
  gruposIds: ["Q1.1", "Q2.1", "Q2.2", "Q2.3", "Q2.4", "Q2.5", "Q2.6", "Q2.7"],
  metodo: "Leitura controlada de conteúdo visível em fontes públicas oficiais, confrontada com os requisitos da matriz. Não produz conclusão de auditoria.",
  totais: { analisados: 34, aguardandoValidacao: 34, homologados: 0 },
  diagnosticos: [...q11, ...diagnostics],
});

const ids = new Set(payload.diagnosticos.map((item) => item.criterioId));
if (ids.size !== 34 || diagnostics.length !== 24) throw new Error("Cobertura Q1.1 + Q2 incompleta ou duplicada.");
const serialized = `${JSON.stringify(payload, null, 2)}\n`;
await writeFile(path.join(projectRoot, "data", "diagnosticos-preliminares.json"), serialized, "utf8");
await mkdir(path.join(projectRoot, "public", "data"), { recursive: true });
await writeFile(path.join(projectRoot, "public", "data", "diagnosticos-preliminares.json"), serialized, "utf8");
await mkdir(path.join(projectRoot, "private", "diagnosticos-q2"), { recursive: true });
await writeFile(path.join(projectRoot, "private", "diagnosticos-q2", `${q2ExecutionId}.json`), `${JSON.stringify({ ...payload, diagnosticos: diagnostics, historicoPrivado: true }, null, 2)}\n`, "utf8");
console.log(`Diagnósticos Q2 preparados: ${diagnostics.length}; cobertura substantiva total: ${payload.totais.analisados}; resultados finais: 0.`);
