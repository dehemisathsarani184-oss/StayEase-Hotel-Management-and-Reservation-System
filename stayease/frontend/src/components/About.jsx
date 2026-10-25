function About({ onNavigate }) {
  return (
    <main className="inner-page about-page">
      {/* HERO */}
      <section className="inner-hero about-hero">
        <div className="about-hero-content">
          <p className="gold-eyebrow">OUR STORY</p>
          <h1>
            Hospitality with a
            <br />
            <span>personal touch.</span>
          </h1>
          <p>
            More than a place to stay — a place to feel welcome.
          </p>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="about-content">
        <div className="about-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=85"
            alt="Elegant hotel exterior and relaxing surroundings"
          />
          <div className="about-image-caption">
            <span className="about-caption-mark">S</span>
            <span>STAYEASE</span>
            <small>YOUR TIME. YOUR SPACE.</small>
          </div>
        </div>

        <div className="about-text">
          <p className="gold-eyebrow">WHO WE ARE</p>
          <h2>
            Welcome to <span>StayEase.</span>
          </h2>

          <p>
            StayEase is designed around a simple idea: every
            guest deserves a comfortable, welcoming and
            memorable experience.
          </p>

          <p>
            We believe a great stay is about more than a
            beautiful room. It is about feeling at ease from
            the moment you arrive, enjoying a peaceful
            environment and knowing that your comfort matters.
          </p>

          <p>
            Our approach combines elegant spaces, attentive
            hospitality and care for the little details that
            make each visit special. Whether you are planning
            a relaxing getaway or travelling for work, we aim
            to make your time with us effortless.
          </p>

          <button
            className="gold-button about-contact-button"
            onClick={() => onNavigate("contact")}
          >
            Contact Our Team <span>→</span>
          </button>
        </div>
      </section>

      {/* OUR PHILOSOPHY */}
      <section className="about-philosophy">
        <div className="about-section-heading">
          <p className="gold-eyebrow">THE STAYEASE DIFFERENCE</p>
          <h2>Hospitality in every <span>detail.</span></h2>
          <p>
            We want every guest to feel welcomed, cared for
            and comfortable throughout their stay.
          </p>
        </div>

        <div className="about-values">
          <article className="about-value-card">
            <span className="about-value-icon">✧</span>
            <span className="about-value-number">01</span>
            <h3>Comfort First</h3>
            <p>
              Relax in welcoming spaces designed to help you
              unwind and feel at home.
            </p>
          </article>

          <article className="about-value-card">
            <span className="about-value-icon">♡</span>
            <span className="about-value-number">02</span>
            <h3>Thoughtful Service</h3>
            <p>
              We value warm, respectful hospitality and care
              for the needs of every guest.
            </p>
          </article>

          <article className="about-value-card">
            <span className="about-value-icon">◇</span>
            <span className="about-value-number">03</span>
            <h3>Every Detail Matters</h3>
            <p>
              From the atmosphere to the little touches, we
              aim to make your stay feel special.
            </p>
          </article>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="about-closing">
        <div className="about-closing-content">
          <p className="gold-eyebrow">YOUR TIME. YOUR SPACE.</p>
          <h2>We look forward to welcoming you.</h2>
          <p>
            Let us help you find a comfortable place for your
            next stay.
          </p>

          <button
            className="gold-button"
            onClick={() => onNavigate("booking")}
          >
            Explore Our Rooms <span>↗</span>
          </button>
        </div>
      </section>
    </main>
  );
}

export default About;