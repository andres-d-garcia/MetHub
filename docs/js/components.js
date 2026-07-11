function getImageFallbackSrc(title = 'Sin imagen') {
  const text = String(title || 'Sin imagen')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="100%" height="100%" fill="#f5efe6" />
      <rect x="24" y="24" width="552" height="352" rx="24" fill="#fffdf8" stroke="#ddd3c4" stroke-width="3" />
      <text x="50%" y="48%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="28" fill="#8b3e2f">${text}</text>
      <text x="50%" y="62%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="20" fill="#666">Sin imagen disponible</text>
    </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function openImagePreview(src, alt = 'Imagen ampliada') {
  const existing = document.querySelector('.image-preview-overlay');
  if (existing) {
    existing.remove();
  }

  const overlay = document.createElement('div');
  overlay.className = 'image-preview-overlay';

  const modal = document.createElement('div');
  modal.className = 'image-preview-modal';

  const closeButton = document.createElement('button');
  closeButton.className = 'image-preview-close';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Cerrar imagen ampliada');

  const image = document.createElement('img');
  image.src = src || getImageFallbackSrc(alt);
  image.alt = alt || 'Imagen ampliada';
  image.loading = 'eager';
  image.decoding = 'async';

  closeButton.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.remove();
    }
  });

  modal.append(closeButton, image);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function createCard({ title, subtitle, meta, imageSrc, onAction, actionLabel = 'Ver detalle' }) {
  const article = document.createElement('article');
  article.className = 'card';

  if (onAction) {
    article.classList.add('actionable');
    article.addEventListener('click', onAction);
    article.setAttribute('role', 'button');
    article.setAttribute('tabindex', '0');
    article.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onAction();
      }
    });
  }

  if (imageSrc || true) {
    const img = document.createElement('img');
    img.src = imageSrc || getImageFallbackSrc(title);
    img.alt = title || 'Obra';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', (event) => {
      event.stopPropagation();
      openImagePreview(img.src, img.alt);
    });
    img.addEventListener('error', () => {
      img.src = getImageFallbackSrc(title);
    });
    article.appendChild(img);
  }

  const body = document.createElement('div');
  body.className = 'card-body';

  const titleEl = document.createElement('h3');
  titleEl.textContent = title || 'Sin título';
  body.appendChild(titleEl);

  if (subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.textContent = subtitle;
    body.appendChild(subtitleEl);
  }

  if (meta) {
    const metaEl = document.createElement('p');
    metaEl.textContent = meta;
    body.appendChild(metaEl);
  }

  article.appendChild(body);

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

export { createCard, createState, getImageFallbackSrc, openImagePreview };
