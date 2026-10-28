import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronRight, ExternalLink, Filter, Layers, Phone, RotateCcw, Search } from 'lucide-react';
import { PageBanner, CtaBand, DIVISION_ICONS, smallVariant } from './ui';
import { useHubData } from '../data/HubData';
import { CatalogueSection } from './catalogue/CatalogueParts';
import { DivisionIntro } from './catalogue/DivisionIntro';
import { matchesQuery } from '../data/tariffs';
import {
  SERVICE_CATALOGUE,
  CATALOGUE_INDEX,
  CATALOGUE_TOTAL,
  ECITIZEN_URL,
  findCataloguePath,
  formatKES,
  itemsUnder,
  lowestFee,
  onlineCount,
  servicesLabel,
  type CatalogueDivision,
  type CatalogueItem,
  type CatalogueNode,
} from '../data/serviceCatalogue';

interface ServiceCatalogueViewProps {
  /** Division or group to open; the overview when empty */
  nodeId?: string;
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry: (slug?: string) => void;
}

type Channel = 'all' | 'online' | 'priced';
const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'all', label: 'All services' },
  { id: 'online', label: 'Apply online' },
  { id: 'priced', label: 'Published tariff' },
];

interface Section {
  node: CatalogueNode;
  items: CatalogueItem[];
}

/** Every node at or below `node` that lists items, in display order. */
const sectionsUnder = (node: CatalogueNode): Section[] => [
  ...(node.items?.length ? [{ node, items: node.items }] : []),
  ...(node.children ?? []).flatMap(sectionsUnder),
];

const searchText = new Map(
  CATALOGUE_INDEX.map(({ item, path }) => [
    item,
    [item.name, item.blurb, item.note, item.feeUnit, ...path.map((p) => p.title)].join(' ').toLowerCase(),
  ]),
);

const ONLINE_TOTAL = CATALOGUE_INDEX.filter(({ item }) => item.onboarded).length;

/* ---------------------------- Tree navigator ---------------------------- */

const Tree: React.FC<{
  nodes: CatalogueNode[];
  activePath: CatalogueNode[];
  onSelect: (id: string) => void;
  depth?: number;
}> = ({ nodes, activePath, onSelect, depth = 0 }) => (
  <ul className={depth ? 'mt-1 ml-3 pl-3 border-l border-line space-y-0.5' : 'space-y-1'}>
    {nodes.map((node) => {
      const onPath = activePath.includes(node);
      const current = activePath[activePath.length - 1] === node;
      const Icon = depth === 0 ? DIVISION_ICONS[node.id] : undefined;
      return (
        <li key={node.id}>
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            aria-current={current ? 'page' : undefined}
            aria-expanded={node.children ? onPath : undefined}
            className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
              current ? 'bg-navy-600 text-white' : onPath ? 'bg-navy-50 text-navy-800' : 'text-ink hover:bg-canvas'
            } ${depth === 0 ? 'font-semibold' : 'text-[0.9rem]'}`}
          >
            {Icon && <Icon className={`w-4 h-4 shrink-0 ${current ? 'text-teal-300' : 'text-teal-700'}`} aria-hidden="true" />}
            <span className="flex-1 min-w-0 leading-snug">{node.title}</span>
            <span className={`text-xs tabular-nums ${current ? 'text-white/80' : 'text-subtle'}`}>{itemsUnder(node).length}</span>
          </button>
          {node.children && onPath && (
            <Tree nodes={node.children} activePath={activePath} onSelect={onSelect} depth={depth + 1} />
          )}
        </li>
      );
    })}
  </ul>
);

/** Flattened options for the small-screen category picker. */
const pickerOptions = (nodes: CatalogueNode[], depth = 0): { id: string; label: string }[] =>
  nodes.flatMap((n) => [
    { id: n.id, label: `${' '.repeat(depth)}${n.title} (${itemsUnder(n).length})` },
    ...pickerOptions(n.children ?? [], depth + 1),
  ]);
const PICKER_OPTIONS = pickerOptions(SERVICE_CATALOGUE);

/* ---------------------------- Division card ---------------------------- */

export const DivisionCard: React.FC<{ division: CatalogueDivision; onSelect: (id: string) => void; showGroups?: boolean }> = ({
  division: d,
  onSelect,
  showGroups = true,
}) => {
  const Icon = DIVISION_ICONS[d.id];
  const from = lowestFee(d);
  const online = onlineCount(d);
  return (
    <article className="k-card k-card--hover h-full">
      <div className="k-card__figure">
        <div className="k-card__media">
          <img src={smallVariant(d.image)} alt="" loading="lazy" />
          {online > 0 && <span className="absolute top-3.5 left-3.5 k-badge k-badge--solid">{online} online</span>}
        </div>
        <span className="k-card__icon" aria-hidden="true"><Icon /></span>
      </div>
      <div className="k-card__body">
        <h3 className="k-h3">
          <button type="button" onClick={() => onSelect(d.id)} className="text-left hover:text-navy-500 after:absolute after:inset-0">
            {d.title}
          </button>
        </h3>
        <p className="text-[0.95rem] text-muted mt-2 leading-relaxed">{d.tagline}</p>
        <p className="mt-3 text-sm font-semibold text-teal-800">
          {servicesLabel(itemsUnder(d).length)}{from != null && <> · from {formatKES(from)}</>}
        </p>
        {showGroups && (
          <ul className="relative z-1 mt-4 space-y-0.5 border-t border-line pt-3">
            {d.children.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => onSelect(g.id)}
                  className="w-full flex items-center gap-2 py-1 text-left text-sm text-ink hover:text-navy-600"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-teal-700 shrink-0" aria-hidden="true" />
                  <span className="flex-1 min-w-0">{g.title}</span>
                  <span className="text-xs text-subtle tabular-nums">{itemsUnder(g).length}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600">
          Explore <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
};

/* --------------------------------- View --------------------------------- */

export const ServiceCatalogueView: React.FC<ServiceCatalogueViewProps> = ({ nodeId, onNavigate, onOpenInquiry }) => {
  const { services } = useHubData();
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState<Channel>('all');
  const contentRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const path = findCataloguePath(nodeId);
  const selected = path[path.length - 1];
  const division = SERVICE_CATALOGUE.find((d) => d === path[0]);
  const isDivision = !!selected && selected === division;
  const portfolio = division?.serviceSlug ? services.find((s) => s.slug === division.serviceSlug) : undefined;

  const select = (id?: string) => onNavigate('catalogue', id);

  // New category: clear the search and bring the content back into view.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setQuery('');
    const el = contentRef.current;
    if (el && el.getBoundingClientRect().top < 0) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }, [nodeId]);

  const q = query.toLowerCase().trim();
  const filtering = q !== '' || channel !== 'all';

  const sections = useMemo(() => {
    const scope = selected ? sectionsUnder(selected) : SERVICE_CATALOGUE.flatMap((d) => sectionsUnder(d));
    return scope
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (item) =>
            (!q || matchesQuery(searchText.get(item)!, q)) &&
            (channel === 'all' || (channel === 'online' ? item.onboarded : item.feeKES != null || item.feeNote != null)),
        ),
      }))
      .filter((s) => s.items.length);
  }, [selected, q, channel]);

  const shownCount = sections.reduce((n, s) => n + s.items.length, 0);
  const scopeCount = selected ? itemsUnder(selected).length : CATALOGUE_TOTAL;

  const resetFilters = () => {
    setQuery('');
    setChannel('all');
  };

  return (
    <div>
      <PageBanner
        crumbs={[
          { label: 'Home', onClick: () => onNavigate('home') },
          { label: 'Service Catalogue', onClick: () => select() },
          ...path.map((n) => ({ label: n.title, onClick: () => select(n.id) })),
        ]}
        title={selected ? selected.title : <>KMFRI Service <em>Catalogue</em></>}
        subtitle={
          isDivision
            ? division!.tagline
            : selected
              ? selected.summary
              : `${CATALOGUE_TOTAL} services from Kenya’s marine and freshwater research institute — laboratory testing, fish seed and feeds, vessel charter, visits, venues and more, with official tariffs and online applications.`
        }
        image={selected?.image ?? division?.image ?? '/images/kmfri/hq-harbour-view.webp'}
        imagePosition="center 45%"
        next="#F7F9FC"
      >
        {isDivision && division!.serviceSlug && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn btn-teal" onClick={() => onOpenInquiry(division!.serviceSlug)}>Request a Quotation</button>
            {onlineCount(division!) > 0 && (
              <a href={ECITIZEN_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light">
                Apply on eCitizen <ExternalLink aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </PageBanner>

      <section className="band-mist k-section pt-8!" aria-label="Service catalogue">
        <div className="k-container grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)] items-start">
          {/* Category navigator */}
          <aside className="lg:sticky lg:top-28 space-y-4">
            <div className="lg:hidden k-panel p-4">
              <label htmlFor="cat-picker" className="k-label">Browse by category</label>
              <select id="cat-picker" className="k-input" value={selected?.id ?? ''} onChange={(e) => select(e.target.value || undefined)}>
                <option value="">All categories ({CATALOGUE_TOTAL})</option>
                {PICKER_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <nav className="hidden lg:block k-panel p-3 max-h-[calc(100vh-15rem)] overflow-y-auto" aria-label="Service categories">
              <button
                type="button"
                onClick={() => select()}
                aria-current={!selected ? 'page' : undefined}
                className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 mb-1 text-left font-semibold transition-colors ${
                  !selected ? 'bg-navy-600 text-white' : 'text-navy-800 hover:bg-canvas'
                }`}
              >
                <Layers className={`w-4 h-4 ${!selected ? 'text-teal-300' : 'text-teal-700'}`} aria-hidden="true" />
                <span className="flex-1">All services</span>
                <span className={`text-xs tabular-nums ${!selected ? 'text-white/80' : 'text-subtle'}`}>{CATALOGUE_TOTAL}</span>
              </button>
              <Tree nodes={SERVICE_CATALOGUE} activePath={path} onSelect={select} />
            </nav>
            <div className="hidden lg:block k-panel p-4 text-sm">
              <p className="font-heading font-semibold text-navy-800">Not sure what you need?</p>
              <p className="text-muted mt-1">Describe your project and KMFRI will recommend the right services.</p>
              <button type="button" className="btn btn-primary btn-sm btn-block mt-3" onClick={() => onOpenInquiry(division?.serviceSlug)}>
                Ask for advice
              </button>
              <a href="tel:+25441475151" className="mt-2.5 flex items-center justify-center gap-1.5 font-semibold text-navy-800">
                <Phone className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" /> +254 (0) 41 475151
              </a>
            </div>
          </aside>

          <div ref={contentRef} className="min-w-0 space-y-6">
            {/* Division introduction (scope, benefits, how to apply, contacts) */}
            {isDivision && !filtering && <DivisionIntro division={division!} service={portfolio} onOpenInquiry={onOpenInquiry} onNavigate={onNavigate} />}
            {isDivision && !filtering && division!.id === 'laboratory' && (
              <div className="k-alert k-alert--teal flex-wrap items-center justify-between">
                <span>Meet the laboratories behind these services — ocean &amp; coastal, freshwater and aquaculture labs, equipment and FAQs.</span>
                <button type="button" className="k-link text-sm" onClick={() => onNavigate('laboratories')}>
                  Our laboratories <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Search & filters */}
            <div className="k-panel p-4 sm:p-5" role="search" aria-label="Search the service catalogue">
              <label htmlFor="cat-search" className="k-label">
                {isDivision ? <>Find a service in {selected.title}</> : selected ? <>Search in {selected.title}</> : 'What do you need?'}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  id="cat-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. heavy metals, monosex fingerlings, school visit, conference, tide tables…"
                  className="k-input pl-10!"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="k-tabs gap-1.5!" role="group" aria-label="Filter by availability">
                  {CHANNELS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setChannel(c.id)}
                      className="k-tab min-h-8.5! py-1! px-3! text-[0.8125rem]!"
                      aria-pressed={channel === c.id}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted" aria-live="polite">
                  Showing <strong className="text-navy-800">{filtering || selected ? shownCount : scopeCount}</strong> of {scopeCount}
                  {filtering && (
                    <button type="button" onClick={resetFilters} className="k-link text-sm ml-3">
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Reset
                    </button>
                  )}
                </p>
              </div>
            </div>

            {/* Overview: divisions */}
            {!selected && !filtering && (
              <>
                <div className="k-panel p-5 sm:p-6 bg-teal-50! border-[#bfe8ec]!">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="max-w-xl">
                      <span className="k-tag">Available online now</span>
                      <h2 className="k-h3 mt-1">{ONLINE_TOTAL} services can be applied for on eCitizen</h2>
                      <p className="text-sm text-muted mt-1.5">
                        Fingerlings and ornamental fish, laboratory analysis, educational visits, conference bookings, attachments and tide tables.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setChannel('online')}>See the list</button>
                      <a href={ECITIZEN_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                        KMFRI eCitizen <ExternalLink aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>

                <ul className="grid gap-6 md:grid-cols-2">
                  {SERVICE_CATALOGUE.map((d) => (
                    <li key={d.id} className="relative">
                      <DivisionCard division={d} onSelect={select} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Group selected: link back to the division */}
            {selected && !isDivision && !filtering && division && (
              <div className="k-panel p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  Part of <strong className="text-navy-800">{division.title}</strong> — {division.tagline}
                </p>
                <button type="button" className="k-link text-sm" onClick={() => select(division.id)}>
                  About this service <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Services & tariffs */}
            {(selected || filtering) && (
              <>
                {isDivision && !filtering && (
                  <div className="flex flex-wrap items-end justify-between gap-3 pt-2">
                    <div>
                      <span className="k-eyebrow">Services &amp; Tariffs</span>
                      <h2 className="k-h2">Choose your <em>service</em></h2>
                    </div>
                    {selected.children && selected.children.length > 1 && (
                      <ul className="flex flex-wrap gap-2" aria-label={`Groups in ${selected.title}`}>
                        {selected.children.map((c) => (
                          <li key={c.id}>
                            <button type="button" className="k-tab min-h-8.5! py-1! px-3! text-[0.8125rem]!" onClick={() => select(c.id)}>
                              {c.title} <span className="text-subtle font-normal">{itemsUnder(c).length}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {sections.length === 0 ? (
                  <div className="k-panel p-12 text-center">
                    <Filter className="w-10 h-10 text-line-strong mx-auto mb-3" aria-hidden="true" />
                    <h2 className="k-h3">No services match</h2>
                    <p className="text-sm text-muted mt-2 max-w-md mx-auto">
                      {channel !== 'all'
                        ? `Nothing matches with the “${CHANNELS.find((c) => c.id === channel)!.label}” filter on.`
                        : selected
                          ? `Nothing in ${selected.title} matches. Try searching all services.`
                          : 'Try a different keyword, or ask KMFRI for advice.'}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {selected && <button type="button" onClick={() => select()} className="btn btn-primary">Search all services</button>}
                      <button type="button" onClick={resetFilters} className="btn btn-outline">Reset filters</button>
                    </div>
                  </div>
                ) : (
                  sections.map((s) => {
                    // Heading relative to the current scope, e.g. "Benchtop Analysis — Biota › Proximate Analysis"
                    const trail = findCataloguePath(s.node.id).map((n) => n.title).slice(selected ? path.length - 1 : 0);
                    const heading = trail.length > 1 ? trail.slice(1).join(' › ') : trail[0];
                    return (
                      <CatalogueSection
                        key={s.node.id}
                        node={s.node}
                        items={s.items}
                        context={trail.length > 1 ? trail[0] : undefined}
                        heading={heading}
                        showIntro={!filtering}
                        onOpen={s.node !== selected ? () => select(s.node.id) : undefined}
                        onOpenInquiry={onOpenInquiry}
                      />
                    );
                  })
                )}
              </>
            )}

            <p className="text-xs text-subtle">
              Tariffs are as published in the KMFRI services register, in Kenya Shillings. Final charges are confirmed on the official quotation or eCitizen invoice.
            </p>
          </div>
        </div>
      </section>

      {/* Other divisions */}
      {selected && division && (
        <section className="bg-white k-section" aria-labelledby="more-heading">
          <div className="k-container">
            <span className="k-eyebrow">Explore More</span>
            <h2 id="more-heading" className="k-h2 mb-8">Other KMFRI <em>services</em></h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICE_CATALOGUE.filter((d) => d !== division).slice(0, 4).map((d) => (
                <li key={d.id} className="relative">
                  <DivisionCard division={d} onSelect={select} showGroups={false} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand
        eyebrow="Quotations"
        title={<>Need several tests <em>or a bulk order?</em></>}
        text="Send your sample list, quantities, cruise plan or event dates and KMFRI will return an official quotation with terms of delivery."
      >
        <button type="button" className="btn btn-teal" onClick={() => onOpenInquiry(division?.serviceSlug)}>Request a Quotation</button>
        <button type="button" className="btn btn-ghost-light" onClick={() => onNavigate('charter')}>Tariffs &amp; Charter</button>
      </CtaBand>
    </div>
  );
};
