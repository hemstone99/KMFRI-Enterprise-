import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, X, MapPin, ArrowRight, CornerDownLeft, ListTree, Layers, Receipt, Microscope, FlaskConical,
  FilePenLine, Building2, ExternalLink,
} from 'lucide-react';
import { useHubData } from '../data/HubData';
import { DIVISION_ICONS } from './ui';
import {
  SERVICE_CATALOGUE,
  CATALOGUE_INDEX,
  CATALOGUE_TOTAL,
  ECITIZEN_URL,
  availabilityOf,
  divisionForService,
  formatFee,
  formatKES,
  itemsUnder,
  lowestFee,
  servicesLabel,
  type CatalogueNode,
} from '../data/serviceCatalogue';
import { LAB_GROUPS } from '../data/laboratoriesData';
import { searchScore, searchTokens, standardRates, tariffAnchor } from '../data/tariffs';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry?: (slug?: string) => void;
}

type Filter = 'all' | 'services' | 'labs' | 'stations' | 'education';
type ResultType = 'services' | 'labs' | 'stations' | 'pages';

/** One search result (the same shape as the Drupal search dialog's). */
interface Result {
  key: string;
  type: ResultType;
  education?: boolean;
  /** Shown before anything is typed */
  isDefault?: boolean;
  title: string;
  kicker?: string;
  sub?: string;
  meta?: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: 'teal' | 'navy' | 'solid';
  /** Search text (title, kicker, sub, meta and keywords) */
  text: string;
  run: () => void;
}

interface Group {
  key: string;
  label: string;
  unit: string;
  /** Matches shown at most (the full list is a click away) */
  limit?: number;
  items: Result[];
}

const TONES = {
  teal: 'bg-teal-50 text-teal-700 border border-[#bfe8ec] rounded-xl',
  navy: 'bg-navy-50 text-navy-600 border border-[#cfdcef] rounded-xl',
  solid: 'bg-navy-600 text-white rounded-full',
};

const EDUCATION = ['visits', 'attachment'];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenInquiry,
}) => {
  const { services, stations } = useHubData();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [isOpen]);

  // Everything the dialog can find: pages, service areas, groups, services, rates, labs, stations.
  const groups = useMemo<Group[]>(() => {
    const text = (...parts: (string | undefined | null)[]) => parts.filter(Boolean).join(' ').toLowerCase();
    const count = (n: CatalogueNode) => {
      const from = lowestFee(n);
      return `${servicesLabel(itemsUnder(n).length)}${from != null ? ` · from ${formatKES(from)}` : ''}`;
    };
    const toCharter = (anchor?: string) => () => {
      onNavigate('charter');
      if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ block: 'start' }), 150);
    };

    const pages: Result[] = [
      { key: 'p-charter', type: 'pages', title: 'Tariffs & Charter', sub: 'Every published price, standard rates and service charter commitments.', Icon: Receipt, tone: 'teal', text: text('tariffs & charter prices price list fees charges cost how much turnaround complaints redress'), run: toCharter() },
      { key: 'p-quote', type: 'pages', title: 'Request a quotation', sub: 'Send your sample list, quantities or dates for an official KMFRI quotation.', Icon: FilePenLine, tone: 'teal', text: text('request a quotation quote order book booking buy purchase invoice estimate'), run: () => onOpenInquiry?.() },
      { key: 'p-catalogue', type: 'pages', title: 'Service Catalogue', sub: `All ${CATALOGUE_TOTAL} KMFRI services by area, group and sub-group.`, Icon: Building2, tone: 'teal', text: text('service catalogue directory all services list'), run: () => onNavigate('catalogue') },
      { key: 'p-ecitizen', type: 'pages', title: 'Apply online on eCitizen', sub: 'Apply for and pay for services online.', Icon: ExternalLink, tone: 'teal', text: text('apply online on ecitizen pay payment mpesa account'), run: () => window.open(ECITIZEN_URL, '_blank', 'noopener') },
    ];

    const divisions: Result[] = SERVICE_CATALOGUE.map((d, i) => ({
      key: `d-${d.id}`,
      type: 'services',
      education: EDUCATION.includes(d.id),
      isDefault: i < 4,
      title: d.title,
      sub: d.tagline,
      meta: count(d),
      Icon: DIVISION_ICONS[d.id],
      tone: 'teal',
      text: text(d.title, d.tagline, d.highlight, d.registerLabel, ...d.children.map((c) => c.title)),
      run: () => onNavigate('catalogue', d.id),
    }));

    const nodes: Result[] = [];
    const walk = (node: CatalogueNode, trail: CatalogueNode[]) =>
      node.children?.forEach((child) => {
        const kicker = [...trail, node].map((n) => n.title).join(' › ');
        nodes.push({
          key: `g-${child.id}`,
          type: 'services',
          education: EDUCATION.includes((trail[0] ?? node).id),
          title: child.title,
          kicker,
          sub: child.summary,
          meta: count(child),
          Icon: Layers,
          tone: 'navy',
          text: text(child.title, kicker, child.summary, child.registerLabel),
          run: () => onNavigate('catalogue', child.id),
        });
        walk(child, [...trail, node]);
      });
    SERVICE_CATALOGUE.forEach((d) => walk(d, []));

    const catalogue: Result[] = CATALOGUE_INDEX.map(({ item, path }) => {
      const kicker = path.map((n) => n.title).join(' › ');
      const meta = `${formatFee(item)}${availabilityOf(item) === 'online' ? ' · Apply online on eCitizen' : ''}`;
      return {
        key: `i-${item.no}`,
        type: 'services',
        education: EDUCATION.includes(path[0].id),
        title: item.name,
        kicker,
        meta,
        Icon: ListTree,
        tone: 'navy',
        text: text(item.name, kicker, meta, item.blurb, item.note, `register ${item.no}`),
        run: () => onNavigate('catalogue', path[path.length - 1].id),
      };
    });

    const rates: Result[] = services.flatMap((s) => {
      const division = divisionForService(s.slug);
      return standardRates(s).map((t) => ({
        key: `r-${s.slug}-${t.id ?? t.name}`,
        type: 'services' as const,
        education: EDUCATION.includes(division?.id ?? ''),
        title: t.name,
        kicker: s.title,
        meta: `${formatKES(t.costKES)} ${t.unit}`,
        Icon: Receipt,
        tone: 'teal' as const,
        text: text(t.name, s.title, t.unit, s.categoryLabel),
        run: toCharter(tariffAnchor(division?.id ?? s.slug)),
      }));
    });

    const labs: Result[] = LAB_GROUPS.flatMap((g) => [
      { key: `l-${g.id}`, type: 'labs' as const, title: g.name, kicker: 'Laboratory Services', sub: g.summary, Icon: Microscope, tone: 'teal' as const, text: text(g.name, g.summary, g.intro), run: () => onNavigate('laboratories') },
      ...g.units.map((u) => ({
        key: `l-${g.id}-${u.name}`,
        type: 'labs' as const,
        title: u.name,
        kicker: g.shortName,
        sub: u.services.join(' · '),
        Icon: FlaskConical,
        tone: 'navy' as const,
        text: text(u.name, g.shortName, ...u.services),
        run: () => onNavigate('laboratories'),
      })),
    ]);

    const stationResults: Result[] = stations.map((st, i) => ({
      key: `s-${st.id}`,
      type: 'stations',
      isDefault: i < 3,
      title: st.name,
      kicker: `${st.code} · ${st.county}`,
      sub: st.description,
      Icon: MapPin,
      tone: 'solid',
      text: text(st.name, st.code, st.location, st.county, st.description, ...st.primaryFocus),
      run: () => onNavigate('stations', st.id),
    }));

    return [
      { key: 'pages', label: 'Pages', unit: 'pages', limit: 3, items: pages },
      { key: 'divisions', label: 'Service Areas', unit: 'areas', items: divisions },
      { key: 'groups', label: 'Service Groups', unit: 'groups', limit: 4, items: nodes },
      { key: 'catalogue', label: 'Tests, Products & Applications', unit: 'services', limit: 8, items: catalogue },
      { key: 'rates', label: 'Standard Rates', unit: 'rates', limit: 5, items: rates },
      { key: 'labs', label: 'Laboratory Services', unit: 'results', limit: 5, items: labs },
      { key: 'stations', label: 'Research Stations & Centres', unit: 'stations', items: stationResults },
    ];
  }, [services, stations, onNavigate, onOpenInquiry]);

  const searchResults = useMemo(() => {
    const q = query.trim();
    const tokens = searchTokens(q);
    const keep = (r: Result) =>
      activeFilter === 'all' ||
      (activeFilter === 'education' ? !!r.education : r.type === activeFilter);
    const shown = groups
      .map((g) => {
        const matches = q
          ? g.items
              .map((r) => ({ r, score: keep(r) ? searchScore(r.title, r.text, tokens) : 0 }))
              .filter((x) => x.score > 0)
              .sort((a, b) => b.score - a.score)
              .map((x) => x.r)
          : g.items.filter((r) => r.isDefault);
        return { ...g, total: matches.length, items: matches.slice(0, g.limit ?? Infinity) };
      })
      .filter((g) => g.items.length);
    return { groups: shown, total: shown.reduce((n, g) => n + g.total, 0), isDefault: !q };
  }, [groups, query, activeFilter]);

  // Flat list of results for keyboard navigation
  const flat = useMemo(() => searchResults.groups.flatMap((g) => g.items), [searchResults]);

  useEffect(() => setHighlight(0), [query, activeFilter]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  if (!isOpen) return null;

  const run = (i: number) => {
    onClose();
    flat[i]?.run();
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!flat.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(highlight);
    }
  };

  const resultCls = (idx: number) =>
    `group w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-colors ${
      idx === highlight ? 'bg-navy-50 border-[#cfdcef]' : 'border-transparent hover:bg-canvas hover:border-line'
    }`;

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All Hub Results' },
    { id: 'services', label: `Services & Tariffs (${CATALOGUE_TOTAL})` },
    { id: 'labs', label: 'Laboratories' },
    { id: 'stations', label: `Research Stations (${stations.length})` },
    { id: 'education', label: 'Education & Tours' },
  ];

  let idx = 0;

  return (
    <div className="k-modal-backdrop items-start!" onClick={onClose}>
      <div
        className="k-modal max-w-3xl my-4! sm:my-10!"
        role="dialog"
        aria-modal="true"
        aria-label="Search Hub"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center gap-3">
          <Search className="w-5 h-5 text-teal-700 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search KMFRI services, RV Mtafiti vessel, water analysis, fingerlings, stations, tours..."
            className="w-full min-w-0 text-base sm:text-lg text-ink placeholder:text-subtle focus:outline-none bg-transparent font-medium"
            aria-label="Search the Enterprise Services Hub"
            aria-controls="search-results"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="k-icon-btn w-9! h-9! text-subtle!" aria-label="Clear search">
              <X className="w-4! h-4!" aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={onClose} className="shrink-0 px-2.5 py-1 rounded-md border border-line bg-canvas text-xs font-semibold text-muted hover:text-navy-800">
            ESC
          </button>
        </div>

        {/* Filter Category Pills */}
        <div className="px-4 sm:px-5 py-3 bg-canvas border-b border-line flex flex-wrap items-center justify-between gap-3">
          <div className="k-tabs gap-1.5!" role="group" aria-label="Filter results">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className="k-tab min-h-8.5! py-1! px-3! text-[0.8125rem]!"
                aria-pressed={activeFilter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs font-medium text-muted" aria-live="polite">
            {searchResults.isDefault ? 'Suggested Searches' : `${searchResults.total} matches`}
          </span>
        </div>

        {/* Results List */}
        <div id="search-results" ref={listRef} className="max-h-[58vh] overflow-y-auto p-3 sm:p-4">
          {searchResults.total === 0 && !searchResults.isDefault ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-10 h-10 mx-auto text-line-strong" aria-hidden="true" />
              <p className="font-heading font-semibold text-navy-800">No matches found for "{query}"</p>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Try searching for keywords like "water testing", "RV Mtafiti", "tilapia", "Kisumu", or "attachment".
              </p>
            </div>
          ) : (
            searchResults.groups.map((g, gi) => (
              <div key={g.key} className={gi ? 'mt-4 pt-4 border-t border-line' : ''}>
                <p className="flex items-center justify-between px-2 mb-2 k-tag">
                  <span>{g.label}</span>
                  <span className="text-subtle">
                    {g.total > g.items.length ? `${g.items.length} of ${g.total}` : g.total} {g.unit}
                  </span>
                </p>
                <ul className="space-y-1">
                  {g.items.map((r) => {
                    const i = idx++;
                    return (
                      <li key={r.key}>
                        <button type="button" data-idx={i} onClick={() => run(i)} onMouseEnter={() => setHighlight(i)} className={resultCls(i)}>
                          <span className={`grid place-items-center w-10 h-10 shrink-0 ${TONES[r.tone]}`}>
                            <r.Icon className="w-4.5 h-4.5" />
                          </span>
                          <span className="flex-1 min-w-0">
                            {r.kicker && <span className="block text-xs font-semibold text-teal-800 truncate">{r.kicker}</span>}
                            <span className="block font-heading font-semibold text-navy-800 truncate">{r.title}</span>
                            {r.sub && <span className="block text-sm text-muted line-clamp-1">{r.sub}</span>}
                            {r.meta && <span className="block mt-0.5 text-xs text-subtle">{r.meta}</span>}
                          </span>
                          <ArrowRight className="w-4 h-4 shrink-0 self-center text-subtle group-hover:text-navy-600" aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-canvas border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div className="hidden sm:flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-line-strong bg-white font-mono text-[0.68rem]">↑↓</kbd> navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-line-strong bg-white font-mono text-[0.68rem]"><CornerDownLeft className="w-3 h-3 inline" aria-label="Enter" /></kbd> open
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded border border-line-strong bg-white font-mono text-[0.68rem]">ESC</kbd> to exit
            </span>
            <span aria-hidden="true">&bull;</span>
            <span>Search every KMFRI service, price, laboratory and station</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onNavigate('services');
              onClose();
            }}
            className="k-link text-sm"
          >
            Open Service Catalogue
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
