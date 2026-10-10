import { ViewTransition, type ReactNode } from "react";

/**
 * Rota değişiminde sayfa içeriği hafifçe yukarı kayıp kaybolur, yenisi aşağıdan
 * gelir. Header `site-header` adıyla sabit kalır. Layout'a değil her sayfaya konur;
 * layout gezinme boyunca kalıcı olduğu için enter/exit orada tetiklenmez.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
