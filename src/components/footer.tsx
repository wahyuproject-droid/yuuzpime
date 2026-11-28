import Link from "next/link";
export default function Footer(){
  return <footer className="mt-10 border-t border-white/10 bg-[#101010] px-4 py-8 text-center">
    <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold"><img src="/yuuz-logo.svg" alt="" width={32} height={32}/>YuuZPime</Link>
    <p className="mt-3 text-xs text-neutral-400">Modifikasi oleh YuuZ · <a className="underline" href="https://sociabuzz.com/yuuzdisini" target="_blank" rel="noopener noreferrer">SociaBuzz</a> · <a className="underline" href="https://github.com/wahyuproject-droid/yuuzpime/blob/main/LICENSE">MIT</a></p>
  </footer>;
}
