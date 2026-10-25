import { useEffect, useMemo, useState } from "react";
import "./BookingPayment.css";

const API_URL = "http://localhost:5000/api";

// TODO: replace with your hotel's real bank account details.
const BANK_DETAILS = {
  bank: "Your Bank Name",
  accountName: "StayEase Hotels (Pvt) Ltd",
  accountNumber: "0000 0000 0000",
  branch: "Colombo 03",
};

const MAX_SLIP_SIZE = 5 * 1024 * 1024;
const SLIP_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function prettyStatus(status) {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextDay(dateString) {
  if (!dateString) return getToday();

  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMoney(value) {
  const amount = Number(value);
  return `Rs. ${(Number.isFinite(amount) ? amount : 0).toLocaleString(
    "en-LK",
    { maximumFractionDigits: 2 }
  )}`;
}

function formatDate(dateString) {
  if (!dateString) return "Not selected";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Booking() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");

  const [mealPlans, setMealPlans] = useState([]);
  const [selectedMealPlan, setSelectedMealPlan] = useState("");

  const [loadingMealPlans, setLoadingMealPlans] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);

  const [paymentError, setPaymentError] = useState("");

  // Payment method + slip upload state
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [slipUploading, setSlipUploading] = useState(false);
  const [slipError, setSlipError] = useState("");
  const [slipDone, setSlipDone] = useState("");

  // Demo card payment state
  const [demoCardNumber, setDemoCardNumber] = useState("");
  const [demoCardName, setDemoCardName] = useState("");
  const [demoPaymentDone, setDemoPaymentDone] = useState(false);

  const [guest, setGuest] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Load meal plans
  useEffect(() => {
    const controller = new AbortController();

    async function loadMealPlans() {
      try {
        const response = await fetch(`${API_URL}/meal-plans`, {
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load meal plans.");
        }

        const plans = (data.mealPlans || []).map((plan) => ({
          ...plan,
          id: String(plan.id),
          price_per_guest_per_night: Number(
            plan.price_per_guest_per_night ?? plan.price ?? 0
          ),
        }));

        setMealPlans(plans);

        if (plans.length > 0) {
          setSelectedMealPlan((current) =>
            plans.some((plan) => plan.id === current)
              ? current
              : plans[0].id
          );
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load meal plans.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMealPlans(false);
        }
      }
    }

    loadMealPlans();

    return () => controller.abort();
  }, []);

  // Load available rooms for the chosen dates and guest count
  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setRooms([]);
      setSelectedRoom("");
      setLoadingRooms(false);
      return;
    }

    const controller = new AbortController();

    async function loadRooms() {
      setLoadingRooms(true);
      setRooms([]);
      setSelectedRoom("");
      setError("");

      try {
        const params = new URLSearchParams({
          check_in: checkIn,
          check_out: checkOut,
          adults: String(adults),
          children: String(children),
        });

        const response = await fetch(
          `${API_URL}/bookings/available-rooms?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load available rooms.");
        }

        // Normalize the API fields so room selection and prices use
        // the correct ID and price property.
        const normalizedRooms = (data.rooms || []).map((item) => ({
          ...item,
          room_id: String(item.room_id ?? item.id),
          base_price: Number(item.base_price ?? item.price ?? 0),
        }));

        setRooms(normalizedRooms);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not connect to the server.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRooms(false);
        }
      }
    }

    loadRooms();

    return () => controller.abort();
  }, [checkIn, checkOut, adults, children]);

  // Calculate nights using calendar dates
  const nights = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return 0;

    const start = Date.parse(`${checkIn}T00:00:00Z`);
    const end = Date.parse(`${checkOut}T00:00:00Z`);

    return Math.round((end - start) / 86400000);
  }, [checkIn, checkOut]);

  // Find the selected room using the normalized room_id
  const room = rooms.find(
    (item) => item.room_id === selectedRoom
  );

  const mealPlan = mealPlans.find(
    (item) => item.id === selectedMealPlan
  );

  // Live price calculation
  const totalGuests = Number(adults) + Number(children);

  const roomRate = room ? Number(room.base_price) : 0;
  const roomTotal = roomRate * nights;

  const mealPlanRate = mealPlan
    ? Number(mealPlan.price_per_guest_per_night)
    : 0;

  const mealTotal = mealPlanRate * totalGuests * nights;
  const estimatedTotal = roomTotal + mealTotal;

  // Advance payment preview (20% of estimated total)
  const advancePayment = estimatedTotal * 0.20;
  const remainingBalance = estimatedTotal - advancePayment;

  function updateGuest(event) {
    const { name, value } = event.target;

    setGuest((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleCheckInChange(event) {
    const value = event.target.value;

    setCheckIn(value);

    if (checkOut && value && checkOut <= value) {
      setCheckOut("");
    }

    setSelectedRoom("");
  }

  function handleCheckOutChange(event) {
    setCheckOut(event.target.value);
    setSelectedRoom("");
  }

  async function submitBooking(event) {
    event.preventDefault();
    setError("");

    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setError("Please select a valid check-in and check-out date.");
      return;
    }

    if (!room) {
      setError("Please select an available room.");
      return;
    }

    if (!mealPlan) {
      setError("Please select a meal plan.");
      return;
    }

    if (totalGuests < 1) {
      setError("Please select at least one guest.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...guest,
          room_id: Number(room.room_id),
          check_in: checkIn,
          check_out: checkOut,
          adults: Number(adults),
          children: Number(children),
          meal_plan_id: Number(selectedMealPlan),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Booking failed.");
      }

      // Preserve submitted details as fallbacks if the API response
      // does not include every summary field.
      setBooking({
        ...data.booking,
        check_in: data.booking?.check_in || checkIn,
        check_out: data.booking?.check_out || checkOut,
        nights: data.booking?.nights ?? nights,
        adults: data.booking?.adults ?? Number(adults),
        children: data.booking?.children ?? Number(children),
        room_number: data.booking?.room_number ?? room.room_number,
        room_type: data.booking?.room_type ?? room.type_name,
        meal_plan_name:
          data.booking?.meal_plan_name ?? mealPlan.plan_name,
        estimated_total:
          data.booking?.estimated_total ?? estimatedTotal,
        booking_status:
          data.booking?.booking_status ?? "Received",
        guest_name: guest.full_name,
        email: data.booking?.email ?? guest.email,
        phone: data.booking?.phone ?? guest.phone,
        address: data.booking?.address ?? guest.address,
        advance_payment:
          data.booking?.advance_payment ?? advancePayment,
        remaining_balance:
          data.booking?.remaining_balance ?? remainingBalance,
        checkout: data.booking?.checkout ?? null,
      });
    } catch (err) {
      setError(err.message || "Could not create your booking.");
    } finally {
      setSubmitting(false);
    }
  }

  // Demo card payment. No real card details are sent to the backend.
  async function handlePayAdvance() {
    setPaymentError("");

    if (!booking?.booking_reference || !booking?.email) {
      setPaymentError(
        "Booking reference or email is missing. Please create your booking again."
      );
      return;
    }

    if (!demoCardName.trim()) {
      setPaymentError("Please enter the cardholder name.");
      return;
    }

    const cardNumber = demoCardNumber.replace(/\s/g, "");

    if (!/^\d{16}$/.test(cardNumber)) {
      setPaymentError("Please enter a valid 16-digit demo card number.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/payments/demo-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_reference: booking.booking_reference,
          email: booking.email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Demo card payment failed.");
      }

      setDemoPaymentDone(true);
      setPaymentError("");

      setBooking((previous) => ({
        ...previous,
        booking_status:
          data.booking_status || data.booking?.booking_status || "confirmed",
      }));
    } catch (err) {
      setPaymentError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check that the backend is running."
          : err.message || "Demo card payment failed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Preview for image slips
  useEffect(() => {
    if (slipFile && slipFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(slipFile);
      setSlipPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setSlipPreview("");
  }, [slipFile]);

  function handleSlipChange(event) {
    setSlipError("");
    const file = event.target.files?.[0];

    if (!file) {
      setSlipFile(null);
      return;
    }

    if (!SLIP_TYPES.includes(file.type)) {
      setSlipError("Please upload a JPG, PNG, WEBP or PDF file.");
      setSlipFile(null);
      return;
    }

    if (file.size > MAX_SLIP_SIZE) {
      setSlipError("The file is too large. Maximum size is 5 MB.");
      setSlipFile(null);
      return;
    }

    setSlipFile(file);
  }

  async function handleSlipUpload() {
    setSlipError("");

    if (!slipFile) {
      setSlipError("Please choose your payment slip first.");
      return;
    }

    setSlipUploading(true);

    try {
      const body = new FormData();
      body.append("booking_reference", booking.booking_reference);
      body.append("email", booking.email);
      body.append("bank_reference", bankReference);
      body.append("slip", slipFile);

      const response = await fetch(`${API_URL}/payments/slip`, {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not upload the slip.");
      }

      setSlipDone(data.message);
      setSlipFile(null);
    } catch (err) {
      setSlipError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please try again."
          : err.message
      );
    } finally {
      setSlipUploading(false);
    }
  }

  function resetBooking() {
    setBooking(null);
    setPaymentMethod("card");
    setSlipFile(null);
    setBankReference("");
    setSlipError("");
    setSlipDone("");
    setPaymentError("");
    setDemoCardNumber("");
    setDemoCardName("");
    setDemoPaymentDone(false);
    setCheckIn("");
    setCheckOut("");
    setAdults("1");
    setChildren("0");
    setRooms([]);
    setSelectedRoom("");
    setError("");

    setGuest({
      full_name: "",
      email: "",
      phone: "",
      address: "",
    });

    if (mealPlans.length > 0) {
      setSelectedMealPlan(mealPlans[0].id);
    }
  }

  return (
    <main className="booking-page">
      <section className="booking-hero">
        <p className="gold-eyebrow">YOUR NEXT STAY STARTS HERE</p>
        <h1>Rooms &amp; Reservations</h1>
        <p>
          Discover your perfect room and enjoy a comfortable
          StayEase experience.
        </p>
      </section>

      {booking ? (
        <section className="booking-success">
          <div className="booking-success-icon">✓</div>

          <p className="gold-eyebrow">RESERVATION RECEIVED</p>
          <h2>Your booking has been received!</h2>

          <p>
            Thank you for choosing StayEase. Keep your booking reference
            for future enquiries.
          </p>

          <div className="booking-reference">
            <span>Booking Reference</span>
            <strong>{booking.booking_reference || "Pending"}</strong>
          </div>

          <div className="booking-summary">
            {booking.guest_name && (
              <p>
                Guest: <strong>{booking.guest_name}</strong>
              </p>
            )}

            <p>
              Room:{" "}
              <strong>
                {booking.room_type || "Room"}{" "}
                {booking.room_number ? `(Room ${booking.room_number})` : ""}
              </strong>
            </p>

            <p>
              Check-in: <strong>{formatDate(booking.check_in)}</strong>
            </p>

            <p>
              Check-out: <strong>{formatDate(booking.check_out)}</strong>
            </p>

            <p>
              Nights: <strong>{booking.nights}</strong>
            </p>

            <p>
              Adults: <strong>{booking.adults}</strong>
            </p>

            <p>
              Children: <strong>{booking.children}</strong>
            </p>

            <p>
              Meal plan:{" "}
              <strong>{booking.meal_plan_name || "Room Only"}</strong>
            </p>

            <p>
              Estimated total:{" "}
              <strong>{formatMoney(booking.estimated_total)}</strong>
            </p>

            <p>
              Status: <strong>{prettyStatus(booking.booking_status)}</strong>
            </p>

            <p>
              Advance Payment (20%):{" "}
              <strong>
                {formatMoney(
                  booking.advance_payment ??
                  Number(booking.estimated_total || 0) * 0.2
                )}
              </strong>
            </p>

            <p>
              Remaining Balance (80%):{" "}
              <strong>
                {formatMoney(
                  booking.remaining_balance ??
                  Number(booking.estimated_total || 0) * 0.8
                )}
              </strong>
            </p>
          </div>

          {/* ---------- PAYMENT PANEL ---------- */}
          <div className="pay-panel">
            <ol className="pay-steps">
              <li className="done"><span>1</span>Booking received</li>
              <li className={demoPaymentDone || slipDone ? "done" : "current"}>
                <span>2</span>Pay advance
              </li>
              <li className={demoPaymentDone ? "done" : ""}>
                <span>3</span>Confirmed
              </li>
            </ol>

            <h3 className="pay-title">Pay your 20% advance</h3>
            <p className="pay-amount">
              {formatMoney(
                booking.advance_payment ??
                  Number(booking.estimated_total || 0) * 0.2
              )}
            </p>

            {demoPaymentDone ? (
              <div className="pay-slip-done" role="status">
                <span>✓</span>
                <p>
                  Demo payment successful! No real money was charged.
                </p>
              </div>
            ) : (
              <>
                <div className="pay-methods" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "card"}
                    className={`pay-method ${paymentMethod === "card" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <span className="pay-method-icon">💳</span>
                    <strong>Pay by Card</strong>
                    <small>Demo payment · no real money</small>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === "slip"}
                    className={`pay-method ${paymentMethod === "slip" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("slip")}
                  >
                    <span className="pay-method-icon">🧾</span>
                    <strong>Bank Transfer</strong>
                    <small>Upload your payment slip</small>
                  </button>
                </div>

                {paymentMethod === "card" && (
                  <div className="pay-body">
                    <p className="pay-help">
                      This is a demo card payment for testing the StayEase
                      booking system. No real payment will be made. Do not
                      enter your real bank card details.
                    </p>

                    <label className="pay-field">
                      Cardholder name
                      <input
                        type="text"
                        value={demoCardName}
                        onChange={(event) =>
                          setDemoCardName(event.target.value)
                        }
                        maxLength={100}
                        autoComplete="off"
                        placeholder="Enter demo cardholder name"
                      />
                    </label>

                    <label className="pay-field">
                      Demo card number (16 digits)
                      <input
                        type="text"
                        inputMode="numeric"
                        value={demoCardNumber}
                        onChange={(event) =>
                          setDemoCardNumber(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 16)
                          )
                        }
                        maxLength={16}
                        autoComplete="off"
                        placeholder="Enter 16-digit demo number"
                      />
                    </label>

                    {paymentError && (
                      <p className="booking-error" role="alert">
                        {paymentError}
                      </p>
                    )}

                    <button
                      type="button"
                      className="booking-primary-button"
                      onClick={handlePayAdvance}
                      disabled={submitting}
                    >
                      {submitting
                        ? "Processing..."
                        : "Complete Demo Payment"}
                    </button>

                    <p className="booking-disclaimer">
                      Portfolio demo only. This form does not process or
                      charge a real card.
                    </p>
                  </div>
                )}

                {paymentMethod === "slip" && (
                  <div className="pay-body">
                    {slipDone ? (
                      <div className="pay-slip-done" role="status">
                        <span>✓</span>
                        <p>{slipDone}</p>
                      </div>
                    ) : (
                      <>
                        <div className="pay-bank">
                          <h4>Transfer to this account</h4>
                          <dl>
                            <dt>Bank</dt><dd>{BANK_DETAILS.bank}</dd>
                            <dt>Account name</dt><dd>{BANK_DETAILS.accountName}</dd>
                            <dt>Account number</dt><dd>{BANK_DETAILS.accountNumber}</dd>
                            <dt>Branch</dt><dd>{BANK_DETAILS.branch}</dd>
                            <dt>Reference</dt>
                            <dd>{booking.booking_reference}</dd>
                          </dl>
                          <small>
                            Please use your booking reference as the transfer
                            reference.
                          </small>
                        </div>

                        <label className="pay-field">
                          Bank transaction reference (optional)
                          <input
                            value={bankReference}
                            onChange={(e) => setBankReference(e.target.value)}
                            maxLength={100}
                            placeholder="e.g. TXN123456"
                          />
                        </label>

                        <label className={`pay-dropzone ${slipFile ? "has-file" : ""}`}>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleSlipChange}
                          />
                          {slipPreview ? (
                            <img src={slipPreview} alt="Payment slip preview" />
                          ) : (
                            <span className="pay-dropzone-icon">⬆</span>
                          )}
                          <strong>
                            {slipFile ? slipFile.name : "Choose your payment slip"}
                          </strong>
                          <small>JPG, PNG, WEBP or PDF · max 5 MB</small>
                        </label>

                        {slipError && (
                          <p className="booking-error" role="alert">
                            {slipError}
                          </p>
                        )}

                        <button
                          type="button"
                          className="booking-primary-button"
                          onClick={handleSlipUpload}
                          disabled={slipUploading || !slipFile}
                        >
                          {slipUploading ? "Uploading..." : "Submit Payment Slip"}
                        </button>

                        <p className="booking-disclaimer">
                          Your booking is confirmed once our team verifies the
                          slip.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            className="booking-primary-button"
            onClick={resetBooking}
          >
            Make Another Booking
          </button>
        </section>
      ) : (
        <form className="booking-layout" onSubmit={submitBooking}>
          <section className="booking-card">
            <div className="booking-section-heading">
              <span>01</span>
              <div>
                <h2>Your Stay</h2>
                <p>Choose your dates and number of guests.</p>
              </div>
            </div>

            <div className="booking-form-grid">
              <label>
                Check-in
                <input
                  type="date"
                  value={checkIn}
                  min={getToday()}
                  onChange={handleCheckInChange}
                  required
                />
              </label>

              <label>
                Check-out
                <input
                  type="date"
                  value={checkOut}
                  min={getNextDay(checkIn)}
                  onChange={handleCheckOutChange}
                  required
                />
              </label>

              <label>
                Adults
                <select
                  value={adults}
                  onChange={(event) => setAdults(event.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6].map((number) => (
                    <option key={number} value={number}>
                      {number} {number === 1 ? "Adult" : "Adults"}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Children
                <select
                  value={children}
                  onChange={(event) => setChildren(event.target.value)}
                >
                  {[0, 1, 2, 3, 4, 5].map((number) => (
                    <option key={number} value={number}>
                      {number} {number === 1 ? "Child" : "Children"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="booking-section-heading room-heading">
              <span>02</span>
              <div>
                <h2>Select Your Room</h2>
                <p>Available rooms and prices for your selected dates.</p>
              </div>
            </div>

            {!checkIn || !checkOut ? (
              <p className="booking-notice">
                Select your check-in and check-out dates to find rooms.
              </p>
            ) : null}

            {checkIn && checkOut && checkOut <= checkIn && (
              <p className="booking-notice">
                Check-out must be at least one day after check-in.
              </p>
            )}

            {loadingRooms && (
              <p className="booking-notice">
                Checking room availability...
              </p>
            )}

            {!loadingRooms &&
              checkIn &&
              checkOut &&
              checkOut > checkIn &&
              rooms.length === 0 &&
              !error && (
                <p className="booking-notice">
                  No rooms are available for these dates. Try different dates.
                </p>
              )}

            <div className="booking-room-list">
              {rooms.map((item) => (
                <label
                  key={item.room_id}
                  className={`booking-room-option ${
                    selectedRoom === item.room_id ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="room"
                    value={item.room_id}
                    checked={selectedRoom === item.room_id}
                    onChange={() => setSelectedRoom(item.room_id)}
                  />

                  <div className="booking-room-info">
                    <strong>{item.type_name || "Room"}</strong>
                    <span>Room {item.room_number}</span>

                    {item.floor_number != null && (
                      <span>Floor {item.floor_number}</span>
                    )}

                    <span>Up to {item.capacity} guests</span>

                    {item.description && <span>{item.description}</span>}
                  </div>

                  <div className="booking-room-price">
                    <strong>{formatMoney(item.base_price)}</strong>
                    <span>per night</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="booking-section-heading room-heading">
              <span>03</span>
              <div>
                <h2>Select a Meal Plan</h2>
                <p>Choose the meal option that suits your stay.</p>
              </div>
            </div>

            <div className="booking-meal-plans">
              {loadingMealPlans ? (
                <p className="booking-notice">Loading meal plans...</p>
              ) : mealPlans.length === 0 ? (
                <p className="booking-notice">
                  No meal plans are available.
                </p>
              ) : (
                mealPlans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`booking-meal-option ${
                      selectedMealPlan === plan.id ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="meal_plan"
                      value={plan.id}
                      checked={selectedMealPlan === plan.id}
                      onChange={() => setSelectedMealPlan(plan.id)}
                    />

                    <span className="booking-meal-option-content">
                      <strong>{plan.plan_name}</strong>
                      <small>{plan.description}</small>

                      <span>
                        {plan.price_per_guest_per_night === 0
                          ? "Included with room rate"
                          : `${formatMoney(
                              plan.price_per_guest_per_night
                            )} per guest / night`}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="booking-section-heading room-heading">
              <span>04</span>
              <div>
                <h2>Guest Details</h2>
                <p>Who will be staying with us?</p>
              </div>
            </div>

            <div className="booking-form-grid">
              <label>
                Full name
                <input
                  name="full_name"
                  value={guest.full_name}
                  onChange={updateGuest}
                  maxLength={120}
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                Phone number
                <input
                  type="tel"
                  name="phone"
                  value={guest.phone}
                  onChange={updateGuest}
                  maxLength={25}
                  autoComplete="tel"
                  required
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  value={guest.email}
                  onChange={updateGuest}
                  maxLength={150}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                Address
                <input
                  name="address"
                  value={guest.address}
                  onChange={updateGuest}
                  maxLength={255}
                  autoComplete="street-address"
                />
              </label>
            </div>

            {error && (
              <p className="booking-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="booking-primary-button"
              disabled={
                submitting ||
                loadingRooms ||
                loadingMealPlans ||
                !room ||
                !mealPlan ||
                nights <= 0
              }
            >
              {submitting ? "Processing..." : "Confirm Reservation"}
            </button>

            <p className="booking-disclaimer">
              Your reservation is saved first. You can then pay the 20%
              advance by card or upload a bank transfer slip.
            </p>
          </section>

          <aside className="booking-card booking-summary-card">
            <p className="gold-eyebrow">YOUR RESERVATION</p>
            <h2>Booking Summary</h2>

            <div className="summary-line">
              <span>Check-in</span>
              <strong>{formatDate(checkIn)}</strong>
            </div>

            <div className="summary-line">
              <span>Check-out</span>
              <strong>{formatDate(checkOut)}</strong>
            </div>

            <div className="summary-line">
              <span>Duration</span>
              <strong>{nights > 0 ? `${nights} nights` : "—"}</strong>
            </div>

            <div className="summary-line">
              <span>Guests</span>
              <strong>
                {adults} adults, {children} children
              </strong>
            </div>

            <div className="summary-line">
              <span>Room</span>
              <strong>
                {room
                  ? `${room.type_name || "Room"} (${room.room_number})`
                  : "Not selected"}
              </strong>
            </div>

            <div className="summary-line">
              <span>Rate per night</span>
              <strong>{formatMoney(roomRate)}</strong>
            </div>

            <div className="summary-line">
              <span>Meal plan</span>
              <strong>{mealPlan?.plan_name || "Not selected"}</strong>
            </div>

            <div className="summary-line">
              <span>Room cost</span>
              <strong>{formatMoney(roomTotal)}</strong>
            </div>

            <div className="summary-line">
              <span>Meal cost</span>
              <strong>{formatMoney(mealTotal)}</strong>
            </div>

            <div className="summary-total">
              <span>Estimated Total</span>
              <strong>{formatMoney(estimatedTotal)}</strong>

              <small>
                Room rate × nights + meal rate × guests × nights.
                Final charges are subject to server validation.
              </small>
            </div>

            <div className="summary-line">
              <span>Advance Payment (20%)</span>
              <strong>{formatMoney(advancePayment)}</strong>
            </div>

            <div className="summary-line">
              <span>Remaining Balance</span>
              <strong>{formatMoney(remainingBalance)}</strong>
            </div>

            <p className="booking-disclaimer">
              The advance is 20% of the estimated total. After confirming your
              reservation you can pay by card or upload a bank slip.
            </p>
          </aside>
        </form>
      )}
    </main>
  );
}

export default Booking;