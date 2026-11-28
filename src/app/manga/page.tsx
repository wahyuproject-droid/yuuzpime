import { Metadata } from 'next';
import { constructMetadata } from '@/lib/metadata';
import { MangaPage } from '@/views/MangaPage';

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    title: 'Manga Catalog',
    description: 'Explore manga information, covers, and the local reader.',
    type: 'website',
    canonicalUrl: '/manga',
  });
}

export default function Page() {
  return <MangaPage />;
}
