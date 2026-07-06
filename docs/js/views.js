import { API_BASE, fetchJson } from './api.js';
import { createCard, createState } from './components.js';
import { navigateTo } from './router.js';

const PAGE_SIZE = 12;

function renderHomeView(app) {
  app.innerHTML = '';
  app.appendChild(createState('Cargando obras destacadas...'));

  Promise.allSettled([
    fetchJson(`${API_BASE}/departments`),
    fetchJson(`${API_BASE}/search?isHighlight=true&hasImages=true`),
  ])
    .then(([departmentsResult, searchResult]) => {
      if (departmentsResult.status === 'rejected' || searchResult.status === 'rejected') {
        app.innerHTML = '';
        app.appendChild(createState('No se pudieron cargar los datos del museo.', { onRetry: () => renderHomeView(app) }));
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
      app.innerHTML = '';
      app.appendChild(createState('Ocurrió un error inesperado.', { onRetry: () => renderHomeView(app) }));
    });
}

function renderHomeContent(app, totalDepartments, totalHighlights, objectResults) {
  app.innerHTML = '';

  const hero = document.createElement('section');
  hero.className = 'hero';
  const title = document.createElement('h1');
  title.textContent = 'Explora la colección del Met';
  const intro = document.createElement('p');
  intro.textContent = 'Una SPA inicial para navegar la colección del museo usando la API pública.';
  const stats = document.createElement('p');
  stats.textContent = `Departamentos: ${totalDepartments} · Obras destacadas revisadas: ${totalHighlights}`;
  hero.append(title, intro, stats);
  app.appendChild(hero);

  const grid = document.createElement('div');
  grid.className = 'grid';

  const validItems = objectResults.filter((result) => result.status === 'fulfilled' && result.value);

  if (!validItems.length) {
    grid.appendChild(createState('No se pudieron cargar obras destacadas en este momento.'));
    app.appendChild(grid);
    return;
  }

  validItems.forEach((result) => {
    const item = result.value;
    const card = createCard({
      title: item.title || 'Sin título',
      subtitle: item.artistDisplayName || 'Artista desconocido',
      meta: `${item.objectDate || '—'} · ${item.department || '—'}`,
      imageSrc: item.primaryImageSmall || 'https://via.placeholder.com/300x220?text=Sin+imagen',
      actionLabel: 'Ver detalle',
      onAction: () => navigateTo(`#detail/${item.objectID}`),
    });
    grid.appendChild(card);
  });

  app.appendChild(grid);
}

function renderExploreView(app) {
  app.innerHTML = '';

  const section = document.createElement('section');
  section.className = 'panel';

  const title = document.createElement('h2');
  title.textContent = 'Explorar';
  section.appendChild(title);

  const controls = document.createElement('div');
  controls.className = 'filter-panel';

  const filters = {
    q: '',
    department: '',
    yearFrom: '',
    yearTo: '',
    isHighlight: false,
    hasImages: false,
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
    .then((data) => populateDepartments(departmentSelect, data.departments || []))
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

  fetchJson(`${API_BASE}/search?${params.toString()}`)
    .then((data) => {
      const objectIds = data.objectIDs || [];
      const total = data.total || 0;
      const startIndex = (filters.page - 1) * PAGE_SIZE;
      const pageIds = objectIds.slice(startIndex, startIndex + PAGE_SIZE);

      if (!pageIds.length) {
        renderEmptyExploreState(results, aggregates, pagination, total);
        return;
      }

      return Promise.allSettled(pageIds.map((id) => fetchJson(`${API_BASE}/objects/${id}`))).then((resolvedResults) => {
        renderExploreResults(app, filters, { results, aggregates, pagination }, total, resolvedResults);
      });
    })
    .catch(() => {
      results.innerHTML = '';
      results.appendChild(createState('No se pudieron cargar los resultados.', { onRetry: () => loadExploreResults(app, filters, elements) }));
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
        imageSrc: item.primaryImageSmall || 'https://via.placeholder.com/300x220?text=Sin+imagen',
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
      image.src = item.primaryImage || item.primaryImageSmall || 'https://via.placeholder.com/400x300?text=Sin+imagen';
      image.alt = item.title || 'Obra';
      imageColumn.appendChild(image);

      if (Array.isArray(item.additionalImages) && item.additionalImages.length) {
        const thumbs = document.createElement('div');
        thumbs.className = 'thumb-gallery';

        item.additionalImages.slice(0, 4).forEach((src) => {
          const thumb = document.createElement('img');
          thumb.className = 'thumb-image';
          thumb.src = src;
          thumb.alt = 'Imagen adicional';
          thumbs.appendChild(thumb);
        });

        imageColumn.appendChild(thumbs);
      }

      const infoColumn = document.createElement('div');
      infoColumn.className = 'detail-info';

      const artist = document.createElement('p');
      artist.className = 'detail-subtitle';
      artist.textContent = item.artistDisplayName || 'Artista desconocido';

      const description = document.createElement('p');
      description.textContent = item.artistDisplayBio || item.objectDate || 'Sin descripción';

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

      infoColumn.append(title, artist, description, metaList, tags);
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
      const grid = document.createElement('div');
      grid.className = 'grid';

      (data.departments || []).forEach((department) => {
        const card = createCard({
          title: department.displayName || 'Departamento',
          actionLabel: 'Ver obras',
          onAction: () => navigateTo('#explore'),
        });
        grid.appendChild(card);
      });

      app.appendChild(grid);
    })
    .catch(() => {
      app.innerHTML = '';
      app.appendChild(createState('No se pudieron cargar los departamentos.', { onRetry: () => renderDepartmentsView(app) }));
    });
}

function renderArtistView(app, name) {
  app.innerHTML = '';
  const section = document.createElement('section');
  section.className = 'panel';
  const h2 = document.createElement('h2');
  h2.textContent = name ? `Obras de ${name}` : 'Obras del artista';
  const p = document.createElement('p');
  p.textContent = 'Aquí se mostrará la lista de obras de un artista cuando se implemente la búsqueda.';
  section.append(h2, p);
  app.appendChild(section);
}

function renderCompareView(app) {
  app.innerHTML = '';
  const section = document.createElement('section');
  section.className = 'panel';
  const h2 = document.createElement('h2');
  h2.textContent = 'Comparador';
  const p = document.createElement('p');
  p.textContent = 'Aquí irá el buscador interno de dos paneles y la tabla comparativa.';
  section.append(h2, p);
  app.appendChild(section);
}

export {
  renderHomeView,
  renderExploreView,
  renderDetailView,
  renderDepartmentsView,
  renderArtistView,
  renderCompareView,
};
