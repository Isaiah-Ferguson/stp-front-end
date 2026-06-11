import React from "react";

export default function StatCard({
  label,
  num,
  delta,
  deltaClass,
  className,
}: {
  label: string;
  num: React.ReactNode;
  delta?: React.ReactNode;
  deltaClass?: string;
  className?: string;
}) {
  return (
    <div className={`adm-stat ${className ?? ""}`.trim()}>
      <span className="label">{label}</span>
      <span className="num">{num}</span>
      {delta ? <span className={`delta ${deltaClass ?? ""}`.trim()}>{delta}</span> : null}
    </div>
  );
}
