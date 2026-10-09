# Plataforma de Apoio à Fiscalização de Transparência Ativa da SEMA-MT

Aplicação local e estática para apoiar a Ordem de Serviço nº 4618/2026. O sistema organiza 73 critérios, 17 grupos, 66 passos, referências documentais e evidências. Não usa banco de dados e não substitui o julgamento profissional dos auditores.

## Estado desta iteração

- 16 originais inventariados sem modificação: 14 PDFs, um XLSX e um DOCX;
- 251 páginas PDF extraídas individualmente; OCR local complementar em três páginas de baixo texto;
- 73 critérios importados das linhas 2–74; linha 75 de exemplo excluída;
- 17 itens e 66 passos importados do roteiro;
- painel estático com dashboard, resultados reais, busca/filtros, detalhe, roteiro, documentos e metodologia;
- descoberta e coleta técnica Q1.1 executadas a partir da homepage, sem resultado final automático;
- extrato sanitizado de quatro execuções, com 13 evidências registradas e dez cópias locais selecionadas da coleta final;
- `data/resultados-publicados.json` vazio, pois não há revisão humana aprovada.

## Segurança e diretórios

`../arquivos/`, `private/` e `exports/` estão excluídos do Git. Transcrições, traces, revisões e relatórios restritos nunca são importados pelo frontend. A única exceção controlada são cópias PNG selecionadas por `npm run export:panel`, gravadas em `public/evidencias-autorizadas/`, que também permanece ignorado pelo Git.

Em ambientes com pouco espaço, `.tools/`, `node_modules/`, `private/` e `out/` podem ser redirecionados por junções locais para outro volume. Esses caminhos são ignorados e não fazem parte do código versionável.

## Requisitos

- Node.js 24 LTS ou superior;
- Python 3.13 com `openpyxl`, `python-docx` e `pdfplumber` para regenerar os dados documentais;
- Chromium do Playwright para coleta/QA.

## Instalação e painel

```powershell
npm install
npx playwright install chromium
npm run validate:data
npm run typecheck
npm test
$env:PAINEL_DESTINO = "local"
npm run build
npm run dev
```

O build é inteiramente estático (`output: "export"`) e gera `out/`. Não há API Routes, Server Actions ou persistência web.

## Extração e consolidação documental

```powershell
python scripts/extrair_documentos.py
python scripts/gerar_dados.py
```

Para habilitar o OCR local nas páginas marcadas como insuficientes, disponibilize `PyMuPDF` e `rapidocr_onnxruntime` no ambiente e execute com `ENABLE_LOCAL_OCR=1`.

## Q1.1 — descoberta e coleta

Identifique explicitamente o operador. Os comandos não produzem resultado final:

```powershell
$env:AUDITOR_NOME = "Nome do operador"
npm run discover:q11
npm run collect:q11
```

Cada execução cria `private/execucoes/<id>/manifest.json`, `eventos.jsonl`, `mapa-links.json`, screenshots brutos com SHA-256, `trace.zip` e um resumo que mantém `resultado_final: null`.

## Integração das coletas com o painel

O comando abaixo lê os JSON/JSONL originais, confere os hashes, produz `data/resultados-coletas.json` sem caminhos absolutos e copia somente os PNG listados no manifesto de seleção:

```powershell
npm run export:panel -- --selecao config/evidencias-painel.local.json
```

O manifesto atual autoriza apenas uso local e não contém aprovação externa. Enquanto as cópias estiverem em `public/evidencias-autorizadas/`, o `prebuild` bloqueia builds sem `PAINEL_DESTINO=local`. Uma publicação futura exige novo manifesto com `destino: "publicacao"` e `aprovacao_externa` expressa; não reutilize a autorização local.

Semântica dos indicadores:

- **coleta técnica:** existe evento original que associa URL ou captura ao critério;
- **critério verificado:** existe verificação de conteúdo registrada por responsável;
- **resultado final:** existe revisão humana independente publicada em `data/resultados-publicados.json`.

Sucesso ou falha de navegação nunca é convertido automaticamente em atendimento. No estado atual, dez critérios têm coleta técnica, nenhum foi efetivamente verificado e nenhum tem resultado final.

## Revisão, publicação sanitizada e Excel

Crie um JSON local compatível com `reviewInputSchema` em `lib/schemas.ts` e execute:

```powershell
npm run review -- --input C:\caminho\revisao.json
npm run publish:data
npm run export:xlsx
npm run export:evidence
```

O revisor deve ser diferente do primeiro responsável. Quando a primeira busca resultar em `nao_localizado`, a segunda verificação deve ser em data posterior; nenhum prazo mínimo numérico é inventado. `Não atendido` exige captura anexada. A publicação copia apenas campos aprovados e sanitizados para o JSON público e nunca aciona deploy. A exportação gera XLSX, CSV UTF-8 com BOM e índice local de evidências com reverificação dos hashes.

## Documentação técnica

- [Inventário documental](docs-tecnicos/INVENTARIO_DOCUMENTAL.md)
- [Análise documental integrada](docs-tecnicos/ANALISE_DOCUMENTAL_INTEGRADA.md)
- [Matriz de rastreabilidade](docs-tecnicos/MATRIZ_DE_RASTREABILIDADE.md)
- [Arquitetura](docs-tecnicos/ARQUITETURA.md)
- [Plano de execução](docs-tecnicos/PLANO_DE_EXECUCAO.md)
- [Relatório de testes](docs-tecnicos/RELATORIO_DE_TESTES.md)
