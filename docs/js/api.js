import { metApi } from './metApiService.js';

const API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';

async function fetchJson(url) {
  const parsedUrl = new URL(url, window.location.origin);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '');
  const params = Object.fromEntries(parsedUrl.searchParams.entries());

  if (pathname.endsWith('/departments') || pathname.includes('/departments')) {
    const data = await metApi.getDepartments();
    return { departments: data };
  }

  if (pathname.endsWith('/search') || pathname.includes('/search')) {
    return metApi.searchObjects(params);
  }

  const objectMatch = pathname.match(/\/objects\/(\d+)$/);
  if (objectMatch) {
    return metApi.getObjectById(objectMatch[1]);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export { API_BASE, fetchJson };
