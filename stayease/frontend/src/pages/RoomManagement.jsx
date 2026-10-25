
import { useEffect, useState } from "react";
import "./RoomManagement.css";

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
  room_number: "",
  room_type_id: "",
  floor_number: "",
  room_status: "available",
  housekeeping_status: "clean",
};

function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [
        { response: roomsResponse, result: roomsData },
        { response: typesResponse, result: typesData },
      ] = await Promise.all([
        apiFetch(`${API}/rooms`),
        apiFetch(`${API}/room-types`),
      ]);

      if (
        !roomsResponse.ok ||
        !roomsData.success ||
        !typesResponse.ok ||
        !typesData.success
      ) {
        throw new Error("Unable to load rooms or room types.");
      }

      setRooms(roomsData.data);
      setRoomTypes(typesData.data);
    } catch (err) {
      setError(err.message || "Failed to load room data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function startEdit(room) {
    setEditingId(room.id);
    setForm({
      room_number: String(room.room_number),
      room_type_id: String(room.room_type_id),
      floor_number: room.floor_number ?? "",
      room_status: room.room_status,
      housekeeping_status: room.housekeeping_status,
    });
    setMessage("");
    setError("");

    document
      .getElementById("room-management-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.room_type_id) {
      setError("Please select a room type.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        room_number: form.room_number.trim(),
        room_type_id: Number(form.room_type_id),
        floor_number:
          form.floor_number === "" ? null : Number(form.floor_number),
      };

      const url = editingId
        ? `${API}/rooms/${editingId}`
        : `${API}/rooms`;

      const { response, result } = await apiFetch(url, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save room.");
      }

      setMessage(
        editingId ? "Room updated successfully." : "Room added successfully."
      );

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to save room.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(room) {
    const confirmed = window.confirm(
      `Are you sure you want to delete room ${room.room_number}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const { response, result } = await apiFetch(
        `${API}/rooms/${room.id}`,
        { method: "DELETE" }
      );

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete room.");
      }

      setMessage("Room deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to delete room.");
    }
  }

  const filteredRooms = rooms.filter((room) => {
    const query = search.toLowerCase();

    return (
      String(room.room_number).toLowerCase().includes(query) ||
      String(room.type_name).toLowerCase().includes(query) ||
      String(room.room_status).toLowerCase().includes(query)
    );
  });

  return (
    <main className="room-management">
      <header className="rm-header">
        <div>
          <p className="rm-eyebrow">STAYEASE MANAGEMENT</p>
          <h1>Room Management</h1>
          <p>Manage room inventory, room types and housekeeping status.</p>
        </div>

        <button
          className="rm-refresh"
          type="button"
          onClick={loadData}
          disabled={loading}
        >
          Refresh Rooms
        </button>
      </header>

      {message && <div className="rm-message">{message}</div>}
      {error && <div className="rm-error" role="alert">{error}</div>}

      <section className="rm-summary">
        <article>
          <span>Total Rooms</span>
          <strong>{rooms.length}</strong>
        </article>
        <article>
          <span>Available</span>
          <strong>
            {rooms.filter((r) => r.room_status === "available").length}
          </strong>
        </article>
        <article>
          <span>Occupied</span>
          <strong>
            {rooms.filter((r) => r.room_status === "occupied").length}
          </strong>
        </article>
        <article>
          <span>Maintenance</span>
          <strong>
            {rooms.filter((r) => r.room_status === "maintenance").length}
          </strong>
        </article>
      </section>

      <section className="rm-panel" id="room-management-form">
        <div className="rm-panel-heading">
          <div>
            <h2>{editingId ? "Edit Room" : "Add New Room"}</h2>
            <p>Enter the room details below.</p>
          </div>

          {editingId && (
            <button
              className="rm-secondary"
              type="button"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form className="rm-form" onSubmit={handleSubmit}>
          <label>
            Room Number *
            <input
              name="room_number"
              value={form.room_number}
              onChange={handleChange}
              placeholder="e.g. 401"
              required
            />
          </label>

          <label>
            Room Type *
            <select
              name="room_type_id"
              value={form.room_type_id}
              onChange={handleChange}
              required
            >
              <option value="">Select room type</option>
              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type_name} — Capacity {type.capacity}
                </option>
              ))}
            </select>
          </label>

          <label>
            Floor Number
            <input
              type="number"
              name="floor_number"
              value={form.floor_number}
              onChange={handleChange}
              placeholder="e.g. 4"
            />
          </label>

          <label>
            Room Status
            <select
              name="room_status"
              value={form.room_status}
              onChange={handleChange}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </label>

          <label>
            Housekeeping Status
            <select
              name="housekeeping_status"
              value={form.housekeeping_status}
              onChange={handleChange}
            >
              <option value="clean">Clean</option>
              <option value="dirty">Dirty</option>
              <option value="inspected">Inspected</option>
            </select>
          </label>

          <div className="rm-form-actions">
            <button
              className="rm-primary"
              type="submit"
              disabled={saving || roomTypes.length === 0}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Room"
                  : "Add Room"}
            </button>

            <button
              className="rm-secondary"
              type="button"
              onClick={() => {
                resetForm();
                setError("");
                setMessage("");
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      <section className="rm-panel">
        <div className="rm-panel-heading rm-list-heading">
          <div>
            <h2>All Rooms</h2>
            <p>{filteredRooms.length} room(s) found</p>
          </div>

          <input
            className="rm-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search room, type or status..."
            aria-label="Search rooms"
          />
        </div>

        <div className="rm-table-wrapper">
          <table className="rm-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Price / Night</th>
                <th>Room Status</th>
                <th>Housekeeping</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="rm-empty">
                    Loading rooms...
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan="8" className="rm-empty">
                    No rooms found.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id}>
                    <td className="rm-room-number">{room.room_number}</td>
                    <td>{room.type_name}</td>
                    <td>{room.floor_number ?? "—"}</td>
                    <td>{room.capacity} guests</td>
                    <td>
                      LKR{" "}
                      {Number(room.base_price).toLocaleString("en-LK")}
                    </td>
                    <td>
                      <span
                        className={`rm-badge rm-${room.room_status}`}
                      >
                        {room.room_status}
                      </span>
                    </td>
                    <td>
                      <span className="rm-housekeeping">
                        {room.housekeeping_status}
                      </span>
                    </td>
                    <td>
                      <div className="rm-actions">
                        <button
                          type="button"
                          className="rm-edit"
                          onClick={() => startEdit(room)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rm-delete"
                          onClick={() => handleDelete(room)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default RoomManagement;
