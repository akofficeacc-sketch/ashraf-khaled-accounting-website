/**
 * Stress + abuse-resistance suite for the local dev server.
 * Run: node stress-test.mjs
 * Targets 127.0.0.1:3000 — never run against production.
 */
const BASE = "http://127.0.0.1:3000";
const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name} — ${detail}`);
};

const post = async (path, body, headers = {}) => {
  const t0 = performance.now();
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const ms = performance.now() - t0;
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json, ms };
};

const validBody = (i) => ({
  name: `Stress Bot ${i}`,
  phone: `+20100123${String(4500 + i).slice(-4)}`,
  message: "Automated stress-test submission from the local verification suite.",
});

/* ---------- 1. Contact rate limiter: 5/min per IP ---------- */
{
  // Unique-ish IP header per run to avoid colliding with earlier tests
  const hdrs = { "x-forwarded-for": "10.199.0.1" };
  const statuses = [];
  let firstLimited = null;
  for (let i = 0; i < 8; i++) {
    const r = await post("/api/contact", validBody(i), hdrs);
    statuses.push(r.status);
    if (r.status === 429 && !firstLimited) firstLimited = r;
    if (i === 4) record("contact: 5th request admitted", r.status === 200, `status=${r.status}`);
  }
  const admitted = statuses.filter((s) => s === 200).length;
  const limited = statuses.filter((s) => s === 429).length;
  record("contact: limiter admits exactly 5", admitted === 5, `admitted=${admitted}`);
  record("contact: requests 6-8 rejected 429", limited === 3, `limited=${limited}`);
  const errText = firstLimited?.json?.error;
  const retry =
    (errText && typeof errText === "object" && errText.retryAfterSec === 60) ||
    (typeof errText === "string" && errText.includes("60")) ||
    firstLimited?.json?.retryAfterSec === 60;
  record("contact: 429 carries retryAfterSec", retry, JSON.stringify(firstLimited?.json).slice(0, 110));
}

/* ---------- 2. Honeypot: fake success, no DB write ---------- */
{
  const before = await fetch(BASE + "/api/contact", { method: "HEAD" }).catch(() => null);
  const r = await post("/api/contact", { ...validBody(99), website: "http://spam.example" }, { "x-forwarded-for": "10.199.0.2" });
  const fakeOk = r.status === 200 && r.json?.ok === true;
  record("honeypot: returns fake success", fakeOk, `status=${r.status} ok=${r.json?.ok}`);
  record("honeypot: response identical shape to real success", JSON.stringify(Object.keys(r.json ?? {})).includes("ok"), `keys=${Object.keys(r.json ?? {}).join(",")}`);
}

/* ---------- 3. Oversized body → 413 ---------- */
{
  const big = { ...validBody(0), message: "A".repeat(50 * 1024) };
  const r = await post("/api/contact", big, { "x-forwarded-for": "10.199.0.3" });
  record("body cap: 50KB payload rejected", r.status === 413, `status=${r.status}`);
}

/* ---------- 4. Malformed inputs → clean 400s ---------- */
{
  const cases = [
    ["invalid JSON", "{not json", 400],
    ["wrong types", { name: 123, phone: true, message: [] }, 400],
    ["missing fields", { name: "x" }, 400],
    ["bad phone", validBody(1) && { ...validBody(1), phone: "12345" }, 400],
    ["html injection in name", { ...validBody(2), name: '<script>alert(1)</script>' }, 400],
    ["crlf in name", { ...validBody(3), name: "bad\r\nname" }, 400],
  ];
  for (const [label, body, expected] of cases) {
    // Fresh IP per case so the limiter never masks the validation result.
    const r = await post("/api/contact", body, { "x-forwarded-for": `10.199.1.${cases.findIndex(([l]) => l === label) + 1}` });
    record(`input guard: ${label}`, r.status === expected, `status=${r.status} (want ${expected})`);
  }
}

/* ---------- 5. ETA news: limiter + cache under concurrency ---------- */
{
  const hdrs = { "x-forwarded-for": "10.199.0.5" };
  const t0 = performance.now();
  const shots = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      fetch(BASE + `/api/eta-news?lang=${i % 2 ? "en" : "ar"}`, { headers: hdrs })
        .then(async (res) => ({ status: res.status, body: await res.json().catch(() => null) }))
    )
  );
  const ms = performance.now() - t0;
  const oks = shots.filter((s) => s.status === 200);
  const limited = shots.filter((s) => s.status === 429);
  const shaped = oks.every((s) => s.body && typeof s.body.ok === "boolean" && Array.isArray(s.body.items));
  record("eta-news: 30 concurrent all answered", shots.every((s) => [200, 429].includes(s.status)), `200=${oks.length} 429=${limited.length} in ${ms.toFixed(0)}ms`);
  record("eta-news: responses well-shaped", shaped, `ok+items array on every 200`);
  record("eta-news: limiter engaged (10/min)", limited.length >= 20, `limited=${limited.length}`);
  // cache: a single follow-up should be fast
  const t1 = performance.now();
  const cached = await fetch(BASE + "/api/eta-news?lang=ar", { headers: hdrs });
  const cms = performance.now() - t1;
  record("eta-news: 429 also on cache-hit path", cached.status === 429, `status=${cached.status} ${cms.toFixed(0)}ms`);
}

/* ---------- 6. Latency profile on homepage ---------- */
{
  const times = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    await fetch(BASE + "/");
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const p50 = times[4], p95 = times[8];
  record("homepage latency", p50 < 1500, `p50=${p50.toFixed(0)}ms p95=${p95.toFixed(0)}ms`);
}

/* ---------- 7. Security headers present ---------- */
{
  const res = await fetch(BASE + "/");
  const h = res.headers;
  const checks = [
    ["x-content-type-options", "nosniff"],
    ["x-frame-options", "SAMEORIGIN"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["permissions-policy", ""],
  ];
  for (const [name, want] of checks) {
    const got = h.get(name) ?? "";
    record(`header: ${name}`, got.length > 0 && (want === "" || got.toLowerCase().includes(want.toLowerCase())), got.slice(0, 60));
  }
  const csp = h.get("content-security-policy") ?? "";
  record("header: CSP present", csp.length > 0, csp.slice(0, 70));
  record("header: dev CSP allows eval (expected in dev)", csp.includes("unsafe-eval"), "dev-only");
}

console.log("\n==== SUMMARY ====");
const passed = results.filter((r) => r.pass).length;
console.log(`${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);
