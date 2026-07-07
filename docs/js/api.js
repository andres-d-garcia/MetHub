import { metApi } from './metApiService.js';

/**
 * @deprecated The fetchJson function is deprecated. Use the metApi service directly.
 * This function is kept for backward compatibility but will be removed.
 */
const fetchJson = () => {
  console.warn('fetchJson is deprecated. Please use metApi service.');
};

export { metApi, fetchJson };
