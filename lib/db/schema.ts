export type NoteColor =
  | "offwhite"
  | "gray"
  | "olive"
  | "bluegray"
  | "ashbrown"
  | "graphite";

export interface NoteRecord {
  id: string;
  canvasId: string;
  text: string;
  color: NoteColor;
  done: boolean;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}
