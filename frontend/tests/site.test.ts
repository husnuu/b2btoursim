import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultSiteConfig, makeSection, moveSection, normalizeSite } from "../src/lib/site/config.ts";

describe("site yapılandırması", () => {
  it("boş / bozuk girdi varsayılana döner", () => {
    assert.deepEqual(normalizeSite(null), defaultSiteConfig());
    assert.equal(normalizeSite({ garbage: 1 }).sections[0].kind, "hero");
  });

  it("bilinmeyen bölüm türü atılır, kahraman alanı hep en üstte", () => {
    const c = normalizeSite({
      sections: [
        { id: "a", kind: "tours", enabled: true },
        { id: "b", kind: "banner", enabled: true },
        { id: "hero", kind: "hero", enabled: false },
      ],
    });
    assert.deepEqual(c.sections.map((s) => s.kind), ["hero", "tours"]);
  });

  it("tekil bölümler ikinci kez eklenemez (modüller dahil), serbest metin eklenebilir", () => {
    const c = normalizeSite({
      sections: [
        { id: "hero", kind: "hero" },
        { id: "c1", kind: "custom", body: "a" },
        { id: "c2", kind: "custom", body: "b" },
        { id: "about", kind: "about" },
        { id: "about2", kind: "about" },
        { id: "boats", kind: "boats" },
        { id: "boats-2", kind: "boats" },
      ],
    });
    assert.deepEqual(c.sections.map((s) => s.id), ["hero", "c1", "c2", "about", "boats"]);
  });

  it("otomatik sekmeyle çakışan elle bağlantılar alınmaz", () => {
    const c = normalizeSite({ nav: { links: [
      { label: "Turlar", href: "/magaza/tur-arama" },
      { label: "Tekneler", href: "/magaza#boats" },
      { label: "Blog", href: "https://ornek.com/blog" },
    ] } });
    assert.deepEqual(c.nav.links, [{ label: "Blog", href: "https://ornek.com/blog" }]);
  });

  it("menü bağlantıları yalnız site içi yol ya da https", () => {
    const c = normalizeSite({
      nav: { links: [
        { label: "Hakkımızda", href: "/magaza/hakkimizda" },
        { label: "Kötü", href: "javascript:alert(1)" },
        { label: "Dış", href: "https://ornek.com" },
        { label: "Protokolsüz", href: "//evil.com" },
      ] },
    });
    assert.deepEqual(c.nav.links.map((l) => l.href), ["/magaza/hakkimizda", "https://ornek.com"]);
  });

  it("enum alanları geçersizse varsayılan", () => {
    const c = normalizeSite({ theme: { header: "neon", radius: "soft", hero: "x" } });
    assert.equal(c.theme.header, "light");
    assert.equal(c.theme.radius, "soft");
    assert.equal(c.theme.hero, "split");
  });

  it("kart sınırı 1–24 arasına kırpılır", () => {
    const c = normalizeSite({ sections: [{ id: "hero", kind: "hero" }, { id: "t", kind: "tours", limit: 999 }, { id: "b", kind: "boats", limit: 0 }] });
    assert.equal(c.sections[1].limit, 24);
    assert.equal(c.sections[2].limit, 1);
  });

  it("sıralama taşır", () => {
    const s = [makeSection("hero", "hero"), makeSection("tours", "t"), makeSection("about", "a")];
    assert.deepEqual(moveSection(s, 2, 1).map((x) => x.id), ["hero", "a", "t"]);
  });
});
