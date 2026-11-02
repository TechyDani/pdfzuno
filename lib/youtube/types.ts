export const MAX_YOUTUBE_BYTES = 100 * 1024 * 1024;
export const MAX_YOUTUBE_SECONDS = 20 * 60;
export const YOUTUBE_QUALITIES = [360, 720, 1080] as const;
export type YouTubeQuality = (typeof YOUTUBE_QUALITIES)[number];

export type YouTubeInfo = {
  videoId: string;
  title: string;
  sourceUrl: string;
  duration: number;
  qualities: YouTubeQuality[];
};

export type YouTubePreview = YouTubeInfo & {
  downloads: { quality: YouTubeQuality; url: string }[];
};
