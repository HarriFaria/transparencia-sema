# Auditoria de Transparência — SEMA-MT

Painel executivo e estático de apoio à fiscalização da transparência ativa da SEMA-MT, vinculada à OS nº 4618/2026. A aplicação organiza a matriz oficial de 73 critérios, 17 grupos, 66 passos de roteiro e as coletas técnicas preservadas, sem converter navegação automatizada em conclusão de auditoria.

## Estado público atual

- 73 critérios únicos importados das linhas 2–74 da planilha oficial, distribuídos em 35/24/14 nas Questões 1/2/3;
- zero resultados finais validados e 73 critérios não apurados;
- nove execuções técnicas válidas preservadas localmente, com 74 capturas brutas registradas;
- 34 diagnósticos substantivos preliminares — dez de Q1.1 e 24 de Q2 — todos aguardando validação humana e com `resultado_final = null`;
- 33 capturas aprovadas após inspeção visual, copiadas para `public/evidencias/` e exibidas no painel;
- 41 capturas não allowlisted, sensíveis ou redundantes retidas fora do Git;
- exportação estática Next.js, sem banco de dados, API Route ou arquivo privado em runtime.

## Regra da verdade

Os únicos resultados finais permitidos são `Atendido`, `Não atendido` e `Atendido parcialmente`, sempre após revisão humana independente. Sem validação, `resultado_final` permanece nulo. Coleta técnica, informação localizada, falha de navegação e parecer final são estados diferentes.

O percentual oficial é `Atendidos ÷ 73`. Resultados parciais não entram no numerador.

## Instalação e desenvolvimento

Requisitos: Node.js 24 ou superior; Python 3 para servir o export; Chromium do Playwright para QA e geração das miniaturas.

```powershell
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run validate:data
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run dev
```

Neste checkout, `node_modules` pode ser uma junção para o volume `D:` devido ao espaço disponível. Se o Webpack rejeitar uma junção entre volumes, faça o build em uma cópia sanitizada no mesmo volume das dependências, conforme `docs-tecnicos/PUBLICACAO_GITHUB_VERCEL.md`. Isso não afeta a Vercel, que instala as dependências no próprio ambiente.

## Atualização do snapshot público

O arquivo `private/aprovacao-evidencias.json` é a allowlist local e permanece ignorado. Ausência de `publicar: true` significa não publicar.

```powershell
npm.cmd run prepare:public-evidence
npm.cmd run prepare:diagnostics
npm.cmd run prepare:public-data
npm.cmd run verify:public-evidence
npm.cmd run verify:public
```

`prepare:public-evidence` confere os hashes originais, copia somente as imagens aprovadas, cria miniaturas separadas e gera o manifesto público. `prepare:diagnostics` valida os 34 diagnósticos, preserva o histórico privado e gera o snapshot sanitizado. `prepare:public-data` recalcula os indicadores consumidos pelo dashboard. O build remoto usa apenas os artefatos versionados.

## Build e preview do export

```powershell
npm.cmd run build
python -m http.server 4173 --directory out --bind 127.0.0.1
```

Abra `http://127.0.0.1:4173/`. Um `ERR_CONNECTION_REFUSED` normalmente indica que o servidor foi encerrado.

## Coleta e revisão controlada

```powershell
$env:COLETA_OPERADOR_ID = "coleta-local-01" # opcional; ID técnico, não nome pessoal
npm.cmd run discover:q11
npm.cmd run collect:q11
npm.cmd run collect:q11-content
npm.cmd run analisar:q11
npm.cmd run collect:q2-content
npm.cmd run analisar:q2
npm.cmd run merge:reviews -- --input C:\caminho\validacoes-sema.json
npm.cmd run publish:reviews -- --revision rev-id-expressamente-autorizado
```

O formulário “Revisão do auditor” aparece nos 73 critérios e salva o histórico no `localStorage` do navegador. Ele nunca solicita nome, matrícula, e-mail, login ou assinatura. A exportação produz JSON versionado com SHA-256; o merge valida IDs e preserva conflitos em `data/validacoes/`, cujo conteúdo é ignorado pelo Git. Somente revisões indicadas explicitamente em `publish:reviews` entram no snapshot público. A publicação de dados não aciona deploy automaticamente.

Sem autenticação, a declaração de revisão independente é uma autodeclaração. O sistema não comprova identidade nem rotula o registro como homologação institucional verificada. Veja [Validação local sem identidade pessoal](docs-tecnicos/VALIDACAO_LOCAL_SEM_IDENTIDADE.md).

## GitHub e Vercel

O remoto existente é `origin` (`https://github.com/HarriFaria/transparencia-sema.git`) e a branch de produção utilizada nesta entrega é `main`. O push nessa branch aciona a integração GitHub→Vercel já existente; não é necessário criar projeto ou executar deploy manual.

Antes de publicar:

```powershell
git status --short
git diff --check
npm.cmd run verify:public
git check-ignore -v public/evidencias/Q1.1/q11-coleta-2026-10-09T15-53-09-274Z-fab24357/ev-q11-001.png
git diff --cached --name-status
git push origin main
```

## Documentação

- [Revisão das evidências públicas](docs-tecnicos/REVISAO_PUBLICACAO_EVIDENCIAS.md)
- [Análise preliminar substantiva de Q1.1](docs-tecnicos/ANALISE_PRELIMINAR_Q11.md)
- [Análise preliminar substantiva do Q2](docs-tecnicos/ANALISE_PRELIMINAR_Q2.md)
- [Relatório do redesenho](docs-tecnicos/RELATORIO_REDESIGN.md)
- [Publicação GitHub e Vercel](docs-tecnicos/PUBLICACAO_GITHUB_VERCEL.md)
- [Arquitetura](docs-tecnicos/ARQUITETURA.md)
- [Validação local sem identidade pessoal](docs-tecnicos/VALIDACAO_LOCAL_SEM_IDENTIDADE.md)
- [Matriz de rastreabilidade](docs-tecnicos/MATRIZ_DE_RASTREABILIDADE.md)

`../arquivos/`, `private/`, `exports/`, traces, logs, planilhas, DOCX e PDFs originais permanecem fora do Git e do bundle público.
