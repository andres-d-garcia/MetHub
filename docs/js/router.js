function getRoute() {
  const hash = window.location.hash || '#home';
  return hash.split('?')[0] || '#home';
}

function getHashParams() {
  const hash = window.location.hash || '#home';
  const [routePart, queryPart = ''] = hash.split('?');
  const params = new URLSearchParams(queryPart);
  return { route: routePart || '#home', params };
}

function navigateTo(hash) {
  window.location.hash = hash;
}

function updateActiveNav(navLinks) {
  const current = getRoute();
  navLinks.forEach((link) => {
    const target = link.getAttribute('href').split('?')[0];
    link.classList.toggle('active', target === current);
  });
}

export { getHashParams, getRoute, navigateTo, updateActiveNav };
