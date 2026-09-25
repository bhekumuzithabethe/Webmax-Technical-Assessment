const SHOP = {
  name: "Fade & Forge Barber Co.",
  shortName: "Fade & Forge",
  tagline: "Sharp cuts. Timeless craft.",
  phone: "+27 11 555 0142",
  email: "hello@fadeandforge.co.za",
  address: "42 Main Road, Melville, Johannesburg, 2092",
  addressShort: "42 Main Road, Melville, JHB",
  mapsUrl: "https://maps.google.com/?q=42+Main+Road+Melville+Johannesburg",
  socials: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com"
  }
};

const HOURS = [
  { day: "Monday",    open: "09:00", close: "18:00" },
  { day: "Tuesday",   open: "09:00", close: "18:00" },
  { day: "Wednesday", open: "09:00", close: "18:00" },
  { day: "Thursday",  open: "09:00", close: "19:00" },
  { day: "Friday",    open: "09:00", close: "19:00" },
  { day: "Saturday",  open: "08:00", close: "16:00" },
  { day: "Sunday",    open: null,    close: null    }
];

const SERVICES = [
  { id: "classic-cut",  name: "Classic Haircut",     price: 180, duration: 30, desc: "A tailored cut with clippers and scissors, finished with a hot towel." },
  { id: "skin-fade",    name: "Skin Fade",           price: 220, duration: 40, desc: "Precision fade down to the skin, blended clean and sharp." },
  { id: "beard-trim",   name: "Beard Trim & Shape",  price: 120, duration: 20, desc: "Beard shaped, lined and conditioned with beard oil." },
  { id: "cut-beard",    name: "Cut + Beard Combo",   price: 280, duration: 50, desc: "Our most popular — a full haircut paired with a beard sculpt." },
  { id: "hot-shave",    name: "Hot Towel Shave",     price: 200, duration: 30, desc: "Traditional straight-razor shave with hot towels and balm." },
  { id: "kids-cut",     name: "Kids Cut",            price: 120, duration: 25, desc: "Patient, friendly cuts for boys and girls under 12." },
  { id: "full-works",   name: "The Full Works",      price: 380, duration: 75, desc: "Haircut, beard sculpt and hot towel shave. The complete reset." }
];

const BARBERS = [
  {
    id: "sipho",
    name: "Sipho Ndlovu",
    role: "Master Barber & Founder",
    bio: "Fifteen years behind the chair. Sipho founded Fade & Forge with one rule: every client leaves sharper than they came in.",
    img: "https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=600&q=80"
  },
  {
    id: "marco",
    name: "Marco Reyes",
    role: "Senior Barber",
    bio: "Specialist in skin fades and modern textured cuts. Marco trained in Lisbon and brings a European edge to every chair.",
    img: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=600&q=80"
  },
  {
    id: "thabo",
    name: "Thabo Mokoena",
    role: "Barber & Beard Specialist",
    bio: "Thabo is our beard whisperer. If you want a sharp line and a hot towel finish, he's your man.",
    img: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80"
  }
];

function getTimeSlots(dateStr, duration, barberId) {
  const date = new Date(dateStr + "T00:00:00");
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const dayHours = HOURS.find(h => h.day === dayName);

  if (!dayHours || !dayHours.open) return [];

  const slots = [];
  const [openH, openM] = dayHours.open.split(":").map(Number);
  const [closeH, closeM] = dayHours.close.split(":").map(Number);
  const openMin = openH * 60 + openM;
  const closeMin = closeH * 60 + closeM;

  for (let m = openMin; m + duration <= closeMin; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const label = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    const seed = (date.getDate() * 31 + h * 7 + mm + (barberId ? barberId.length * 13 : 0));
    const booked = seed % 7 === 0;
    slots.push({ time: label, booked });
  }
  return slots;
}