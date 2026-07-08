const API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

function getCacheKey(url) {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    return `methub-cache:${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return `methub-cache:${url}`;
  }
}

function readCache(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignorar errores de almacenamiento
  }
}

async function fetchJson(url, options = {}) {
  const parsedUrl = new URL(url, window.location.origin);
  const maxAttempts = options.maxAttempts || 3;
  const retryDelayMs = options.retryDelayMs || 700;
  const cacheKey = getCacheKey(parsedUrl.toString());
  const cached = options.skipCache ? null : readCache(cacheKey);

  // 1. Verificar si hay datos en caché antes de hacer la petición
  if (cached) {
    return cached;
  }

  let lastError = null;

  // 2. Intentar la petición a la API con reintentos
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs || 10000);

    try {
      // Si el error de CORS persiste incluso cuando el 502 se solucione, 
      // puedes descomentar la siguiente línea y cambiar 'url' por 'proxyUrl' en el fetch:
      // const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
      
      const response = await fetch(url, {
        cache: 'no-store',
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payload = await response.json();
      writeCache(cacheKey, payload);
      return payload;
      
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => window.setTimeout(resolve, retryDelayMs * attempt));
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  // 3. Manejar el fallo definitivo
  if (lastError?.name === 'AbortError') {
    throw new Error('La petición tardó demasiado');
  }
  
  throw lastError || new Error('La petición falló');
}

export { API_BASE, fetchJson };