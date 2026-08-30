import type { Metadata } from "next";
import "./vaultshield.css";

export const metadata: Metadata = {
  title: "VaultShield | Lock Down Your Passwords with Ironclad Security",
  description:
    "Zero stress, total control. VaultShield keeps you covered with unbreakable storage, one-tap access, and pro-grade tools.",
};

export default function VaultShieldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://db.onlinewebfonts.com/c/04e6981992c0e2e7642af2074ebe3901?family=Helvetica+Now+Display+Bold"
      />
      <div className="vaultshield-root">{children}</div>
    </>
  );
}
