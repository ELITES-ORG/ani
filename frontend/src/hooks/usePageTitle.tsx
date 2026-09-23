import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface PageTitleValue {
  title: string | null;
  setTitle: (title: string | null) => void;
}

const PageTitleContext = createContext<PageTitleValue | null>(null);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>
  );
}

/** Read by the header. Null means "use the route's static title". */
export function usePageTitle(): string | null {
  return useContext(PageTitleContext)?.title ?? null;
}

/**
 * Names the current screen in the header bar.
 *
 * A back arrow beside the word "Ani" tells someone nothing about where they
 * are. On a product page the header should say what they are looking at, and
 * only the page knows that.
 */
export function useSetPageTitle(title: string | null | undefined): void {
  const context = useContext(PageTitleContext);
  const setTitle = context?.setTitle;

  useEffect(() => {
    if (setTitle === undefined) return;
    setTitle(title ?? null);
    return () => setTitle(null);
  }, [setTitle, title]);
}
