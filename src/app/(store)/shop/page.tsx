import { Suspense } from "react";
import { Shop } from "@/components/shop";
export default function Page() {
  return (
    <Suspense fallback={<div className="section">Loading the collection…</div>}>
      <Shop />
    </Suspense>
  );
}
