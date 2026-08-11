import React from "react";
import Link from "next/link";

export default function Widget({
  id,
  title,
  icon,
  linkText,
  linkHref,
  action,
  children,
  bodyClass,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  linkText?: string;
  linkHref?: string;
  /** Optional control (e.g. a button) rendered at the right edge of the head. */
  action?: React.ReactNode;
  children: React.ReactNode;
  bodyClass?: string;
}) {
  return (
    <section className="widget" aria-labelledby={id}>
      <div className="widget-head">
        {icon}
        <h3 id={id}>{title}</h3>
        {linkText ? (
          <Link className="link" href={linkHref ?? "#"}>
            {linkText}
          </Link>
        ) : null}
        {action ? <div style={{ marginLeft: "auto" }}>{action}</div> : null}
      </div>
      <div className={`widget-body ${bodyClass ?? ""}`.trim()}>{children}</div>
    </section>
  );
}
