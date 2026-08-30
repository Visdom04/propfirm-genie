"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import VaultShieldLogo from "./Logo";
import MobileMenu from "./MobileMenu";

const NAV_LINKS = ["Vault", "Plans", "Install", "News", "Help"] as const;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/vaultshield" aria-label="VaultShield home">
          <VaultShieldLogo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link}
              href={link === "Plans" ? "/vaultshield/plans" : "#"}
              className="text-sm font-medium text-[#192837] opacity-80 transition-opacity hover:opacity-100"
            >
              {link}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
            style={{ background: "#7342E2" }}
          >
            Start For Free
          </button>
          <button
            type="button"
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "#F2F2EE", color: "#192837" }}
          >
            Sign In
          </button>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center md:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} color="#192837" />
        </button>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
