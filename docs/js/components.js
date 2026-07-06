function createCard({ title, subtitle, meta, imageSrc, onAction, actionLabel = 'Ver detalle' }) {
  const article = document.createElement('article');
  article.className = 'card';

  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = title || 'Obra';
    article.appendChild(img);
  }

  const titleEl = document.createElement('h3');
  titleEl.textContent = title || 'Sin título';
  article.appendChild(titleEl);

  if (subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.textContent = subtitle;
    article.appendChild(subtitleEl);
  }

  if (meta) {
    const metaEl = document.createElement('p');
    metaEl.textContent = meta;
    article.appendChild(metaEl);
  }

  if (onAction) {
    const button = document.createElement('button');
    button.textContent = actionLabel;
    button.addEventListener('click', onAction);
    article.appendChild(button);
  }

  return article;
}

function createState(message, options = {}) {
  const section = document.createElement('section');
  section.className = 'state';

  if (options.title) {
    const heading = document.createElement('h2');
    heading.textContent = options.title;
    section.appendChild(heading);
  }

  const text = document.createElement('p');
  text.textContent = message;
  section.appendChild(text);

  if (options.onRetry) {
    const button = document.createElement('button');
    button.className = 'retry-btn';
    button.textContent = 'Reintentar';
    button.addEventListener('click', options.onRetry);
    section.appendChild(button);
  }

  return section;
}

export { createCard, createState };
