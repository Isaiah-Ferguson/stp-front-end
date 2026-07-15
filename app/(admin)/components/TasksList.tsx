"use client";

import React from "react";
import { Check } from "lucide-react";

type Task = { id: string; nm: string; sub: string; due: string; overdue?: boolean };

export default function TasksList({
  items,
  onComplete,
  completingId,
}: {
  items: Task[];
  onComplete?: (id: string) => void;
  completingId?: string | null;
}) {
  return (
    <div>
      {items.map((t) => {
        const busy = completingId === t.id;
        return (
          <div className="task-row" key={t.id} aria-label={`${t.nm}. ${t.sub}. Due: ${t.due}`}>
            <button
              className="ss-checkbox"
              aria-pressed={busy}
              aria-label={`Mark ${t.nm} done`}
              disabled={busy || !onComplete}
              onClick={() => onComplete?.(t.id)}
              style={busy ? { opacity: 0.5 } : undefined}
            >
              <Check />
            </button>
            <div className="grow">
              <div className="nm">{t.nm}</div>
              <div className="sub">{t.sub}</div>
            </div>
            <span className={`due${t.overdue ? " overdue" : ""}`}>{t.due}</span>
          </div>
        );
      })}
    </div>
  );
}
