#!/usr/bin/env node
/**
 * Readiness report.
 *
 * Answers one question: what on this site is still fake?
 *
 * Run bare for a report. Run with --strict to make it fail, which is what the
 * launch build uses. Preview builds stay green so work is never blocked, and
 * the on-page banner carries the warning instead.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const STRICT = process.argv.includes("--strict");

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const OFF = "\x1b[0m";

/* -- 1. the registry ----------------------------------------------------- */

const registrySource = readFileSync(
  join(ROOT, "src/lib/placeholders.ts"),
  "utf8",
);

const records = [...registrySource.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?\}/g)]
  .map((match) => {
    const block = match[0];
    const field = (name) =>
      block.match(new RegExp(`${name}:\\s*"([^"]*)"`))?.[1] ?? "";
    const flag = (name) =>
      block.match(new RegExp(`${name}:\\s*(true|false)`))?.[1] === "true";
    return {
      id: match[1],
      label: field("label"),
      detail: field("detail"),
      owner: field("owner"),
      blocksLaunch: flag("blocksLaunch"),
      resolved: flag("resolved"),
    };
  })
  .filter((r) => r.label);

const unresolved = records.filter((r) => !r.resolved);
const blocking = unresolved.filter((r) => r.blocksLaunch);

/* -- 2. unresolved [[TOKEN]] placeholders in source ----------------------- */

const SKIP = new Set(["node_modules", ".next", ".git", ".claude", "docs"]);
const TOKEN = /\[\[[A-Z_]+\]\]/g;

/* Tests are not the site. A test that feeds a marker to the code which is
   supposed to recognise markers is doing its job, and reporting it here made
   the launch gate fail on a fixture. */
const IS_TEST = /\.test\.tsx?$/;

function walk(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, found);
    } else if (/\.(tsx?|mdx?|json)$/.test(entry) && !IS_TEST.test(entry)) {
      const text = readFileSync(full, "utf8");
      const hits = [...new Set(text.match(TOKEN) ?? [])];
      if (hits.length) found.push({ file: relative(ROOT, full), hits });
    }
  }
  return found;
}

const tokenFiles = walk(join(ROOT, "src"));

/* -- 3. report ------------------------------------------------------------ */

console.log(`\n${BOLD}Готовност за пускане${OFF}\n`);

if (!unresolved.length && !tokenFiles.length) {
  console.log(`${GREEN}Всичко е налично. Сайтът може да се пусне.${OFF}\n`);
  process.exit(0);
}

const byOwner = { client: [], us: [] };
for (const r of unresolved) byOwner[r.owner]?.push(r);

for (const [owner, title] of [
  ["client", "Чака се от клиента"],
  ["us", "Наша задача"],
]) {
  const list = byOwner[owner];
  if (!list.length) continue;
  console.log(`${BOLD}${title}${OFF}`);
  for (const r of list) {
    const mark = r.blocksLaunch ? `${RED}блокира${OFF}` : `${YELLOW}желателно${OFF}`;
    console.log(`  [${mark}] ${BOLD}${r.label}${OFF}`);
    console.log(`           ${DIM}${r.detail}${OFF}`);
  }
  console.log("");
}

if (tokenFiles.length) {
  console.log(`${BOLD}Неразрешени маркери в кода${OFF}`);
  for (const { file, hits } of tokenFiles) {
    console.log(`  ${file} ${DIM}${hits.join(" ")}${OFF}`);
  }
  console.log("");
}

console.log(
  `${blocking.length} блокиращи, ${unresolved.length - blocking.length} желателни, ` +
    `${tokenFiles.length} файла с маркери.\n`,
);

if (STRICT && (blocking.length || tokenFiles.length)) {
  console.error(
    `${RED}${BOLD}Спряно.${OFF} Продукционният билд отказва да продължи, докато има заместващи данни.\n` +
      `${DIM}За преглед използвайте: npm run build${OFF}\n`,
  );
  process.exit(1);
}
