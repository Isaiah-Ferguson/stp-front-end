"use client";

import React from "react";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

type Item = { initials: string; name: string; sub: string; badge?: { type: string; text: string } };

export default function PipelineList({ items, onSelect }: { items: Item[]; onSelect?: (i: Item) => void }) {
  const handleKey = (e: React.KeyboardEvent, item: Item) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(item);
    }
  };

  return (
    <div>
      {items.map((it) => (
        <div
          key={it.name}
          className="list-row focusable-row"
          role="button"
          tabIndex={0}
          onClick={() => onSelect?.(it)}
          onKeyDown={(e) => handleKey(e, it)}
          aria-label={`${it.name}, ${it.sub}. ${it.badge?.text ?? ""}"`}
        >
          <span className={`ss-avatar ${it.initials === "AT" ? "coordinator" : it.sub ? "teacher" : "admin"} sm`}>{it.initials}</span>
          <div className="grow">
            <div className="nm">{it.name}</div>
            <div className="sub">{it.sub}</div>
          </div>
          <span className="ss-badge">
            {it.badge?.type === "prospective" ? <Clock /> : it.badge?.type === "active" ? <CheckCircle2 /> : <AlertCircle />}
            {it.badge?.text}
          </span>
        </div>
      ))}
    </div>
  );
}
