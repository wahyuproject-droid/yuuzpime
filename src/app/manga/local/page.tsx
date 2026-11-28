import type { Metadata } from "next";
import LocalMangaReader from "@/components/manga/LocalMangaReader";

export const metadata: Metadata = { title: "Local Manga Reader | YuuZPime", robots: { index: false, follow: false } };

export default function Page() { return <LocalMangaReader />; }
