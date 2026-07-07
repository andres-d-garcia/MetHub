const DEFAULT_TIMEOUT_MS = 10000;

export class MetApiService {
  constructor(baseUrl = "https://collectionapi.metmuseum.org/public/collection/v1") {
    this.baseUrl = baseUrl;
    this.timeoutMs = DEFAULT_TIMEOUT_MS;
  }

  buildUrl(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    return `${this.baseUrl}${endpoint}${query ? `?${query}` : ""}`;
  }

  async request(endpoint, params = {}, options = {}) {
    const url = this.buildUrl(endpoint, params);
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeoutMs ?? this.timeoutMs
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        ...options.fetchOptions,
      });

      if (!response.ok) {
        const error = new Error(`Error ${response.status} al consultar ${endpoint}`);
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        const timeoutError = new Error("La petición tardó demasiado");
        timeoutError.name = "TimeoutError";
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getDepartments() {
    const data = await this.request("/departments");
    return Array.isArray(data?.departments) ? data.departments : [];
  }

  async searchObjects({
    q = "*",
    departmentId = null,
    isHighlight = false,
    hasImages = false,
    artistOrCulture = false,
    dateBegin = null,
    dateEnd = null,
  } = {}) {
    const params = {};

    if (q) params.q = q;
    if (departmentId !== null && departmentId !== "") params.departmentId = departmentId;
    if (isHighlight) params.isHighlight = "true";
    if (hasImages) params.hasImages = "true";
    if (artistOrCulture) params.artistOrCulture = "true";
    if (dateBegin !== null && dateBegin !== "") params.dateBegin = dateBegin;
    if (dateEnd !== null && dateEnd !== "") params.dateEnd = dateEnd;

    const data = await this.request("/search", params);

    return {
      total: Number(data?.total) || 0,
      objectIDs: Array.isArray(data?.objectIDs) ? data.objectIDs : [],
    };
  }

  async getObjectById(id) {
    try {
      return await this.request(`/objects/${id}`);
    } catch (error) {
      if (error.status === 404) return null;
      // Re-throw other errors
      throw error;
    }
  }

  async getObjectsByIds(objectIds = []) {
    const settledResults = await Promise.allSettled(
      objectIds.map((id) => this.getObjectById(id))
    );

    return settledResults
      .filter((result) => result.status === "fulfilled" && result.value)
      .map((result) => result.value);
  }

  async getHighlightedObjects({ q = "", limit = 8 } = {}) {
    const searchResult = await this.searchObjects({
      q,
      isHighlight: true,
      hasImages: true,
    });

    return this.getObjectsByIds(searchResult.objectIDs.slice(0, limit));
  }

  async getArtworksByArtist(artistName) {
    const searchData = await this.request("/search", {
      q: artistName,
      artistOrCulture: true,
    });

    if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
      return { total: 0, artworks: [], bio: "" };
    }

    const idsToFetch = searchData.objectIDs.slice(0, 12);
    const artworks = await this.getObjectsByIds(idsToFetch);
    const bio = artworks.find((art) => art.artistDisplayBio)?.artistDisplayBio || "";

    return {
      total: searchData.total,
      artworks,
      bio,
      allIds: searchData.objectIDs,
    };
  }
}

export const metApi = new MetApiService();
export default MetApiService;
