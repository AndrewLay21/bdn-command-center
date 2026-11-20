/**
 * Creates the tables and loads data/records.json into Netlify DB, only into empty tables (never overwrites).
 * Usage: NETLIFY_DATABASE_URL=... npm run db:seed   (or: npx netlify dev:exec npm run db:seed)
 * The site also does this by itself on its first request, so running this is optional.
 */
import { getDb, ensureSchemaAndSeed, databaseUrl } from "../db/index";

if (!databaseUrl()) {
  console.error("Set NETLIFY_DATABASE_URL first.");
  process.exit(1);
}
const db = await getDb();
const result = await ensureSchemaAndSeed(db!);
console.log(result.seeded.length ? `Seeded: ${result.seeded.join(", ")}` : "Tables already had data; nothing changed.");
