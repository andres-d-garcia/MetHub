function getRoute() {
  return window.location.hash || '#home';
}

function navigateTo(hash) {
  window.location.hash = hash;
}

function updateActiveNav(navLinks) {
  const hash = getRoute();
  navLinks.forEach((link) => {
    const target = link.getAttribute('href');
    link.classList.toggle('active', target === hash);
  });
}

export { getRoute, navigateTo, updateActiveNav };
