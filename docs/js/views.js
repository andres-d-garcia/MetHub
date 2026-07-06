import { API_BASE, fetchJson } from './api.js';
import { createCard, createState, getImageFallbackSrc } from './components.js';
import { navigateTo } from './router.js';

const PAGE_SIZE = 12;
const FALLBACK_OBJECTS = {
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

const FALLBACK_HIGHLIGHTS = [
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

function getFallbackObjectById(id) {
  if (!id) {
    return null;
  }

  return FALLBACK_OBJECTS[String(id)] || null;
}

function getFallbackObjectIdsByQuery(query = '') {
  const normalized = (query || '').toLowerCase();

  if (normalized.includes('starry') || normalized.includes('night') || normalized.includes('van gogh')) {
    return [436535];
  }

  if (normalized.includes('mona') || normalized.includes('lisa') || normalized.includes('da vinci') || normalized.includes('leonardo')) {
    return [437980];
  }

  if (normalized.includes('wave') || normalized.includes('hokusai') || normalized.includes('kanagawa') || normalized.includes('japan')) {
    return [459055];
  }

  return [436535, 437980, 459055];
}

function resolveObjectDetails(ids) {
  const safeIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
  return Promise.allSettled(safeIds.map((id) => fetchJson(`${API_BASE}/objects/${id}`).catch(() => getFallbackObjectById(id))));
}

function renderHomeView(app) {
  app.innerHTML = '';
  app.appendChild(createState('Cargando obras destacadas...'));

  Promise.allSettled([
    fetchJson(`${API_BASE}/departments`),
    fetchJson(`${API_BASE}/search?isHighlight=true&hasImages=true`),
  ])
    .then(([departmentsResult, searchResult]) => {
      if (departmentsResult.status === 'rejected' || searchResult.status === 'rejected') {
        renderHomeContent(app, 19, FALLBACK_HIGHLIGHTS.length, FALLBACK_HIGHLIGHTS.map((item) => ({ status: 'fulfilled', value: item })));
        return;
      }

      const departments = departmentsResult.value?.departments || [];
      const objectIds = (searchResult.value?.objectIDs || []).slice(0, 8);

      if (!objectIds.length) {
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

      return Promise.allSettled(objectIds.map((id) => fetchJson(`${API_BASE}/objects/${id}`))).then((results) => {
        renderHomeContent(app, departments.length, objectIds.length, results);
      });
    })
    .catch(() => {
      renderHomeContent(app, 19, FALLBACK_HIGHLIGHTS.length, FALLBACK_HIGHLIGHTS.map((item) => ({ status: 'fulfilled', value: item })));
    });
}

function renderHomeContent(app, totalDepartments, totalHighlights, objectResults) {
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
  hero.append(title, intro, note);
  app.appendChild(hero);

  const statsSection = document.createElement('section');
  statsSection.className = 'stats-section';

  const statsCard1 = document.createElement('div');
  statsCard1.className = 'stat-card';
  statsCard1.innerHTML = `<strong>${totalDepartments}</strong><span>Departamentos</span>`;

  const statsCard2 = document.createElement('div');
  statsCard2.className = 'stat-card';
  statsCard2.innerHTML = `<strong>${totalHighlights}</strong><span>Obras destacadas</span>`;

  const statsCard3 = document.createElement('div');
  statsCard3.className = 'stat-card';
  statsCard3.innerHTML = '<strong>SPA</strong><span>Navegación sin recarga</span>';

  statsSection.append(statsCard1, statsCard2, statsCard3);
  app.appendChild(statsSection);

  const gallerySection = document.createElement('section');
  gallerySection.className = 'gallery-section';
  const galleryTitle = document.createElement('h2');
  galleryTitle.textContent = 'Obras destacadas';
  gallerySection.appendChild(galleryTitle);

  const grid = document.createElement('div');
  grid.className = 'grid';

  const validItems = objectResults.filter((result) => result.status === 'fulfilled' && result.value);

  if (!validItems.length) {
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
      onAction: () => navigateTo(`#detail/${item.objectID}`),
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

function renderExploreView(app, params = new URLSearchParams()) {
  app.innerHTML = '';

  const section = document.createElement('section');
  section.className = 'panel';

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
    page: 1,
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

  const results = document.createElement('div');
  results.className = 'results-grid';
  section.appendChild(results);

  const pagination = document.createElement('div');
  pagination.className = 'pagination';
  section.appendChild(pagination);

  app.appendChild(section);

  let searchTimer;

  const applyFilters = (resetPage = true) => {
    if (resetPage) {
      filters.page = 1;
    }

    clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      loadExploreResults(app, filters, { results, aggregates, pagination });
    }, 400);
  };

  const resetForm = () => {
    filters.q = '';
    filters.department = '';
    filters.yearFrom = '';
    filters.yearTo = '';
    filters.isHighlight = false;
    filters.hasImages = false;
    filters.page = 1;
    searchInput.value = '';
    departmentSelect.value = '';
    yearFromInput.value = '';
    yearToInput.value = '';
    highlightCheckbox.checked = false;
    imageCheckbox.checked = false;
    applyFilters(true);
  };

  searchInput.addEventListener('input', () => {
    filters.q = searchInput.value.trim();
    applyFilters(true);
  });

  departmentSelect.addEventListener('change', () => {
    filters.department = departmentSelect.value;
    applyFilters(true);
  });

  yearFromInput.addEventListener('input', () => {
    filters.yearFrom = yearFromInput.value;
    applyFilters(true);
  });

  yearToInput.addEventListener('input', () => {
    filters.yearTo = yearToInput.value;
    applyFilters(true);
  });

  highlightCheckbox.addEventListener('change', () => {
    filters.isHighlight = highlightCheckbox.checked;
    applyFilters(true);
  });

  imageCheckbox.addEventListener('change', () => {
    filters.hasImages = imageCheckbox.checked;
    applyFilters(true);
  });

  clearButton.addEventListener('click', resetForm);

  fetchJson(`${API_BASE}/departments`)
    .then((data) => {
      populateDepartments(departmentSelect, data.departments || []);
      if (filters.department) {
        departmentSelect.value = filters.department;
      }
      if (filters.q) {
        searchInput.value = filters.q;
      }
      if (filters.yearFrom) {
        yearFromInput.value = filters.yearFrom;
      }
      if (filters.yearTo) {
        yearToInput.value = filters.yearTo;
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

  loadExploreResults(app, filters, { results, aggregates, pagination });
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

function loadExploreResults(app, filters, elements) {
  const { results, aggregates, pagination } = elements;

  results.innerHTML = '';
  results.appendChild(createState('Cargando resultados...'));

  const params = new URLSearchParams();
  if (filters.q) {
    params.set('q', filters.q);
  }
  if (filters.department) {
    params.set('departmentId', filters.department);
  }
  if (filters.yearFrom) {
    params.set('dateBegin', filters.yearFrom);
  }
  if (filters.yearTo) {
    params.set('dateEnd', filters.yearTo);
  }
  if (filters.isHighlight) {
    params.set('isHighlight', 'true');
  }
  if (filters.hasImages) {
    params.set('hasImages', 'true');
  }

  const startIndex = (filters.page - 1) * PAGE_SIZE;

  fetchJson(`${API_BASE}/search?${params.toString()}`)
    .then((data) => {
      const objectIds = Array.isArray(data?.objectIDs) && data.objectIDs.length ? data.objectIDs : getFallbackObjectIdsByQuery(filters.q);
      const total = Array.isArray(data?.objectIDs) && data.objectIDs.length ? data.total || objectIds.length : objectIds.length;
      const pageIds = objectIds.slice(startIndex, startIndex + PAGE_SIZE);

      if (!pageIds.length) {
        renderEmptyExploreState(results, aggregates, pagination, total);
        return;
      }

      return resolveObjectDetails(pageIds).then((resolvedResults) => {
        renderExploreResults(app, filters, { results, aggregates, pagination }, total, resolvedResults);
      });
    })
    .catch(() => {
      const fallbackIds = getFallbackObjectIdsByQuery(filters.q);
      const pageIds = fallbackIds.slice(startIndex, startIndex + PAGE_SIZE);

      if (!pageIds.length) {
        renderEmptyExploreState(results, aggregates, pagination, 0);
        return;
      }

      return resolveObjectDetails(pageIds).then((resolvedResults) => {
        renderExploreResults(app, filters, { results, aggregates, pagination }, fallbackIds.length, resolvedResults);
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

function renderExploreResults(app, filters, elements, total, resolvedResults) {
  const { results, aggregates, pagination } = elements;
  const validItems = resolvedResults.filter((result) => result.status === 'fulfilled' && result.value);

  results.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'results-grid';

  if (!validItems.length) {
    grid.appendChild(createState('No se pudieron cargar las obras de esta página.'));
    results.appendChild(grid);
  } else {
    validItems.forEach((result) => {
      const item = result.value;
      const card = createCard({
        title: item.title || 'Sin título',
        subtitle: item.artistDisplayName || 'Artista desconocido',
        meta: `${item.objectDate || '—'} · ${item.department || '—'}`,
        imageSrc: item.primaryImageSmall || getImageFallbackSrc(item.title),
        actionLabel: 'Ver detalle',
        onAction: () => navigateTo(`#detail/${item.objectID}`),
      });
      grid.appendChild(card);
    });
    results.appendChild(grid);
  }

  renderAggregates(aggregates, total, validItems.map((result) => result.value));
  renderPagination(pagination, filters, total);
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

function renderPagination(pagination, filters, total) {
  pagination.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);

  const previousButton = document.createElement('button');
  previousButton.textContent = 'Anterior';
  previousButton.disabled = currentPage <= 1;
  previousButton.addEventListener('click', () => {
    filters.page = Math.max(1, currentPage - 1);
    loadExploreResults(document.getElementById('app'), filters, {
      results: pagination.parentElement.querySelector('.results-grid'),
      aggregates: pagination.parentElement.querySelector('.aggregate-panel'),
      pagination,
    });
  });

  const pageIndicator = document.createElement('span');
  pageIndicator.className = 'page-indicator';
  pageIndicator.textContent = `Página ${currentPage} de ${totalPages}`;

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Siguiente';
  nextButton.disabled = currentPage >= totalPages;
  nextButton.addEventListener('click', () => {
    filters.page = Math.min(totalPages, currentPage + 1);
    loadExploreResults(document.getElementById('app'), filters, {
      results: pagination.parentElement.querySelector('.results-grid'),
      aggregates: pagination.parentElement.querySelector('.aggregate-panel'),
      pagination,
    });
  });

  pagination.append(previousButton, pageIndicator, nextButton);
}

function renderDetailView(app, id) {
  app.innerHTML = '';
  app.appendChild(createState('Cargando detalle de la obra...'));

  fetchJson(`${API_BASE}/objects/${id}`)
    .then((item) => {
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
      compareButton.addEventListener('click', () => navigateTo('#compare'));
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

      infoColumn.append(title, artist, descriptionTitle, description, metaSection, tagsSection);
      layout.append(imageColumn, infoColumn);
      section.append(actions, layout);
      app.appendChild(section);
    })
    .catch(() => {
      app.innerHTML = '';
      app.appendChild(createState('No se pudo cargar la obra solicitada.', { onRetry: () => renderDetailView(app, id) }));
    });
}

function renderDepartmentsView(app) {
  app.innerHTML = '';
  app.appendChild(createState('Cargando departamentos...'));

  fetchJson(`${API_BASE}/departments`)
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

      (data.departments || []).forEach((department) => {
        const icon = getDepartmentIcon(department.displayName || '');
        const card = createCard({
          title: `${icon} ${department.displayName || 'Departamento'}`,
          subtitle: `ID ${department.departmentId || '—'}`,
          meta: 'Explora obras de este departamento',
          actionLabel: 'Ver obras',
          onAction: () => navigateTo(`#explore?departmentId=${department.departmentId || ''}`),
        });
        grid.appendChild(card);
      });

      section.appendChild(grid);
      app.appendChild(section);
    })
    .catch(() => {
      app.innerHTML = '';
      app.appendChild(createState('No se pudieron cargar los departamentos.', { onRetry: () => renderDepartmentsView(app) }));
    });
}

function renderArtistView(app, name) {
  app.innerHTML = '';
  app.appendChild(createState('Cargando obras del artista...'));

  const encodedName = encodeURIComponent(name || '');
  fetchJson(`${API_BASE}/search?q=${encodedName}&artistOrCulture=true`)
    .then((data) => {
      const objectIds = data.objectIDs || [];
      const total = data.total || 0;
      const firstIds = objectIds.slice(0, 12);

      if (!firstIds.length) {
        app.innerHTML = '';
        const section = document.createElement('section');
        section.className = 'panel';
        const h2 = document.createElement('h2');
        h2.textContent = name ? `Obras de ${name}` : 'Obras del artista';
        const p = document.createElement('p');
        p.textContent = 'No se encontraron obras asociadas a este artista.';
        section.append(h2, p);
        app.appendChild(section);
        return;
      }

      return Promise.allSettled(firstIds.map((id) => fetchJson(`${API_BASE}/objects/${id}`))).then((results) => {
        app.innerHTML = '';
        const section = document.createElement('section');
        section.className = 'panel';

        const h2 = document.createElement('h2');
        h2.textContent = name ? `Obras de ${name}` : 'Obras del artista';
        const intro = document.createElement('p');
        intro.textContent = `Se encontraron ${total} obras asociadas.`;
        section.append(h2, intro);

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
              onAction: () => navigateTo(`#detail/${item.objectID}`),
            });
            grid.appendChild(card);
          }
        });

        section.appendChild(grid);
        app.appendChild(section);
      });
    })
    .catch(() => {
      app.innerHTML = '';
      app.appendChild(createState('No se pudieron cargar las obras del artista.', { onRetry: () => renderArtistView(app, name) }));
    });
}

function renderCompareView(app) {
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

  const panelA = createComparePanel('Obra A', state, 'A');
  const panelB = createComparePanel('Obra B', state, 'B');

  compareLayout.append(panelA, panelB);
  section.appendChild(compareLayout);

  const tableWrapper = document.createElement('div');
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
      fetchJson(`${API_BASE}/search?q=${encodeURIComponent(value)}&hasImages=true`)
        .then((data) => {
          const ids = (data.objectIDs || []).slice(0, 6);
          if (!ids.length) {
            results.innerHTML = '';
            results.appendChild(createState('No se encontraron obras con ese término.'));
            return;
          }

          return Promise.allSettled(ids.map((id) => fetchJson(`${API_BASE}/objects/${id}`))).then((resolved) => {
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
