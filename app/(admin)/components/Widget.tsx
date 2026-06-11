import React from "react";

export default function Widget({
  id,
  title,
  icon,
  linkText,
  children,
  bodyClass,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  linkText?: string;
  children: React.ReactNode;
  bodyClass?: string;
}) {
  return (
    <section className="widget" aria-labelledby={id}>
      <div className="widget-head">
        {icon}
        <h3 id={id}>{title}</h3>
        {linkText ? (
          <a className="link" href="#">
            {linkText}
          </a>
        ) : null}
      </div>
      <div className={`widget-body ${bodyClass ?? ""}`.trim()}>{children}</div>
    </section>
  );
}
