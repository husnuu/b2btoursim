import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { parseStorefrontHost } from "../src/lib/storefront/host.ts";

describe("vitrin adres çözümü", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "kontuar.com";
  });

  it("geliştirmede *.localhost slug verir", () => {
    assert.deepEqual(parseStorefrontHost("firma-adi.localhost:3000"), { kind: "slug", slug: "firma-adi" });
  });

  it("uygulamanın kendi adresleri vitrin değildir", () => {
    for (const h of ["localhost:3000", "127.0.0.1", "kontuar.com", "www.kontuar.com", "app.kontuar.com"]) {
      assert.deepEqual(parseStorefrontHost(h), { kind: "none" }, h);
    }
  });

  it("kök alan adının alt alanı slug verir", () => {
    assert.deepEqual(parseStorefrontHost("efes-turizm.kontuar.com"), { kind: "slug", slug: "efes-turizm" });
  });

  it("iki seviyeli alt alan ve geçersiz slug reddedilir", () => {
    assert.deepEqual(parseStorefrontHost("a.b.localhost"), { kind: "none" });
    assert.deepEqual(parseStorefrontHost("Firma_Adi.localhost"), { kind: "none" });
  });

  it("yabancı alan adı özel domain olarak aranır", () => {
    assert.deepEqual(parseStorefrontHost("www.efesturizm.com.tr"), {
      kind: "custom",
      hostname: "www.efesturizm.com.tr",
    });
  });

  it("boş host güvenle none", () => {
    assert.deepEqual(parseStorefrontHost(null), { kind: "none" });
  });
});
