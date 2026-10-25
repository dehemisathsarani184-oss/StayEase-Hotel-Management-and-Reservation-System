
import { useEffect, useState } from "react";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api/dashboard";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";

  // Prevent date changes caused by timezone conversion.
  const datePart = String(value).slice(0, 10);
  const parts = datePart.split("-");

  if (parts.length !== 3) return datePart;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError("");

        // Use the same sessionStorage key as AdminLogin.jsx.
        const token = sessionStorage.getItem(
          "stayease_admin_token"
        );

        if (!token) {
          throw new Error(
            "Admin login session not found. Please log in again."
          );
        }

        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            // The token may be missing, invalid, or expired.
            sessionStorage.removeItem("stayease_admin_token");
            sessionStorage.removeItem("stayease_admin_user");

            throw new Error(
              "Your admin session is invalid or expired. Please log in again."
            );
          }

          if (response.status === 403) {
            throw new Error(
              "Admin access only. Please sign in with an admin account."
            );
          }

          throw new Error(
            data.message || "Failed to load dashboard data."
          );
        }

        if (!data.success) {
          throw new Error(
            data.message || "Failed to load dashboard data."
          );
        }

        if (!cancelled) {
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);

        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load dashboard data. Please check the backend server."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    {
      title: "Total Bookings",
      value: dashboardData?.stats?.totalBookings ?? "—",
      description: "All reservations",
      icon: "▦",
    },
    {
      title: "Total Rooms",
      value: dashboardData?.stats?.totalRooms ?? "—",
      description: "Hotel room inventory",
      icon: "▤",
    },
    {
      title: "Available Rooms",
      value: dashboardData?.stats?.availableRooms ?? "—",
      description: "Rooms marked available",
      icon: "⇥",
    },
    {
      title: "Estimated Revenue",
      value:
        dashboardData?.stats?.estimatedRevenue != null
          ? formatCurrency(
              dashboardData.stats.estimatedRevenue
            )
          : "—",
      description: "Estimated booking value",
      icon: "¤",
    },
  ];

  const bookings = dashboardData?.recentBookings || [];

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">
            STAYEASE MANAGEMENT
          </p>

          <h1>Admin Dashboard</h1>

          <p className="dashboard-subtitle">
            Manage your hotel operations in one place.
          </p>
        </div>

        <div className="dashboard-admin">
          <div className="admin-avatar">A</div>

          <div>
            <strong>Administrator</strong>
            <span>Hotel Management</span>
          </div>
        </div>
      </header>

      {loading && (
        <p className="dashboard-subtitle">
          Loading dashboard data...
        </p>
      )}

      {error && (
        <div role="alert" className="dashboard-error">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      <section className="dashboard-stats">
        {stats.map((stat) => (
          <article
            className="dashboard-stat-card"
            key={stat.title}
          >
            <div className="stat-card-top">
              <span>{stat.title}</span>
              <span className="stat-icon">{stat.icon}</span>
            </div>

            <h2>
              {loading && !dashboardData ? "—" : stat.value}
            </h2>

            <p>{stat.description}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-content-card">
        <div className="dashboard-section-header">
          <div>
            <h2>Recent Bookings</h2>
            <p>
              Latest reservations made at your hotel.
            </p>
          </div>
        </div>

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Booking Reference</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan="6"
                    className="dashboard-empty"
                  >
                    Loading bookings...
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                bookings.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="dashboard-empty"
                    >
                      No bookings found.
                    </td>
                  </tr>
                )}

              {!loading &&
                bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.booking_reference}</td>

                    <td>{booking.full_name}</td>

                    <td>
                      {booking.room_number} —{" "}
                      {booking.type_name}
                    </td>

                    <td>{formatDate(booking.check_in)}</td>

                    <td>{formatDate(booking.check_out)}</td>

                    <td>
                      <span
                        className={`booking-status status-${String(
                          booking.booking_status
                        )
                          .toLowerCase()
                          .replace(/[^a-z0-9_-]/g, "")}`}
                      >
                        {String(booking.booking_status)
                          .replaceAll("_", " ")
                          .replace(/\b\w/g, (letter) =>
                            letter.toUpperCase()
                          )}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
