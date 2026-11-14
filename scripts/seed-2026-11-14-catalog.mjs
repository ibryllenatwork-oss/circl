// One-time setup (2026-11-14): circl. admins, real service catalog, draft Social Media packages.
// Safe to re-run: existing rows (matched by email / name) are left alone.
//   node scripts/seed-2026-11-14-catalog.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = readFileSync(".env.local", "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) ?? [])[1]?.trim();
const db = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
const ACTOR = "setup-script";
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
const must = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};

// ---------------------------------------------------------------- 1. remove test catalog
const testPackages = must(await db.from("packages").select("id, name").or("name.eq.Starter Admin,name.ilike.Copy of Starter Admin%"), "find test packages");
for (const p of testPackages) must(await db.from("packages").delete().eq("id", p.id), `delete package ${p.name}`);
const testServices = must(
  await db.from("services").select("id, name, parent_id").in("name", ["Email management", "Calendar management", "Administrative support", "Bookkeeping"]),
  "find test services",
);
// children first, then parents
for (const s of [...testServices].sort((a, b) => (a.parent_id ? 0 : 1) - (b.parent_id ? 0 : 1))) {
  must(await db.from("services").delete().eq("id", s.id), `delete service ${s.name}`);
}
console.log(`removed ${testPackages.length} test package(s), ${testServices.length} test service(s)`);

// ---------------------------------------------------------------- 2. admins (placeholder details)
const admins = [
  ["Ian Brylle", "Nicdao", "ian.nicdao"],
  ["Cyrielle", "Palma", "cyrielle.palma"],
  ["Rhiedaze", "Balili", "rhiedaze.balili"],
];
for (const [first, last, handle] of admins) {
  const email = `${handle}+placeholder@example.com`;
  const existing = must(await db.from("employees").select("id").ilike("first_name", first).ilike("last_name", last), "find admin");
  if (existing.length) {
    console.log(`admin ${first} ${last}: already exists`);
    continue;
  }
  must(
    await db.from("employees").insert({
      first_name: first,
      last_name: last,
      personal_email: email,
      position: "Admin",
      employee_type: "admin",
      employment_type: "full_time",
      status: "active",
      date_hired: today,
      notes: "PLACEHOLDER details (email, position, hire date) created by the setup script. Please update.",
      created_by: ACTOR,
      updated_by: ACTOR,
    }),
    `create admin ${first} ${last}`,
  );
  console.log(`admin ${first} ${last}: created`);
}

// ---------------------------------------------------------------- 3. services
async function service(name, parentId = null, position = 0, description = null) {
  let q = db.from("services").select("id").ilike("name", name);
  q = parentId ? q.eq("parent_id", parentId) : q.is("parent_id", null);
  const found = must(await q, `find ${name}`);
  if (found.length) return found[0].id;
  const row = must(
    await db
      .from("services")
      .insert({ name, parent_id: parentId, position, description, created_by: ACTOR, updated_by: ACTOR })
      .select("id")
      .single(),
    `create ${name}`,
  );
  console.log(`service ${parentId ? "  └ " : ""}${name}: created`);
  return row.id;
}

const top = ["Social Media Management", "Video Editing", "Graphics Design", "Sales", "Executive Assistant"];
const ids = {};
for (const [i, name] of top.entries()) ids[name] = await service(name, null, i);

// Proposed Social Media subservices and rates (USD/hr: client, VA) — drafts to review.
const smm = [
  ["Content creation", "Captions, carousels and short-form post copy", { entry: [10, 6], intermediate: [14, 8], expert: [20, 12] }],
  ["Scheduling & posting", "Content calendar, scheduling and publishing", { entry: [8, 5], intermediate: [11, 6.5], expert: [15, 9] }],
  ["Community management", "Replies, DMs and comment moderation", { entry: [9, 5.5], intermediate: [12, 7], expert: [17, 10] }],
  ["Analytics & reporting", "Monthly performance reports and insights", { entry: [11, 6.5], intermediate: [15, 9], expert: [22, 13] }],
];
const sub = {};
for (const [i, [name, desc, rates]] of smm.entries()) {
  sub[name] = await service(name, ids["Social Media Management"], i, desc);
  const existingRates = must(await db.from("service_rates").select("tier").eq("service_id", sub[name]), "find rates");
  if (existingRates.length) continue;
  must(
    await db.rpc("save_service_rates", {
      p_service_id: sub[name],
      p_rates: Object.entries(rates).map(([tier, [c, v]]) => ({ tier, client_rate: String(c), va_rate: String(v) })),
      p_actor: ACTOR,
    }),
    `rates for ${name}`,
  );
  console.log(`rates  └ ${name}: set`);
}

// ---------------------------------------------------------------- 4. draft packages
const packages = [
  {
    name: "Social Media Starter",
    description: "Steady presence on 1–2 platforms: posts, scheduling and basic replies.",
    amount: 349,
    lines: [
      ["Content creation", "entry", 20],
      ["Scheduling & posting", "entry", 10],
      ["Community management", "entry", 10],
    ],
  },
  {
    name: "Social Media Growth",
    description: "Consistent content and engagement on 2–3 platforms, with a monthly report.",
    amount: 999,
    lines: [
      ["Content creation", "intermediate", 40],
      ["Scheduling & posting", "intermediate", 20],
      ["Community management", "intermediate", 20],
      ["Analytics & reporting", "intermediate", 5],
    ],
  },
  {
    name: "Social Media Pro",
    description: "Full-service social media: expert content, active community and detailed analytics.",
    amount: 2199,
    lines: [
      ["Content creation", "expert", 60],
      ["Scheduling & posting", "intermediate", 30],
      ["Community management", "expert", 40],
      ["Analytics & reporting", "expert", 10],
    ],
  },
];
for (const p of packages) {
  const found = must(await db.from("packages").select("id").ilike("name", p.name), `find ${p.name}`);
  if (found.length) {
    console.log(`package ${p.name}: already exists`);
    continue;
  }
  must(
    await db.rpc("save_package", {
      p_package: { name: p.name, description: p.description, monthly_amount: String(p.amount), status: "draft", notes: "Draft proposed by the setup script. Review rates, hours and amount." },
      p_lines: p.lines.map(([svc, tier, hours]) => ({ service_id: sub[svc], tier, hours_per_month: String(hours) })),
      p_actor: ACTOR,
    }),
    `create ${p.name}`,
  );
  console.log(`package ${p.name}: created (draft)`);
}
console.log("done");
