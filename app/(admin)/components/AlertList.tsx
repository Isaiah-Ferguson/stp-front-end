import React from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

type AlertItem = {
  severity: "danger" | "warning" | "info";
  txt: string;
  sub: string;
  act: string;
  href: string;
};

export default function AlertList({ items }: { items: AlertItem[] }) {
  return (
    <div>
      {items.map((a) => {
        const Icon = a.severity === "danger" ? AlertCircle : a.severity === "warning" ? AlertTriangle : Info;
        const severityClass = a.severity === "danger" ? "ico--danger" : a.severity === "warning" ? "ico--warning" : "ico--info";
        return (
          <div
            className="alert-row"
            key={a.txt}
            aria-label={`${a.severity === "danger" ? "Urgent" : a.severity === "warning" ? "Warning" : "Info"}: ${a.txt}`}
          >
            <Icon className={`ico ${severityClass}`} aria-hidden="true" />
            <div className="body">
              <div className="txt">{a.txt}</div>
              <div className="sub">{a.sub}</div>
            </div>
            <Link className="act" href={a.href}>
              {a.act}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
