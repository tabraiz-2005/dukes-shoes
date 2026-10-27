import { getCatalogData } from "@/lib/catalog/source";
import { CatalogProvider } from "@/components/catalog-provider";
import { StoreProvider } from "@/components/store-provider";
import { Header, Footer } from "@/components/shell";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getCatalogData();
  return (
    <CatalogProvider data={data}>
      <StoreProvider>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </StoreProvider>
    </CatalogProvider>
  );
}
