/**
 * Production Database Migration Script
 * 
 * This script runs all database migrations in order.
 * Use this for initial production setup or when adding new migrations.
 * 
 * Usage:
 *   npx tsx scripts/run-migrations.ts
 * 
 * Prerequisites:
 *   - Set SUPABASE_SERVICE_ROLE_KEY in environment
 *   - Set NEXT_PUBLIC_SUPABASE_URL in environment
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables:");
  if (!SUPABASE_URL) console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_SERVICE_KEY) console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const MIGRATIONS_DIR = path.join(__dirname, "../supabase/migrations");

async function runMigrations() {
  console.log("🚀 Starting database migrations...\n");
  console.log(`📍 Database: ${SUPABASE_URL}\n`);

  // Get all migration files sorted by name
  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (migrationFiles.length === 0) {
    console.log("⚠️  No migration files found in", MIGRATIONS_DIR);
    return;
  }

  console.log(`📋 Found ${migrationFiles.length} migration(s):\n`);
  migrationFiles.forEach((file) => console.log(`   - ${file}`));
  console.log("");

  for (const file of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    console.log(`⏳ Running: ${file}...`);

    try {
      // Execute the SQL using Supabase's rpc or direct query
      // Note: For complex migrations, you may need to use the Supabase CLI
      // or run these directly in the SQL Editor
      const { error } = await supabase.rpc("exec_sql", { sql_query: sql });

      if (error) {
        // If rpc doesn't exist, provide instructions
        if (error.message.includes("function") && error.message.includes("does not exist")) {
          console.log(`\n⚠️  Cannot run migrations programmatically.`);
          console.log(`   Please run migrations manually in Supabase SQL Editor:\n`);
          console.log(`   1. Go to ${SUPABASE_URL!.replace(".supabase.co", ".supabase.com")}/project/_/sql`);
          console.log(`   2. Copy and paste each migration file in order`);
          console.log(`   3. Execute each migration\n`);
          console.log(`   Migration files are located at: ${MIGRATIONS_DIR}\n`);
          return;
        }
        throw error;
      }

      console.log(`✅ Completed: ${file}`);
    } catch (error) {
      console.error(`❌ Failed: ${file}`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      console.log(`\n💡 Tip: Run this migration manually in Supabase SQL Editor`);
      process.exit(1);
    }
  }

  console.log("\n✨ All migrations completed successfully!");
}

// Run migrations
runMigrations().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
