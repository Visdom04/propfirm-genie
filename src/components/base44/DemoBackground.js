'use client';

/** Deep Space Oracle background — purple → blue aura, vignette, stars, grid, orbs */
export default function DemoBackground() {
  return (
    <>
      {/* Central purple → blue radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(
              ellipse 90% 62% at 42% 38%,
              rgba(91, 33, 182, 0.48) 0%,
              rgba(67, 56, 202, 0.28) 28%,
              rgba(30, 58, 138, 0.16) 52%,
              transparent 72%
            ),
            radial-gradient(
              ellipse 55% 42% at 62% 44%,
              rgba(59, 130, 246, 0.28) 0%,
              rgba(37, 99, 235, 0.1) 45%,
              transparent 68%
            )
          `,
        }}
        aria-hidden="true"
      />

      {/* Edge vignette */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            linear-gradient(
              90deg,
              rgba(5, 6, 15, 0.92) 0%,
              rgba(5, 6, 15, 0.25) 14%,
              transparent 32%,
              transparent 68%,
              rgba(5, 6, 15, 0.25) 86%,
              rgba(5, 6, 15, 0.92) 100%
            ),
            radial-gradient(
              ellipse 115% 95% at 50% 48%,
              transparent 32%,
              rgba(5, 6, 15, 0.55) 72%,
              rgba(5, 6, 15, 0.92) 100%
            )
          `,
        }}
        aria-hidden="true"
      />

      {/* Sparse star field */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-45"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 12% 18%, rgba(255, 255, 255, 0.55), transparent),
            radial-gradient(1px 1px at 28% 62%, rgba(255, 255, 255, 0.35), transparent),
            radial-gradient(1.5px 1.5px at 44% 24%, rgba(168, 85, 247, 0.45), transparent),
            radial-gradient(1px 1px at 58% 78%, rgba(255, 255, 255, 0.3), transparent),
            radial-gradient(1px 1px at 72% 34%, rgba(255, 255, 255, 0.4), transparent),
            radial-gradient(1.5px 1.5px at 84% 58%, rgba(96, 165, 250, 0.5), transparent),
            radial-gradient(1px 1px at 92% 14%, rgba(255, 255, 255, 0.35), transparent),
            radial-gradient(1px 1px at 8% 82%, rgba(255, 255, 255, 0.28), transparent),
            radial-gradient(1px 1px at 36% 88%, rgba(99, 102, 241, 0.4), transparent),
            radial-gradient(1px 1px at 66% 12%, rgba(255, 255, 255, 0.32), transparent)
          `,
        }}
        aria-hidden="true"
      />

      {/* Square grid */}
      <div
        className="b44-grid-mask pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.016) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.016) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      {/* Ambient orbs */}
      <div
        className="b44-orb-1 pointer-events-none absolute -top-[220px] -left-[260px] z-0 size-[720px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.32) 0%, transparent 68%)',
        }}
        aria-hidden="true"
      />
      <div
        className="b44-orb-2 pointer-events-none absolute -bottom-[140px] right-[100px] z-0 size-[560px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(88, 28, 135, 0.26) 0%, transparent 68%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-[40%] left-[55%] z-0 size-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
    </>
  );
}
