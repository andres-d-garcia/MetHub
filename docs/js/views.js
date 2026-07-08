import { API_BASE, fetchJson as obtenerJson } from './api.js';
import { createCard, createState, getImageFallbackSrc } from './components.js';
import { navigateTo } from './router.js';

const TAMANO_PAGINA = 6;
const MAX_PETICIONES_PARALELAS = 4;
const OBJETOS_RESPALDO = {
  436535: {
    objectID: 436535,
    title: 'The Starry Night',
    artistDisplayName: 'Vincent van Gogh',
    objectDate: '1889',
    department: 'Paintings',
    medium: 'Oil on canvas',
    dimensions: '73.7 × 92.1 cm',
    culture: 'Dutch',
    classification: 'Paintings',
    creditLine: 'Acquired through the Lillie P. Bliss Bequest',
    primaryImageSmall: getImageFallbackSrc('The Starry Night'),
    primaryImage: getImageFallbackSrc('The Starry Night'),
  },
  437980: {
    objectID: 437980,
    title: 'Mona Lisa',
    artistDisplayName: 'Leonardo da Vinci',
    objectDate: '1503',
    department: 'European Paintings',
    medium: 'Oil on poplar panel',
    dimensions: '77 × 53 cm',
    culture: 'Italian',
    classification: 'Paintings',
    creditLine: 'Leonardo da Vinci',
    primaryImageSmall: getImageFallbackSrc('Mona Lisa'),
    primaryImage: getImageFallbackSrc('Mona Lisa'),
  },
  459055: {
    objectID: 459055,
    title: 'The Great Wave off Kanagawa',
    artistDisplayName: 'Katsushika Hokusai',
    objectDate: '1831',
    department: 'Asian Art',
    medium: 'Woodblock print',
    dimensions: '25.4 × 37.3 cm',
    culture: 'Japanese',
    classification: 'Prints',
    creditLine: 'Gift of Mrs. Frank B. Wilderson',
    primaryImageSmall: getImageFallbackSrc('The Great Wave off Kanagawa'),
    primaryImage: getImageFallbackSrc('The Great Wave off Kanagawa'),
  },
};

const DESTACADOS_RESPALDO = [
  {
    objectID: 436535,
    title: 'The Starry Night',
    artistDisplayName: 'Vincent van Gogh',
    objectDate: '1889',
    department: 'Paintings',
    primaryImageSmall: getImageFallbackSrc('The Starry Night'),
  },
  {
    objectID: 437980,
    title: 'Mona Lisa',
    artistDisplayName: 'Leonardo da Vinci',
    objectDate: '1503',
    department: 'European Paintings',
    primaryImageSmall: getImageFallbackSrc('Mona Lisa'),
  },
  {
    objectID: 459055,
    title: 'The Great Wave off Kanagawa',
    artistDisplayName: 'Katsushika Hokusai',
    objectDate: '1831',
    department: 'Asian Art',
    primaryImageSmall: getImageFallbackSrc('The Great Wave off Kanagawa'),
  },
];

function obtenerObjetoRespaldoPorId(id) {
  if (!id) {
    return null;
  }

  return OBJETOS_RESPALDO[String(id)] || null;
}

function obtenerIdsObjetoRespaldoPorQuery(consulta = '') {
  const normalizar = (s = '') =>
    String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const q = normalizar(consulta || '');
  if (!q) return Object.keys(OBJETOS_RESPALDO).map((k) => Number(k));

  const terminos = q.split(' ').filter(Boolean);

  // Build a simple local index from OBJETOS_RESPALDO
  const indice = Object.values(OBJETOS_RESPALDO).map((obj) => {
    const text = normalizar([obj.title, obj.artistDisplayName, obj.department].join(' '));
    return { id: obj.objectID, text };
  });

  // Score objects by token matches
  const scored = index
    .map((entry) => {
      let score = 0;
      for (const t of terminos) {
        if (entry.text.includes(t)) score += 2;
        else if (t.length > 2 && entry.text.split(' ').some((w) => w.startsWith(t))) score += 1;
      }
      return { id: entry.id, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length) return scored.map((s) => s.id);

  // fallback to simple keyword mapping for a few special cases (preserve previous behavior)
  if (q.includes('starry') || q.includes('night') || q.includes('van gogh')) return [436535];
  if (q.includes('mona') || q.includes('lisa') || q.includes('da vinci') || q.includes('leonardo')) return [437980];
  if (q.includes('wave') || q.includes('hokusai') || q.includes('kanagawa') || q.includes('japan')) return [459055];

  return Object.keys(OBJETOS_RESPALDO).map((k) => Number(k));
}

async function resolverDetallesObjeto(ids) {
  const idsSeguros = Array.isArray(ids) ? ids.filter(Boolean) : [];
  const results = [];

  for (let i = 0; i < idsSeguros.length; i += MAX_PETICIONES_PARALELAS) {
    const fragmento = idsSeguros.slice(i, i + MAX_PETICIONES_PARALELAS);
    const resultadosFragmento = await Promise.allSettled(fragmento.map((id) => obtenerJson(`${API_BASE}/objects/${id}`).catch(() => obtenerObjetoRespaldoPorId(id))));
    results.push(...resultadosFragmento);
  }

  return results;
}

function guardarEstadoComparador(state) {
  try {
    const payload = {
      A: state.selectedA ? { objectID: state.selectedA.objectID } : null,
      B: state.selectedB ? { objectID: state.selectedB.objectID } : null,
    };
    window.sessionStorage.setItem('methub-compare', JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function cargarEstadoComparador() {
  try {
    const raw = window.sessionStorage.getItem('methub-compare');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function guardarObjetoEnCache(item) {
  if (!item?.objectID) {
    return;
  }

  try {
    window.sessionStorage.setItem(`methub-object-${item.objectID}`, JSON.stringify(item));
  } catch {
    // ignore storage errors
  }
}

function obtenerObjetoDeCache(id) {
  if (!id) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(`methub-object-${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function abrirDetalle(item) {
  if (item?.objectID) {
    guardarObjetoEnCache(item);
    guardarItemReciente(item);
    navigateTo(`#detail/${item.objectID}`);
    return;
  }

  navigateTo('#home');
}

function leerItemsRecientes() {
  try {
    const datosCrudos = window.localStorage.getItem('methub-recent-items');
    return datosCrudos ? JSON.parse(datosCrudos) : [];
  } catch {
    return [];
  }
}

function saveRecentItem(item) {
  if (!item?.objectID) {
    return;
  }

  const actuales = leerItemsRecientes().filter((entry) => String(entry.objectID) !== String(item.objectID));
  actuales.unshift({
    objectID: item.objectID,
    title: item.title || 'Sin título',
    artistDisplayName: item.artistDisplayName || 'Artista desconocido',
    objectDate: item.objectDate || '—',
    department: item.department || '—',
    primaryImageSmall: item.primaryImageSmall || getImageFallbackSrc(item.title),
  });

  try {
    window.localStorage.setItem('methub-recent-items', JSON.stringify(actuales.slice(0, 4)));
  } catch {
    // ignore storage errors
  }
}

function renderHomeView(app) {
  app.innerHTML = '';
  app.appendChild(createState('Cargando obras destacadas...'));

  Promise.allSettled([
    obtenerJson(`${API_BASE}/departments`),
    obtenerJson(`${API_BASE}/search?isHighlight=true&hasImages=true`),
    obtenerJson(`${API_BASE}/search`),
  ])
    .then(([resultadoDepartamentos, resultadoBusqueda, resultadoTotalColeccion]) => {
      if (resultadoDepartamentos.status === 'rejected' || resultadoBusqueda.status === 'rejected') {
        renderizarContenidoHome(app, 19, DESTACADOS_RESPALDO.length, DESTACADOS_RESPALDO.map((item) => ({ status: 'fulfilled', value: item })), []);
        return;
      }

      const departamentos = resultadoDepartamentos.value?.departments || [];
      const idsObjetos = (resultadoBusqueda.value?.objectIDs || []).slice(0, 4);

      if (!idsObjetos.length) {
        app.innerHTML = '';
        const section = document.createElement('section');
        section.className = 'hero';
        const title = document.createElement('h1');
        title.textContent = 'Explora la colección del Met';
        const text = document.createElement('p');
        text.textContent = 'No hay obras destacadas disponibles.';
        section.append(title, text);
        app.appendChild(section);
        return;
      }

      return Promise.allSettled(idsObjetos.map((id) => obtenerJson(`${API_BASE}/objects/${id}`))).then((results) => {
        renderizarContenidoHome(app, departamentos.length, idsObjetos.length, results, departamentos);
      });
    })
    .catch(() => {
      renderizarContenidoHome(app, 19, DESTACADOS_RESPALDO.length, DESTACADOS_RESPALDO.map((item) => ({ status: 'fulfilled', value: item })), []);
    });
}

function renderizarContenidoHome(app, totalDepartamentos, totalDestacados, resultadosObjetos, departamentos = []) {
  app.innerHTML = '';

  const hero = document.createElement('section');
  hero.className = 'hero';
  const title = document.createElement('h1');
  title.textContent = 'Explora la colección del Met';
  const intro = document.createElement('p');
  intro.textContent = 'Descubre obras maestras, departamentos curatoriales y datos reales de la colección del museo.';
  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = 'Si la API no responde, se muestran obras de ejemplo para mantener la vista operativa.';

  const actions = document.createElement('div');
  actions.className = 'hero-actions';

  const btnExplorar = document.createElement('button');
  btnExplorar.className = 'secondary-btn';
  btnExplorar.textContent = 'Explorar obras';
  btnExplorar.addEventListener('click', () => navigateTo('#explore'));

  const btnDepartamentos = document.createElement('button');
  btnDepartamentos.className = 'secondary-btn';
  btnDepartamentos.textContent = 'Ver departamentos';
  btnDepartamentos.addEventListener('click', () => navigateTo('#departments'));

  actions.append(btnExplorar, btnDepartamentos);
  hero.append(title, intro, note, actions);
  app.appendChild(hero);

  const seccionEstadisticas = document.createElement('section');
  seccionEstadisticas.className = 'stats-section';

  const tarjetaEstadistica1 = document.createElement('div');
  tarjetaEstadistica1.className = 'stat-card';
  tarjetaEstadistica1.innerHTML = `<strong>${totalDepartamentos}</strong><span>Departamentos</span>`;

  const itemsValidos = resultadosObjetos.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);

  const conteoArtistas = new Map();
  itemsValidos.forEach((item) => {
    const artist = item.artistDisplayName || 'Artista desconocido';
    conteoArtistas.set(artist, (conteoArtistas.get(artist) || 0) + 1);
  });

  let artistaFrecuente = '—';
  let conteoMaximo = 0;
  conteoArtistas.forEach((count, artist) => {
    if (count > conteoMaximo) {
      artistaFrecuente = artist;
      conteoMaximo = count;
    }
  });

  const tarjetaEstadistica2 = document.createElement('div');
  tarjetaEstadistica2.className = 'stat-card';
  tarjetaEstadistica2.innerHTML = `<strong>${artistaFrecuente}</strong><span>Artista más frecuente (destacadas)</span>`;

  let oldestWork = null;
  if (validItems.length > 0) {
    oldestWork = validItems.reduce((oldest, current) => {
      if (!oldest || (current.objectBeginDate && current.objectBeginDate < oldest.objectBeginDate)) {
        return current;
      }
      return oldest;
    }, null);
  }

  const tarjetaEstadistica3 = document.createElement('div');
  tarjetaEstadistica3.className = 'stat-card';
  tarjetaEstadistica3.innerHTML = `<strong>${oldestWork ? oldestWork.objectDate : '—'}</strong><span>Obra más antigua (destacadas)</span>`;
  
  seccionEstadisticas.append(tarjetaEstadistica1, tarjetaEstadistica2, tarjetaEstadistica3);
  app.appendChild(seccionEstadisticas);

  const quickSearchSection = document.createElement('section');
  quickSearchSection.className = 'gallery-section';
  const quickSearchTitle = document.createElement('h2');
  quickSearchTitle.textContent = 'Búsquedas rápidas';
  quickSearchSection.appendChild(quickSearchTitle);

  const quickSearchList = document.createElement('div');
  quickSearchList.className = 'chip-list';

  const quickSearches = [
    { label: 'Van Gogh', query: 'van gogh' },
    { label: 'Mona Lisa', query: 'mona lisa' },
    { label: 'Hokusai', query: 'hokusai' },
    { label: 'Arte moderno', departmentId: '21' },
    { label: 'Pinturas', departmentId: '11' },
  ];

  quickSearches.forEach((item) => {
    const button = document.createElement('button');
    button.className = 'chip-btn';
    button.textContent = item.label;
    button.addEventListener('click', () => {
      const params = new URLSearchParams();
      if (item.query) {
        params.set('q', item.query);
      }
      if (item.departmentId) {
        params.set('departmentId', item.departmentId);
      }
      navigateTo(`#explore${params.toString() ? `?${params.toString()}` : ''}`);
    });
    quickSearchList.appendChild(button);
  });

  quickSearchSection.appendChild(quickSearchList);
  app.appendChild(quickSearchSection);

  if (departamentos.length) {
    const departmentsSection = document.createElement('section');
    departmentsSection.className = 'gallery-section';
    const departmentsTitle = document.createElement('h2');
    departmentsTitle.textContent = 'Departamentos destacados';
    departmentsSection.appendChild(departmentsTitle);

    const departmentsGrid = document.createElement('div');
    departmentsGrid.className = 'grid';

    departamentos.slice(0, 6).forEach((department) => {
      const icon = getDepartmentIcon(department.displayName || '');
      const card = createCard({
        title: `${icon} ${department.displayName || 'Departamento'}`,
        meta: 'Explora obras de este departamento',
        actionLabel: 'Ver obras',
        onAction: () => navigateTo(`#explore?departmentId=${department.departmentId || ''}`),
      });
      card.querySelector('img')?.remove();
      departmentsGrid.appendChild(card);
    });

    departmentsSection.appendChild(departmentsGrid);
    app.appendChild(departmentsSection);
  }

  const itemsRecientes = leerItemsRecientes();
  if (itemsRecientes.length) {
    const recentSection = document.createElement('section');
    recentSection.className = 'gallery-section';
    const recentTitle = document.createElement('h2');
    recentTitle.textContent = 'Visto recientemente';
    recentSection.appendChild(recentTitle);

    const recentGrid = document.createElement('div');
    recentGrid.className = 'grid';

    itemsRecientes.forEach((item) => {
      const card = createCard({
        title: item.title || 'Sin título',
        subtitle: item.artistDisplayName || 'Artista desconocido',
        meta: `${item.objectDate || '—'} · ${item.department || '—'}`,
        imageSrc: item.primaryImageSmall || getImageFallbackSrc(item.title),
        actionLabel: 'Ver detalle',
        onAction: () => abrirDetalle(item),
      });
      recentGrid.appendChild(card);
    });

    recentSection.appendChild(recentGrid);
    app.appendChild(recentSection);
  }

  const gallerySection = document.createElement('section');
  gallerySection.className = 'gallery-section';
  const galleryTitle = document.createElement('h2');
  galleryTitle.textContent = 'Obras destacadas';
  gallerySection.appendChild(galleryTitle);

  const grid = document.createElement('div');
  grid.className = 'grid';

  if (!itemsValidos.length) {
    grid.appendChild(createState('No se pudieron cargar obras destacadas en este momento.'));
    gallerySection.appendChild(grid);
    app.appendChild(gallerySection);
    return;
  }

  validItems.forEach((result) => {
    const item = result.value;
    const card = createCard({
      title: item.title || 'Sin título',
      subtitle: item.artistDisplayName || 'Artista desconocido',
      meta: `${item.objectDate || '—'} · ${item.department || '—'}`,
      imageSrc: item.primaryImageSmall || getImageFallbackSrc(item.title),
      actionLabel: 'Ver detalle',
      onAction: () => abrirDetalle(item),
    });
    grid.appendChild(card);
  });

  gallerySection.appendChild(grid);
  app.appendChild(gallerySection);
}

function getDepartmentIcon(name) {
  const normalized = (name || '').toLowerCase();
  if (normalized.includes('paint')) return '🎨';
  if (normalized.includes('sculpt')) return '🗿';
  if (normalized.includes('draw')) return '✏️';
  if (normalized.includes('print')) return '🖼️';
  if (normalized.includes('photo')) return '📷';
  if (normalized.includes('text')) return '🧵';
  if (normalized.includes('armor')) return '🛡️';
  if (normalized.includes('costume')) return '👗';
  if (normalized.includes('musical')) return '🎼';
  if (normalized.includes('coin')) return '🪙';
  if (normalized.includes('jew')) return '💍';
  if (normalized.includes('med')) return '🏺';
  if (normalized.includes('near')) return '🏛️';
  return '🏛️';
}

async function getDepartmentPreviewImage(departmentId) {
  if (!departmentId) {
    return null;
  }

  try {
    const resultadoBusqueda = await obtenerJson(`${API_BASE}/search?q=${encodeURIComponent('*')}&departmentId=${departmentId}&hasImages=true`);
    const ids = Array.isArray(resultadoBusqueda.objectIDs) ? resultadoBusqueda.objectIDs : [];
    if (!ids.length) {
      return null;
    }

    const candidateIds = ids.slice(0, Math.min(ids.length, 8));
    const randomId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
    const item = await obtenerJson(`${API_BASE}/objects/${randomId}`);
    return item?.primaryImageSmall || item?.primaryImage || null;
  } catch {
    return null;
  }
}

function renderExploreView(app, params = new URLSearchParams()) {
  // Si el panel de exploración ya existe, no lo volvemos a renderizar.
  // Esto evita el parpadeo al cambiar filtros.
  if (document.querySelector('.panel.explore-view')) {
    return;
  }

  app.innerHTML = '';
  const section = document.createElement('section');
  section.className = 'panel explore-view';

  const title = document.createElement('h2');
  title.textContent = 'Explorar';
  section.appendChild(title);

  const controls = document.createElement('div');
  controls.className = 'filter-panel';

  const filters = {
    q: params.get('q') || '',
    department: params.get('departmentId') || '',
    yearFrom: params.get('dateBegin') || '',
    yearTo: params.get('dateEnd') || '',
    isHighlight: params.get('isHighlight') === 'true',
    hasImages: params.get('hasImages') === 'true',
    page: Number(params.get('page') || 1),
  };

  const searchField = document.createElement('div');
  searchField.className = 'filter-field';
  const searchLabel = document.createElement('label');
  searchLabel.textContent = 'Buscar';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Título, artista o tema';
  searchField.append(searchLabel, searchInput);

  const departmentField = document.createElement('div');
  departmentField.className = 'filter-field';
  const departmentLabel = document.createElement('label');
  departmentLabel.textContent = 'Departamento';
  const departmentSelect = document.createElement('select');
  departmentField.append(departmentLabel, departmentSelect);

  const yearField = document.createElement('div');
  yearField.className = 'filter-field';
  const yearLabel = document.createElement('label');
  yearLabel.textContent = 'Rango de años';
  const yearFromInput = document.createElement('input');
  yearFromInput.type = 'number';
  yearFromInput.placeholder = 'Desde';
  const yearToInput = document.createElement('input');
  yearToInput.type = 'number';
  yearToInput.placeholder = 'Hasta';

  yearField.append(yearLabel, yearFromInput, yearToInput);

  const checkboxGroup = document.createElement('div');
  checkboxGroup.className = 'checkbox-group';

  const highlightLabel = document.createElement('label');
  highlightLabel.className = 'checkbox-item';
  const highlightCheckbox = document.createElement('input');
  highlightCheckbox.type = 'checkbox';
  const highlightText = document.createElement('span');
  highlightText.textContent = 'Solo destacadas';
  highlightLabel.append(highlightCheckbox, highlightText);

  const imageLabel = document.createElement('label');
  imageLabel.className = 'checkbox-item';
  const imageCheckbox = document.createElement('input');
  imageCheckbox.type = 'checkbox';
  const imageText = document.createElement('span');
  imageText.textContent = 'Solo con imagen';
  imageLabel.append(imageCheckbox, imageText);

  checkboxGroup.append(highlightLabel, imageLabel);

  const actions = document.createElement('div');
  actions.className = 'filter-actions';
  const clearButton = document.createElement('button');
  clearButton.className = 'secondary-btn';
  clearButton.textContent = 'Limpiar filtros';
  actions.appendChild(clearButton);

  controls.append(searchField, departmentField, yearField, checkboxGroup, actions);
  section.appendChild(controls);

  const aggregates = document.createElement('div');
  aggregates.className = 'aggregate-panel';
  section.appendChild(aggregates);

  const resultsSummary = document.createElement('div');
  resultsSummary.className = 'results-summary';
  section.appendChild(resultsSummary);

  const results = document.createElement('div');
  results.className = 'results-grid';
  section.appendChild(results);

  const pagination = document.createElement('div');
  pagination.className = 'pagination';
  section.appendChild(pagination);

  app.appendChild(section);

  let searchTimer;

  const syncExploreHash = () => {
    const hashParams = new URLSearchParams();
    if (filters.q) {
      hashParams.set('q', filters.q);
    }
    if (filters.department) {
      hashParams.set('departmentId', filters.department);
    }
    if (filters.yearFrom) {
      hashParams.set('dateBegin', filters.yearFrom);
    }
    if (filters.yearTo) {
      hashParams.set('dateEnd', filters.yearTo);
    }
    if (filters.isHighlight) {
      hashParams.set('isHighlight', 'true');
    }
    if (filters.hasImages) {
      hashParams.set('hasImages', 'true');
    }
    if (filters.page > 1) {
      hashParams.set('page', String(filters.page));
    }

    const nextHash = hashParams.toString() ? `#explore?${hashParams.toString()}` : '#explore';
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  };

  const applyFilters = (resetPage = true) => {
    if (resetPage) {
      filtros.page = 1;
    }

    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      syncExploreHash();
      loadExploreResults(app, filters, { results, aggregates, pagination, resultsSummary }, applyFilters);
    }, 400);
  };

  const resetForm = () => {
    filtros.q = '';
    filtros.department = '';
    filtros.yearFrom = '';
    filtros.yearTo = '';
    filtros.isHighlight = false;
    filtros.hasImages = false;
    filtros.page = 1;
    searchInput.value = '';
    departmentSelect.value = '';
    yearFromInput.value = '';
    yearToInput.value = '';
    // reset ranges to defaults
    try {
      rangeFrom.value = rangeFrom.min;
      rangeTo.value = rangeTo.max;
    } catch (e) {
      // ignore if ranges not available
    }
    highlightCheckbox.checked = false;
    imageCheckbox.checked = false;
    applyFilters(true);
  };

  searchInput.addEventListener('input', () => {
    filtros.q = searchInput.value.trim();
    applyFilters(true);
  });

  departmentSelect.addEventListener('change', () => {
    filtros.department = departmentSelect.value;
    applyFilters(true);
  });

  const validateAndApplyYearFilters = () => {
    const fromVal = yearFromInput.value;
    const toVal = yearToInput.value;
    const fromNum = Number(fromVal);
    const toNum = Number(toVal);

    let isValid = true;
    if (fromVal && toVal && fromNum > toNum) {
      isValid = false;
    }

    yearFromInput.classList.toggle('invalid', !isValid);
    yearToInput.classList.toggle('invalid', !isValid);

    if (!isValid) {
      return;
    }

    filtros.yearFrom = fromVal;
    filtros.yearTo = toVal;
    applyFilters(true);
  };

  yearFromInput.addEventListener('input', validateAndApplyYearFilters);
  yearToInput.addEventListener('input', validateAndApplyYearFilters);

  highlightCheckbox.addEventListener('change', () => {
    filtros.isHighlight = highlightCheckbox.checked;
    applyFilters(true);
  });

  imageCheckbox.addEventListener('change', () => {
    filtros.hasImages = imageCheckbox.checked;
    applyFilters(true);
  });

  clearButton.addEventListener('click', resetForm);

  obtenerJson(`${API_BASE}/departments`)
    .then((data) => {
      populateDepartments(departmentSelect, data.departments || []);
      if (filtros.department) {
        departmentSelect.value = filtros.department;
      }
      if (filtros.q) {
        searchInput.value = filtros.q;
      }
      if (filtros.yearFrom) {
        yearFromInput.value = filtros.yearFrom;
      }
      if (filtros.yearTo) {
        yearToInput.value = filtros.yearTo;
      }
      highlightCheckbox.checked = filters.isHighlight;
      imageCheckbox.checked = filters.hasImages;
    })
    .catch(() => {
      const message = document.createElement('p');
      message.className = 'note';
      message.textContent = 'No se pudieron cargar los departamentos.';
      controls.appendChild(message);
    });

  loadExploreResults(app, filters, { results, aggregates, pagination, resultsSummary }, applyFilters);
}

function populateDepartments(select, departments) {
  select.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'Todos los departamentos';
  select.appendChild(allOption);

  departments.forEach((department) => {
    const option = document.createElement('option');
    option.value = department.departmentId;
    option.textContent = department.displayName || 'Departamento';
    select.appendChild(option);
  });
}

function loadExploreResults(app, filtros, elements, applyFilters) {
  const { results, aggregates, pagination } = elements;
  let { resultsSummary } = elements;
  if (!resultsSummary && results && results.parentElement) {
    resultsSummary = results.parentElement.querySelector('.results-summary');
  }

  results.innerHTML = '';
  results.appendChild(createState('Cargando resultados...'));

  const params = new URLSearchParams();
  let departmentName = '';

  if (filtros.department) {
    try {
      const select = document.querySelector('.filter-panel select');
      departmentName = select.options[select.selectedIndex].text;
    } catch {
      // ignore error
    }
  }

  params.set('q', filtros.q || departmentName || '*');

  if (filtros.department) {
    params.set('departmentId', filtros.department);
  }
  if (filtros.yearFrom) {
    params.set('dateBegin', filtros.yearFrom);
  }
  if (filtros.yearTo) {
    params.set('dateEnd', filtros.yearTo);
  }
  if (filtros.isHighlight) {
    params.set('isHighlight', 'true');
  }
  if (filtros.hasImages) {
    params.set('hasImages', 'true');
  }

  const startIndex = (filtros.page - 1) * TAMANO_PAGINA;

  obtenerJson(`${API_BASE}/search?${params.toString()}`)
    .then((data) => {
      const idsObjetos = Array.isArray(data?.objectIDs) && data.objectIDs.length ? data.objectIDs : obtenerIdsObjetoRespaldoPorQuery(filtros.q);
      const total = Array.isArray(data?.objectIDs) && data.objectIDs.length ? data.total || idsObjetos.length : idsObjetos.length;
      const pageIds = idsObjetos.slice(startIndex, startIndex + TAMANO_PAGINA);

      if (!pageIds.length) {
        renderEmptyExploreState(results, aggregates, pagination, total);
        return;
      }

      return resolverDetallesObjeto(pageIds).then((resolvedResults) => {
        renderExploreResults(app, filtros, { results, aggregates, pagination, resultsSummary }, total, resolvedResults, applyFilters);
      });
    })
    .catch(() => {
      const fallbackIds = obtenerIdsObjetoRespaldoPorQuery(filtros.q);
      const pageIds = fallbackIds.slice(startIndex, startIndex + TAMANO_PAGINA);

      if (!pageIds.length) {
        renderEmptyExploreState(results, aggregates, pagination, 0);
        return;
      }

      return resolverDetallesObjeto(pageIds).then((resolvedResults) => {
        renderExploreResults(app, filtros, { results, aggregates, pagination, resultsSummary }, fallbackIds.length, resolvedResults, applyFilters);
      });
    });
}

function renderEmptyExploreState(results, aggregates, pagination, total) {
  results.innerHTML = '';
  results.appendChild(createState('No se encontraron obras con los filtros aplicados.'));

  aggregates.innerHTML = '';
  const title = document.createElement('h3');
  title.textContent = 'Agregados';
  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = 'Agregados calculados sobre los visibles. Total se refiere al search completo.';
  const empty = document.createElement('p');
  empty.textContent = '—';
  aggregates.append(title, note, empty);

  pagination.innerHTML = '';
}

function renderExploreResults(app, filtros, elements, total, resolvedResults, applyFilters) {
  const { results, aggregates, pagination, resultsSummary } = elements;
  const itemsValidos = resolvedResults.filter((result) => result.status === 'fulfilled' && result.value);

  results.innerHTML = '';
  resultsSummary.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'results-grid';

  if (!itemsValidos.length) {
    const summaryText = document.createElement('p');
    summaryText.textContent = 'No hay resultados para esta página.';
    resultsSummary.appendChild(summaryText);
    grid.appendChild(createState('No se pudieron cargar las obras de esta página.'));
    results.appendChild(grid);
  } else {
    itemsValidos.forEach((result) => {
      const item = result.value;
      const card = createCard({
        title: item.title || 'Sin título',
        subtitle: item.artistDisplayName || 'Artista desconocido',
        meta: `${item.objectDate || '—'} · ${item.department || '—'}`,
        imageSrc: item.primaryImageSmall || getImageFallbackSrc(item.title),
        actionLabel: 'Ver detalle',
        onAction: () => abrirDetalle(item),
      });
      grid.appendChild(card);
    });
    const summaryText = document.createElement('p');
    summaryText.textContent = `Mostrando ${itemsValidos.length} obras de ${total} resultados totales.`;
    resultsSummary.appendChild(summaryText);
    results.appendChild(grid);
  }

  renderAggregates(aggregates, total, itemsValidos.map((result) => result.value));
  renderPagination(pagination, filtros.page, total, (newPage) => {
    filtros.page = newPage;
    applyFilters(false); // Re-aplica filtros sin resetear la página
  });
}

function renderAggregates(aggregates, total, items) {
  aggregates.innerHTML = '';
  const title = document.createElement('h3');
  title.textContent = 'Agregados';

  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = 'Agregados calculados sobre los visibles. Total se refiere al search completo.';

  const metrics = document.createElement('div');
  metrics.className = 'aggregate-grid';

  const totalItem = createMetric('Total', total.toString());
  const loadedItem = createMetric('Cargados', items.length.toString());
  const departmentItem = createMetric('Departamento dominante', getDominantValue(items, 'department'));
  const centuryItem = createMetric('Siglo más frecuente', getDominantValue(items, 'century'));
  const cultureItem = createMetric('Cultura más frecuente', getDominantValue(items, 'culture'));

  metrics.append(totalItem, loadedItem, departmentItem, centuryItem, cultureItem);
  aggregates.append(title, note, metrics);
}

function createMetric(label, value) {
  const item = document.createElement('div');
  item.className = 'aggregate-item';
  const key = document.createElement('strong');
  key.textContent = label;
  const valueEl = document.createElement('span');
  valueEl.textContent = value || '—';
  item.append(key, valueEl);
  return item;
}

function getDominantValue(items, type) {
  if (!items.length) {
    return '—';
  }

  const counts = new Map();

  items.forEach((item) => {
    let value = '—';

    if (type === 'department') {
      value = item.department || 'Sin departamento';
    } else if (type === 'century') {
      value = getCenturyLabel(item.objectBeginDate || item.objectEndDate);
    } else if (type === 'culture') {
      value = item.culture || 'Sin cultura';
    }

    counts.set(value, (counts.get(value) || 0) + 1);
  });

  let dominant = '—';
  let maxCount = 0;
  counts.forEach((count, value) => {
    if (count > maxCount) {
      dominant = value;
      maxCount = count;
    }
  });

  return dominant;
}

function getCenturyLabel(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const year = Number(value);
  if (!Number.isFinite(year)) {
    return '—';
  }

  if (year < 0) {
    return `Siglo ${Math.floor(Math.abs(year) / 100) + 1} a. C.`;
  }

  return `Siglo ${Math.floor(year / 100) + 1}`;
}

function getNumericYear(item) {
  if (!item) {
    return null;
  }

  const candidates = [item.objectEndDate, item.objectBeginDate, item.objectDate];
  for (const value of candidates) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    const year = Number(value);
    if (Number.isFinite(year)) {
      return year;
    }
    const match = String(value).match(/(-?\d{1,4})/);
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function getYearDifference(itemA, itemB) {
  const yearA = getNumericYear(itemA);
  const yearB = getNumericYear(itemB);
  if (yearA === null || yearB === null) {
    return null;
  }
  return Math.abs(yearA - yearB);
}

function renderPagination(pagination, currentPage, total, onPageChange) {
  pagination.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(total / TAMANO_PAGINA));

  const previousButton = document.createElement('button');
  previousButton.textContent = 'Anterior';
  previousButton.disabled = currentPage <= 1;
  previousButton.addEventListener('click', () => onPageChange(currentPage - 1));

  const pageIndicator = document.createElement('span');
  pageIndicator.className = 'page-indicator';
  pageIndicator.textContent = `Página ${currentPage} de ${totalPages}`;

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Siguiente';
  nextButton.disabled = currentPage >= totalPages;
  nextButton.addEventListener('click', () => onPageChange(currentPage + 1));

  pagination.append(previousButton, pageIndicator, nextButton);
}

function renderDetailView(app, id) {
  app.innerHTML = '';
  app.appendChild(createState('Cargando detalle de la obra...'));

  const cachedItem = obtenerObjetoDeCache(id);
  if (cachedItem) {
    guardarItemReciente(cachedItem);
    renderDetailContent(app, cachedItem);
    return;
  }

  obtenerJson(`${API_BASE}/objects/${id}`)
    .then((item) => {
      guardarObjetoEnCache(item);
      guardarItemReciente(item);
      renderDetailContent(app, item);
    })
    .catch(() => {
      app.innerHTML = '';
      app.appendChild(createState('No se pudo cargar la obra solicitada.', { onRetry: () => renderDetailView(app, id) }));
    });
}

function renderDetailContent(app, item) {
  app.innerHTML = '';
  const section = document.createElement('section');
  section.className = 'panel detail-view';

  const title = document.createElement('h2');
  title.textContent = item.title || 'Sin título';

  const actions = document.createElement('div');
  actions.className = 'detail-actions';

  const back = document.createElement('button');
  back.className = 'secondary-btn';
  back.textContent = '← Volver';
  back.addEventListener('click', () => window.history.back());
  actions.appendChild(back);

  if (item.artistDisplayName) {
    const artistButton = document.createElement('button');
    artistButton.className = 'secondary-btn';
    artistButton.textContent = 'Ver más obras del artista';
    artistButton.addEventListener('click', () => navigateTo(`#artist/${encodeURIComponent(item.artistDisplayName)}`));
    actions.appendChild(artistButton);
  }

  const compareButton = document.createElement('button');
  compareButton.className = 'secondary-btn';
  compareButton.textContent = 'Comparar';
  compareButton.addEventListener('click', () => navigateTo(`#compare?selectedA=${encodeURIComponent(item.objectID)}`));
  actions.appendChild(compareButton);

  const layout = document.createElement('div');
  layout.className = 'detail-layout';

  const imageColumn = document.createElement('div');
  imageColumn.className = 'detail-image-column';

  const image = document.createElement('img');
  image.className = 'detail-image';
  image.src = item.primaryImage || item.primaryImageSmall || getImageFallbackSrc(item.title);
  image.alt = item.title || 'Obra';
  image.loading = 'eager';
  image.decoding = 'async';
  image.addEventListener('error', () => {
    image.src = getImageFallbackSrc(item.title);
  });
  imageColumn.appendChild(image);

  if (Array.isArray(item.additionalImages) && item.additionalImages.length) {
    const thumbs = document.createElement('div');
    thumbs.className = 'thumb-gallery';

    item.additionalImages.slice(0, 4).forEach((src) => {
      const thumb = document.createElement('img');
      thumb.className = 'thumb-image';
      thumb.src = src;
      thumb.alt = 'Imagen adicional';
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      thumb.addEventListener('error', () => {
        thumb.src = getImageFallbackSrc('Sin imagen');
      });
      thumbs.appendChild(thumb);
    });

    imageColumn.appendChild(thumbs);
  }

  const infoColumn = document.createElement('div');
  infoColumn.className = 'detail-info';

  const artist = document.createElement('p');
  artist.className = 'detail-subtitle';
  artist.textContent = item.artistDisplayName || 'Artista desconocido';

  const descriptionTitle = document.createElement('h3');
  descriptionTitle.textContent = 'Biografía del artista';
  const description = document.createElement('p');
  description.textContent = item.artistDisplayBio || 'Sin descripción disponible.';

  const metaSection = document.createElement('div');
  metaSection.className = 'meta-section';
  const metaTitle = document.createElement('h3');
  metaTitle.textContent = 'Ficha técnica';
  const metaList = document.createElement('dl');
  metaList.className = 'detail-meta';

  const fields = [
    ['Fecha', item.objectDate || '—'],
    ['Departamento', item.department || '—'],
    ['Técnica', item.medium || '—'],
    ['Dimensiones', item.dimensions || '—'],
    ['Cultura', item.culture || '—'],
    ['Periodo', item.period || '—'],
    ['Clasificación', item.classification || '—'],
    ['Adquisición', item.creditLine || '—'],
  ];

  fields.forEach(([label, value]) => {
    const term = document.createElement('dt');
    term.textContent = label;
    const definition = document.createElement('dd');
    definition.textContent = value;
    metaList.append(term, definition);
  });

  metaSection.append(metaTitle, metaList);

  const tagsSection = document.createElement('div');
  tagsSection.className = 'tags-section';
  const tagsTitle = document.createElement('h3');
  tagsTitle.textContent = 'Tags';
  const tags = document.createElement('div');
  tags.className = 'tag-list';

  if (Array.isArray(item.tags) && item.tags.length) {
    item.tags.slice(0, 12).forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.textContent = tag.term || 'Etiqueta';
      tags.appendChild(chip);
    });
  } else {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.textContent = 'Sin etiquetas';
    tags.appendChild(chip);
  }

  tagsSection.append(tagsTitle, tags);

  const externalSection = document.createElement('div');
  externalSection.className = 'meta-section';
  const externalTitle = document.createElement('h3');
  externalTitle.textContent = 'Ver en el museo';
  const externalLink = document.createElement('a');
  externalLink.href = item.objectURL || '#';
  externalLink.textContent = item.objectURL ? 'Abrir ficha oficial del Met' : 'No disponible';
  externalLink.target = '_blank';
  externalLink.rel = 'noopener noreferrer';
  externalLink.className = 'external-link';
  externalSection.append(externalTitle, externalLink);

  infoColumn.append(title, artist, descriptionTitle, description, metaSection, tagsSection, externalSection);
  layout.append(imageColumn, infoColumn);
  section.append(actions, layout);
  app.appendChild(section);
}

function renderDepartmentsView(app) {
  app.innerHTML = '';
  app.appendChild(createState('Cargando departamentos...'));

  obtenerJson(`${API_BASE}/departments`)
    .then((data) => {
      app.innerHTML = '';

      const section = document.createElement('section');
      section.className = 'panel';
      const title = document.createElement('h2');
      title.textContent = 'Departamentos';
      const intro = document.createElement('p');
      intro.textContent = 'Explora las áreas curatoriales del museo y filtra la colección por cada una de ellas.';
      section.append(title, intro);

      const grid = document.createElement('div');
      grid.className = 'grid';

      const departmentPromises = (data.departments || []).map(async (department) => {
        const icon = getDepartmentIcon(department.displayName || '');
        const card = createCard({
          title: `${icon} ${department.displayName || 'Departamento'}`,
          meta: 'Explora obras de este departamento',
          actionLabel: 'Ver obras',
          onAction: () => navigateTo(`#explore?departmentId=${department.departmentId || ''}`),
        });
        card.querySelector('img')?.remove();
        grid.appendChild(card);
      });

      Promise.all(departmentPromises)
        .catch(() => {
          // Ignorar fallos individuales y mostrar tarjetas con imágenes fallback.
        })
        .finally(() => {
          section.appendChild(grid);
          app.appendChild(section);
        });
    })
    .catch(() => {
      app.innerHTML = '';
      app.appendChild(createState('No se pudieron cargar los departamentos.', { onRetry: () => renderDepartmentsView(app) }));
    });
}

function renderArtistView(app, name, currentPage = 1) {
  app.innerHTML = '';
  app.appendChild(createState('Cargando obras del artista...'));

  const encodedName = encodeURIComponent(name || '');
  obtenerJson(`${API_BASE}/search?q=${encodedName}&artistOrCulture=true`)
    .then((data) => {
      const idsObjetos = Array.isArray(data.objectIDs) ? data.objectIDs.slice(0, 12) : [];
      const total = data.total || idsObjetos.length;
      const pageSize = TAMANO_PAGINA;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const pagina = Math.min(Math.max(1, currentPage), totalPages);
      const pageIds = idsObjetos.slice((pagina - 1) * pageSize, pagina * pageSize);

      app.innerHTML = '';
      const section = document.createElement('section');
      section.className = 'panel';

      const header = document.createElement('div');
      header.className = 'artist-header';
      const h2 = document.createElement('h2');
      h2.textContent = name ? `Obras de ${name}` : 'Obras del artista';
      const intro = document.createElement('p');
      intro.textContent = `Se encontraron ${total} obras asociadas.`;
      const backButton = document.createElement('button');
      backButton.className = 'secondary-btn';
      backButton.textContent = '← Volver';
      backButton.addEventListener('click', () => window.history.back());
      header.append(backButton, h2, intro);
      section.append(header);

      if (!pageIds.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No se encontraron obras asociadas a este artista.';
        section.appendChild(empty);
        app.appendChild(section);
        return;
      }

      return Promise.allSettled(pageIds.map((id) => obtenerJson(`${API_BASE}/objects/${id}`))).then((results) => {
        const grid = document.createElement('div');
        grid.className = 'grid';

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const item = result.value;
            const card = createCard({
              title: item.title || 'Sin título',
              subtitle: item.artistDisplayName || 'Artista desconocido',
              meta: `${item.objectDate || '—'} · ${item.department || '—'}`,
              imageSrc: item.primaryImageSmall || getImageFallbackSrc(item.title),
              actionLabel: 'Ver detalle',
              onAction: () => abrirDetalle(item),
            });
            grid.appendChild(card);
          }
        });

        section.appendChild(grid);

        if (totalPages > 1) {
          const pagination = document.createElement('div');
          pagination.className = 'pagination';

          const prev = document.createElement('button');
          prev.textContent = 'Anterior';
          prev.disabled = pagina <= 1;
          prev.addEventListener('click', () => renderArtistView(app, name, pagina - 1));

          const indicator = document.createElement('span');
          indicator.className = 'page-indicator';
          indicator.textContent = `Página ${pagina} de ${totalPages}`;

          const next = document.createElement('button');
          next.textContent = 'Siguiente';
          next.disabled = pagina >= totalPages;
          next.addEventListener('click', () => renderArtistView(app, name, pagina + 1));

          pagination.append(prev, indicator, next);
          section.appendChild(pagination);
        }

        app.appendChild(section);
      });
    })
    .catch(() => {
      app.innerHTML = '';
      app.appendChild(createState('No se pudieron cargar las obras del artista.', { onRetry: () => renderArtistView(app, name, currentPage) }));
    });
}

function renderCompareView(app, params = new URLSearchParams()) {
  app.innerHTML = '';
  const section = document.createElement('section');
  section.className = 'panel';

  const h2 = document.createElement('h2');
  h2.textContent = 'Comparador';
  const intro = document.createElement('p');
  intro.textContent = 'Busca dos obras y compáralas lado a lado.';
  section.append(h2, intro);

  const compareLayout = document.createElement('div');
  compareLayout.className = 'compare-layout';

  const state = {
    selectedA: null,
    selectedB: null,
  };

  const selectedAId = params.get('selectedA');

  const panelA = createComparePanel('Obra A', state, 'A');
  const panelB = createComparePanel('Obra B', state, 'B');

  compareLayout.append(panelA, panelB);
  section.appendChild(compareLayout);

  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'comparison-table-wrapper';
  section.appendChild(tableWrapper);

  const initSelections = async () => {
    const saved = cargarEstadoComparador();
    if (selectedAId) {
      try {
        const item = await obtenerJson(`${API_BASE}/objects/${selectedAId}`);
        if (item) {
          const sel = panelA.querySelector('.compare-selected');
          sel.innerHTML = '';
          const card = createCard({
            title: item.title || 'Sin título',
            subtitle: item.artistDisplayName || 'Artista desconocido',
            meta: `${item.objectDate || '—'} · ${item.department || '—'}`,
            imageSrc: item.primaryImageSmall || getImageFallbackSrc(item.title),
            actionLabel: 'Seleccionada',
            onAction: () => {},
          });
          sel.appendChild(card);
          state.selectedA = item;
        }
      } catch {
        // ignore
      }
    }

    if (saved) {
      if (!state.selectedA && saved.A && saved.A.objectID) {
        try {
          const item = await obtenerJson(`${API_BASE}/objects/${saved.A.objectID}`);
          if (item) {
            const sel = panelA.querySelector('.compare-selected');
            sel.innerHTML = '';
            const card = createCard({
              title: item.title || 'Sin título',
              subtitle: item.artistDisplayName || 'Artista desconocido',
              meta: `${item.objectDate || '—'} · ${item.department || '—'}`,
              imageSrc: item.primaryImageSmall || getImageFallbackSrc(item.title),
              actionLabel: 'Seleccionada',
              onAction: () => {},
            });
            sel.appendChild(card);
            state.selectedA = item;
          }
        } catch {
          // ignore
        }
      }
      if (saved.B && saved.B.objectID) {
        try {
          const item = await obtenerJson(`${API_BASE}/objects/${saved.B.objectID}`);
          if (item) {
            const sel = panelB.querySelector('.compare-selected');
            sel.innerHTML = '';
            const card = createCard({
              title: item.title || 'Sin título',
              subtitle: item.artistDisplayName || 'Artista desconocido',
              meta: `${item.objectDate || '—'} · ${item.department || '—'}`,
              imageSrc: item.primaryImageSmall || getImageFallbackSrc(item.title),
              actionLabel: 'Seleccionada',
              onAction: () => {},
            });
            sel.appendChild(card);
            state.selectedB = item;
          }
        } catch {
          // ignore
        }
      }
    }

    renderComparison();
  };

  initSelections();
  tableWrapper.className = 'comparison-table-wrapper';
  section.appendChild(tableWrapper);

  const renderComparison = () => {
    if (!state.selectedA || !state.selectedB) {
      tableWrapper.innerHTML = '';
      const emptyState = document.createElement('p');
      emptyState.className = 'compare-note';
      emptyState.textContent = 'Selecciona dos obras para ver una comparación detallada.';
      tableWrapper.appendChild(emptyState);
      return;
    }

    const table = document.createElement('table');
    table.className = 'comparison-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const titleCell = document.createElement('th');
    titleCell.textContent = 'Atributo';
    const leftCell = document.createElement('th');
    leftCell.textContent = 'Obra A';
    const rightCell = document.createElement('th');
    rightCell.textContent = 'Obra B';
    headRow.append(titleCell, leftCell, rightCell);
    thead.appendChild(headRow);

    const rows = [
      ['Artista', state.selectedA.artistDisplayName || 'Artista desconocido', state.selectedB.artistDisplayName || 'Artista desconocido'],
      ['Fecha', state.selectedA.objectDate || '—', state.selectedB.objectDate || '—'],
      ['Departamento', state.selectedA.department || '—', state.selectedB.department || '—'],
      ['Técnica', state.selectedA.medium || '—', state.selectedB.medium || '—'],
      ['Clasificación', state.selectedA.classification || '—', state.selectedB.classification || '—'],
      ['Cultura', state.selectedA.culture || '—', state.selectedB.culture || '—'],
      ['Obra destacada', state.selectedA.isHighlight ? 'Sí' : 'No', state.selectedB.isHighlight ? 'Sí' : 'No'],
      ['Dominio público', state.selectedA.isPublicDomain ? 'Sí' : 'No', state.selectedB.isPublicDomain ? 'Sí' : 'No'],
    ];

    const tbody = document.createElement('tbody');
    rows.forEach(([label, left, right]) => {
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('th');
      tdLabel.textContent = label;

      const tdLeft = document.createElement('td');
      tdLeft.textContent = left;
      const tdRight = document.createElement('td');
      tdRight.textContent = right;

      const hasDifference = `${left}`.trim().toLowerCase() !== `${right}`.trim().toLowerCase();
      if (hasDifference) {
        tdLabel.className = 'diff-label';
        tdLeft.className = 'diff-cell';
        tdRight.className = 'diff-cell';

        const badge = document.createElement('span');
        badge.className = 'diff-badge';
        badge.textContent = 'Diferente';
        tdLeft.appendChild(badge);
        tdRight.appendChild(badge.cloneNode(true));
      }

      tr.append(tdLabel, tdLeft, tdRight);
      tbody.appendChild(tr);
    });

    table.append(thead, tbody);
    tableWrapper.innerHTML = '';
    tableWrapper.appendChild(table);

    const diffYears = getYearDifference(state.selectedA, state.selectedB);
    if (diffYears !== null) {
      const diffNote = document.createElement('p');
      diffNote.className = 'compare-note';
      diffNote.textContent = `Diferencia de años entre las obras: ${diffYears} años.`;
      tableWrapper.appendChild(diffNote);
    }

    const note = document.createElement('p');
    note.className = 'compare-note';
    note.textContent = 'Las celdas resaltadas indican diferencias entre las obras seleccionadas.';
    tableWrapper.appendChild(note);
  };

  const applySelection = (panelKey, item) => {
    if (panelKey === 'A') {
      state.selectedA = item;
    } else {
      state.selectedB = item;
    }
    guardarEstadoComparador(state);
    renderComparison();
  };

  panelA.dataset.onSelect = 'A';
  panelB.dataset.onSelect = 'B';
  panelA.addEventListener('select-item', (event) => {
    applySelection(event.detail.panelKey, event.detail.item);
  });
  panelB.addEventListener('select-item', (event) => {
    applySelection(event.detail.panelKey, event.detail.item);
  });
  panelA.addEventListener('clear-selection', (event) => {
    if (event.detail.panelKey === 'A') {
      state.selectedA = null;
    }
    guardarEstadoComparador(state);
    renderComparison();
  });
  panelB.addEventListener('clear-selection', (event) => {
    if (event.detail.panelKey === 'B') {
      state.selectedB = null;
    }
    guardarEstadoComparador(state);
    renderComparison();
  });

  app.appendChild(section);
}

function createComparePanel(title, state, panelKey) {
  const panel = document.createElement('div');
  panel.className = 'compare-panel';

  const heading = document.createElement('h3');
  heading.textContent = title;
  panel.appendChild(heading);

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Busca una obra por nombre o artista';
  panel.appendChild(searchInput);

  const results = document.createElement('div');
  results.className = 'compare-results';
  panel.appendChild(results);

  const selected = document.createElement('div');
  selected.className = 'compare-selected';
  panel.appendChild(selected);

  const changeButton = document.createElement('button');
  changeButton.className = 'secondary-btn compare-change-btn';
  changeButton.textContent = 'Cambiar selección';
  changeButton.style.display = 'none';
  panel.appendChild(changeButton);

  panel.setSelectionState = (isSelected) => {
    changeButton.style.display = isSelected ? 'inline-flex' : 'none';
  };

  changeButton.addEventListener('click', () => {
    selected.innerHTML = '';
    results.innerHTML = '';
    searchInput.value = '';
    panel.setSelectionState(false);
    panel.dispatchEvent(new CustomEvent('clear-selection', { detail: { panelKey } }));
  });

  let debounceTimer;

  searchInput.addEventListener('input', () => {
    const value = searchInput.value.trim();
    clearTimeout(debounceTimer);
    results.innerHTML = '';

    if (!value) {
      results.appendChild(createState('Busca y elige una obra para comparar.'));
      return;
    }

    results.appendChild(createState('Buscando obras...'));

    debounceTimer = window.setTimeout(() => {
      obtenerJson(`${API_BASE}/search?q=${encodeURIComponent(value)}&hasImages=true`)
        .then((data) => {
          const ids = (data.objectIDs || []).slice(0, 4);
          if (!ids.length) {
            results.innerHTML = '';
            results.appendChild(createState('No se encontraron obras con ese término.'));
            return;
          }

          return Promise.allSettled(ids.map((id) => obtenerJson(`${API_BASE}/objects/${id}`))).then((resolved) => {
            results.innerHTML = '';
            resolved.forEach((result) => {
              if (result.status === 'fulfilled' && result.value) {
                const item = result.value;
                const suggestion = document.createElement('button');
                suggestion.className = 'suggestion-card';
                suggestion.innerHTML = `<strong>${item.title || 'Sin título'}</strong><span>${item.artistDisplayName || 'Artista desconocido'}</span>`;

                const alreadySelected = panelKey === 'A' ? state.selectedB?.objectID === item.objectID : state.selectedA?.objectID === item.objectID;
                suggestion.disabled = Boolean(alreadySelected);

                suggestion.addEventListener('click', () => {
                  if (suggestion.disabled) {
                    return;
                  }

                  selected.innerHTML = '';
                  const card = createCard({
                    title: item.title || 'Sin título',
                    subtitle: item.artistDisplayName || 'Artista desconocido',
                    meta: `${item.objectDate || '—'} · ${item.department || '—'}`,
                    imageSrc: item.primaryImageSmall || getImageFallbackSrc(item.title),
                    actionLabel: 'Seleccionada',
                    onAction: () => {},
                  });
                  selected.appendChild(card);
                  results.innerHTML = '';
                  panel.setSelectionState(true);
                  panel.dispatchEvent(new CustomEvent('select-item', { detail: { panelKey, item } }));
                });
                results.appendChild(suggestion);
              }
            });
          });
        })
        .catch(() => {
          results.innerHTML = '';
          results.appendChild(createState('No se pudo buscar en este momento.', { onRetry: () => searchInput.dispatchEvent(new Event('input')) }));
        });
    }, 400);
  });

  return panel;
}

export {
  renderHomeView,
  renderExploreView,
  renderDetailView,
  renderDepartmentsView,
  renderArtistView,
  renderCompareView,
};
