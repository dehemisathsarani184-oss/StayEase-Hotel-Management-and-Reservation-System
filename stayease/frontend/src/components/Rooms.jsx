
import { useEffect, useState } from "react";
import "../App.css";

const API_URL = "http://localhost:5000/api";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    room_number: "",
    room_type_id: "",
    floor_number: "",
    room_status: "available",
    housekeeping_status: "clean",
  };

  const [form, setForm] = useState(emptyForm);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [roomsResponse, typesResponse] = await Promise.all([
        fetch(`${API_URL}/rooms`),
        fetch(`${API_URL}/room-types`),
      ]);

      if (!roomsResponse.ok || !typesResponse.ok) {
        throw new Error("Failed to load room data.");
      }

      const roomsResult = await roomsResponse.json();
      const typesResult = await typesResponse.json();

      setRooms(roomsResult.data || []);
      setRoomTypes(typesResult.data || []);
    } catch (err) {
      setError("Cannot connect to the backend. Check that the server is running.");
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

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function startEdit(room) {
    setEditingId(room.id);
    setForm({
      room_number: room.room_number,
      room_type_id: String(room.room_type_id),
      floor_number: room.floor_number ?? "",
      room_status: room.room_status,
      housekeeping_status: room.housekeeping_status,
    });
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const payload = {
      ...form,
      room_type_id: Number(form.room_type_id),
      floor_number: form.floor_number === ""
        ? null
        : Number(form.floor_number),
    };

    try {
      const response = await fetch(
        editingId
          ? `${API_URL}/rooms/${editingId}`
          : `${API_URL}/rooms`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Could not save the room.");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Could not save the room.");
    }
  }

  async function handleDelete(room) {
    const confirmed = window.confirm(
      `Are you sure you want to delete room ${room.room_number}?`
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(`${API_URL}/rooms/${room.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Could not delete the room.");
      }

      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete the room.");
    }
  }

  return (
    <main className="rooms-page">
      <div className="rooms-header">
        <div>
          <p className="eyebrow">STAYEASE HOTEL MANAGEMENT</p>
          <h1>Rooms Management</h1>
          <p className="page-subtitle">
            Manage your hotel rooms and their current status.
          </p>
        </div>

        <button className="primary-btn" onClick={startAdd}>
          + Add Room
        </button>
      </div>

      <div className="room-stats">
        <div className="stat-card">
          <span>Total Rooms</span>
          <strong>{rooms.length}</strong>
        </div>
        <div className="stat-card">
          <span>Available</span>
          <strong>
            {rooms.filter((room) => room.room_status === "available").length}
          </strong>
        </div>
        <div className="stat-card">
          <span>Occupied</span>
          <strong>
            {rooms.filter((room) => room.room_status === "occupied").length}
          </strong>
        </div>
        <div className="stat-card">
          <span>Maintenance</span>
          <strong>
            {rooms.filter((room) => room.room_status === "maintenance").length}
          </strong>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="room-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Room" : "Add New Room"}</h2>

          <div className="form-grid">
            <label>
              Room Number
              <input
                name="room_number"
                value={form.room_number}
                onChange={handleChange}
                placeholder="e.g. 103"
                required
              />
            </label>

            <label>
              Room Type
              <select
                name="room_type_id"
                value={form.room_type_id}
                onChange={handleChange}
                required
              >
                <option value="">Select room type</option>
                {roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type_name} — Rs. {type.base_price}
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
                min="0"
                placeholder="e.g. 1"
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
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-btn">
              {editingId ? "Save Changes" : "Add Room"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="rooms-table-card">
        <div className="table-heading">
          <h2>All Rooms</h2>
          <button className="secondary-btn" onClick={loadData}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="empty-state">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p className="empty-state">
            No rooms found. Click “Add Room” to create one.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Floor</th>
                  <th>Price / Night</th>
                  <th>Room Status</th>
                  <th>Housekeeping</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="room-number">{room.room_number}</td>
                    <td>{room.type_name}</td>
                    <td>{room.floor_number ?? "—"}</td>
                    <td>Rs. {Number(room.base_price).toLocaleString("en-LK")}</td>
                    <td>
                      <span className={`status-badge ${room.room_status}`}>
                        {room.room_status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${room.housekeeping_status}`}
                      >
                        {room.housekeeping_status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => startEdit(room)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(room)}
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
      </section>
    </main>
  );
}

export default Rooms;
