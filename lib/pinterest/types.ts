export type PinterestMedia = {
  id: string;
  type: "image" | "video";
  url: string;
  previewUrl?: string;
  width?: number;
  height?: number;
};

export type PinterestResult = {
  pinId: string;
  title: string;
  sourceUrl: string;
  media: PinterestMedia[];
  notice?: string;
};

export type PinterestPreview = Omit<PinterestResult, "media"> & {
  media: (Omit<PinterestMedia, "url"> & { downloadUrl: string })[];
};
