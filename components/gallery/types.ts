import type { LabelColor } from "../../lib/labels";
import type { Orientation, Slot } from "../../lib/booklets";

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
  /** Photos this booklet holds. */
  capacity: number;
  orientation: Orientation;
  /** Pages built from the studio's sketches (empty for older image-only layouts). */
  pages: { sketchUrl: string; slots: Slot[] }[];
};

export type GalleryFilter = "all" | "favourites" | "labelled" | "comments";

export type PhotoState = {
  favourite: boolean;
  label: LabelColor | null;
  comments: GalleryComment[];
};
