# Revisão de publicação das evidências

Data da revisão: 13/10/2026. Escopo: 13 capturas localizadas nas quatro execuções Q1.1 preservadas.

## Resultado

- 10 capturas da coleta final aprovadas e publicadas;
- 3 capturas de execuções de descoberta retidas por redundância e ausência na allowlist;
- nenhum dado pessoal, credencial, token, sessão, sistema interno ou documento reservado identificado nas dez imagens aprovadas;
- nenhum original privado foi alterado;
- as cópias públicas não receberam ocultação, pois não foi identificado conteúdo que exigisse saneamento;
- capturas candidatas a vários critérios foram vinculadas somente ao grupo Q1.1.

| ID | Arquivo público | Captura (UTC) | Origem pública | Vínculo | Decisão e justificativa |
|---|---|---|---|---|---|
| EV-Q11-001 | `ev-q11-001.png` | 2026-10-09 15:53:16 | Página inicial SEMA-MT | execução | Aprovado; registro inicial sem associação material a critério. |
| EV-Q11-002 | `ev-q11-002.png` | 2026-10-09 15:53:20 | Perguntas frequentes | Q1.1.10 | Aprovado; página pública e associação individual registrada no evento. |
| EV-Q11-003 | `ev-q11-003.png` | 2026-10-09 15:53:23 | Página inicial SEMA-MT | grupo Q1.1 | Aprovado; retorno de navegação, sem atribuição individual. |
| EV-Q11-004 | `ev-q11-004.png` | 2026-10-09 15:53:26 | Comitê do Programa REM | grupo Q1.1 | Aprovado; candidata a múltiplos critérios, mantida no grupo. |
| EV-Q11-005 | `ev-q11-005.png` | 2026-10-09 15:53:29 | Planos estaduais | grupo Q1.1 | Aprovado; candidata a múltiplos critérios, mantida no grupo. |
| EV-Q11-006 | `ev-q11-006.png` | 2026-10-09 15:53:32 | Projeto EVA | grupo Q1.1 | Aprovado; candidata a múltiplos critérios, mantida no grupo. |
| EV-Q11-007 | `ev-q11-007.png` | 2026-10-09 15:53:35 | Quem somos | Q1.1.1 | Aprovado; página pública e associação individual registrada no evento. |
| EV-Q11-008 | `ev-q11-008.png` | 2026-10-09 15:53:38 | Unidades administrativas | Q1.1.2 | Aprovado; página pública e associação individual registrada no evento. |
| EV-Q11-009 | `ev-q11-009.png` | 2026-10-09 15:53:41 | Atendimento ao cidadão | grupo Q1.1 | Aprovado; preservada sem conclusão sobre ausência de conteúdo. |
| EV-Q11-010 | `ev-q11-010.png` | 2026-10-09 15:53:44 | Página inicial SEMA-MT | grupo Q1.1 | Aprovado; retorno final sem atribuição individual. |

As URLs completas, hashes SHA-256, tamanhos e metadados técnicos públicos constam em `data/evidencias-publicas.json`. Caminhos privados não constam neste relatório nem no manifesto público.

## Controles aplicados

1. inspeção visual individual das dez candidatas da coleta final;
2. allowlist privada explícita em `private/aprovacao-evidencias.json`;
3. conferência do evento JSONL e do SHA-256 original;
4. cópia para `public/evidencias/Q1.1/<execução>/` e geração de miniatura separada;
5. verificação automatizada do hash de cada cópia e miniatura;
6. teste HTTP de imagem: status 200, `content-type: image/png` e 2.077.360 bytes na amostra EV-Q11-001;
7. inspeção do bundle para impedir PDF, DOCX, XLSX, JSONL, ZIP, log, trace e caminho absoluto.

As imagens comprovam a navegação técnica. Não comprovam atendimento, parcialidade ou não atendimento à norma.
