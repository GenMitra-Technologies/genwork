// src/lib/youtube.ts
/**
 * Utility for parsing YouTube URLs, extracting video IDs,
 * generating thumbnail URLs, and fetching public video metadata via oEmbed.
 */

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const clean = url.trim();

  // Match short (youtu.be/ID), standard (watch?v=ID), embed (/embed/ID), or shorts (/shorts/ID)
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = clean.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  // Raw 11-char ID input
  if (/^[\w-]{11}$/.test(clean)) {
    return clean;
  }

  return null;
}

export function getYouTubeThumbnail(videoId: string, quality: 'max' | 'hq' = 'hq'): string {
  if (!videoId) return '';
  return quality === 'max'
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  if (!videoId) return '';
  // Use official privacy-enhanced mode and clean player parameters
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
}

export async function fetchYouTubeMeta(url: string): Promise<{
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
} | null> {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        videoId,
        title: data.title || '',
        author: data.author_name || '',
        thumbnailUrl: data.thumbnail_url || getYouTubeThumbnail(videoId, 'hq'),
      };
    }
  } catch {
    // Graceful fallback if offline or blocked by CORS
  }

  return {
    videoId,
    title: '',
    author: '',
    thumbnailUrl: getYouTubeThumbnail(videoId, 'hq'),
  };
}
