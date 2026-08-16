"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let renderCounter = 0;

/**
 * Render a mermaid flowchart definition as inline SVG.
 *
 * @param props.definition - mermaid flowchart source text
 */
export function PermitFlow({ definition }: { definition: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        primaryColor: "#dbeafe",
        primaryBorderColor: "#2563eb",
        primaryTextColor: "#1e293b",
        lineColor: "#64748b",
        tertiaryColor: "#fee2e2",
      },
    });
    const id = `permit-flow-${++renderCounter}`;
    mermaid
      .render(id, definition)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch((e: unknown) => setError(String(e)));
  }, [definition]);

  if (error) {
    return <pre className="text-destructive text-sm whitespace-pre-wrap">{error}</pre>;
  }
  return <div ref={ref} className="overflow-x-auto" />;
}
