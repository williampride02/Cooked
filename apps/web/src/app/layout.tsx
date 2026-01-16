import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cooked - Hold Your Friends Accountable",
  description: "Get roasted when you fold. Stay accountable with your squad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
