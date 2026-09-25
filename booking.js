(function () {
  const form = document.getElementById("booking-app");
  if (!form) return;

  const state = {
    step: 1,
    service: null,
    barber: null,
    date: null,
    time: null,
    customer: { name: "", email: "", phone: "", notes: "" }
  };

  const panels = form.querySelectorAll(".booking-panel");
  const stepEls = document.querySelectorAll(".step");

  function goTo(step) {
    state.step = step;
    panels.forEach(p => p.classList.toggle("active", Number(p.dataset.step) === step));
    stepEls.forEach(s => {
      const n = Number(s.dataset.step);
      s.classList.toggle("active", n === step);
      s.classList.toggle("done", n < step);
    });
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
    updateNextButtons();
  }

  function updateNextButtons() {
    const next1 = form.querySelector("[data-next='1']");
    if (next1) next1.disabled = !state.service;
    const next2 = form.querySelector("[data-next='2']");
    if (next2) next2.disabled = !state.barber;
    const next3 = form.querySelector("[data-next='3']");
    if (next3) next3.disabled = !(state.date && state.time);
    const next4 = form.querySelector("[data-next='4']");
    if (next4) {
      const { name, email, phone } = state.customer;
      next4.disabled = !(name.trim() && email.trim() && phone.trim());
    }
  }

  form.addEventListener("click", (e) => {
    const nextBtn = e.target.closest("[data-next]");
    if (nextBtn) goTo(Number(nextBtn.dataset.next));
    const backBtn = e.target.closest("[data-back]");
    if (backBtn) goTo(Number(backBtn.dataset.back));
  });

  const serviceGrid = form.querySelector("#service-options");
  if (serviceGrid) {
    SERVICES.forEach(s => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "option";
      el.dataset.serviceId = s.id;
      el.innerHTML = `<h4>${s.name}</h4><div class="opt-price">R${s.price}</div><div class="opt-meta">${s.duration} min · ${s.desc}</div>`;
      el.addEventListener("click", () => {
        state.service = s;
        serviceGrid.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
        el.classList.add("selected");
        updateNextButtons();
        if (state.date && state.barber) renderTimeSlots();
      });
      serviceGrid.appendChild(el);
    });
  }

  const barberGrid = form.querySelector("#barber-options");
  if (barberGrid) {
    BARBERS.forEach(b => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "option";
      el.dataset.barberId = b.id;
      el.innerHTML = `<h4>${b.name}</h4><div class="opt-meta">${b.role}</div>`;
      el.addEventListener("click", () => {
        state.barber = b;
        barberGrid.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
        el.classList.add("selected");
        updateNextButtons();
        if (state.date) renderTimeSlots();
      });
      barberGrid.appendChild(el);
    });
  }

  const dateInput = form.querySelector("#booking-date");
  const timeGrid = form.querySelector("#time-options");

  function renderTimeSlots() {
    if (!timeGrid || !dateInput.value || !state.service || !state.barber) return;
    const slots = getTimeSlots(dateInput.value, state.service.duration, state.barber.id);
    timeGrid.innerHTML = "";
    state.time = null;
    updateNextButtons();

    if (slots.length === 0) {
      timeGrid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;">Closed on this day. Please pick another date.</p>`;
      return;
    }

    slots.forEach(slot => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "time-slot";
      btn.textContent = slot.time;
      btn.disabled = slot.booked;
      if (slot.booked) btn.title = "Already booked";
      btn.addEventListener("click", () => {
        state.time = slot.time;
        timeGrid.querySelectorAll(".time-slot").forEach(t => t.classList.remove("selected"));
        btn.classList.add("selected");
        updateNextButtons();
      });
      timeGrid.appendChild(btn);
    });
  }

  if (dateInput) {
    const today = new Date();
    const max = new Date();
    max.setDate(today.getDate() + 60);
    dateInput.min = today.toISOString().split("T")[0];
    dateInput.max = max.toISOString().split("T")[0];
    dateInput.addEventListener("change", () => {
      state.date = dateInput.value;
      renderTimeSlots();
    });
  }

  const fields = {
    name:  form.querySelector("#cust-name"),
    email: form.querySelector("#cust-email"),
    phone: form.querySelector("#cust-phone"),
    notes: form.querySelector("#cust-notes")
  };
  Object.entries(fields).forEach(([key, input]) => {
    if (!input) return;
    input.addEventListener("input", () => {
      state.customer[key] = input.value;
      updateNextButtons();
    });
  });

  function renderConfirmation() {
    const c = form.querySelector("#confirm-details");
    if (!c) return;
    const start = combineDateTime(state.date, state.time);
    const end = new Date(start.getTime() + state.service.duration * 60000);
    c.innerHTML = `
      <div class="confirm-row"><span class="k">Service</span><span class="v">${state.service.name}</span></div>
      <div class="confirm-row"><span class="k">Barber</span><span class="v">${state.barber.name}</span></div>
      <div class="confirm-row"><span class="k">Date</span><span class="v">${formatDateLong(start)}</span></div>
      <div class="confirm-row"><span class="k">Time</span><span class="v">${state.time} – ${formatTime(end)}</span></div>
      <div class="confirm-row"><span class="k">Duration</span><span class="v">${state.service.duration} min</span></div>
      <div class="confirm-row"><span class="k">Price</span><span class="v">R${state.service.price}</span></div>
      <div class="confirm-row"><span class="k">Name</span><span class="v">${escapeHtml(state.customer.name)}</span></div>
      <div class="confirm-row"><span class="k">Email</span><span class="v">${escapeHtml(state.customer.email)}</span></div>
      <div class="confirm-row"><span class="k">Phone</span><span class="v">${escapeHtml(state.customer.phone)}</span></div>
      ${state.customer.notes ? `<div class="confirm-row"><span class="k">Notes</span><span class="v">${escapeHtml(state.customer.notes)}</span></div>` : ""}
    `;
  }

  const next4 = form.querySelector("[data-next='4']");
  if (next4) next4.addEventListener("click", renderConfirmation);

  function buildEvent() {
    const start = combineDateTime(state.date, state.time);
    const end = new Date(start.getTime() + state.service.duration * 60000);
    const title = `${state.service.name} at ${SHOP.shortName}`;
    const details =
      `Appointment with ${state.barber.name}.\n` +
      `Service: ${state.service.name} (${state.service.duration} min)\n` +
      `Price: R${state.service.price}\n` +
      `Booked for: ${state.customer.name}\n` +
      `Phone: ${state.customer.phone}\n` +
      (state.customer.notes ? `Notes: ${state.customer.notes}\n` : "") +
      `\nPlease arrive 5 minutes early. To reschedule call ${SHOP.phone}.`;
    return { start, end, title, details, location: SHOP.address };
  }

  const gcalBtn = form.querySelector("#add-google");
  if (gcalBtn) {
    gcalBtn.addEventListener("click", () => {
      const { start, end, title, details, location } = buildEvent();
      const url = new URL("https://calendar.google.com/calendar/render");
      url.searchParams.set("action", "TEMPLATE");
      url.searchParams.set("text", title);
      url.searchParams.set("dates", `${toGCal(start)}/${toGCal(end)}`);
      url.searchParams.set("details", details);
      url.searchParams.set("location", location);
      window.open(url.toString(), "_blank");
    });
  }

  const icsBtn = form.querySelector("#add-ics");
  if (icsBtn) {
    icsBtn.addEventListener("click", () => {
      const { start, end, title, details, location } = buildEvent();
      const ics = buildICS({ start, end, title, details, location });
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "fade-and-forge-appointment.ics";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    });
  }

  function combineDateTime(dateStr, timeStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0);
  }
  function formatDateLong(date) {
    return date.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function formatTime(date) { return date.toTimeString().slice(0, 5); }
  function toGCal(date) {
    const pad = n => String(n).padStart(2, "0");
    return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + "T" +
           pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds());
  }
  function toICS(date) { return toGCal(date); }
  function buildICS({ start, end, title, details, location }) {
    const uid = `ff-${Date.now()}@fadeandforge.co.za`;
    const dtstamp = toICS(new Date()) + "Z";
    const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Fade & Forge//Booking//EN",
      "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
      `UID:${uid}`, `DTSTAMP:${dtstamp}`,
      `DTSTART:${toICS(start)}`, `DTEND:${toICS(end)}`,
      `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(details)}`, `LOCATION:${esc(location)}`,
      "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
  }
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  goTo(1);
})();