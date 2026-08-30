"use client";

import { motion } from "framer-motion";
import {
  ArrowRightCircle,
  Fingerprint,
  LockKeyhole,
  Zap,
} from "lucide-react";
import Navbar from "./Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4";

export default function Hero() {
  return (
    <section
      className="relative w-full min-h-screen"
      style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
      }}
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      <div className="relative z-[1] flex min-h-screen flex-col">
        <Navbar />

        <div
          className="mx-auto w-full max-w-[1280px] px-5 sm:px-8"
          style={{ paddingTop: "clamp(40px, 8vw, 72px)" }}
        >
          <div className="max-w-[560px]">
            <motion.h1
              className="mb-6 text-[#192837]"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.65rem, 5vw, 3rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              <Zap
                size={24}
                color="#192837"
                className="relative -top-0.5 mr-1 inline align-middle"
              />
              Lock Down Your Passwords{" "}
              <LockKeyhole
                size={24}
                color="#192837"
                className="relative -top-0.5 mx-1 inline align-middle"
              />{" "}
              with Ironclad Security{" "}
              <Fingerprint
                size={24}
                color="#192837"
                className="relative -top-0.5 ml-1 inline align-middle"
              />
            </motion.h1>

            <motion.p
              className="mb-8 max-w-[560px] opacity-80"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                lineHeight: 1.65,
              }}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              Zero stress, total control. VaultShield keeps you covered with
              unbreakable storage, one-tap access, and pro-grade tools for your
              non-stop world.
            </motion.p>

            <motion.button
              type="button"
              className="flex min-w-[210px] items-center justify-between gap-8 rounded-[50px] px-6 py-[17px] font-semibold text-white transition-all"
              style={{
                background: "#7342E2",
                fontFamily: "var(--font-body)",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                boxShadow: "0 4px 24px rgba(115,66,226,0.28)",
              }}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              whileHover={{ scale: 1.04, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.96 }}
            >
              Get It Free
              <ArrowRightCircle size={20} />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
