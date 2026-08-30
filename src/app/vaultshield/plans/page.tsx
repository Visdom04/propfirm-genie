"use client";

import { motion } from "framer-motion";
import { Check, Shield, Star, Zap } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/vaultshield/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Essential protection for personal use.",
    features: [
      "Unlimited passwords",
      "1 device sync",
      "Secure notes",
      "Password generator",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/month",
    description: "Full security suite for power users.",
    features: [
      "Everything in Free",
      "Unlimited devices",
      "Biometric unlock",
      "Dark web monitoring",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Family",
    price: "$9.99",
    period: "/month",
    description: "Protect up to 6 family members.",
    features: [
      "Everything in Pro",
      "6 premium accounts",
      "Shared vaults",
      "Family admin dashboard",
      "Emergency access",
    ],
    cta: "Protect Your Family",
    highlighted: false,
  },
] as const;

export default function PlansPage() {
  return (
    <div
      className="relative min-h-screen"
      style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
        background: "linear-gradient(180deg, #F2F2EE 0%, #E8E4E1 100%)",
      }}
    >
      <Navbar />

      <main className="mx-auto w-full max-w-[1280px] px-5 pb-20 sm:px-8">
        <motion.div
          className="mx-auto max-w-[640px] text-center"
          style={{ paddingTop: "clamp(48px, 8vw, 80px)" }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-sm font-medium">
            <Star size={14} color="#7342E2" fill="#7342E2" />
            Simple, transparent pricing
          </div>

          <h1
            className="mb-5 text-[#192837]"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            Plans That Scale With Your Security Needs
          </h1>

          <p
            className="opacity-80"
            style={{
              fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
              lineHeight: 1.65,
            }}
          >
            Start free and upgrade when you&apos;re ready. Every plan includes
            military-grade encryption and zero-knowledge architecture.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan, index) => (
            <motion.article
              key={plan.name}
              className="relative flex flex-col rounded-3xl p-8"
              style={{
                background: plan.highlighted ? "#192837" : "#FFFFFF",
                color: plan.highlighted ? "#FFFFFF" : "#192837",
                boxShadow: plan.highlighted
                  ? "0 24px 64px rgba(25,40,55,0.22)"
                  : "0 8px 32px rgba(25,40,55,0.08)",
              }}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={index + 1}
            >
              {plan.highlighted && (
                <span
                  className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ background: "#7342E2" }}
                >
                  <Zap size={12} fill="white" />
                  Most Popular
                </span>
              )}

              <div className="mb-6 flex items-center gap-2">
                <Shield
                  size={20}
                  color={plan.highlighted ? "#7342E2" : "#7342E2"}
                />
                <h2 className="text-lg font-semibold">{plan.name}</h2>
              </div>

              <div className="mb-2 flex items-baseline gap-1">
                <span
                  className="font-bold"
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(2rem, 4vw, 2.5rem)",
                  }}
                >
                  {plan.price}
                </span>
                <span className="text-sm opacity-70">{plan.period}</span>
              </div>

              <p className="mb-8 text-sm opacity-70">{plan.description}</p>

              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0"
                      color={plan.highlighted ? "#7342E2" : "#7342E2"}
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="w-full rounded-full py-3 text-sm font-semibold transition-all hover:scale-[1.02]"
                style={
                  plan.highlighted
                    ? {
                        background: "#7342E2",
                        color: "#FFFFFF",
                        boxShadow: "0 4px 24px rgba(115,66,226,0.35)",
                      }
                    : {
                        background: "#F2F2EE",
                        color: "#192837",
                      }
                }
              >
                {plan.cta}
              </button>
            </motion.article>
          ))}
        </div>

        <motion.p
          className="mt-12 text-center text-sm opacity-60"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
        >
          All plans include a 30-day money-back guarantee.{" "}
          <Link
            href="/vaultshield"
            className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ color: "#7342E2" }}
          >
            Back to home
          </Link>
        </motion.p>
      </main>
    </div>
  );
}
