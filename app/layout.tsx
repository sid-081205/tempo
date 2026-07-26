import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tempo. Your schedule affects your health.",
  description:
    "Tempo is a personal AI agent that connects your calendar and your health data, and shows you what your week is doing to your body.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${grotesk.variable} antialiased`}>{children}</body>
    </html>
  );
}
