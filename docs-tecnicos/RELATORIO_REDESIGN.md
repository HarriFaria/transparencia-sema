# Relatório do redesenho

Data: 13/10/2026.

## Resultado entregue

O frontend foi reconstruído como relatório executivo de auditoria. A nova interface adota cabeçalho branco compacto, hero institucional, KPIs contidos, navegação por áreas, matriz densa e responsiva, detalhes rastreáveis e galeria real de capturas. O desenho foi inspirado na hierarquia do site de referência, sem importar seus 18 controles, percentuais, diagnósticos ou notas GUT.

O estado público permanece fiel à base: 73 critérios, 0 resultados finais validados, 0 atendidos, 0 parciais, 0 não atendidos e 73 não apurados.

## Rotas

Antes: `/`, `/resultados`, `/criterios`, 73 detalhes, `/roteiro`, `/documentos` e `/metodologia`.

Depois:

- `/`: visão executiva, seis KPIs, cobertura técnica e amostra de prints;
- `/criterios/`: matriz completa com busca, sete dimensões de filtro e ordenação;
- `/criterios/<id>/`: redação integral, fundamento, histórico, evidências e decisão;
- `/resultados/`: trilha técnica, galeria de dez capturas e lightbox;
- `/recomendacoes/`: estado vazio editorial, sem recomendações inventadas;
- `/metodologia/`: regras de interpretação e acesso secundário ao roteiro/documentos;
- `/roteiro/` e `/documentos/`: conteúdo metodológico preservado fora da home.

O export contém 82 páginas estáticas: a home, páginas editoriais e 73 detalhes de critério.

## Dados e evidências

- `scripts/preparar-evidencias-publicas.ts`: lê a allowlist privada, confere fonte/evento/hash, gera cópias e miniaturas e produz o manifesto público;
- `scripts/preparar-dados-publicos.ts`: valida 73/17/66 e 35/24/14, calcula indicadores e gera o snapshot sanitizado;
- `scripts/verificar-evidencias-publicas.ts`: confere arquivos declarados, referências e hashes;
- `scripts/verificar-publicacao.ts`: procura artefatos proibidos, caminhos internos e resultados finais indevidos;
- o build remoto consome somente dados e imagens versionados; não lê `private/` nem `../arquivos/`.

## QA visual e funcional

Capturas locais ignoradas pelo Git:

- `private/qa-redesign/homepage-desktop.png`;
- `private/qa-redesign/homepage-mobile.png`;
- `private/qa-redesign/matriz-desktop.png`;
- `private/qa-redesign/matriz-filtro-id.png`;
- `private/qa-redesign/matriz-mobile-filtrada.png`;
- `private/qa-redesign/criterio-detalhe.png`;
- `private/qa-redesign/evidencias-lightbox.png`.

Correções após a comparação visual: proteção da marca `SEMA‑MT` contra quebra no hífen; remoção do cabeçalho de tabela que interceptava “Ver detalhes”; busca exata para códigos completos, impedindo `Q1.1.1` de também retornar `Q1.1.10`.

Resultados da regressão em Chromium:

- 73 linhas/cartões na matriz;
- `Q3.4.4` retorna 1 registro;
- Questão 1 + coleta realizada retorna 10 registros;
- `Q1.1.1` em 390 px retorna somente 1 registro;
- lightbox abre, navega, fecha por Escape e carrega imagem 1280×4930;
- imagem amostrada responde HTTP 200 e `image/png`;
- zero erros de console e zero respostas HTTP 4xx/5xx nas rotas internas;
- zero overflow horizontal em 390 px na home e na matriz.

## Validações

| Verificação | Resultado |
|---|---|
| Integridade dos dados | aprovado: 73, 17, 66 e 35/24/14 |
| TypeScript | aprovado |
| Lint local | aprovado em 16 arquivos de aplicação |
| Testes | 9 aprovados, 0 falhas |
| Evidências públicas | 10 originais + 10 miniaturas, hashes aprovados |
| Build estático | aprovado, 82 páginas |
| Verificação do bundle | nenhum artefato restrito ou caminho interno |

## Comandos PowerShell

```powershell
npm.cmd ci
npm.cmd run prepare:public-evidence
npm.cmd run prepare:public-data
npm.cmd run validate:data
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run verify:public-evidence
npm.cmd run build
npm.cmd run verify:public
python -m http.server 4173 --directory out --bind 127.0.0.1
```

No checkout atual, o build local foi executado em cópia sanitizada no volume `D:` porque o Webpack não aceita a junção de `node_modules` cruzando volumes. A Vercel não herda essa limitação.
