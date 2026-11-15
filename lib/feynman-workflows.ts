/** Feynman's slash workflows, offered as a selector in the composer. */
export const FEYNMAN_WORKFLOWS = [
  { name: "deepresearch", description: "Multi-agent deep research report" },
  { name: "lit", description: "Literature review" },
  { name: "review", description: "Simulated peer review" },
  { name: "audit", description: "Paper vs. codebase claims audit" },
  { name: "replicate", description: "Replicate an experiment" },
  { name: "compare", description: "Compare sources" },
  { name: "draft", description: "Draft a paper-style writeup" },
  { name: "autoresearch", description: "Autonomous experiment loop" },
  { name: "watch", description: "Recurring research watch" },
  { name: "summarize", description: "Summarize a paper or source" },
] as const;

/** The draft a workflow pick produces: its slash command, keeping any text already typed after a leading command. */
export function workflowDraft(name: string, current: string): string {
  const rest = current.replace(/^\/\S*\s*/, "");
  return `/${name} ${rest}`;
}
