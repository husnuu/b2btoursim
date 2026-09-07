import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  CONTRAST_RULES,
  EXEMPT,
  RAW_COLOR_ALLOWLIST,
  contrast,
} from "../src/lib/design-tokens.ts";

const CSS = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

describe("tasarım tokenları", () => {
  test("her metin ve sınır tokenı göründüğü her zeminde eşiği tutar", () => {
    const failures: string[] = [];
    for (const rule of CONTRAST_RULES) {
      for (const bg of rule.on) {
        const ratio = contrast(rule.value, bg);
        if (ratio < rule.min) {
          failures.push(
            `${rule.token} (${rule.value}) ${bg} üzerinde ${ratio.toFixed(2)}:1 — ` +
              `en az ${rule.min}:1 olmalı`,
          );
        }
      }
    }
    assert.deepEqual(failures, [], `\n  ${failures.join("\n  ")}\n`);
  });

  test("sözleşmedeki değerler globals.css ile aynı", () => {
    const drift: string[] = [];
    for (const rule of [...CONTRAST_RULES, ...EXEMPT]) {
      const m = CSS.match(
        new RegExp(`${rule.token}\\s*:\\s*(#[0-9a-fA-F]{3,8})`),
      );
      if (!m) {
        drift.push(`${rule.token} globals.css içinde bulunamadı`);
        continue;
      }
      if (m[1].toLowerCase() !== rule.value.toLowerCase()) {
        drift.push(
          `${rule.token}: css'te ${m[1]}, sözleşmede ${rule.value} — ikisi ayrışmış`,
        );
      }
    }
    assert.deepEqual(drift, [], `\n  ${drift.join("\n  ")}\n`);
  });

  test("muafiyetlerin hepsinin yazılı gerekçesi var", () => {
    for (const e of [...EXEMPT, ...RAW_COLOR_ALLOWLIST]) {
      const id = "token" in e ? e.token : e.file;
      assert.ok(e.reason && e.reason.length > 30, `${id} muafiyeti gerekçesiz`);
    }
  });

  test("kök hata sınırındaki satır içi renkler token tablosundan kopyalanmış", () => {
    // Bu dosya token katmanını kullanamıyor; o yüzden değerleri kaymasın diye
    // burada doğrulanır.
    const src = readFileSync("src/app/global-error.tsx", "utf8");
    const used = new Set(
      (src.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((c) => c.toLowerCase()),
    );
    const known = new Set([
      ...CONTRAST_RULES.map((r) => r.value.toLowerCase()),
      ...EXEMPT.map((r) => r.value.toLowerCase()),
      "#ffffff",
      "#f0f2ef",
    ]);
    const unknown = [...used].filter((c) => !known.has(c));
    assert.deepEqual(
      unknown,
      [],
      `global-error.tsx token tablosunda olmayan renk kullanıyor: ${unknown.join(", ")}`,
    );
  });

  test("bileşenlerde ham hex kalmadı", () => {
    // Token katmanının tek kuralı: renk değerleri yalnız globals.css ve
    // theme.ts / design-tokens.ts içinde yaşar.
    const allowed = new Set(RAW_COLOR_ALLOWLIST.map((a) => a.file));
    const files = ["src/components", "src/app"]
      .flatMap((dir) =>
        readdirSync(dir, { recursive: true, encoding: "utf8" })
          .filter((f) => /\.tsx?$/.test(f) && !f.includes("design-tokens"))
          .map((f) => `${dir}/${f}`),
      )
      .filter((f) => !allowed.has(f));
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      // imageTone gibi veri kaynaklı renkler mock veriden gelir, kod değil.
      const matches = [
        ...(src.match(/#[0-9a-fA-F]{6}\b/g) ?? []),
        ...(src.match(/rgba?\([^)]*\)/g) ?? []),
      ];
      if (matches.length) offenders.push(`${f}: ${matches.join(", ")}`);
    }
    assert.deepEqual(offenders, [], `\n  ${offenders.join("\n  ")}\n`);
  });
});
