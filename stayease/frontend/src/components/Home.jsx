
function Home({ onNavigate }) {
  return (
    <main className="home-page">
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <p className="gold-eyebrow">WELCOME TO STAYEASE</p>

          <h1>
            Where Luxury
            <br />
            Meets <span>Serenity.</span>
          </h1>

          <p className="hero-description">
            Discover a more beautiful way to stay.
            Experience thoughtful hospitality, elegant spaces
            and unforgettable moments.
          </p>

          <div className="hero-actions">
            <button
              className="gold-button"
              onClick={() => onNavigate("booking")}
            >
              Explore Our Rooms ↗
            </button>

            <button
              className="outline-button"
              onClick={() => onNavigate("about")}
            >
              Discover StayEase
            </button>
          </div>
        </div>

        <div className="hero-bottom-label">
          <span>COMFORT</span>
          <span className="gold-dot">◆</span>
          <span>ELEGANCE</span>
          <span className="gold-dot">◆</span>
          <span>EXCEPTIONAL SERVICE</span>
        </div>
      </section>

      {/* WELCOME */}
      <section className="home-welcome">
        <div className="home-welcome-image"></div>

        <div className="home-welcome-content">
          <p className="gold-eyebrow">YOUR COMFORT, OUR PRIORITY</p>
          <h2>A stay that feels <span>special.</span></h2>

          <p>
            At StayEase, every detail is designed to make your
            stay comfortable, relaxing and memorable. From
            thoughtfully designed spaces to warm hospitality,
            discover a place where you can truly unwind.
          </p>

          <button
            className="text-link-button"
            onClick={() => onNavigate("about")}
          >
            DISCOVER OUR STORY ↗
          </button>
        </div>
      </section>

      {/* FEATURED ROOMS */}
      <section className="home-rooms">
        <div className="home-section-heading">
          <p className="gold-eyebrow">REST IN COMFORT</p>
          <h2>Rooms & <span>Suites</span></h2>
          <p>
            Find your perfect space to relax, recharge and
            enjoy your stay.
          </p>
        </div>

        <div className="home-room-grid">
          <article className="home-room-card">
            <div className="home-room-image standard-room">
              <span>COMFORT COLLECTION</span>
            </div>
            <div className="home-room-info">
              <h3>Standard Room</h3>
              <p>
                A welcoming space with essential comforts for
                a relaxing stay.
              </p>
              <button onClick={() => onNavigate("booking")}>
                Explore Room ↗
              </button>
            </div>
          </article>

          <article className="home-room-card">
            <div className="home-room-image deluxe-room">
              <span>REFINED LIVING</span>
            </div>
            <div className="home-room-info">
              <h3>Deluxe Room</h3>
              <p>
                Enjoy a little more space, style and comfort
                during your visit.
              </p>
              <button onClick={() => onNavigate("booking")}>
                Explore Room ↗
              </button>
            </div>
          </article>

          <article className="home-room-card">
            <div className="home-room-image suite-room">
              <span>EXCLUSIVE COMFORT</span>
            </div>
            <div className="home-room-info">
              <h3>Luxury Suite</h3>
              <p>
                Unwind in an elegant setting made for a
                memorable getaway.
              </p>
              <button onClick={() => onNavigate("booking")}>
                Explore Room ↗
              </button>
            </div>
          </article>
        </div>

        <button
          className="gold-button home-all-rooms"
          onClick={() => onNavigate("booking")}
        >
          View Rooms & Book ↗
        </button>
      </section>

      {/* HOTEL EXPERIENCE */}
      <section className="home-experience">
        <div className="home-section-heading">
          <p className="gold-eyebrow">THE STAYEASE EXPERIENCE</p>
          <h2>More than just a <span>stay.</span></h2>
          <p>
            Thoughtful details that make every visit feel
            effortless.
          </p>
        </div>

        <div className="home-experience-grid">
          <article className="home-experience-card">
            <span className="experience-number">01</span>
            <h3>Elegant Spaces</h3>
            <p>
              Relax in carefully designed spaces that bring
              together style, warmth and comfort.
            </p>
          </article>

          <article className="home-experience-card">
            <span className="experience-number">02</span>
            <h3>Personal Hospitality</h3>
            <p>
              Enjoy a welcoming experience with attention to
              the details that matter to you.
            </p>
          </article>

          <article className="home-experience-card">
            <span className="experience-number">03</span>
            <h3>Moments to Remember</h3>
            <p>
              Make space for rest, connection and memorable
              moments throughout your stay.
            </p>
          </article>
        </div>
      </section>

      {/* BOOKING CTA */}
      <section className="home-booking-cta">
        <p className="gold-eyebrow">YOUR NEXT ESCAPE STARTS HERE</p>
        <h2>Make room for something wonderful.</h2>
        <p>
          Your comfortable stay is just a few steps away.
        </p>

        <button
          className="gold-button"
          onClick={() => onNavigate("booking")}
        >
          Plan Your Stay ↗
        </button>
      </section>
    </main>
  );
}

export default Home;
