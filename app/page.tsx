import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>🇫🇷 Prononciation</h1>

      <Link href="/phoneme/gn">
        <button>/ɲ/ son GN</button>
      </Link>
    </main>
  );
}