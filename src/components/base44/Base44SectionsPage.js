'use client';

import TestimonialWall from '@/components/TestimonialWall';
import DemoFAQ from '@/components/DemoFAQ';
import DiscordCommunity from '@/components/DiscordCommunity';
import '@/components/DemoHero.css';

/**
 * Pixel-matched preview of the 3 /demo sections + Deep Space background.
 * Uses the same components/CSS as /demo (not the Tailwind port).
 *
 * Portable Base44 (React + Tailwind) copies live in /base44-handoff.
 */
export default function Base44SectionsPage({ discordUrl } = {}) {
  return (
    <div className="demo-page">
      <div className="demo-aura" aria-hidden="true" />
      <div className="demo-vignette" aria-hidden="true" />
      <div className="demo-stars" aria-hidden="true" />
      <div className="demo-grid" aria-hidden="true" />
      <div className="demo-orb demo-orb--1" aria-hidden="true" />
      <div className="demo-orb demo-orb--2" aria-hidden="true" />
      <div className="demo-orb demo-orb--3" aria-hidden="true" />

      <TestimonialWall />
      <DemoFAQ />
      <DiscordCommunity />
    </div>
  );
}
