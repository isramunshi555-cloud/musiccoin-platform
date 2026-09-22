import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "MusicCoin | Decentralized Music Festival Platform",
  description: "Next-generation blockchain festival ecosystem: NFT ticketing, instant artist royalties, anti-scalping, and fan token economy on Polygon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased bg-neutral-950 text-neutral-100 min-h-screen flex flex-col selection:bg-purple-600 selection:text-white"
      >
        <WalletProvider>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
