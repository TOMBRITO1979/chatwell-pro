import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Chatwell Pro - Sistema de Gestão Empresarial",
  description: "Sistema completo de gestão com agenda, clientes, projetos, finanças e muito mais",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={cn("font-sans min-h-screen bg-background antialiased")}>
        {children}
      </body>
    </html>
  );
}