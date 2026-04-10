import Image from 'next/image';
import { firms } from '@/data/firms';
import './Hero.css';

/** Five recognizable firms for the glass showcase strip (order is intentional for visual balance). */
const HERO_SHOWCASE_SLUGS = [
  'The5%ers',
  'FundingPips',
  'Alpha Capital',
  'AquaFunded',
  'Blue Guardian',
];

const heroShowcaseFirms = HERO_SHOWCASE_SLUGS.map((name) => firms.find((f) => f.name === name)).filter(
  Boolean
);

const cards = [
  { id: 1, logo: '/firm/bg-partner.svg',          name: 'Blue Guardian', platform: 'MT5',      balance: '$53,897.78',  status: 'Evaluation', style: { top: '5%',  left: '2%'  }, delay: '0s'    },
  { id: 2, logo: '/firm/alpha-partner.svg',        name: 'Alpha Capital', platform: 'cTrader',  balance: '$199,027.50', status: 'Funded',     style: { top: '40%', left: '-1%' }, delay: '0.6s'  },
  { id: 3, logo: '/firm/funding-pips-partner.svg', name: 'FundingPips',   platform: 'cTrader',  balance: '$22,322.40',  status: 'Evaluation', style: { top: '72%', left: '4%'  }, delay: '1.2s'  },
  { id: 4, logo: '/firm/aquafunded-partner.svg',   name: 'Aqua Funded',   platform: 'DX Trade', balance: '$203,158.35', status: 'Funded',     style: { top: '3%',  right: '2%' }, delay: '0.3s'  },
  { id: 5, logo: '/firm/the-5-ers-partner.svg',    name: 'The5%ers',      platform: 'MT5',      balance: '$9,993.00',   status: 'Evaluation', style: { top: '42%', right: '0%' }, delay: '0.9s'  },
  { id: 6, logo: '/firm/brightfunded-partner.svg', name: 'BrightFunded',  platform: 'MT5',      balance: '$10,650.25',  status: 'Evaluation', style: { top: '70%', right: '3%' }, delay: '1.5s'  },
];

function FirmCard({ card }) {
  return (
    <div
      className="firm-card"
      style={{ ...card.style, animationDelay: card.delay }}
    >
      <span className={`firm-card__badge firm-card__badge--${card.status.toLowerCase()}`}>
        {card.status}
      </span>
      <div className="firm-card__body">
        <div className="firm-card__logo">
          <Image src={card.logo} alt={card.name} width={26} height={26} />
        </div>
        <div className="firm-card__info">
          <span className="firm-card__name">{card.name}</span>
          <span className="firm-card__platform">{card.platform}</span>
        </div>
        <div className="firm-card__balance">
          <span className="firm-card__balance-label">Balance:</span>
          <span className="firm-card__balance-value">{card.balance}</span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="hero-wrapper">
      <div className="hero container animate-fade">

        <div className="hero-content">
          <h1 className="hero-title">
            Compare the Best<br />
            <span className="hero-gradient-line">Prop Trading Firms</span>
            <span className="hero-title-suffix"> of 2026</span>
          </h1>
          <p className="hero-subtitle">One Place, One Hub, Infinite Possibilities.</p>
          <div className="hero-actions">
            <button className="hero-btn-primary">Get Started</button>
            <button className="hero-btn-secondary">Watch Video</button>
          </div>

          <div className="hero-partners-glass" aria-label="Featured prop trading firms">
            <span className="hero-partners-glass__label">Compare top firms</span>
            <div className="hero-partners-glass__inner">
              <div className="hero-partners-glass__logos">
                {heroShowcaseFirms.map((firm, i) => (
                  <div
                    key={firm.name}
                    className="hero-float-logo"
                    style={{
                      '--float-delay': `${i * 0.45}s`,
                      '--float-duration': `${3.2 + (i % 3) * 0.35}s`,
                    }}
                  >
                    <div className="hero-float-logo__halo" aria-hidden />
                    <div className="hero-float-logo__cell">
                      <Image
                        src={firm.logo}
                        alt={`${firm.name} logo`}
                        width={44}
                        height={44}
                        className="hero-float-logo__img"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          {cards.map(c => <FirmCard key={c.id} card={c} />)}
          <div className="hero-image-wrap">
            <Image
              src="/hero (1).png"
              alt="Trading dashboard"
              width={900}
              height={560}
              className="hero-image"
              priority
            />
          </div>
        </div>

      </div>
    </section>
  );
}
