"use client";

import React from "react";
import { Check } from "lucide-react";

type Task = { nm: string; sub: string; due: string; overdue?: boolean };

export default function TasksList({ items }: { items: Task[] }) {
  const handleKey = (e: React.KeyboardEvent, t: Task) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // placeholder for selection behaviour
      // console.log('activate', t.nm)
    }
  };

  return (
    <div>
      {items.map((t) => (
        <div
          className="task-row focusable-row"
          key={t.nm}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => handleKey(e, t)}
          aria-label={`${t.nm}. ${t.sub}. Due: ${t.due}`}
        >
          <button className="ss-checkbox" aria-pressed={false} aria-label={`Mark ${t.nm} done`}>
            <Check />
          </button>
          <div className="grow">
            <div className="nm">{t.nm}</div>
            <div className="sub">{t.sub}</div>
          </div>
          <span className={`due${t.overdue ? " overdue" : ""}`}>{t.due}</span>
        </div>
      ))}
    </div>
  );
}
