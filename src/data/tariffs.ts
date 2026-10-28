/**
 * Tariffs and search shared by the Tariffs & Charter page, the search dialog and the
 * bundled (offline) data — the same rules as the Drupal module (Catalogue.php,
 * js/hub.js) and sql/005_catalogue_tariffs.sql:
 *
 * - every priced catalogue service is a tariff of its portfolio (laboratory tests carry
 *   no unit in the register: "per test");
 * - portfolio pricing tiers the catalogue does not list are "standard rates";
 * - search matches every word in any order, ignores question words ("price",
 *   "how much") and trims plural -s / -ing.
 */
import type { PricingTier, ServiceItem } from '../types';
import {
  CATALOGUE_INDEX,
  SERVICE_CATALOGUE,
  type CatalogueDivision,
  type CatalogueItem,
  type CatalogueNode,
} from './serviceCatalogue';

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set(['a', 'an', 'and', 'the', 'of', 'for', 'in', 'on', 'to', 'at', 'by', 'with', 'my', 'i', 'is', 'how', 'much', 'what', 'where', 'do', 'you', 'kmfri', 'price', 'prices', 'pricing', 'cost', 'costs', 'fee', 'fees', 'tariff', 'tariffs', 'charge', 'charges', 'rate', 'rates', 'service', 'services', 'ksh', 'kes']);

const stem = (w: string) => {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
};

/** Query → search tokens. A query of question words only ("prices") keeps them. */
export const searchTokens = (query: string): string[] => {
  const words = query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const kept = words.filter((w) => !STOPWORDS.has(w));
  return (kept.length ? kept : words).map(stem);
};

/** 0 = no match; higher = better (words in the title, title starting with the first word). */
export const searchScore = (title: string, text: string, tokens: string[]): number => {
  const t = title.toLowerCase();
  const all = `${t} ${text.toLowerCase()}`;
  if (!tokens.every((x) => all.includes(x))) return 0;
  return 1 + tokens.filter((x) => t.includes(x)).length * 2 + (tokens.length && t.startsWith(tokens[0]) ? 1 : 0);
};

export const matchesQuery = (text: string, query: string) => !query.trim() || searchScore('', text, searchTokens(query)) > 0;

/* ------------------------------------------------------------------ */
/* Tariffs                                                             */
/* ------------------------------------------------------------------ */

export const unitOf = (item: CatalogueItem) => (item.feeKES == null ? undefined : item.feeUnit ?? 'per test');

/** The catalogue's published tariffs of a portfolio, shaped like pricing tiers. */
export const catalogueTiers = (slug: string, turnaroundTime = ''): PricingTier[] =>
  CATALOGUE_INDEX.filter(({ item }) => item.serviceSlug === slug && item.feeKES != null).map(({ item }) => ({
    registerNo: item.no,
    name: item.name,
    unit: unitOf(item)!,
    costKES: item.feeKES!,
    turnaroundTime,
  }));

/** Bundled portfolios: tariffs the catalogue prices are the catalogue's own. */
export const withCatalogueTiers = (s: ServiceItem): ServiceItem => {
  const tiers = catalogueTiers(s.slug, s.turnaroundTime);
  return tiers.length ? { ...s, pricingTiers: tiers } : s;
};

export interface TariffRow {
  item: CatalogueItem;
  /** Group heading below the division ("Benchtop Analysis — Biota › Proximate Analysis") */
  group: string;
  groupNode: CatalogueNode;
}

export interface TariffDivision {
  division: CatalogueDivision;
  rows: TariffRow[];
  priced: number;
  min?: number;
  max?: number;
  portfolio?: ServiceItem;
  /** Portfolio pricing tiers the catalogue does not list */
  rates: PricingTier[];
}

export const standardRates = (s?: ServiceItem) => (s ? s.pricingTiers.filter((t) => t.registerNo == null) : []);

export const tariffAnchor = (key: string) => `tariffs-${key}`;

/** The complete tariff schedule, per division, plus portfolios outside the catalogue. */
export const tariffSchedule = (services: ServiceItem[]) => {
  const bySlug = new Map(services.map((s) => [s.slug, s]));
  const covered = new Set<string>();
  const divisions: TariffDivision[] = SERVICE_CATALOGUE.map((division) => {
    const rows: TariffRow[] = CATALOGUE_INDEX.filter(({ path }) => path[0] === division).map(({ item, path }) => ({
      item,
      groupNode: path[path.length - 1],
      group: path.slice(1).map((n) => n.title).join(' › '),
    }));
    const fees = rows.map((r) => r.item.feeKES).filter((f): f is number => f != null);
    const portfolio = division.serviceSlug ? bySlug.get(division.serviceSlug) : undefined;
    if (division.serviceSlug) covered.add(division.serviceSlug);
    return {
      division,
      rows,
      priced: fees.length,
      min: fees.length ? Math.min(...fees) : undefined,
      max: fees.length ? Math.max(...fees) : undefined,
      portfolio,
      rates: standardRates(portfolio),
    };
  });
  const other = services.filter((s) => !covered.has(s.slug) && s.pricingTiers.length).map((portfolio) => ({ portfolio, rates: standardRates(portfolio) }));
  return {
    divisions,
    other,
    priced: divisions.reduce((n, d) => n + d.priced, 0),
    rates: divisions.reduce((n, d) => n + d.rates.length, 0) + other.reduce((n, o) => n + o.rates.length, 0),
  };
};
