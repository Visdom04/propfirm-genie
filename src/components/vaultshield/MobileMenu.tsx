"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import VaultShieldLogo from "./Logo";

const NAV_LINKS = ["Vault", "Plans", "Install", "News", "Help"] as const;

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              background: "rgba(25,40,55,0.35)",
              backdropFilter: "blur(4px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-dvh flex-col"
            style={{
              width: "min(88vw, 360px)",
              background: "#CFC8C5",
              boxShadow: "-12px 0 48px rgba(25,40,55,0.18)",
            }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <VaultShieldLogo />
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                aria-label="Close menu"
              >
                <X size={22} color="#192837" />
              </button>
            </div>

            <div className="mx-6 h-px bg-[#192837]/15" />

            <nav className="flex flex-1 flex-col gap-1 px-6 py-6">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.18 + i * 0.07,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={link === "Plans" ? "/vaultshield/plans" : "#"}
                    onClick={onClose}
                    className="block py-3 text-base font-medium text-[#192837] transition-opacity hover:opacity-70"
                  >
                    {link}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="flex flex-col gap-3 px-6 pb-8">
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
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
