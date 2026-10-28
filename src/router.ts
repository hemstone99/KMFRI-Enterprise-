/**
 * Web addresses of the hub views (History API; the server falls back to index.html).
 *
 *   /                                         home
 *   /catalogue[/{division}[/{group}[/{sub}]]] service catalogue
 *   /stations                                 research stations
 *   /stations/{station}                       one station: overview, services, booking
 *   /laboratories                             laboratory facilities
 *   /charter                                  tariffs & service charter
 *
 * Former addresses (/services, /services/{portfolio-slug}) open the matching catalogue page.
 * The same paths exist in the Drupal module under /enterprise.
 */
import { catalogueHref, divisionForService, nodeIdFromSlugs } from './data/serviceCatalogue';

export type View = 'home' | 'stations' | 'station' | 'charter' | 'laboratories' | 'catalogue';

export interface Route {
  view: View;
  /** Catalogue node id, or station slug (or id — App resolves it to the slug) */
  slug?: string;
}

/** Resolves navigation requests, including the legacy 'services' and 'service_detail' views. */
export const resolveRoute = (view: string, slug?: string): Route => {
  if (view === 'catalogue' || view === 'services') return { view: 'catalogue', slug };
  if (view === 'service_detail') return { view: 'catalogue', slug: divisionForService(slug)?.id };
  // A station id or slug opens that station's own page.
  if (view === 'station' || (view === 'stations' && slug)) return { view: 'station', slug };
  if (view === 'stations' || view === 'charter' || view === 'laboratories') return { view };
  return { view: 'home' };
};

export const hrefFor = ({ view, slug }: Route): string => {
  switch (view) {
    case 'catalogue':
      return catalogueHref(slug);
    case 'station':
      return slug ? `/stations/${slug}` : '/stations';
    case 'home':
      return '/';
    default:
      return `/${view}`;
  }
};

export const routeFromLocation = (loc: Location = window.location): Route => {
  const parts = loc.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const [first, ...rest] = parts;
  switch (first) {
    case 'catalogue':
      return { view: 'catalogue', slug: nodeIdFromSlugs(rest.join('/')) };
    case 'services':
      return resolveRoute(rest.length ? 'service_detail' : 'services', rest[0]);
    case 'stations': {
      // /stations/{slug}; the former /stations#{id} anchors open the station page too.
      const key = rest[0] ?? (loc.hash.slice(1) || undefined);
      return key ? { view: 'station', slug: key } : { view: 'stations' };
    }
    case 'charter':
    case 'laboratories':
      return { view: first };
    default:
      return { view: 'home' };
  }
};
