import { Outlet } from '@remix-run/react';
import { mergeMeta } from '~/utils';

import type { Handle } from '~/types/handle';
import { searchPages } from '~/constants/tabLinks';
import { BreadcrumbItem } from '~/components/elements/Breadcrumb';

export const meta = mergeMeta(() => [
  { title: 'YuuZPime - Search' },
  { name: 'description', content: 'Search Movies, Tv Series and Anime on YuuZPime' },
  { property: 'og:url', content: 'https://sorachill.vercel.app/search' },
  { property: 'og:title', content: 'YuuZPime - Search' },
  { property: 'og:image', content: 'https://sorachill.vercel.app/api/ogimage?it=search' },
  { property: 'og:description', content: 'Search Movies, Tv Series and Anime on YuuZPime' },
  { name: 'twitter:title', content: 'YuuZPime - Search' },
  { name: 'twitter:image', content: 'https://sorachill.vercel.app/api/ogimage?it=search' },
  { name: 'twitter:description', content: 'Search Movies, Tv Series and Anime on YuuZPime' },
]);

export const handle: Handle = {
  breadcrumb: ({ t }) => (
    <BreadcrumbItem to="/search" key="search">
      {t('search.action')}
    </BreadcrumbItem>
  ),
  showTabLink: true,
  tabLinkPages: searchPages,
  tabLinkTo: () => '/search/',
  miniTitle: ({ t }) => ({
    title: t('search.action'),
    showImage: false,
  }),
};

const SearchPage = () => <Outlet />;

export default SearchPage;
