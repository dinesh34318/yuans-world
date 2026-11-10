/**
 * Switches the Prisma schema datasource provider between sqlite and postgresql
 * based on the DATABASE_URL environment variable.
 *
 * - URL starting with "postgresql://" or "postgres://" → provider = "postgresql"
 * - Everything else (including "file:") → provider = "sqlite"
 *
 * Run automatically via `postinstall` so the correct client is generated.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL || "file:./dev.db";
const provider = url.startsWith("postgresql://") || url.startsWith("postgres://") ? "postgresql" : "sqlite";

const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
let schema = readFileSync(schemaPath, "utf-8");

// Replace the provider line inside the datasource block
schema = schema.replace(
  /datasource db \{\s*provider\s*=\s*"(sqlite|postgresql)"\s*\}/,
  `datasource db {\n  provider = "${provider}"\n}`
);

writeFileSync(schemaPath, schema);
console.log(`[switch-provider] Set Prisma provider to "${provider}" based on DATABASE_URL`);
