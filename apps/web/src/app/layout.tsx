import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cooked - Hold Your Friends Accountable",
  description: "Get roasted when you fold. Stay accountable with your squad.",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params?: Promise<Record<string, string | string[]>>;
}>) {
  // Unwrap params if provided to avoid React DevTools warnings
  // Even though we don't use it, unwrapping prevents serialization issues
  if (params) {
    await params;
  }

  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
