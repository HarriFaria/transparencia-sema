import test from "node:test";
import assert from "node:assert/strict";
import { classifyLinks } from "../automacao/adaptadores/sema";

test("classifica fixture sem transformar descoberta em conclusão", () => {
  const result = classifyLinks([
    { texto: "Perguntas Frequentes", url: "https://www.sema.mt.gov.br/faq" },
    { texto: "Organograma", url: "https://www.sema.mt.gov.br/organograma" },
    { texto: "Notícias", url: "https://www.sema.mt.gov.br/noticias" },
    { texto: "Serviço de Informação ao Cidadão", url: "https://www.sema.mt.gov.br/informacao" },
  ]);
  assert.equal(result.length, 2);
  assert.equal(result.some((item) => item.criterios.includes("Q1.1.10")), true);
  assert.equal(result.some((item) => item.criterios.includes("Q1.1.2")), true);
  assert.equal(Object.prototype.hasOwnProperty.call(result[0], "resultado_final"), false);
  assert.equal(result.some((item) => item.texto.includes("Informação ao Cidadão")), false);
});
