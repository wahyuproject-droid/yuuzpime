import Link from "next/link";
export default function Page() {
  return <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6 text-center">
    <h1 className="text-lg font-bold">YuuZPime</h1>
    <p className="mt-3 text-sm text-neutral-400">Pemutaran langsung belum tersedia. Gunakan penyedia anime resmi yang memiliki izin.</p>
    <Link href="/" className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-sm font-bold text-black">Kembali ke beranda</Link>
  </section>;
}
