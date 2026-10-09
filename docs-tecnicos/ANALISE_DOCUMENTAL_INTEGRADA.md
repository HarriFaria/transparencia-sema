# Análise documental integrada

## Escopo efetivamente processado

Foram inventariados **16 arquivos**: 14 PDFs (**251 páginas processadas**), uma planilha XLSX e um roteiro DOCX. Os 251 extratos de páginas PDF foram gravados individualmente em `private/analise-documental/`. OCR local foi executado nas páginas PDF com menos de 150 caracteres extraídos: página 2 do arquivo nomeado `Decreto 1973-2013.pdf` e páginas 1 e 3 de `Pedido de informação - fluxo e prazos.pdf`.

A planilha foi lida célula a célula, inclusive fórmulas, valores em cache e estilos. A aba principal contém 73 critérios válidos nas linhas 2–74 e um exemplo na linha 75, excluído. As fórmulas da aba Resumo usam exatamente `$2:$74` e calculam atendimento como `Atendidos / total`; itens parciais não entram no numerador. As 26 linhas da aba Instruções foram preservadas no extrato privado.

O roteiro contém 115 parágrafos, 3 tabelas de separação por questão, nenhum arquivo de mídia incorporado e **66 parágrafos numerados**, organizados em 17 itens. As propriedades internas declaram uma página e zero palavras; esse metadado é incompatível com a estrutura extraída e não foi tratado como paginação confiável.

## Confirmações e divergências críticas

- **PTA/Quadro 1:** o PDF `Unidade_NGER_PTA_PTA 2026 COMPLETO.pdf` tem 87 páginas e contém, nas páginas PDF 68–69, a ação de fortalecimento da transparência, o produto “Portal da Transparência mantido” e o responsável citado no roteiro. Não foi localizado um elemento ou texto literalmente rotulado “Quadro 1”; portanto, não se afirma que o arquivo contenha o Quadro 1 mencionado.
- **Processo:** a página 1 do voto-vista confirma expressamente `PROCESSO Nº 7.810-7/2022`; a associação com o nome de arquivo `78107-2022` foi confirmada pelo conteúdo, não pela semelhança gráfica.
- **Arquivo “Decreto 1973-2013”:** seu conteúdo é o Decreto nº 397, de 11/03/2020, que altera o Decreto nº 1.973/2013. O Decreto nº 806/2021 registra, na página 19, a revogação do Decreto nº 1.973/2013. O nome do arquivo não descreve corretamente o ato principal nele contido.
- **Regimento:** o Decreto nº 1.599/2025 apresenta a Unidade Estratégica de Transparência e Geoinformação na estrutura (p. 3) e o art. 19 nas páginas 14–15, incluindo supervisão do Portal e coordenação dos procedimentos de implementação da LAI.
- **Documentos metodológicos ausentes:** não foram localizados entre os 16 originais o `Relatório de Visão Geral do Objeto` nem a `Matriz de Planejamento`, embora sejam mencionados na planilha e no roteiro.

## Achados documentais — não são achados de fiscalização de 2026

- Os Ofícios 50–53/2023 são pedidos de informação e antecedentes. Eles não demonstram, por si, publicação ou ausência atual no portal.
- O voto-vista de 21/06/2023 registra discussão sobre informações de convênios e recomendações de transparência relacionadas ao exercício de 2021. Isso é antecedente, não conclusão atual.
- O Decreto nº 1.691/2025 exige PDA por órgão e publicação dos dados abertos na plataforma estadual e do PDA no sítio institucional (p. 3).
- A Lei nº 10.650/2003 trata do acesso a documentos/processos ambientais e exige relatórios anuais de qualidade do ar e da água (p. 2).
- O material “Pedido de informação — fluxo e prazos” cita o Decreto nº 1.973/2013, mas o acervo também contém o Decreto nº 806/2021, que registra sua revogação; o material deve ser tratado como potencialmente desatualizado até validação institucional.

## Pendências documentais reais

As seguintes normas citadas na matriz não foram fornecidas como originais: Lei nº 13.460/2017, Lei nº 12.651/2012, Lei nº 9.985/2000, LC Estadual nº 38/1995, Lei nº 9.433/1997, LC nº 140/2011 e Lei nº 13.709/2018. Há atos correlatos no acervo para alguns grupos, mas eles não substituem automaticamente o texto normativo citado. A matriz registra esses casos como `a_verificar`.

## Separação entre documentação e fiscalização

Nenhuma coleta atual em portal foi executada nesta etapa documental. Não existem resultados aprovados, percentuais de conformidade, data de última coleta ou conclusões de atendimento. `data/resultados-publicados.json` permanece um array vazio.
