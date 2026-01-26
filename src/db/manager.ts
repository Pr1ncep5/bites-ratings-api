import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
import { join } from "path";

const db = new Database("database.sqlite");

export function runSqlFile(fileName: string, params: Record<string, any> = {}, isReadQuery = true) {
  try {
    const filePath = join(import.meta.dir, "queries", fileName);
    const sql = readFileSync(filePath, "utf8");

    const query = db.query(sql);

    if (isReadQuery) return query.all(params); 
    else return query.run(params);
  } catch (error) {
    console.error(`Failed to execute ${fileName}:`, error);
  }
}