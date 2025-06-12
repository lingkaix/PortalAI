import { drizzle, SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import * as defaultSchema from "./schema";
import { isSelectQuery } from "./database";

import initSqlJs from "sql.js";
import { readFileSync } from "fs";
import { join } from "path";

// Import migrations
import journalData from "./migrations/meta/_journal.json";
const migrationFileModules = import.meta.glob('./migrations/*.sql', { query: '?raw', import: 'default' });

// Initialize sql.js differently for Node.js vs browser
let sqlJs: any;
async function initializeSqlJs() {
  if (typeof window !== 'undefined') {
    // Browser environment
    sqlJs = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
  } else {
    // Node.js environment (for testing)
    try {
      // Try to load from node_modules
      const wasmPath = join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
      const wasmBinary = readFileSync(wasmPath);
      sqlJs = await initSqlJs({
        wasmBinary
      });
    } catch (error) {
      // Fallback: initialize without WASM binary (may be slower but works)
      sqlJs = await initSqlJs();
    }
  }
}

/**
* Creates a drizzle database instance of SQLite.
* Use sql.js in browser for testing.
* @param ALL parameters are not used in test mode, only for compatibility.
* @returns The drizzle database instance.
*/

export async function getSQLiteDB<TSchema extends Record<string, unknown> = Record<string, never>>
  (schema: TSchema = defaultSchema as unknown as TSchema,
    name: string = "app",
    migrationFolder: string = "migrations",
  )
  : Promise<SqliteRemoteDatabase<TSchema>> {

  // only use main database for testing
  schema = defaultSchema as unknown as TSchema;
  name = "app";
  migrationFolder = "migrations";

  // Load migrations
  // Initialize sql.js if not already done
  if (!sqlJs) {
    await initializeSqlJs();
  }

  const db = new sqlJs.Database();

  await runMigrations(db);

  return drizzle<TSchema>(
    async (sql, params, method) => {
      let rows: any[] = [];
      let results: any[] = [];

      try {
        // If the query is a SELECT, use select-like behavior
        if (isSelectQuery(sql)) {
          const stmt = db.prepare(sql);
          if (params && params.length > 0) {
            stmt.bind(params);
          }

          // Get column names first
          const columnNames = stmt.getColumnNames();
          
          while (stmt.step()) {
            const row = stmt.getAsObject();
            
            // Convert object to array in the same order as column names
            // This is what drizzle expects for sqlite-proxy
            const rowArray = columnNames.map((colName: string) => {
              const value = row[colName];
              // Handle NULL values properly - convert undefined to null
              return value === undefined ? null : value;
            });
            
            rows.push(rowArray);
          }
          stmt.free();
        } else {
          // For INSERT, UPDATE, DELETE operations
          const stmt = db.prepare(sql);
          if (params && params.length > 0) {
            stmt.bind(params);
          }
          stmt.step();
          stmt.free();

          // For non-SELECT queries, return empty rows
          return { rows: [] };
        }

        // Format results based on method
        results = method === "all" ? rows : (rows[0] || []);

        return { rows: results };
      } catch (error) {
        console.error("SQL Error:", error);
        return { rows: [] };
      }
    },
    // Pass the schema to the drizzle instance
    { schema: schema, logger: true }
  );
}

/**
 * Executes database migrations using the dynamically loaded migration files.
 * @param db The sql.js database instance.
 */
async function runMigrations(db: InstanceType<typeof sqlJs.Database>): Promise<void> {
  // Create migrations table
  const migrationTableCreate = `
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idx INTEGER NOT NULL UNIQUE,
      tag text NOT NULL UNIQUE,
      created_at numeric
    )
  `;
  db.exec(migrationTableCreate);

  // Get existing migrations
  const existingMigrations = db.exec(
    "SELECT idx, tag FROM \"__drizzle_migrations\" ORDER BY created_at DESC"
  );

  const existingMigrationSet = new Set<string>();
  if (existingMigrations.length > 0) {
    for (const result of existingMigrations) {
      if (result.values) {
        for (const row of result.values) {
          existingMigrationSet.add(`${row[0]}_${row[1]}`);
        }
      }
    }
  }

  // Load and run new migrations in order
  for (const entry of journalData.entries) {
    const migrationKey = `${entry.idx}_${entry.tag}`;

    if (!existingMigrationSet.has(migrationKey)) {
      const migrationPath = `./migrations/${entry.tag}.sql`;

      try {
        // Load migration content using Vite's glob import
        const migrationModule = migrationFileModules[migrationPath];
        if (migrationModule) {
          const migrationSQL = await migrationModule() as string;

          if (migrationSQL) {
            // Split by statement breakpoint and execute each statement
            const statements = migrationSQL
              .split('--> statement-breakpoint')
              .map((stmt: string) => stmt.trim())
              .filter((stmt: string) => stmt.length > 0);

            for (const statement of statements) {
              if (statement.trim()) {
                try {
                  db.exec(statement);
                } catch (error: any) {
                  // Handle common SQL errors that might be acceptable
                  if (error.message.includes('already exists') ||
                    error.message.includes('duplicate column name') ||
                    error.message.includes('no such column') ||
                    error.message.includes('table') && error.message.includes('already exists')) {
                    console.warn(`Skipping statement due to SQL error: ${error.message}`);
                    continue;
                  } else {
                    console.error(`Migration error in ${entry.tag}:`, error.message);
                    console.error(`Statement: ${statement}`);
                    throw error;
                  }
                }
              }
            }

            // Record migration as completed
            const stmt = db.prepare(
              "INSERT INTO \"__drizzle_migrations\" (idx, tag, created_at) VALUES (?, ?, ?)"
            );
            stmt.run([entry.idx, entry.tag, Date.now()]);
            stmt.free();

            console.info(`Migration ${entry.tag} completed`);
          } else {
            console.warn(`Migration content not found for ${entry.tag}`);
          }
        } else {
          console.warn(`Migration file not found: ${migrationPath}`);
        }
      } catch (error) {
        console.error(`Failed to load migration ${entry.tag}:`, error);
        throw error;
      }
    }
  }

  console.info("All migrations completed");
}