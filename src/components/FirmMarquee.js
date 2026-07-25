'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { firms } from '@/data/firms';
import './FirmMarquee.css';

const CARD_GRADIENTS = [
  'linear-gradient(145deg, #1e1b4b 0%, #0f0a1e 100%)',
  'linear-gradient(145deg, #312e81 0%, #13102a 100%)',
  'linear-gradient(145deg, #4c1d95 0%, #1a0a2e 100%)',
  'linear-gradient(145deg, #1e3a5f 0%, #0a1628 100%)',
  'linear-gradient(145deg, #3730a3 0%, #151238 100%)',
  'linear-gradient(145deg, #5b21b6 0%, #1e3a8a 100%)',
  'linear-gradient(145deg, #134e4a 0%, #0a1f1e 100%)',
];

const CARD_GRADIENTS_GREEN = [
  'linear-gradient(145deg, #052e1f 0%, #0a0f0d 100%)',
  'linear-gradient(145deg, #064e3b 0%, #0a1410 100%)',
  'linear-gradient(145deg, #14532d 0%, #0a120e 100%)',
  'linear-gradient(145deg, #0f3d2e 0%, #0a1628 100%)',
  'linear-gradient(145deg, #166534 0%, #0a1410 100%)',
  'linear-gradient(145deg, #15803d 0%, #052e1f 100%)',
  'linear-gradient(145deg, #134e4a 0%, #0a1f1e 100%)',
];

function MarqueeCard({ firm, index, gradients }) {
  return (
    <article
      className="firm-marquee__card"
      style={{ '--card-bg': gradients[index % gradients.length] }}
      aria-label={`${firm.name}, ${firm.discount}`}
    >
      <span className="firm-marquee__card-bg" aria-hidden="true" />
      <span className="firm-marquee__discount">{firm.discount}</span>
      <span className="firm-marquee__logo-wrap">
        <Image
          src={firm.logo}
          alt=""
          width={96}
          height={96}
          className="firm-marquee__logo"
          draggable={false}
        />
      </span>
      <span className="firm-marquee__name">{firm.name}</span>
    </article>
  );
}

function MarqueeRow({ items, reverse = false, rowKey, gradients }) {
  const track = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="firm-marquee__row" aria-hidden="true">
      <div
        className={`firm-marquee__track${reverse ? ' firm-marquee__track--reverse' : ''}`}
        style={{ '--marquee-duration': reverse ? '52s' : '44s' }}
      >
        {track.map((firm, i) => (
          <MarqueeCard
            key={`${rowKey}-${firm.name}-${i}`}
            firm={firm}
            index={i}
            gradients={gradients}
          />
        ))}
      </div>
    </div>
  );
}

export default function FirmMarquee({ theme = 'purple' }) {
  const gradients = theme === 'green' ? CARD_GRADIENTS_GREEN : CARD_GRADIENTS;

  const marqueeFirms = useMemo(() => {
    const ranked = [...firms].sort((a, b) => b.rating - a.rating);
    return ranked.length >= 6 ? ranked : [...ranked, ...ranked].slice(0, 8);
  }, []);

  const rowA = useMemo(() => marqueeFirms.filter((_, i) => i % 2 === 0), [marqueeFirms]);
  const rowB = useMemo(() => marqueeFirms.filter((_, i) => i % 2 === 1), [marqueeFirms]);

  return (
    <div className="firm-marquee" aria-label="Featured prop firm logos">
      <div className="firm-marquee__fade firm-marquee__fade--left" aria-hidden="true" />
      <div className="firm-marquee__fade firm-marquee__fade--right" aria-hidden="true" />
      <MarqueeRow items={rowA} rowKey="a" gradients={gradients} />
      <MarqueeRow items={rowB} reverse rowKey="b" gradients={gradients} />
    </div>
  );
}
