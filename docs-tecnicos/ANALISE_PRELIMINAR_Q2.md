# Análise preliminar substantiva — Q2

Data da coleta: 15/10/2026. Execução privada de referência: `q2-conteudo-2026-10-15T14-25-21-830Z-a87d4c9f`.

Esta análise confronta os 24 critérios oficiais do Q2 com conteúdo visível em 16 páginas oficiais. É um diagnóstico técnico preliminar: nenhum registro recebeu resultado final, e todos aguardam validação humana independente.

| Critério | Objeto | Localização | Leitura técnica preliminar | Pendência principal |
|---|---|---|---|---|
| Q2.1.1 | Documentos administrativos ambientais | Localizada | Portal reúne sistemas e categorias ambientais; cobertura integral não demonstrada | Revisar amostra e cobertura temporal |
| Q2.1.2 | Processos administrativos ambientais | Localizada | Há conjuntos de julgamentos e consulta por número; acesso integral aos autos não aferido | Testar amostra nos sistemas indicados |
| Q2.1.3 | Listagens de licenciamento | Localizada | Geoportal declara consulta e download de licenças e autorizações | Validar camadas, exportação e atualização |
| Q2.1.4 | Supressão de vegetação | Localizada | Autorizações geográficas foram localizadas, sem identificação textual inequívoca da camada específica | Inspecionar camadas de supressão |
| Q2.1.5 | Autos de infração | Localizada | Duas bases, julgamentos e arrecadação estão indicados | Confrontar bases SEMA/SIGA com decisões |
| Q2.1.6 | TAC | Localizada | Diário Oficial retorna extratos de TAC da SEMA-MT em 2026; captura mantida somente no acervo privado por conter identificadores pessoais | Conferir integralidade da série e processos |
| Q2.1.7 | Recursos administrativos | Localizada | Há editais e decisões por ano; série de recursos não foi isolada | Conferir recursos e acórdãos do CONSEMA |
| Q2.1.8 | Estudos de impacto ambiental | Localizada | Acervo EIA/RIMA apresenta estudos, relatórios, termos e dispensas, inclusive processos de 2026 | Testar amostra de downloads |
| Q2.2.1 | Qualidade do ar | Localizada | Série visível de 2018–2023, com interrupções operacionais declaradas | Confirmar relatórios de 2024–2026 |
| Q2.2.2 | Qualidade da água | Localizada | Relatórios e dados cobrem períodos até 2024 | Validar arquivos e anos recentes |
| Q2.2.3 | Periodicidade anual | Localizada | Séries agregadas e lacunas aparentes não demonstram sequência anual contínua | Montar série ano a ano de ar e água |
| Q2.3.1 | Informações públicas do CAR | Localizada | SIMCAR Público está acessível sem login | Revisar cobertura e campos sigilosos |
| Q2.3.2 | Consulta/pesquisa do SIMCAR | Localizada | Busca por número, filtros e mapa estão visíveis | Teste funcional com cadastro autorizado |
| Q2.3.3 | Acesso aos resultados | Inconclusiva | Interface é pública, mas a coleta não usou identificador real | Comprovar resultado em teste controlado |
| Q2.4.1 | Planos de manejo | Localizada | Página atualizada em 2026 lista 48 UCs e referencia planos em várias fichas | Inventariar individualmente as 48 unidades |
| Q2.4.2 | Compensação ambiental | Localizada | Atas, processos, termos, quitações e unidades beneficiadas estão publicados | Validar arquivos e atualização de 2026 |
| Q2.5.1 | Informações sobre FEMAM | Localizada | Busca retorna notícias e atos dispersos, sem página temática consolidada | Localizar governança e atos vigentes |
| Q2.5.2 | Fontes de recursos | Localizada | Foi localizada receita de taxas, sem demonstração do rol completo | Confrontar fontes legais e publicação ativa |
| Q2.5.3 | Informações financeiras do Fundo | Não localizada nesta busca | Menção normativa a balanço não equivale a demonstrativo financeiro publicado | Segunda verificação no portal de transparência |
| Q2.6.1 | Informações sobre recursos hídricos | Localizada | Seção reúne planos, outorgas, barragens, comitês e relatórios | Validar amostra e atualização dos subtemas |
| Q2.6.2 | Seção/sistema de recursos hídricos | Localizada | Existe seção própria com sistemas e documentos organizados | Testar links e downloads |
| Q2.7.1 | Sistema estadual de informações | Localizada | Portal organiza SIMLAM, SIMCAR, Geoportal e outros sistemas | Validar integração e governança |
| Q2.7.2 | Prestação de informações ao Sinima | Inconclusiva | Fonte federal descreve a obrigação geral, não o fluxo específico de Mato Grosso | Obter comprovação técnica/administrativa |
| Q2.7.3 | Alimentação de sistemas nacionais/PNLA | Inconclusiva | PNLA é descrito pelo MMA, sem comprovação de alimentação atual pela SEMA-MT | Consultar PNLA por MT e confirmar atualização |

## Salvaguardas

- as 16 páginas retornaram HTTP 200, mas resposta técnica não foi tratada como atendimento;
- a tela do SIMCAR foi capturada antes de qualquer consulta, sem expor cadastro, proprietário ou imóvel;
- Q2.5.3 permanece como não localizada nesta busca;
- Q2.3.3, Q2.7.2 e Q2.7.3 permanecem inconclusivas;
- três critérios do Q2 exigem segunda verificação (quatro no total, incluindo Q1.1.9);
- `resultadoFinal` permanece `null` nos 24 diagnósticos.

O snapshot sanitizado está em `data/diagnosticos-preliminares.json`. Texto coletado, caminhos privados, originais e histórico permanecem em `private/` e não integram o Git.
