// Tenor GIF API Service
// Free tier: https://developers.google.com/tenor/guides/quickstart

const TENOR_API_KEY = process.env.EXPO_PUBLIC_TENOR_API_KEY || '';
const TENOR_BASE_URL = 'https://tenor.googleapis.com/v2';

export interface TenorGif {
  id: string;
  title: string;
  content_description: string;
  media_formats: {
    gif: {
      url: string;
      dims: [number, number];
      size: number;
    };
    tinygif: {
      url: string;
      dims: [number, number];
      size: number;
    };
    nanogif: {
      url: string;
      dims: [number, number];
      size: number;
    };
    mediumgif?: {
      url: string;
      dims: [number, number];
      size: number;
    };
  };
  created: number;
}

export interface TenorSearchResponse {
  results: TenorGif[];
  next: string;
}

/**
 * Search for GIFs on Tenor
 */
export async function searchGifs(
  query: string,
  limit: number = 20,
  pos?: string
): Promise<{ gifs: TenorGif[]; next: string | null }> {
  if (!TENOR_API_KEY) {
    console.warn('Tenor API key not configured');
    return { gifs: [], next: null };
  }

  try {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      q: query,
      limit: limit.toString(),
      media_filter: 'gif,tinygif,nanogif',
      contentfilter: 'medium', // Filter inappropriate content
      client_key: 'cooked_app',
    });

    if (pos) {
      params.append('pos', pos);
    }

    const response = await fetch(`${TENOR_BASE_URL}/search?${params}`);

    if (!response.ok) {
      console.error('Tenor API error:', response.status, response.statusText);
      return { gifs: [], next: null };
    }

    const data: TenorSearchResponse = await response.json();

    return {
      gifs: data.results || [],
      next: data.next || null,
    };
  } catch (error) {
    console.error('Tenor search error:', error);
    return { gifs: [], next: null };
  }
}

/**
 * Get trending GIFs from Tenor
 */
export async function getTrendingGifs(
  limit: number = 20,
  pos?: string
): Promise<{ gifs: TenorGif[]; next: string | null }> {
  if (!TENOR_API_KEY) {
    console.warn('Tenor API key not configured');
    return { gifs: [], next: null };
  }

  try {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      limit: limit.toString(),
      media_filter: 'gif,tinygif,nanogif',
      contentfilter: 'medium',
      client_key: 'cooked_app',
    });

    if (pos) {
      params.append('pos', pos);
    }

    const response = await fetch(`${TENOR_BASE_URL}/featured?${params}`);

    if (!response.ok) {
      console.error('Tenor API error:', response.status, response.statusText);
      return { gifs: [], next: null };
    }

    const data: TenorSearchResponse = await response.json();

    return {
      gifs: data.results || [],
      next: data.next || null,
    };
  } catch (error) {
    console.error('Tenor trending error:', error);
    return { gifs: [], next: null };
  }
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (!TENOR_API_KEY || !query.trim()) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      q: query,
      limit: '5',
      client_key: 'cooked_app',
    });

    const response = await fetch(`${TENOR_BASE_URL}/autocomplete?${params}`);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Tenor autocomplete error:', error);
    return [];
  }
}

/**
 * Register a GIF share (for Tenor analytics - recommended by their API)
 */
export async function registerShare(gifId: string, query?: string): Promise<void> {
  if (!TENOR_API_KEY) return;

  try {
    const params = new URLSearchParams({
      key: TENOR_API_KEY,
      id: gifId,
      client_key: 'cooked_app',
    });

    if (query) {
      params.append('q', query);
    }

    await fetch(`${TENOR_BASE_URL}/registershare?${params}`);
  } catch (error) {
    // Silent fail - this is just analytics
    console.debug('Tenor register share failed:', error);
  }
}

/**
 * Get the best URL for displaying a GIF based on size preference
 */
export function getGifUrl(gif: TenorGif, size: 'full' | 'medium' | 'small' = 'medium'): string {
  const { media_formats } = gif;

  switch (size) {
    case 'full':
      return media_formats.gif?.url || media_formats.mediumgif?.url || media_formats.tinygif.url;
    case 'medium':
      return media_formats.mediumgif?.url || media_formats.tinygif?.url || media_formats.gif.url;
    case 'small':
      return media_formats.nanogif?.url || media_formats.tinygif?.url || media_formats.gif.url;
    default:
      return media_formats.tinygif?.url || media_formats.gif.url;
  }
}

/**
 * Get the preview URL for a GIF (smaller size for grid display)
 */
export function getPreviewUrl(gif: TenorGif): string {
  return gif.media_formats.nanogif?.url || gif.media_formats.tinygif?.url || gif.media_formats.gif.url;
}
