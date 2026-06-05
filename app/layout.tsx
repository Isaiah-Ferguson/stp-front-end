import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shining Stars CRM",
  description:
    "Internal CRM for Shining Stars — a performing-arts nonprofit serving adults with developmental disabilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
