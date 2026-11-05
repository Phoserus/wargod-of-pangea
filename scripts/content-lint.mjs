import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "src/data/skills";
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
let errors = 0;
for (const f of files) {
  const data = JSON.parse(readFileSync(join(dir, f), "utf8"));
  if (!Array.isArray(data.tiers) || data.tiers.length < 3) {
    console.error(`${f}: expected >=3 tiers, got ${data.tiers?.length ?? 0}`);
    errors++;
  }
  for (const t of data.tiers ?? []) {
    // actions live at skill level; just ensure config present
    if (!t.config || typeof t.config !== "object") {
      console.error(`${f} tier ${t.tier ?? "?"}: missing config`);
      errors++;
    }
  }
  if (!Array.isArray(data.actions) || data.actions.length < 1) {
    console.error(`${f}: needs >=1 action`);
    errors++;
  }
}
if (errors) {
  console.error(`content-lint: ${errors} issue(s)`);
  process.exit(1);
}
console.log(`content-lint: OK (${files.length} skills)`);
