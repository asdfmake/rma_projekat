import * as SQLite from "expo-sqlite";

export type Plant = {
  id: number;
  name: string;
  species: string | null;
  wateringIntervalDays: number;
  lastWateredAt: string; // ISO
};

const db = SQLite.openDatabaseSync("plants.db");

export function initDb() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species TEXT,
      wateringIntervalDays INTEGER NOT NULL,
      lastWateredAt TEXT NOT NULL
    );
  `);
}

export function listPlants(): Plant[] {
  return db.getAllSync<Plant>(`SELECT * FROM plants ORDER BY id DESC;`);
}

export function addPlant(input: Omit<Plant, "id">) {
  db.runSync(
    `INSERT INTO plants (name, species, wateringIntervalDays, lastWateredAt)
     VALUES (?, ?, ?, ?);`,
    [input.name, input.species, input.wateringIntervalDays, input.lastWateredAt]
  );
}

export function waterPlantNow(plantId: number) {
  const nowIso = new Date().toISOString();
  db.runSync(`UPDATE plants SET lastWateredAt = ? WHERE id = ?;`, [nowIso, plantId]);
}

export function deletePlant(plantId: number) {
  db.runSync(`DELETE FROM plants WHERE id = ?;`, [plantId]);
}
