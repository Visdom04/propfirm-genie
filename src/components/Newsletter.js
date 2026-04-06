import './Newsletter.css';

export default function Newsletter() {
  return (
    <section className="newsletter-section container">
      <div className="newsletter-card">
        <div className="newsletter-glow newsletter-glow--left"></div>
        <div className="newsletter-glow newsletter-glow--right"></div>

        <div className="newsletter-content">
          <span className="newsletter-label">STAY CONNECTED</span>
          <h2 className="newsletter-title">
            Subscribe For The Latest In Prop<br />Trading News And Deals
          </h2>
          <div className="newsletter-form">
            <input
              type="email"
              placeholder="Your email address"
              className="newsletter-input"
            />
            <button className="newsletter-btn">Subscribe</button>
          </div>
          <p className="newsletter-note">No spam, ever. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}
