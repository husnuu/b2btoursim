import { ContentPage } from "./ContentPage";

/**
 * Serbest metinli içerik sayfası (iptal-iade, KVKK). Metin acentenin
 * editörde yazdığı düz metin: boş satır paragraf, `#` ile başlayan satır
 * ara başlık. HTML yok; her şey metin olarak basılır.
 */
export function LegalPage({ title, body }: { title: string; body: string }) {
  const blocks = body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <ContentPage title={title}>
      {blocks.map((b, i) =>
        b.startsWith("#") ? <h2 key={i}>{b.replace(/^#+\s*/, "")}</h2> : <p key={i} className="whitespace-pre-line">{b}</p>,
      )}
    </ContentPage>
  );
}
