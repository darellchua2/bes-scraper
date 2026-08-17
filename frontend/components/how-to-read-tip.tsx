"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { STAGE_EXPLANATIONS } from "@/lib/flow";

/**
 * Info-icon tooltip holding the "How to read this diagram" stage explainers,
 * so the flow page keeps the guidance without a permanent card section.
 */
export function HowToReadTip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="How to read this diagram"
        >
          <Info className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-md">
          <div>
            <p className="mb-1 font-medium">How to read this diagram</p>
            <ul className="list-disc space-y-1 pl-4">
              {STAGE_EXPLANATIONS.map((s) => (
                <li key={s.stage}>
                  <strong>{s.stage}</strong> ({s.persona}) — {s.text}
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
