import { DemoBanner } from "@/components/layout/DemoBanner";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

/** Used only for URLs that match no route; pages inside (site) use (site)/not-found.tsx instead. */
export default function RootNotFound() {
  return (
    <>
      <DemoBanner />
      <Header />
      <main>
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
