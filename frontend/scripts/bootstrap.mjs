#!/usr/bin/env node
/**
 * İlk kurulum: platform kiracısı + ana acente + platform yöneticisi.
 *
 * Davet modelinde ilk kullanıcıyı davet edecek kimse yoktur; bu betik o
 * tek istisnadır. Bir kez çalışır, sonrası davetle.
 *
 *   node scripts/bootstrap.mjs <e-posta> <şifre> "<Şirket adı>"
 *
 * .env.local içinde SUPABASE_SECRET_KEY gerekir. Aynı e-posta varsa
 * hiçbir şey yazmaz.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env.local yoksa ortam değişkenlerine güvenilir */
  }
}
loadEnv();

const [email, password, companyName = "Platform"] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!email || !password) {
  console.error('Kullanım: node scripts/bootstrap.mjs <e-posta> <şifre> "<Şirket adı>"');
  process.exit(1);
}
if (!url || !secret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SECRET_KEY .env.local içinde tanımlı olmalı.");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Şifre en az 10 karakter olmalı.");
  process.exit(1);
}

const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: existing } = await db.from("app_user").select("id").ilike("email", email).maybeSingle();
if (existing) {
  console.log(`Zaten var: ${email} — hiçbir şey yazılmadı.`);
  process.exit(0);
}

const { data: plan, error: planErr } = await db.from("plan").select("id").eq("code", "enterprise").single();
if (planErr) throw planErr;

const slug = companyName
  .toLocaleLowerCase("tr")
  .replace(/[çğışöü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ş: "s", ö: "o", ü: "u" })[c])
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || "platform";

const { data: tenant, error: tenantErr } = await db
  .from("tenant")
  .insert({ name: companyName, slug, plan_id: plan.id, status: "active", default_currency: "TRY" })
  .select("id")
  .single();
if (tenantErr) throw tenantErr;

const { data: agency, error: agencyErr } = await db
  .from("agency")
  .insert({ tenant_id: tenant.id, name: companyName, type: "master", currency: "TRY" })
  .select("id")
  .single();
if (agencyErr) throw agencyErr;

// Platform yöneticisi acenteye bağlı değildir (app_user_agency_rule).
const { data: appUser, error: userErr } = await db
  .from("app_user")
  .insert({
    tenant_id: tenant.id,
    agency_id: null,
    role: "platform_admin",
    email,
    full_name: "Platform Yöneticisi",
    status: "invited",
  })
  .select("id")
  .single();
if (userErr) throw userErr;

// Auth kaydı: tetikleyici app_user ile bağlar. E-posta doğrulanmış sayılır.
const { error: authErr } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { app_user_id: appUser.id, full_name: "Platform Yöneticisi" },
});
if (authErr) {
  await db.from("tenant").delete().eq("id", tenant.id); // cascade: agency + app_user
  throw authErr;
}

console.log(`Hazır.
  Kiracı:   ${companyName} (${tenant.id})
  Acente:   ${agency.id}
  Kullanıcı: ${email} — platform_admin
Giriş: http://localhost:3000/giris`);
