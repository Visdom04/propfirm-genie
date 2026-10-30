// Answers must match the pipeline: daily check (.github/workflows/fineprint-starter.yml),
// two-check publish gate (gateVersion in lib/fineprint/diff.js), verdict rules (lib/fineprint/terms.js).
export function faqItems(firms) {
  return [
    {
      q: 'Where does this data come from?',
      a: "From each firm's own public rules, help-center and payout pages. We save a copy of every page once a day and compare it with the previous copy.",
    },
    {
      q: 'How do you know a change is real?',
      a: 'New wording has to appear on two checks in a row before it is published. Pages that fail to load, show a security check or come back cut short are skipped, so a broken download never counts as a change.',
    },
    {
      q: 'How quickly does a change show up?',
      a: 'Usually within two days. One daily check spots the new wording and the next one confirms it.',
    },
    {
      q: 'What do Better and Worse for traders mean?',
      a: 'Worse for traders means the rule got harder to pass or get paid under, like a lower daily loss limit or a higher profit target. Better for traders is the opposite. We only label a change when the sentence stays the same and exactly one number next to a known rule moves.',
    },
    {
      q: 'Why do some changes only say Changed?',
      a: 'The wording moved in a way we cannot score with certainty. Open the change to read the exact before and after text, then judge it yourself.',
    },
    {
      q: 'Which firms do you track?',
      a: firms.length ? `${firms.join(', ')}. More firms are added as their rules pages are verified.` : 'Firms are added as their rules pages are verified.',
    },
    {
      q: "Is this more accurate than the firm's own site?",
      a: "No. The firm's page is always the final word. Every change links to the page it came from so you can check it.",
    },
  ];
}

export function faqJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export default function FinePrintFaq({ items }) {
  return (
    <div className="fp-info">
      <section className="fp-faq" aria-labelledby="fp-faq-title">
        <h2 id="fp-faq-title" className="fp-h2">
          FAQ
        </h2>
        <div className="fp-faq-list">
          {items.map(item => (
            <details key={item.q} className="fp-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="fp-disclaimer" aria-labelledby="fp-disclaimer-title">
        <h2 id="fp-disclaimer-title">Disclaimer</h2>
        <p>
          Prop Firm Genie is not affiliated with any firm listed here. Changes are detected automatically from public
          pages and can be late, incomplete or wrong. Confirm every rule on the firm&apos;s own site before you buy a
          challenge. Nothing on this page is financial advice.
        </p>
      </section>
    </div>
  );
}
