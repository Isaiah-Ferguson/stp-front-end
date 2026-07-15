import React from "react";
import Link from "next/link";

export default function Widget({
  id,
  title,
  icon,
  linkText,
  linkHref,
  children,
  bodyClass,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  linkText?: string;
  linkHref?: string;
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
      </div>
      <div className={`widget-body ${bodyClass ?? ""}`.trim()}>{children}</div>
    </section>
  );
}
