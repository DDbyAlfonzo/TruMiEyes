import type { LabelColor } from "../../lib/labels";

export type GalleryComment = {
  id: string;
  message: string;
  createdAt: string;
};

export type GalleryPhoto = {
  id: string;
  imageUrl: string;
  /** Smaller rendition for grids and filmstrips. */
  thumbUrl: string;
  downloadUrl: string;
  filename: string;
  downloadable: boolean;
};

export type GalleryLayout = {
  id: string;
  name: string;
  description: string | null;
  previewImageUrl: string;
  pageCount: number;
  orientation: string;
};

export type GalleryFilter = "all" | "favourites" | "labelled" | "comments";

export type PhotoState = {
  favourite: boolean;
  label: LabelColor | null;
  comments: GalleryComment[];
};
