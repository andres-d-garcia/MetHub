import {
  renderHomeView,
  renderExploreView,
  renderDetailView,
  renderDepartmentsView,
  renderArtistView,
  renderCompareView,
} from './views.js';
import { getRoute, updateActiveNav } from './router.js';

const app = document.getElementById('app');
const navLinks = Array.from(document.querySelectorAll('.nav-links a'));

function init() {
  window.addEventListener('hashchange', renderRoute);
  renderRoute();
}

function renderRoute() {
  const hash = getRoute();
  updateActiveNav(navLinks);

  if (hash.startsWith('#detail/')) {
    const id = hash.split('/')[1];
    renderDetailView(app, id);
    return;
  }

  if (hash.startsWith('#artist/')) {
    const name = decodeURIComponent(hash.split('/')[1] || '');
    renderArtistView(app, name);
    return;
  }

  switch (hash) {
    case '#explore':
      renderExploreView(app);
      break;
    case '#departments':
      renderDepartmentsView(app);
      break;
    case '#compare':
      renderCompareView(app);
      break;
    case '#home':
    default:
      renderHomeView(app);
      break;
  }
}

init();
