import Link from "next/link";
export default function NotFound() {
  return (
    <section className="section empty page">
            <h1>We could not find that page.</h1>
      <p>The piece may have moved or the link may be mistyped.</p>
      <Link className="button" href="/shop">
        Back to the collection
      </Link>
    </section>
  );
}
