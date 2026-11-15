/** Feynman's slash workflows (its `prompts/*.md`), offered as a selector in the composer. */
export const FEYNMAN_WORKFLOWS = [
  { name: "deepresearch", description: "Source-heavy investigation with citations" },
  { name: "lit", description: "Literature review" },
  { name: "review", description: "Critique with severity and revision plan" },
  { name: "audit", description: "Paper claims vs. public code" },
  { name: "replicate", description: "Replication plan" },
  { name: "recipe", description: "Ranked ML training recipes" },
  { name: "compare", description: "Source comparison matrix" },
  { name: "draft", description: "Paper-style draft from findings" },
  { name: "autoresearch", description: "Bounded experiment loop" },
  { name: "summarize", description: "Summarize a paper, repo or PDF" },
  { name: "log", description: "Durable session log" },
] as const;

/** The draft a workflow pick produces: its slash command, keeping any text already typed after a leading command. */
export function workflowDraft(name: string, current: string): string {
  const rest = current.replace(/^\/\S*\s*/, "");
  return `/${name} ${rest}`;
}
