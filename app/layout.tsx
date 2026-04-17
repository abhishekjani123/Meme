import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DANK MEME GENERATOR 9000",
  description: "Turn your tweets into absolute bangers. AI-powered dank meme creator.",
  openGraph: {
    title: "DANK MEME GENERATOR 9000",
    description: "Turn your tweets into absolute bangers",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
