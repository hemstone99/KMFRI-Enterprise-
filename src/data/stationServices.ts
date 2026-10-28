/**
 * What each research station offers, resolved against the Service Catalogue.
 *
 * A catalogue division is offered at a station when the station lists the division's
 * service portfolio, or the portfolio lists the station (or "All KMFRI Centres").
 * Portfolios outside the catalogue (e.g. consultancy) are returned as `other`.
 * The Drupal module mirrors these rules in Repository/StationCatalogue.php.
 */
import type { ResearchStation, ServiceItem } from '../types';
import { SERVICE_CATALOGUE, itemsUnder, onlineCount, type CatalogueDivision } from './serviceCatalogue';

/** Web address segment: the station's place name ("mombasa", "kisumu", …). */
export const stationSlug = (st: ResearchStation) =>
  st.name.split(/[\s(]/)[0].toLowerCase().replace(/[^a-z0-9-]/g, '') || st.code.toLowerCase();

/** Banner photo per station slug (official KMFRI photographs); others use a generic image. */
export const STATION_IMAGES: Record<string, string> = {
  mombasa: '/images/kmfri/hq-building.webp',
  shimoni: '/images/kmfri/cage-culture.webp',
  kegati: '/images/aquaculture-hatchery.webp',
  sangoro: '/images/aquaculture-hatchery.webp',
  kisumu: '/images/ocean-surface.webp',
  naivasha: '/images/ocean-surface.webp',
  baringo: '/images/ocean-surface.webp',
  turkana: '/images/ocean-surface.webp',
};

/** A station by id (database or bundled) or by web address slug. */
export const findStation = (stations: ResearchStation[], key?: string) =>
  key ? stations.find((st) => st.id === key || stationSlug(st) === key) : undefined;

/** "Mombasa Headquarters & Marine Centre" → "mombasa" (for matching free-text station names). */
const placeOf = (name: string) => name.split(/[\s(]/)[0].toLowerCase();

const portfolioFor = (services: ServiceItem[], title: string) =>
  services.find((s) => s.title === title || s.title.startsWith(title) || title.startsWith(s.title));

export interface StationOffer {
  /** Catalogue divisions available at the station, in catalogue order */
  divisions: CatalogueDivision[];
  /** Portfolios listed for the station that are not in the citizen catalogue */
  other: string[];
  /** Number of individual catalogue services */
  total: number;
  online: number;
}

export const stationOffer = (station: ResearchStation, services: ServiceItem[]): StationOffer => {
  const place = placeOf(station.name);
  const slugs = new Set<string>();
  const other: string[] = [];

  station.servicesOffered.forEach((title) => {
    const portfolio = portfolioFor(services, title);
    const inCatalogue = portfolio && SERVICE_CATALOGUE.some((d) => d.serviceSlug === portfolio.slug);
    if (inCatalogue) slugs.add(portfolio.slug);
    else other.push(title);
  });
  services.forEach((s) => {
    if (s.availableStations.some((n) => placeOf(n) === place || /^all\b/i.test(n))) slugs.add(s.slug);
  });

  const divisions = SERVICE_CATALOGUE.filter((d) => d.serviceSlug && slugs.has(d.serviceSlug));
  return {
    divisions,
    other,
    total: divisions.reduce((n, d) => n + itemsUnder(d).length, 0),
    online: divisions.reduce((n, d) => n + onlineCount(d), 0),
  };
};

/** Stations offering a catalogue division (for "Where to get it"). */
export const stationsForDivision = (stations: ResearchStation[], services: ServiceItem[], division: CatalogueDivision) =>
  stations.filter((st) => stationOffer(st, services).divisions.includes(division));
