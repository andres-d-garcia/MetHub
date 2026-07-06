function getRoute() {
  return window.location.hash || '#home';
}

function getHashParams() {
  const hash = window.location.hash || '#home';
  const [routePart, queryPart = ''] = hash.split('?');
  const params = new URLSearchParams(queryPart);
  return { route: routePart, params };
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

export { getHashParams, getRoute, navigateTo, updateActiveNav };
