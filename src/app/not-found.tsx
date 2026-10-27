import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section empty page">
      <h1>We could not find that page.</h1>
      <p>The page may have moved or the link may be mistyped.</p>
      <Link className="button" href="/">
        Go to the DUKES homepage
      </Link>
    </main>
  );
}
