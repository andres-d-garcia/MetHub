const API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

function obtenerClaveCache(url) {
  try {
    const urlParseada = new URL(url, window.location.origin);
    return `methub-cache:${urlParseada.pathname}${urlParseada.search}`;
  } catch {
    return `methub-cache:${url}`;
  }
}

function leerCache(clave) {
  try {
    const datosCrudos = window.localStorage.getItem(clave);
    return datosCrudos ? JSON.parse(datosCrudos) : null;
  } catch {
    return null;
  }
}

function escribirCache(clave, valor) {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // ignorar errores de almacenamiento
  }
}

async function obtenerJson(url, opciones = {}) {
  const urlParseada = new URL(url, window.location.origin);
  const maxIntentos = opciones.maxIntentos || 3;
  const retrasoReintentoMs = opciones.retrasoReintentoMs || 700;
  const claveCache = obtenerClaveCache(urlParseada.toString());
  const enCache = opciones.skipCache ? null : leerCache(claveCache);

  // 1. Verificar si hay datos en caché antes de hacer la petición
  if (enCache) {
    return enCache;
  }

  let ultimoError = null;

  // 2. Intentar la petición a la API con reintentos
  for (let intento = 1; intento <= maxIntentos; intento += 1) {
    const controlador = new AbortController();
    const idTimeout = window.setTimeout(() => controlador.abort(), opciones.timeoutMs || 10000);

    try {
      // Si el error de CORS persiste incluso cuando el 502 se solucione, 
      // puedes descomentar la siguiente línea y cambiar 'url' por 'proxyUrl' en el fetch:
      // const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
      
      const response = await fetch(url, {
        cache: 'no-store',
        ...opciones,
        signal: controlador.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const datos = await response.json();
      escribirCache(claveCache, datos);
      return datos;
      
    } catch (error) {
      ultimoError = error;
      if (intento < maxIntentos) {
        await new Promise((resolve) => window.setTimeout(resolve, retrasoReintentoMs * intento));
      }
    } finally {
      window.clearTimeout(idTimeout);
    }
  }

  // 3. Manejar el fallo definitivo
  if (ultimoError?.name === 'AbortError') {
    throw new Error('La petición tardó demasiado');
  }
  
  throw ultimoError || new Error('La petición falló');
}

export { API_BASE, obtenerJson as fetchJson };