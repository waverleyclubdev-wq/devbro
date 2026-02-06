import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers"; // <--- Import the provider we made

export const metadata: Metadata = {
  title: "DevBro",
  description: "Engineering Flex",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-white">
        {/* THIS IS THE MISSING PIECE */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}