export interface DiscoveredLink { texto: string; url: string; criterios: string[]; motivo: string; }

const rules = [
  { ids: ["Q1.1.1"], words: ["competência", "quem somos", "institucional"] },
  { ids: ["Q1.1.2"], words: ["estrutura", "organograma", "unidades administrativas"] },
  { ids: ["Q1.1.3", "Q1.1.4", "Q1.1.5"], words: ["contato", "fale conosco", "atendimento", "ouvidoria"] },
  { ids: ["Q1.1.6", "Q1.1.7", "Q1.1.8", "Q1.1.9"], words: ["programa", "ação", "projeto", "obra", "planos estaduais"] },
  { ids: ["Q1.1.10"], words: ["perguntas frequentes", "faq"] },
];

function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim(); }
function containsTerm(searchable: string, term: string) {
  const escaped = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(searchable);
}

export function classifyLinks(links: Array<{ texto: string; url: string }>): DiscoveredLink[] {
  const unique = new Map<string, DiscoveredLink>();
  for (const link of links) {
    const searchable = normalize(`${link.texto} ${link.url}`);
    const matched = rules.filter((rule) => rule.words.some((word) => containsTerm(searchable, word)));
    if (!matched.length) continue;
    const criteria = [...new Set(matched.flatMap((rule) => rule.ids))];
    const motives = matched.flatMap((rule) => rule.words.filter((word) => containsTerm(searchable, word)));
    const key = `${link.url}|${criteria.join(",")}`;
    if (!unique.has(key)) unique.set(key, { texto: link.texto.trim() || "link sem texto", url: link.url, criterios: criteria, motivo: `Termos observados: ${[...new Set(motives)].join(", ")}` });
  }
  return [...unique.values()].sort((a, b) => a.url.localeCompare(b.url));
}
