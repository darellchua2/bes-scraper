import type { StageStatusCount, StageTransition } from "./queries";

/** Hidden inspection gate — "Assessed 2" in BES monthly safety reports. */
export const INSPECTOR_STAGE = "Assessed 2 (Inspector)";

/**
 * Canonical chain role → SG PTW role model.
 * Source: potential_implementation/base-information.md §2
 * (Applicant/Closure Applicant → PTW User; Assessed/Approve → PTW Authority;
 * Acknowledge → supervisor persona; Closure Accept → PTW Authority by analogy).
 * Inspector is not in the doc's mapper — BES never logs its trail steps — but
 * the Inspector/Rejected(Inspector) statuses prove the gate, and the monthly
 * safety report tracks it as "Assessed 2"; mapped to the WSHO persona.
 */
export const ROLE_MODEL: Record<string, string> = {
  Applicant: "PTW User",
  Assessed: "PTW Authority (Assessor)",
  [INSPECTOR_STAGE]: "WSHO (Inspector)",
  Acknowledge: "Supervisor (In Charge)",
  Approve: "PTW Authority (Approver)",
  "Closure Applicant": "PTW User",
  "Closure Accept": "PTW Authority",
};

/** Lifecycle stages in chain order. Assessed 2 is synthetic (status-derived). */
export const STAGES = [
  "Applicant",
  "Assessed",
  INSPECTOR_STAGE,
  "Acknowledge",
  "Approve",
  "Closure Applicant",
  "Closure Accept",
] as const;

/** Rejected-status → gate stage that issued the rejection. */
const REJECT_GATE: Record<string, string> = {
  "Rejected(Assessor)": "Assessed",
  "Rejected(Inspector)": INSPECTOR_STAGE,
  "Rejected(In Charge)": "Acknowledge",
  "Rejected(Approver)": "Approve",
};

/** Mermaid-safe node id for a stage name. */
function nodeId(stage: string): string {
  return stage.toLowerCase().replace(/[^a-z]+/g, "_");
}

/**
 * Build a mermaid flowchart definition of the PTW lifecycle from build-time
 * aggregation results. The chain is Applicant → Assessed → Inspector →
 * Acknowledge → Approve → Closure Applicant → Closure Accept: four approval
 * gates (Assessor, Inspector, In Charge, Approver), each with its own
 * Rejected terminal node. Trails never record Inspector steps, so its edges
 * are derived: Assessed→Inspector = observed Assessed→Acknowledge transitions
 * + permits currently at Inspector status + Rejected(Inspector) permits.
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
  const rejectedByStatus = new Map<string, number>();
  const revokedAt = new Map<string, number>();
  let revokedTotal = 0;
  let inspectorHere = 0;

  for (const row of stageStatus) {
    if (row.status === "Inspector") {
      inspectorHere += row.count; // status-only gate: trails say 'Assessed'
    } else if (row.status.startsWith("Rejected")) {
      rejectedByStatus.set(
        row.status,
        (rejectedByStatus.get(row.status) ?? 0) + row.count,
      );
    } else if (row.status === "Revoked") {
      revokedAt.set(row.stage, (revokedAt.get(row.stage) ?? 0) + row.count);
      revokedTotal += row.count;
    } else {
      atStage.set(row.stage, (atStage.get(row.stage) ?? 0) + row.count);
    }
  }

  // Observed pairs keyed "from->to"; Assessed→Acknowledge splits via Inspector.
  const pairCount = new Map<string, number>();
  for (const t of transitions) {
    pairCount.set(`${t.from}->${t.to}`, t.count);
  }
  const assessedToAck = pairCount.get(`Assessed->Acknowledge`) ?? 0;
  pairCount.delete("Assessed->Acknowledge");
  const rejectedInspector = rejectedByStatus.get("Rejected(Inspector)") ?? 0;
  pairCount.set(`Assessed->${INSPECTOR_STAGE}`, assessedToAck + inspectorHere + rejectedInspector);
  pairCount.set(`${INSPECTOR_STAGE}->Acknowledge`, assessedToAck);

  const lines: string[] = ["flowchart LR"];

  for (const stage of STAGES) {
    const here = stage === INSPECTOR_STAGE ? inspectorHere : (atStage.get(stage) ?? 0);
    const persona = ROLE_MODEL[stage] ?? stage;
    lines.push(
      `  ${nodeId(stage)}["${stage}<br/><small>${persona} · ${here.toLocaleString()} here</small>"]`,
    );
  }
  for (const status of Object.keys(REJECT_GATE)) {
    const count = rejectedByStatus.get(status) ?? 0;
    lines.push(`  ${nodeId(status)}(["${status}<br/><small>${count.toLocaleString()}</small>"])`);
  }
  lines.push(`  revoked(["Revoked<br/><small>${revokedTotal.toLocaleString()}</small>"])`);

  // Main chain in stage order (solid edges), then any leftover observed pairs.
  const emitted = new Set<string>();
  for (let i = 0; i < STAGES.length - 1; i++) {
    const key = `${STAGES[i]}->${STAGES[i + 1]}`;
    const count = pairCount.get(key);
    if (count) {
      lines.push(`  ${nodeId(STAGES[i])} -->|${count.toLocaleString()}| ${nodeId(STAGES[i + 1])}`);
      emitted.add(key);
    }
  }
  for (const [key, count] of pairCount) {
    if (emitted.has(key)) continue;
    const [from, to] = key.split("->");
    lines.push(`  ${nodeId(from)} -->|${count.toLocaleString()}| ${nodeId(to)}`);
  }
  for (const [status, gate] of Object.entries(REJECT_GATE)) {
    const count = rejectedByStatus.get(status) ?? 0;
    if (count) {
      lines.push(`  ${nodeId(gate)} -.->|${count.toLocaleString()}| ${nodeId(status)}`);
    }
  }
  for (const [stage, count] of revokedAt) {
    // ponytail: junk last roles ('-->') canon to 'Other' — no node exists, skip the edge; the count stays in the revoked total.
    if (stage === "Other") continue;
    lines.push(`  ${nodeId(stage)} -.->|${count.toLocaleString()}| revoked`);
  }

  return lines.join("\n");
}

/** Plain-English explainer per lifecycle stage, grounded in observed data. */
export const STAGE_EXPLANATIONS: { stage: string; persona: string; text: string }[] = [
  {
    stage: "Applicant",
    persona: "PTW User",
    text: "The PTW User submits the application: work description, contractor, dates, and evidence (checklists/attachments). First trail entry of every permit; 24 are waiting for a first review.",
  },
  {
    stage: "Assessed — gate 1",
    persona: "PTW Authority (Assessor)",
    text: "First approval level: an assessor reviews the application against the RA and method statement. Approve → inspection queue; reject → Rejected(Assessor) (46 permits).",
  },
  {
    stage: "Assessed 2 (Inspector) — gate 2",
    persona: "WSHO (Inspector)",
    text: "Second approval level: site inspection — the monthly safety report tracks it as 'Assessed 2'. BES never logs trail steps for this gate; it only exists in statuses: 168 permits are waiting here now and 111 were Rejected(Inspector).",
  },
  {
    stage: "Acknowledge — gate 3",
    persona: "Supervisor (In Charge)",
    text: "Third approval level: the supervisor / in-charge accepts site responsibility. Rejection here → Rejected(In Charge) — the most common rejection gate (224 permits).",
  },
  {
    stage: "Approve — gate 4",
    persona: "PTW Authority (Approver)",
    text: "Final approval level: the approver grants the permit and work may start. 569 permits are live with status Approved(Approver); only 1 permit was ever Rejected(Approver).",
  },
  {
    stage: "Closure Applicant",
    persona: "PTW User",
    text: "After the work, the applicant declares completion. Permits waiting here hold status 'Applicant - Works completion' — the largest group in the archive (1,698).",
  },
  {
    stage: "Closure Accept",
    persona: "PTW Authority",
    text: "The approver accepts the closure — the only 'done' terminal BES records, status 'Closure Accepted(Approver)' (25 permits). No closure rejection status exists in the data.",
  },
  {
    stage: "Terminal states",
    persona: "—",
    text: "Each of the four approval gates has its own rejection terminal: Assessor 46, Inspector 111, In Charge 224, Approver 1 (381 total). Revoked (15) can happen after approval. Permits can also be resubmitted after rejection, which is why transition counts exceed permit counts.",
  },
  {
    stage: "Monthly report enums",
    persona: "—",
    text: "BES's monthly safety report tracks 7 statuses: Submitted, Assessed, Assessed 2, Approved, Closed, Closure Accepted, Revoked. They map onto this chain: Assessed/Assessed 2 = gates 1–2, Approved = gate 4 passed, Closed = 'Applicant - Works completion', Closure Accepted/Revoked = terminals. The report shows no rejections — only the trail data reveals them.",
  },
];

/** Minimal permit shape for client-side flow computation (static JSON). */
export interface PermitLite {
  apply_id: number;
  applied_on: string; // YYYY-MM-DD
  status: string;
}

/** Minimal approval-step shape for client-side flow computation. */
export interface StepLite {
  apply_id: number;
  seq: number;
  role: string;
}

/** Suffix → canonical stage, mirroring CANON_ROLE_SQL in lib/queries.ts. */
const CANON_SUFFIXES: [string, string][] = [
  ["closure applicant", "Closure Applicant"],
  ["closure accept", "Closure Accept"],
  ["acknowledge", "Acknowledge"],
  ["assessed", "Assessed"],
  ["approve", "Approve"],
  ["applicant", "Applicant"],
];

/**
 * Map a raw (often name-prefixed) approval-step role to its canonical stage,
 * e.g. "MUHAMMAD ABDUL HALIM  Assessed" → "Assessed". Junk roles → "Other".
 */
export function canonStage(role: string): string {
  const r = role.trim().toLowerCase();
  for (const [suffix, label] of CANON_SUFFIXES) {
    if (r.endsWith(suffix)) return label;
  }
  return "Other";
}

/**
 * Compute the mermaid flow definition client-side from raw permits + steps,
 * restricted to permits applied within [from, to] (inclusive YYYY-MM-DD).
 * Mirrors getStageTransitions/getStageStatusCounts in lib/queries.ts.
 */
export function computeFlow(
  permits: PermitLite[],
  steps: StepLite[],
  from: string,
  to: string,
): string {
  const statusByPermit = new Map<number, string>();
  for (const p of permits) {
    if (p.applied_on >= from && p.applied_on <= to) {
      statusByPermit.set(p.apply_id, p.status);
    }
  }

  const stepsByPermit = new Map<number, StepLite[]>();
  for (const s of steps) {
    if (!statusByPermit.has(s.apply_id)) continue;
    const arr = stepsByPermit.get(s.apply_id);
    if (arr) arr.push(s);
    else stepsByPermit.set(s.apply_id, [s]);
  }

  const transitionCounts = new Map<string, number>();
  const stageStatusCounts = new Map<string, number>();
  for (const [pid, arr] of stepsByPermit) {
    arr.sort((a, b) => a.seq - b.seq);
    const canon = arr.map((s) => canonStage(s.role));
    for (let i = 0; i + 1 < canon.length; i++) {
      const f = canon[i];
      const t = canon[i + 1];
      if (f === "Other" || t === "Other" || f === t) continue;
      const key = `${f}|${t}`;
      transitionCounts.set(key, (transitionCounts.get(key) ?? 0) + 1);
    }
    const key = `${canon[canon.length - 1]}|${statusByPermit.get(pid)}`;
    stageStatusCounts.set(key, (stageStatusCounts.get(key) ?? 0) + 1);
  }

  const transitions: StageTransition[] = [...transitionCounts].map(([k, count]) => {
    const [from, to] = k.split("|");
    return { from, to, count };
  });
  const stageStatus: StageStatusCount[] = [...stageStatusCounts].map(([k, count]) => {
    const [stage, status] = k.split("|");
    return { stage, status, count };
  });
  return buildFlowDefinition(transitions, stageStatus);
}
