document.addEventListener("DOMContentLoaded", () => {
  // Theme Toggle
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const html = document.documentElement;
  
  const savedTheme = localStorage.getItem("theme") || 
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  html.setAttribute("data-theme", savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = html.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  // Mobile Menu
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');

  if (hamburger && nav) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation(); 
      hamburger.classList.toggle('active');
      nav.classList.toggle('open');
    });

    // Close menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        nav.classList.remove('open');
      });
    });
  }

  // Purposeful modal — first-visit discount
  const promoModal = document.getElementById("promo-modal");
  if (promoModal && !sessionStorage.getItem("promoSeen")) {
    const openModal = () => {
      promoModal.classList.add("open");
      sessionStorage.setItem("promoSeen", "true");
    };
    setTimeout(openModal, 2500);

    // Close on X, backdrop click, or any [data-close-modal]
    promoModal.addEventListener("click", (e) => {
      if (e.target === promoModal || e.target.matches("[data-close-modal]")) {
        promoModal.classList.remove("open");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") promoModal.classList.remove("open");
    });
  }
});