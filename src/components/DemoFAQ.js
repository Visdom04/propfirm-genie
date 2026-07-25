'use client';

import { useId } from 'react';
import { SITE_URL } from '@/lib/brand';
import './DemoFAQ.css';

const FAQ_ITEMS = [
  {
    q: 'How fast are payouts?',
    a: 'Payout speed depends on the firm you choose. Prop Firm Wise surfaces each partner’s payout cadence up front — weekly, bi-weekly, or monthly — so you can match firms to how you actually trade and withdraw.',
  },
  {
    q: 'What is a prop firm?',
    a: 'A proprietary trading firm provides capital so you can trade their money instead of risking only your own. You typically pass an evaluation that proves risk discipline; if you meet the rules, you keep a share of profits while the firm carries most of the capital risk.',
  },
  {
    q: 'How does Prop Firm Wise pick a match?',
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
    a: 'No. Prop Firm Wise is a discovery and comparison layer. You open accounts and pay evaluation fees directly with the firms you choose. We don’t custody funds or place trades on your behalf.',
  },
];

export default function DemoFAQ() {
  const baseId = useId();

  return (
    <section className="demo-faq" id="faq" aria-labelledby="demo-faq-title">
      <div className="demo-faq__inner">
        <header className="demo-faq__head">
          <h2 id="demo-faq-title" className="demo-faq__title">
            Frequently Asked Questions?
          </h2>
          <p className="demo-faq__sub">
            We&apos;ve got <span className="demo-faq__sub-accent">answers</span>
          </p>
        </header>

        <div className="demo-faq__list">
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={item.q}
              className="demo-faq__item"
              name="demo-faq"
              open={index === 0}
            >
              <summary className="demo-faq__summary">
                <span className="demo-faq__q-text" id={`${baseId}-q-${index}`}>
                  {item.q}
                </span>
                <span className="demo-faq__toggle" aria-hidden="true">
                  <span className="demo-faq__toggle-icon" />
                </span>
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
          <a href={`${SITE_URL}/Support`} className="demo-faq__link">
            Open the help center
          </a>{' '}
          or compare live rules in the table above.
        </p>
      </div>
    </section>
  );
}
