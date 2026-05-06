import { config } from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./client";

config();

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("⏳ Running migrations...");

  const start = Date.now();
  await migrate(db, {
    migrationsFolder: "./src/drizzle",
  });
  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
