import type { StageStatusCount, StageTransition } from "./queries";

/**
 * Canonical chain role → SG PTW role model.
 * Source: potential_implementation/base-information.md §2
 * (Applicant/Closure Applicant → PTW User; Assessed/Approve → PTW Authority;
 * Acknowledge → supervisor persona; Closure Accept → PTW Authority by analogy).
 */
export const ROLE_MODEL: Record<string, string> = {
  Applicant: "PTW User",
  "Closure Applicant": "PTW User",
  Assessed: "PTW Authority",
  Approve: "PTW Authority",
  "Closure Accept": "PTW Authority",
  Acknowledge: "Supervisor",
};

/** Lifecycle stages in chain order. */
export const STAGES = [
  "Applicant",
  "Assessed",
  "Acknowledge",
  "Approve",
  "Closure Applicant",
  "Closure Accept",
] as const;

/** Mermaid-safe node id for a stage name. */
function nodeId(stage: string): string {
  return stage.toLowerCase().replace(/[^a-z]+/g, "_");
}

/**
 * Build a mermaid flowchart definition of the PTW lifecycle from build-time
 * aggregation results. Nodes = canonical stages (annotated with the SG role
 * model persona + permits currently at that stage); edges = observed
 * transitions with counts; Rejected/Revoked = terminal nodes fed per-gate.
 *
 * @param transitions - observed consecutive-stage transition counts
 * @param stageStatus - (stage, status) counts locating permits in the lifecycle
 * @returns mermaid flowchart source text
 */
export function buildFlowDefinition(
  transitions: StageTransition[],
  stageStatus: StageStatusCount[],
): string {
  const atStage = new Map<string, number>();
  const rejectedAt = new Map<string, number>();
  const revokedAt = new Map<string, number>();
  let rejectedTotal = 0;
  let revokedTotal = 0;

  for (const row of stageStatus) {
    if (row.status.startsWith("Rejected")) {
      rejectedAt.set(row.stage, (rejectedAt.get(row.stage) ?? 0) + row.count);
      rejectedTotal += row.count;
    } else if (row.status === "Revoked") {
      revokedAt.set(row.stage, (revokedAt.get(row.stage) ?? 0) + row.count);
      revokedTotal += row.count;
    } else {
      atStage.set(row.stage, (atStage.get(row.stage) ?? 0) + row.count);
    }
  }

  const lines: string[] = ["flowchart LR"];

  for (const stage of STAGES) {
    const here = atStage.get(stage) ?? 0;
    const persona = ROLE_MODEL[stage] ?? stage;
    lines.push(
      `  ${nodeId(stage)}["${stage}<br/><small>${persona} · ${here.toLocaleString()} here</small>"]`,
    );
  }
  lines.push(`  rejected(["Rejected (any gate)<br/><small>${rejectedTotal.toLocaleString()}</small>"])`);
  lines.push(`  revoked(["Revoked<br/><small>${revokedTotal.toLocaleString()}</small>"])`);

  for (const t of transitions) {
    lines.push(`  ${nodeId(t.from)} -->|${t.count.toLocaleString()}| ${nodeId(t.to)}`);
  }
  for (const [stage, count] of rejectedAt) {
    lines.push(`  ${nodeId(stage)} -.->|${count.toLocaleString()}| rejected`);
  }
  for (const [stage, count] of revokedAt) {
    lines.push(`  ${nodeId(stage)} -.->|${count.toLocaleString()}| revoked`);
  }

  return lines.join("\n");
}

/** Plain-English explainer per lifecycle stage, grounded in observed data. */
export const STAGE_EXPLANATIONS: { stage: string; persona: string; text: string }[] = [
  {
    stage: "Applicant",
    persona: "PTW User",
    text: "The PTW User submits the application: work description, contractor, dates, and evidence (checklists/attachments). First trail entry of every permit.",
  },
  {
    stage: "Assessed",
    persona: "PTW Authority",
    text: "An assessor reviews the application against the RA and method statement. Rejection here lands the permit in 'Rejected(Assessor)'.",
  },
  {
    stage: "Acknowledge",
    persona: "Supervisor",
    text: "The supervisor / in-charge acknowledges the assessed permit, accepting site responsibility. Rejection here → 'Rejected(In Charge)' — the most common rejection gate (224 permits).",
  },
  {
    stage: "Approve",
    persona: "PTW Authority",
    text: "The approver grants the permit; work may start. Live permits carry status 'Approved(Approver)' (569 currently).",
  },
  {
    stage: "Closure Applicant",
    persona: "PTW User",
    text: "After the work, the applicant declares completion. Permits waiting here hold status 'Applicant - Works completion' — the largest group in the archive (1,698).",
  },
  {
    stage: "Closure Accept",
    persona: "PTW Authority",
    text: "The approver accepts the closure — the only 'done' terminal BES records, status 'Closure Accepted(Approver)' (25 permits).",
  },
  {
    stage: "Terminal states",
    persona: "—",
    text: "Rejected at any gate (381 total) and Revoked (15) are terminal. 168 permits carry status 'Inspector' — a state with no matching trail role, a BES data quirk.",
  },
];
