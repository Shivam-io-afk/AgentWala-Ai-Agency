/**
 * Concurrency & Lost-Update Verification Script for AgentWala OS
 *
 * Verifies that parallel writes (such as incoming leads) do not suffer
 * from lost updates under concurrent load.
 *
 * Usage:
 *   node scripts/test-concurrency.js [http://localhost:3000]
 */

const fs = require("fs");
const path = require("path");

const targetUrl = process.argv[2] || process.env.APP_URL || "http://localhost:3000";

async function getDbClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("app_state")
      .select("data, version")
      .eq("key", "db")
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase query error: ${error.message}`);
    }
    const clients = data?.data?.clients || [];
    return { mode: "Supabase (app_state table)", clients, version: data?.version };
  }

  // Local fallback
  const dbPath = path.join(process.cwd(), ".data", "db.json");
  if (!fs.existsSync(dbPath)) {
    return { mode: "Local file (.data/db.json)", clients: [], version: 0 };
  }
  const raw = fs.readFileSync(dbPath, "utf8");
  const parsed = JSON.parse(raw);
  const clients = parsed.clients || [];
  return { mode: "Local file (.data/db.json)", clients, version: 0 };
}

async function run() {
  console.log("==================================================");
  console.log("  AGENTWALA OS CONCURRENCY VERIFICATION TEST      ");
  console.log("==================================================");
  console.log(`Targeting: ${targetUrl}\n`);

  // Check if server is reachable
  try {
    const health = await fetch(`${targetUrl}/`, { method: "HEAD" });
    if (!health.ok && health.status >= 500) {
      console.error(`[FAIL] Server returned status ${health.status} on root path.`);
      process.exit(1);
    }
  } catch (err) {
    console.log(`[SKIP] App server not running at ${targetUrl}.`);
    console.log("To run this test, start the server in another terminal:");
    console.log("  npm run start (or npm run dev)");
    console.log("Then re-run: node scripts/test-concurrency.js\n");
    process.exit(0);
  }

  // Detect storage backend and initial count
  const initialDb = await getDbClients();
  const initialCount = initialDb.clients.length;
  console.log(`Storage backend detected: ${initialDb.mode}`);
  console.log(`Initial lead/client count in db: ${initialCount}\n`);

  const BATCH_SIZE = 20;
  const timestamp = Date.now();
  console.log(`Sending ${BATCH_SIZE} concurrent lead submissions to /api/lead...`);

  const requests = Array.from({ length: BATCH_SIZE }).map(async (_, i) => {
    // Generate valid 10-digit Indian phone starting with 9
    const suffix = String(timestamp).slice(-6) + String(i).padStart(2, "0");
    const phone = `98${suffix.slice(-8)}`;
    const payload = {
      name: `Concurrency Lead ${i + 1}`,
      businessName: `Test Venture ${i + 1} (${timestamp})`,
      businessType: "Healthcare / Small Business",
      city: "Mumbai",
      phone: phone,
      need: "whatsapp_bot",
      budgetRange: "₹25k–₹60k",
      timeline: "Within 2 weeks",
      description: `Automated concurrency verification test #${i + 1} at ${timestamp}`,
      consent: true,
    };

    try {
      const res = await fetch(`${targetUrl}/api/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `10.100.2.${i + 1}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      return {
        index: i + 1,
        status: res.status,
        ok: res.ok && (data.success === true || res.status === 200),
        data,
      };
    } catch (err) {
      return {
        index: i + 1,
        status: 0,
        ok: false,
        error: err.message,
      };
    }
  });

  const results = await Promise.all(requests);
  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\nHTTP Results: ${succeeded}/${BATCH_SIZE} requests returned 200 OK.`);

  if (failed.length > 0) {
    console.error(`[FAIL] ${failed.length} requests failed:`);
    failed.forEach((f) => {
      console.error(`  - Request #${f.index}: status=${f.status}, error=${JSON.stringify(f.data || f.error)}`);
    });
    process.exit(1);
  }

  // Small delay to allow any pending asynchronous persistence writes to complete
  await new Promise((r) => setTimeout(r, 1000));

  // Verify stored count in database
  console.log(`\nVerifying database lead/client count in ${initialDb.mode}...`);
  const finalDb = await getDbClients();
  const finalCount = finalDb.clients.length;
  const testClients = finalDb.clients.filter(
    (c) => c.name && c.name.includes(`(${timestamp})`)
  );

  console.log(`Previous count: ${initialCount}`);
  console.log(`Current count:  ${finalCount} (Delta: +${finalCount - initialCount})`);
  console.log(`Test leads matching timestamp (${timestamp}): ${testClients.length}`);

  if (testClients.length !== BATCH_SIZE || finalCount - initialCount !== BATCH_SIZE) {
    console.error(`\n[FAIL] Lost update detected! Expected exactly +${BATCH_SIZE} leads, but got +${finalCount - initialCount} (matched ${testClients.length}/${BATCH_SIZE}).`);
    process.exit(1);
  }

  console.log(`\n✓ Concurrency assertion PASSED on ${initialDb.mode}:`);
  console.log(`  Lead count increased by exactly ${BATCH_SIZE} (${initialCount} -> ${finalCount}). Zero lost updates!`);

  console.log("\n==================================================");
  console.log("          CONCURRENCY SUITE COMPLETED             ");
  console.log("==================================================");
  process.exit(0);
}

run().catch((err) => {
  console.error("Unexpected error in test runner:", err);
  process.exit(1);
});
