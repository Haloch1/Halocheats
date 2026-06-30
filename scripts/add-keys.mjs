import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Add keys here before running. Clear after use - never commit real key values.
const keys = [
  // { product_slug: "example-product-day", key_value: "YOUR-KEY-HERE", status: "unused" },
];

const { data, error } = await supabase
  .from("license_keys")
  .insert(keys)
  .select("id, product_slug, key_value, status, created_at");

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

console.log("Inserted", data.length, "keys:");
for (const row of data) {
  console.log(`  ${row.product_slug} → ${row.key_value} (${row.status})`);
}
