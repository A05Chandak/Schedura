import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pkg from "pg";

const { Client } = pkg;

dotenv.config();

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const rootDir = path.resolve(currentDir, "../..");
const sqlDir = path.join(rootDir, "sql");

const client = new Client({
  connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  const schema = await fs.readFile(path.join(sqlDir, "schema.sql"), "utf8");
  const seed = await fs.readFile(path.join(sqlDir, "seed.sql"), "utf8");

  // Split schema and seed into individual statements and execute them
  const schemaStatements = schema.split(";").filter((stmt) => stmt.trim());
  for (const statement of schemaStatements) {
    if (statement.trim()) {
      await client.query(statement);
    }
  }

  const seedStatements = seed.split(";").filter((stmt) => stmt.trim());
  for (const statement of seedStatements) {
    if (statement.trim()) {
      await client.query(statement);
    }
  }

  console.log(`Database ${process.env.DB_NAME || "schedura_db"} initialized successfully.`);
} finally {
  await client.end();
}
