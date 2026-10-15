# Relatório de testes

Data da rodada: 09/10/2026. Ambiente: Windows, Node.js v24.21.0 LTS portátil, Python 3.13.5.

## Testes executados

| Verificação | Resultado |
|---|---|
| Extração documental | 16 arquivos; 251/251 páginas PDF; nenhuma página omitida; OCR local executado em 3 páginas marcadas. |
| Validação de dados (`npm run validate:data`) | aprovado: 73 critérios únicos, 17 grupos, 66 passos, 35/24/14, referências cruzadas. |
| TypeScript (`npm run typecheck`) | aprovado. |
| Testes (`npm test`) | 4 aprovados, 0 falhas. |
| Build estático (`npm run build --prefix ...`) | aprovado: 80 páginas estáticas, incluindo 73 detalhes de critério. |
| QA desktop | título e H1 corretos; sem portal de erro; screenshot local inspecionado. |
| QA mobile | 73 cartões carregados; filtro `Q3.4.4` reduz para um; navegação ao detalhe correta; 16 documentos; nenhum HTTP 4xx/5xx após ajuste de links. |
| Descoberta Q1.1 | homepage HTTP 200; 9 links candidatos; 1 screenshot; trace; resultado final nulo. |
| Coleta Q1.1 | 9 navegações, 0 falhas, 10 screenshots brutos, 10 eventos de evidência, trace de 44.666.905 bytes; resultado final nulo. |
| Publicação sanitizada | executada com zero revisões: JSON público permaneceu vazio e nenhum deploy foi acionado. |
| Exportações locais | XLSX preservou 3 abas/fórmulas e 73 critérios; CSV UTF-8 BOM excluiu a linha de exemplo; índice conferiu 13/13 hashes de evidências em 4 tentativas/execuções preservadas. |

## Execuções Q1.1 preservadas

- descoberta válida: `q11-descoberta-2026-10-09T15-52-37-517Z-88eae50f`;
- coleta válida: `q11-coleta-2026-10-09T15-53-09-274Z-fab24357`;
- tentativas anteriores foram preservadas, inclusive a interrupção por falta de espaço ao gravar trace; não foram convertidas em achado.

## Ajustes decorrentes dos testes

- regra de descoberta passou a exigir limites de palavra, impedindo que `ação` corresponda a `informação` ou `declaração`;
- navegação interna do painel usa links estáticos completos para evitar prefetch incompatível com servidor HTTP simples;
- cabeçalho móvel passou a quebrar a navegação em linhas, em vez de ocultar o último item;
- build foi validado em cópia sanitizada no volume D porque o volume C estava quase cheio e o Turbopack recusou `node_modules` ligado entre volumes.

## Limitações

- não houve revisão humana de mérito nem resultado aprovado;
- o build no checkout original não foi executado com dependências fisicamente no mesmo volume; o mesmo código foi compilado em D com dependências reais, sem `private/`, originais ou exportações;
- a revisão não coleta identidade pessoal; a autodeclaração independente não comprova identidade nem homologação institucional;
- a coleta demonstra navegação e integridade técnica, não atendimento material dos critérios.

## Segunda etapa — integração ao painel

Rodada complementar em 09/10/2026:

| Verificação | Resultado |
|---|---|
| Leitura das coletas reais | 4 execuções preservadas; coleta final com 43 eventos, 9 navegações, 10 capturas e 10 critérios associados. |
| Indicadores | 10 critérios com coleta técnica; 0 efetivamente verificados; 73 sem verificação; 0 resultados preliminares; 0 finais validados. |
| Testes automatizados | 8 aprovados, 0 falhas; incluídas conferência dos JSON/JSONL, estados e hashes das cópias. |
| TypeScript | aprovado após integração. |
| Build estático | aprovado: 81 páginas, incluindo `/resultados/` e 73 detalhes de critério. |
| Evidências autorizadas | 10/10 PNG abriram em desktop e mobile; hashes SHA-256 conferidos. |
| Proteção de publicação | build rejeitado sem destino autorizado; build local aceito; manifesto exige aprovação externa distinta para publicação. |
| Inspeção do `out/` | 440 arquivos; nenhum ZIP, JSONL, PDF, DOCX, XLSX ou log; nenhum caminho absoluto, referência a `private/`, trace ou transcrição interna. |
| QA responsivo | desktop 1440×1000 e mobile 390×844 sem overflow horizontal; estados coletado/não verificado conferidos. |

Os 20 erros da coleta final referem-se a recursos auxiliares de redes sociais. Permanecem no nível da execução, pois os eventos não os associam a critérios específicos.

## Rodada de validação local sem identidade — 13/10/2026

| Verificação | Resultado |
|---|---|
| Schema e privacidade | aprovado: revisão contém somente IDs técnicos, instante, parecer, justificativa e confirmações; nenhum campo de nome, matrícula, e-mail, login ou assinatura. |
| Testes automatizados | 18 aprovados, 0 falhas; incluem bloqueio de segunda verificação, resultado `Não atendido` com checkbox e preservação do histórico. |
| TypeScript e lint | aprovados; lint em 20 arquivos de aplicação. |
| Build estático | aprovado em cópia limpa no volume D: 82 páginas, incluindo os 73 detalhes. |
| Fluxo sem conclusão | Q2.1.1 salvo como `Revisado sem conclusão`; estado preservado após recarregar. |
| Fluxo validado localmente | Q1.1.2 recebeu parecer local, checkbox explícito, persistiu após F5, exportou e reimportou JSON com SHA-256. O snapshot público continuou vazio. |
| Bloqueio metodológico | Q1.1.9 recusou conclusão enquanto a segunda verificação em outra data permanece pendente; rascunho permitido. |
| Merge idempotente | a mesma exportação foi importada duas vezes sem duplicar revisões e sem conflito. |
| Publicação isolada | snapshot de teste gerado em cópia fora do repositório com uma revisão expressamente indicada e nenhum campo de identidade pessoal. |
| Regressão visual | desktop 1440×1000 e mobile 390×844 aprovados; 33 evidências, filtros, análises Q1.1/Q2, lightbox e ausência de overflow preservados. |
