'use client';

import { useId } from 'react';
import './DemoFAQ.css';

const FAQ_ITEMS = [
  {
    q: 'What is a prop firm?',
    a: 'A proprietary trading firm provides capital so you can trade their money instead of risking only your own. You typically pass an evaluation or challenge that proves risk discipline; if you meet the rules, you keep a share of profits while the firm carries most of the capital risk.',
  },
  {
    q: 'How does PropFirmGenie pick a match?',
    a: 'You tell us your budget, drawdown comfort, payout cadence, markets, and account size. We score firms against those preferences and surface options that fit — so you spend less time reading fine print and more time comparing real trade-offs.',
  },
  {
    q: 'Are your firm profiles and rankings unbiased?',
    a: 'We aggregate public rules, fees, and platform details and update them on a regular cadence. When we highlight a firm, it is based on fit to your filters and transparent criteria — not a hidden pay-to-rank list.',
  },
  {
    q: 'What is the difference between evaluation and funded?',
    a: 'Evaluation (or challenge) is the trial phase where you prove you can follow drawdown and consistency rules. Funded is the live allocation stage after you pass — payouts and scaling rules are spelled out in each firm’s doc; always verify on the firm’s official site before you buy.',
  },
  {
    q: 'Do you execute trades or hold my capital?',
    a: 'No. PropFirmGenie is a discovery and comparison layer. You open accounts and pay evaluation fees directly with the firms you choose. We don’t custody funds or place trades on your behalf.',
  },
  {
    q: 'How often is comparison data refreshed?',
    a: 'We aim to refresh listings and promo flags frequently as firms change rules and pricing. Markets move fast — double-check time-sensitive details (like discount codes) on the firm’s checkout page before you commit.',
  },
];

export default function DemoFAQ() {
  const baseId = useId();

  return (
    <section className="demo-faq" id="faq" aria-labelledby="demo-faq-title">
      <div className="demo-faq__inner">
        <header className="demo-faq__head">
          <p className="demo-faq__eyebrow">Questions</p>
          <h2 id="demo-faq-title" className="demo-faq__title">
            Straight answers, <span className="demo-faq__title-accent">no jargon wall</span>
          </h2>
          <p className="demo-faq__sub">
            The basics traders ask before choosing a challenge — in plain language, aligned with how you already filter firms on this page.
          </p>
        </header>

        <div className="demo-faq__list">
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={item.q}
              className="demo-faq__item"
              name="demo-faq"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <summary className="demo-faq__summary">
                <span className="demo-faq__q-text" id={`${baseId}-q-${index}`}>
                  {item.q}
                </span>
                <span className="demo-faq__chevron" aria-hidden="true" />
              </summary>
              <div
                className="demo-faq__panel"
                role="region"
                aria-labelledby={`${baseId}-q-${index}`}
              >
                <p className="demo-faq__a">{item.a}</p>
              </div>
            </details>
          ))}
        </div>

        <p className="demo-faq__footnote">
          Still stuck?{' '}
          <a href="#" className="demo-faq__link">
            Open the help center
          </a>{' '}
          or compare live rules in the table above.
        </p>
      </div>
    </section>
  );
}
