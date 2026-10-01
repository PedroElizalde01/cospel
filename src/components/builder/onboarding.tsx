"use client";

import { useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = "cospel:onboarded";
const STEPS = [
  { target: "panel", text: "Edit your pass here." },
  { target: "preview", text: "Your Wallet preview updates instantly." },
  { target: "generate", text: "When you're ready, generate a pass or share the preview." },
];

/** Three lightweight coachmarks, shown once. */
export function Onboarding() {
  // Mounted only after the editor loads on the client, so localStorage is available.
  const [step, setStep] = useState<number | null>(() => {
    try {
      return localStorage.getItem(KEY) ? null : 0;
    } catch {
      return null;
    }
  });
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (step === null) return;
    const measure = () => {
      const el = [...document.querySelectorAll<HTMLElement>(`[data-onboarding="${STEPS[step].target}"]`)].find((e) => e.offsetParent !== null);
      setRect(el?.getBoundingClientRect() ?? null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step]);

  if (step === null) return null;
  const done = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setStep(null);
  };
  const s = STEPS[step];
  const W = 248;
  const pos = rect
    ? s.target === "generate"
      ? { top: rect.bottom + 10, left: Math.max(12, rect.right - W) }
      : s.target === "preview"
        ? { top: rect.top + 16, left: rect.left + rect.width / 2 - W / 2 }
        : { top: rect.top + 80, left: Math.min(rect.right + 12, window.innerWidth - W - 12) }
    : { bottom: 24, left: 12 };

  return (
    <div role="dialog" aria-label="Tip" className="fixed z-50 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl" style={{ width: W, ...pos }}>
      <p className="text-sm">{s.text}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground tabular-nums">{step + 1} of {STEPS.length}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="xs" onClick={done}>Skip</Button>
          <Button size="xs" onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : done())}>{step < STEPS.length - 1 ? "Next" : "Got it"}</Button>
        </div>
      </div>
    </div>
  );
}
