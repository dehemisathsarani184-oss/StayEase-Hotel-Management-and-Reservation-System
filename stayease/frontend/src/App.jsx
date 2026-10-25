
import { useState } from "react";

import Home from "./components/Home";
import About from "./components/About";
import Contact from "./components/Contact";
import Rooms from "./components/Rooms";
import Booking from "./components/Booking";
import AdminLogin from "./components/AdminLogin";

import Dashboard from "./pages/Dashboard";
import RoomManagement from "./pages/RoomManagement";
import RoomTypesManagement from "./pages/RoomTypesManagement";

import "./App.css";

const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "booking", label: "Rooms & Suites" },
  { id: "contact", label: "Contact" },
];

function App() {
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("stayease_admin_user") || "null"
      );
    } catch {
      return null;
    }
  });

  function navigateTo(nextPage) {
    setPage(nextPage);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Admin Login Protection
  if (
    page === "admin" ||
    page === "room-management" ||
    page === "room-types"
  ) {
    const token = sessionStorage.getItem("stayease_admin_token");

    if (!adminUser || !token || adminUser.role !== "admin") {
      return (
        <AdminLogin
          onLogin={(user) => setAdminUser(user)}
          onBack={() => navigateTo("home")}
        />
      );
    }

    // Admin Dashboard, Room Management and Room Types Management
    return (
      <div className="stayease-app">
        <div className="admin-topbar">
          <button
            className="admin-back-button"
            onClick={() => navigateTo("home")}
          >
            ← Back to Website
          </button>

          <button
            className="admin-back-button"
            onClick={() => {
              sessionStorage.removeItem("stayease_admin_token");
              sessionStorage.removeItem("stayease_admin_user");
              setAdminUser(null);
              navigateTo("admin");
            }}
          >
            Logout
          </button>
        </div>

        <div className="admin-page-navigation">
          <button
            className={`admin-page-button ${
              page === "admin" ? "active" : ""
            }`}
            onClick={() => navigateTo("admin")}
          >
            Dashboard
          </button>

          <button
            className={`admin-page-button ${
              page === "room-management" ? "active" : ""
            }`}
            onClick={() => navigateTo("room-management")}
          >
            Room Management
          </button>

          <button
            className={`admin-page-button ${
              page === "room-types" ? "active" : ""
            }`}
            onClick={() => navigateTo("room-types")}
          >
            Room Types Management
          </button>
        </div>

        {page === "admin" && <Dashboard />}

        {page === "room-management" && <RoomManagement />}

        {page === "room-types" && <RoomTypesManagement />}
      </div>
    );
  }

  // Customer Website
  return (
    <div className="stayease-app">
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigateTo("home")}
          aria-label="StayEase home"
        >
          <span className="brand-mark">S</span>
          <span className="brand-text">
            <strong>STAYEASE</strong>
            <small>YOUR TIME. YOUR SPACE.</small>
          </span>
        </button>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav className={`site-nav ${menuOpen ? "nav-open" : ""}`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${
                page === item.id ? "active" : ""
              }`}
              onClick={() => navigateTo(item.id)}
            >
              {item.label}
            </button>
          ))}

          <button
            className="nav-book-button"
            onClick={() => navigateTo("booking")}
          >
            Book Now <span>↗</span>
          </button>
        </nav>
      </header>

      {page === "home" && <Home onNavigate={navigateTo} />}

      {page === "about" && <About onNavigate={navigateTo} />}

      {page === "contact" && <Contact />}

      {page === "rooms" && <Rooms />}

      {page === "booking" && <Booking />}

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-column">
            <button
              className="brand footer-brand"
              onClick={() => navigateTo("home")}
            >
              <span className="brand-mark">S</span>
              <span className="brand-text">
                <strong>STAYEASE</strong>
                <small>YOUR TIME. YOUR SPACE.</small>
              </span>
            </button>

            <p>
              A welcoming hotel experience with thoughtful
              hospitality, elegant rooms and comfort in every detail.
            </p>
          </div>

          <div className="footer-column">
            <h3>Explore</h3>

            <p>
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("home");
                }}
              >
                Home
              </a>
            </p>

            <p>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("about");
                }}
              >
                About Us
              </a>
            </p>

            <p>
              <a
                href="#rooms"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("booking");
                }}
              >
                Rooms & Suites
              </a>
            </p>

            <p>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("contact");
                }}
              >
                Contact
              </a>
            </p>
          </div>

          
<div className="footer-column footer-contact">
  <h3>Contact & Information</h3>

  <a
    className="footer-contact-item"
    href="https://www.google.com/maps/search/?api=1&query=Old+Road+Colombo+03"
    target="_blank"
    rel="noreferrer"
  >
    <span className="footer-contact-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    </span>
    <span className="footer-contact-text">
      <strong>Our Location</strong>
      <span>Old Road, Colombo 03</span>
    </span>
  </a>

  <a
    className="footer-contact-item"
    href="mailto:stayease@gmail.com"
  >
    <span className="footer-contact-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    </span>
    <span className="footer-contact-text">
      <strong>Email Us</strong>
      <span>stayease@gmail.com</span>
    </span>
  </a>

  <a
    className="footer-contact-item"
    href="tel:0112563895"
  >
    <span className="footer-contact-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4c0 1-1 2-2 2C10 21 3 14 3 5c0-1 1-2 2-2Z" />
      </svg>
    </span>
    <span className="footer-contact-text">
      <strong>Call Us</strong>
      <span>011 256 3895</span>
    </span>
  </a>

  <p className="footer-contact-note">
    We're here to help make your stay special.
  </p>
</div>

        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} StayEase. All rights reserved.
          </span>
          <span>Comfort · Elegance · Hospitality</span>
        </div>

        <div className="footer-admin-link">
          <button onClick={() => navigateTo("admin")}>
            Admin Dashboard →
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
