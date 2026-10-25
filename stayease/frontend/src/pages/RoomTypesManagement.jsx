
import { useEffect, useState } from "react";
import "./RoomTypesManagement.css";

const API = "http://localhost:5000/api";

async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem("stayease_admin_token");

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const result = await response.json();

  if (response.status === 401) {
    throw new Error(
      result.message || "Session expired. Please log in again."
    );
  }

  if (response.status === 403) {
    throw new Error(result.message || "Admin access only.");
  }

  return { response, result };
}

const emptyForm = {
  type_name: "",
  description: "",
  capacity: "2",
  base_price: "",
};

function RoomTypesManagement() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadRoomTypes() {
    setLoading(true);
    setError("");

    try {
      const { response, result } = await apiFetch(`${API}/room-types`);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load room types");
      }

      setRoomTypes(result.data || []);
    } catch (err) {
      setError(err.message || "Cannot connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoomTypes();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function startEdit(roomType) {
    setForm({
      type_name: roomType.type_name || "",
      description: roomType.description || "",
      capacity: String(roomType.capacity ?? 2),
      base_price: String(roomType.base_price ?? ""),
    });

    setEditingId(roomType.id);
    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const capacity = Number(form.capacity);
    const basePrice = Number(form.base_price);

    if (!form.type_name.trim()) {
      setError("Please enter a room type name.");
      return;
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("Guest capacity must be a whole number of at least 1.");
      return;
    }

    if (
      form.base_price.trim() === "" ||
      !Number.isFinite(basePrice) ||
      basePrice < 0
    ) {
      setError("Please enter a valid room price.");
      return;
    }

    setSaving(true);

    try {
      const url = editingId
        ? `${API}/room-types/${editingId}`
        : `${API}/room-types`;

      const { response, result } = await apiFetch(url, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({
          type_name: form.type_name.trim(),
          description: form.description.trim(),
          capacity,
          base_price: basePrice,
        }),
      });

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save room type.");
      }

      setMessage(
        editingId
          ? "Room type updated successfully."
          : "Room type added successfully."
      );

      setForm(emptyForm);
      setEditingId(null);

      await loadRoomTypes();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(roomType) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${roomType.type_name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const { response, result } = await apiFetch(
        `${API}/room-types/${roomType.id}`,
        { method: "DELETE" }
      );

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete room type.");
      }

      if (editingId === roomType.id) {
        resetForm();
      }

      setMessage("Room type deleted successfully.");
      await loadRoomTypes();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  }

  const filteredRoomTypes = roomTypes.filter((roomType) =>
    `${roomType.type_name} ${roomType.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalRooms = roomTypes.reduce(
    (total, roomType) => total + Number(roomType.room_count || 0),
    0
  );

  return (
    <section className="rtm-page">
      <div className="rtm-header">
        <div>
          <p className="rtm-eyebrow">STAYEASE ADMINISTRATION</p>
          <h1>Room Types Management</h1>
          <p className="rtm-subtitle">
            Manage room categories, guest capacity and standard prices.
          </p>
        </div>

        <button
          className="rtm-add-button"
          onClick={() => {
            resetForm();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          + Add Room Type
        </button>
      </div>

      <div className="rtm-stats">
        <div className="rtm-stat-card">
          <span>Total Room Types</span>
          <strong>{roomTypes.length}</strong>
        </div>

        <div className="rtm-stat-card">
          <span>Total Guests Capacity</span>
          <strong>
            {roomTypes.reduce(
              (total, item) => total + Number(item.capacity || 0),
              0
            )}
          </strong>
        </div>

        <div className="rtm-stat-card">
          <span>Average Base Price</span>
          <strong>
            {roomTypes.length
              ? `LKR ${(
                  roomTypes.reduce(
                    (total, item) => total + Number(item.base_price || 0),
                    0
                  ) / roomTypes.length
                ).toLocaleString("en-LK", {
                  maximumFractionDigits: 2,
                })}`
              : "LKR 0"}
          </strong>
        </div>
      </div>

      {error && (
        <div className="rtm-alert rtm-error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="rtm-alert rtm-success" role="status">
          {message}
        </div>
      )}

      <div className="rtm-content">
        <div className="rtm-panel rtm-form-panel">
          <div className="rtm-panel-heading">
            <h2>{editingId ? "Edit Room Type" : "Add New Room Type"}</h2>
            <p>
              {editingId
                ? "Update the selected room category."
                : "Enter the details for a new room category."}
            </p>
          </div>

          <form className="rtm-form" onSubmit={handleSubmit}>
            <label htmlFor="type_name">Room Type Name *</label>
            <input
              id="type_name"
              name="type_name"
              value={form.type_name}
              onChange={handleChange}
              placeholder="e.g. Deluxe"
              maxLength={100}
              required
            />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the room type..."
              rows={4}
            />

            <label htmlFor="capacity">Guest Capacity *</label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              step="1"
              value={form.capacity}
              onChange={handleChange}
              required
            />

            <label htmlFor="base_price">Base Price per Night (LKR) *</label>
            <input
              id="base_price"
              name="base_price"
              type="number"
              min="0"
              step="0.01"
              value={form.base_price}
              onChange={handleChange}
              placeholder="e.g. 15000"
              required
            />

            <div className="rtm-form-actions">
              <button
                type="submit"
                className="rtm-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Room Type"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="rtm-cancel-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="rtm-panel rtm-list-panel">
          <div className="rtm-list-heading">
            <div>
              <h2>All Room Types</h2>
              <p>View and manage your hotel room categories.</p>
            </div>

            <button
              className="rtm-refresh-button"
              onClick={loadRoomTypes}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          <input
            className="rtm-search"
            type="search"
            placeholder="Search room types..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {loading ? (
            <p className="rtm-empty">Loading room types...</p>
          ) : filteredRoomTypes.length === 0 ? (
            <p className="rtm-empty">
              No room types found. Add a new room type to get started.
            </p>
          ) : (
            <div className="rtm-table-wrapper">
              <table className="rtm-table">
                <thead>
                  <tr>
                    <th>Room Type</th>
                    <th>Capacity</th>
                    <th>Base Price / Night</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRoomTypes.map((roomType) => (
                    <tr key={roomType.id}>
                      <td>
                        <div className="rtm-type-name">
                          {roomType.type_name}
                        </div>
                        <div className="rtm-description">
                          {roomType.description || "No description"}
                        </div>
                      </td>

                      <td>{roomType.capacity} guests</td>

                      <td className="rtm-price">
                        LKR{" "}
                        {Number(roomType.base_price).toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      <td>
                        <div className="rtm-actions">
                          <button
                            className="rtm-edit-button"
                            onClick={() => startEdit(roomType)}
                          >
                            Edit
                          </button>

                          <button
                            className="rtm-delete-button"
                            onClick={() => handleDelete(roomType)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default RoomTypesManagement;
