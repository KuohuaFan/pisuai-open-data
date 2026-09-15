import "dotenv/config";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { governmentDatasets } from "../drizzle/schema";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const ids = process.argv.slice(2);
if (!ids.length || ids.some(id => !/^\d+$/.test(id))) throw new Error("Provide numeric dataset IDs");
const db = drizzle(process.env.DATABASE_URL);
await db.delete(governmentDatasets).where(inArray(governmentDatasets.datasetId, ids));
console.log(`Removed ${ids.length} anomalous dataset IDs: ${ids.join(", ")}`);
process.exit(0);
