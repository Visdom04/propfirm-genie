'use client';

import './DiscordCommunity.css';

const DISCORD_URL = '#';
/** Prefer PNG if you drop one later; SVG ships as the default logo. */
const DISCORD_IMAGE_SRC = '/discord-clyde.svg';

export default function DiscordCommunity() {
  return (
    <section className="discord-cta" id="discord" aria-labelledby="discord-cta-title">
      <div className="discord-cta__banner">
        <div className="discord-cta__content">
          <h2 id="discord-cta-title" className="discord-cta__title">
            Join Our Discord Community
          </h2>
          <p className="discord-cta__sub">
            Connect with thousands of traders in our free Discord community. Explore strategies,
            access free resources, and stay updated with the latest announcements.
          </p>
          <a href={DISCORD_URL} className="discord-cta__btn">
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

        <div className="discord-cta__art" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DISCORD_IMAGE_SRC} alt="" className="discord-cta__img" />
        </div>
      </div>
    </section>
  );
}
