"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Download a standalone HTML snapshot of the element with the given DOM id:
 * current rendered markup (charts included, as SVG) plus the app's built CSS
 * inlined into a <style> tag. Font files stay referenced by URL, so the file
 * renders best next to the out/ directory it was exported from.
 */
export function ExportHtmlButton({ targetId }: { targetId: string }) {
  const [busy, setBusy] = useState(false);

  /** Serialize the target element + inlined stylesheets and save as .html. */
  async function exportHtml() {
    const target = document.getElementById(targetId);
    if (!target) return;
    setBusy(true);
    try {
      const css = await Promise.all(
        [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((l) =>
          fetch(l.href).then((r) => r.text()),
        ),
      );
      const title = document.title || "BES Dashboard";
      const html = [
        "<!doctype html>",
        `<html lang="en"><head><meta charset="utf-8">`,
        `<meta name="viewport" content="width=device-width, initial-scale=1">`,
        `<title>${title}</title><style>${css.join("\n")}</style></head>`,
        `<body class="bg-background text-foreground">${target.outerHTML}</body></html>`,
      ].join("\n");
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bes-dashboard-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={exportHtml} disabled={busy}>
      {busy ? "Exporting…" : "Export HTML"}
    </Button>
  );
}
