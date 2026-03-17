import Dexie, { type Table } from "dexie";
import type { NoteRecord } from "./schema";

class ScatterDB extends Dexie {
  notes!: Table<NoteRecord, string>;

  constructor() {
    super("scatter-db");
    this.version(1).stores({
      notes: "id, canvasId, updatedAt, deletedAt",
    });
  }
}

export const db = new ScatterDB();
