document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("booking-app");
  if (!form) return;

  // Normalize data: support both SHOP/SERVICES/BARBERS and shopData shape
  const shopData = (typeof SHOP !== "undefined")
    ? { ...SHOP, services: SERVICES, barbers: BARBERS }
    : window.shopData;

  let bookingState = {
    service: null,
    barber: null,
    date: null,
    time: null,
    customer: {},
  };

  const panels = document.querySelectorAll(".booking-panel");
  const steps = document.querySelectorAll(".step");

  // ---------- Step 1: Services ----------
  const serviceGrid = document.getElementById("service-options");
  shopData.services.forEach((s) => {
    serviceGrid.insertAdjacentHTML(
      "beforeend",
      `<div class="card select-card" data-type="service" data-id="${s.id}">
        <h4>${s.name}</h4>
        <p>${s.desc}</p>
        <strong>R${s.price} · ${s.duration} mins</strong>
      </div>`
    );
  });

  // ---------- Step 2: Barbers ----------
  const barberGrid = document.getElementById("barber-options");
  shopData.barbers.forEach((b) => {
    barberGrid.insertAdjacentHTML(
      "beforeend",
      `<div class="card select-card" data-type="barber" data-id="${b.id}">
        <h4>${b.name}</h4>
        <p>${b.role}</p>
      </div>`
    );
  });

  // ---------- Selection Handling ----------
  document.querySelectorAll(".select-card").forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.type;
      document
        .querySelectorAll(`.select-card[data-type="${type}"]`)
        .forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");

      const collection = type === "service" ? shopData.services : shopData.barbers;
      bookingState[type] = collection.find((item) => item.id === card.dataset.id);

      const nextBtn = card.closest(".booking-panel").querySelector("[data-next]");
      if (nextBtn) nextBtn.disabled = false;
    });
  });

  // ---------- Step 3: Date & Time ----------
  const dateInput = document.getElementById("booking-date");
  const timeGrid = document.getElementById("time-options");

  // Min date = today (local, not UTC)
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  dateInput.setAttribute("min", `${yyyy}-${mm}-${dd}`);

  dateInput.addEventListener("change", (e) => {
    const dateVal = e.target.value;
    if (!dateVal) return;

    // Sunday closed (0 = Sunday)
    const dayOfWeek = new Date(dateVal + "T00:00:00").getDay();
    if (dayOfWeek === 0) {
      timeGrid.innerHTML = `<p style="color:var(--accent);grid-column:1/-1;">We are closed on Sundays. Please pick another day.</p>`;
      const nextBtn = document.querySelector('[data-step="3"] [data-next]');
      if (nextBtn) nextBtn.disabled = true;
      bookingState.time = null;
      return;
    }

    bookingState.date = dateVal;
    bookingState.time = null;

    // Use the real availability logic from data.js
    const slots = getTimeSlots(
      dateVal,
      bookingState.service.duration,
      bookingState.barber ? bookingState.barber.id : null
    );

    if (!slots.length) {
      timeGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;">No slots available on this day.</p>`;
      return;
    }

    timeGrid.innerHTML = slots
      .map(
        (slot) => `<button type="button"
          class="btn btn-outline time-btn${slot.booked ? " booked" : ""}"
          data-time="${slot.time}"
          ${slot.booked ? "disabled" : ""}>
          ${slot.time}${slot.booked ? " ✕" : ""}
        </button>`
      )
      .join("");

    document.querySelectorAll(".time-btn:not(.booked)").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".time-btn")
          .forEach((b) => b.classList.remove("selected-time"));
        btn.classList.add("selected-time");
        bookingState.time = btn.dataset.time;
        document.querySelector('[data-step="3"] [data-next]').disabled = false;
      });
    });
  });

  // ---------- Navigation ----------
  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () =>
      navigateToStep(parseInt(btn.dataset.next, 10))
    );
  });
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () =>
      navigateToStep(parseInt(btn.dataset.back, 10))
    );
  });

  // Enable "Review Booking" button when required fields valid
  ["cust-name", "cust-phone", "cust-email"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      const name = document.getElementById("cust-name").value.trim();
      const phone = document.getElementById("cust-phone").value.trim();
      const email = document.getElementById("cust-email").value.trim();
      const nextBtn = document.querySelector('[data-step="4"] [data-next]');
      if (nextBtn) nextBtn.disabled = !(name && phone && email);
    });
  });

  function navigateToStep(stepNum) {
    if (stepNum === 5) {
      const name = document.getElementById("cust-name").value.trim();
      const phone = document.getElementById("cust-phone").value.trim();
      const email = document.getElementById("cust-email").value.trim();

      if (!name || !phone || !email) {
        alert("Please fill in all required fields.");
        return;
      }
      bookingState.customer = {
        name,
        phone,
        email,
        notes: document.getElementById("cust-notes").value.trim(),
      };
      finalizeBooking();
    }

    panels.forEach((p) => p.classList.remove("active"));
    steps.forEach((s) => {
      const sNum = parseInt(s.dataset.step, 10);
      s.classList.toggle("active", sNum === stepNum);
      s.classList.toggle("completed", sNum < stepNum);
    });
    document
      .querySelector(`.booking-panel[data-step="${stepNum}"]`)
      .classList.add("active");
  }

  // ---------- Confirmation & Calendar ----------
  function finalizeBooking() {
    const { service, barber, date, time, customer } = bookingState;

    document.getElementById("confirm-details").innerHTML = `
      <p><strong>Service:</strong> ${service.name} (${service.duration} min)</p>
      <p><strong>Barber:</strong> ${barber.name}</p>
      <p><strong>Date & Time:</strong> ${formatHumanDate(date)} at ${time}</p>
      <p><strong>Booked for:</strong> ${customer.name} · ${customer.phone}</p>
      ${customer.notes ? `<p><strong>Notes:</strong> ${customer.notes}</p>` : ""}
    `;

    // Build a Date object in LOCAL time (avoids UTC shifting)
    const [h, m] = time.split(":").map(Number);
    const [yy, mo, dd] = date.split("-").map(Number);
    const startDate = new Date(yy, mo - 1, dd, h, m, 0, 0);
    const endDate = new Date(startDate.getTime() + service.duration * 60000);

    const event = {
      title: `${service.name} with ${barber.name} — Fade & Forge`,
      description:
        `Appointment at Fade & Forge Barber Co.\n` +
        `Service: ${service.name} (${service.duration} min)\n` +
        `Barber: ${barber.name}\n` +
        `Client: ${customer.name}\n` +
        `Phone: ${customer.phone}\n` +
        `Email: ${customer.email}\n` +
        (customer.notes ? `Notes: ${customer.notes}\n` : "") +
        `\nPlease arrive 5 minutes early. To reschedule call ${shopData.phone}.`,
      location: shopData.address,
      start: startDate,
      end: endDate,
    };

    setupGoogleCalendar(event);
    setupICSCalendar(event);
  }

  function formatHumanDate(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Convert local Date -> UTC string for Google (Google expects UTC w/ Z)
  function toGoogleUTC(date) {
    return date.toISOString().replace(/[-:]|\.\d{3}/g, "");
  }

  function setupGoogleCalendar(event) {
    const startStr = toGoogleUTC(event.start);
    const endStr = toGoogleUTC(event.end);
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${startStr}/${endStr}`,
      details: event.description,
      location: event.location,
    });
    const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
    document.getElementById("add-google").onclick = () =>
      window.open(url, "_blank", "noopener");
  }

  function setupICSCalendar(event) {
    const startStr = toGoogleUTC(event.start);
    const endStr = toGoogleUTC(event.end);
    const uid = `fadeandforge-${Date.now()}@fadeandforge.co.za`;
    const stamp = toGoogleUTC(new Date());

    // Escape ICS special chars
    const esc = (s) =>
      String(s)
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Fade & Forge//Booking//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${esc(event.title)}`,
      `DESCRIPTION:${esc(event.description)}`,
      `LOCATION:${esc(event.location)}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder — haircut at Fade & Forge",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ];

    document.getElementById("add-ics").onclick = () => {
      const blob = new Blob([icsLines.join("\r\n")], {
        type: "text/calendar;charset=utf-8",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "fade-and-forge-appointment.ics";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    };
  }
});