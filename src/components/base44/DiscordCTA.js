'use client';

const DISCORD_URL = '#';
const DISCORD_IMAGE_SRC = '/discord-clyde.svg';

export default function DiscordCTA({ discordUrl = DISCORD_URL, imageSrc = DISCORD_IMAGE_SRC }) {
  return (
    <section
      className="b44-section-discord relative z-[2] w-full"
      id="discord"
      aria-labelledby="discord-cta-title"
    >
      <div className="b44-discord-banner b44-discord-in relative isolate w-full overflow-hidden rounded-[28px] px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_24px_56px_rgba(79,70,229,0.28),0_8px_20px_rgba(37,99,235,0.18)] sm:rounded-[32px] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: `
              radial-gradient(ellipse 55% 80% at 88% 50%, rgba(255, 255, 255, 0.22) 0%, transparent 60%),
              radial-gradient(ellipse 40% 60% at 12% 80%, rgba(37, 99, 235, 0.18) 0%, transparent 70%)
            `,
          }}
          aria-hidden="true"
        />

        <div className="relative z-[1] flex max-w-[34rem] flex-col items-start gap-4 sm:gap-5">
          <h2
            id="discord-cta-title"
            className="m-0 text-[clamp(1.65rem,3vw,2.6rem)] leading-[1.08] font-bold tracking-[-0.035em] text-[#0a0f24]"
          >
            Join Our Discord Community
          </h2>
          <p className="m-0 max-w-[42ch] text-[0.95rem] leading-[1.55] font-medium text-slate-900/80 sm:text-[1.02rem]">
            Connect with thousands of traders in our free Discord community. Explore strategies,
            access free resources, and stay updated with the latest announcements.
          </p>
          <a
            href={discordUrl}
            className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/8 bg-[#0a0f24] px-7 py-3.5 text-[0.82rem] font-bold tracking-[0.06em] text-white uppercase no-underline shadow-[0_8px_24px_rgba(10,15,36,0.28)] transition-[transform,box-shadow,background] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-gray-900 hover:shadow-[0_12px_32px_rgba(10,15,36,0.38)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0a0f24]"
          >
            Join Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        <div
          className="b44-discord-float pointer-events-none absolute -right-[12%] -bottom-[38%] z-[1] hidden aspect-square w-[min(48%,420px)] sm:block lg:-right-[8%] lg:w-[min(42%,460px)]"
          aria-hidden="true"
        >
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-contain object-center opacity-90 drop-shadow-[0_22px_48px_rgba(30,58,138,0.35)]"
          />
        </div>
      </div>
    </section>
  );
}
