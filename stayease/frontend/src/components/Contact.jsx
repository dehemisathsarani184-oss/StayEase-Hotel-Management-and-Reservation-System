
import { useState } from "react";

function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSubmitted(false);
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Frontend demo only; connect to the backend later.
    setSubmitted(true);

    setForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  }

  return (
    <main className="inner-page contact-page">
      {/* HERO */}
      <section className="inner-hero contact-hero">
        <div className="contact-hero-content">
          <p className="gold-eyebrow">WE ARE HERE FOR YOU</p>
          <h1>
            Let’s start a
            <br />
            <span>conversation.</span>
          </h1>
          <p>
            Questions about your stay? Need a little help
            planning your visit? We would love to hear from you.
          </p>
        </div>

        <div className="contact-hero-badge">
          <span>STAYEASE</span>
          <small>YOUR TIME. YOUR SPACE.</small>
        </div>
      </section>

      {/* CONTACT DETAILS + FORM */}
      <section className="contact-layout">
        <div className="contact-info">
          <p className="gold-eyebrow">GET IN TOUCH</p>
          <h2>We’re happy to <span>help.</span></h2>

          <p className="contact-intro">
            Every great stay begins with a warm welcome.
            Reach out to us with your questions, booking
            enquiries or special requests.
          </p>

          <a
            className="contact-detail"
            href="mailto:stayease@gmail.com"
          >
            <span className="contact-symbol">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </span>
            <span className="contact-detail-text">
              <strong>Email Us</strong>
              <span>stayease@gmail.com</span>
              <small>Send us your enquiries</small>
            </span>
            <span className="contact-arrow">↗</span>
          </a>

          <a
            className="contact-detail"
            href="https://www.google.com/maps/search/?api=1&query=Old+Road+Colombo+03"
            target="_blank"
            rel="noreferrer"
          >
            <span className="contact-symbol">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <span className="contact-detail-text">
              <strong>Our Location</strong>
              <span>Old Road, Colombo 03</span>
              <small>Find us on Google Maps</small>
            </span>
            <span className="contact-arrow">↗</span>
          </a>

          <a
            className="contact-detail"
            href="tel:0112563895"
          >
            <span className="contact-symbol">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 2-2Z" />
              </svg>
            </span>
            <span className="contact-detail-text">
              <strong>Call Our Team</strong>
              <span>011 256 3895</span>
              <small>For booking enquiries</small>
            </span>
            <span className="contact-arrow">↗</span>
          </a>

          <div className="contact-note">
            <span className="contact-note-icon">✦</span>
            <div>
              <strong>We're here to help.</strong>
              <p>
                Let us know how we can make your StayEase
                experience more comfortable.
              </p>
            </div>
          </div>
        </div>

        {/* MESSAGE FORM */}
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form-heading">
            <p className="gold-eyebrow">SEND AN ENQUIRY</p>
            <h2>Send us a message</h2>
            <p>
              Fill in the details below and tell us how we
              can assist you.
            </p>
          </div>

          <div className="contact-field">
            <label htmlFor="contact-name">Your name</label>
            <input
              id="contact-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-email">Email address</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-subject">Subject</label>
            <input
              id="contact-subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Booking enquiry, special request..."
              required
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-message">Your message</label>
            <textarea
              id="contact-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="How can we help you?"
              rows={5}
              required
            />
          </div>

          <button className="gold-button contact-submit" type="submit">
            Send Message <span>↗</span>
          </button>

          {submitted && (
            <p className="success-message" role="status">
              Thank you! Your demo submission was successful.
              Actual message delivery will be available after
              the backend is connected.
            </p>
          )}

          <p className="contact-form-footnote">
            <span>🔒</span> Your details are used for this
            enquiry in this demo.
          </p>
        </form>
      </section>

      {/* CLOSING STRIP */}
      <section className="contact-bottom">
        <p className="gold-eyebrow">YOUR TIME. YOUR SPACE.</p>
        <h2>We look forward to hearing from you.</h2>
        <p>StayEase — where every welcome feels personal.</p>
      </section>
    </main>
  );
}

export default Contact;
