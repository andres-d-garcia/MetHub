const API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export { API_BASE, fetchJson };
