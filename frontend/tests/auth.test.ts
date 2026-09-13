import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hasScope,
  homeForRole,
  hookMissing,
  parseAppClaims,
  safeNext,
} from "../src/lib/auth/claims.ts";

const full = {
  sub: "auth-1",
  email: "a@b.c",
  app_user_id: "user-1",
  tenant_id: "tenant-1",
  agency_id: "agency-1",
  app_role: "sales",
  scopes: ["bookings:read", "bookings:write"],
};

describe("JWT talepleri", () => {
  it("hook'un yazdığı talepleri okur", () => {
    const c = parseAppClaims(full);
    assert.ok(c);
    assert.equal(c.tenantId, "tenant-1");
    assert.equal(c.role, "sales");
    assert.deepEqual(c.scopes, ["bookings:read", "bookings:write"]);
  });

  it("oturum yoksa null", () => {
    assert.equal(parseAppClaims(null), null);
    assert.equal(parseAppClaims({}), null);
  });

  it("oturum var ama kiracı talebi yoksa: hook eksik, oturum değil", () => {
    const raw = { sub: "auth-1", email: "a@b.c" };
    assert.equal(parseAppClaims(raw), null);
    assert.equal(hookMissing(raw), true);
    assert.equal(hookMissing(full), false);
    assert.equal(hookMissing(null), false);
  });

  it("bilinmeyen rol reddedilir", () => {
    assert.equal(parseAppClaims({ ...full, app_role: "root" }), null);
  });

  it("platform yöneticisinin acentesi olmayabilir", () => {
    const c = parseAppClaims({ ...full, app_role: "platform_admin", agency_id: null });
    assert.ok(c);
    assert.equal(c.agencyId, null);
    assert.equal(homeForRole(c.role), "/admin");
    assert.equal(homeForRole("sales"), "/extranet");
  });

  it("*:read her okuma yetkisini kapsar, yazmayı kapsamaz", () => {
    const c = parseAppClaims({ ...full, scopes: ["*:read"] })!;
    assert.equal(hasScope(c, "finance:read"), true);
    assert.equal(hasScope(c, "finance:write"), false);
  });
});

describe("next parametresi", () => {
  it("yalnız site içi göreli yol kabul edilir (açık yönlendirme yok)", () => {
    assert.equal(safeNext("/extranet/sepet", "/x"), "/extranet/sepet");
    assert.equal(safeNext("https://evil.example", "/x"), "/x");
    assert.equal(safeNext("//evil.example", "/x"), "/x");
    assert.equal(safeNext(undefined, "/x"), "/x");
  });
});
