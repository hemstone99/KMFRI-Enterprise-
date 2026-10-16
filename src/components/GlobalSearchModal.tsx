import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, MapPin, ArrowRight, Clock, CornerDownLeft } from 'lucide-react';
import { useHubData } from '../data/HubData';
import { ServiceIcon } from './ui';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, slug?: string) => void;
}

type Filter = 'all' | 'services' | 'stations' | 'education';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All Hub Results' },
  { id: 'services', label: 'Commercial Services (10)' },
  { id: 'stations', label: 'Research Stations (8)' },
  { id: 'education', label: 'Education & Tours' },
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
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

  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        services: services.slice(0, 4),
        stations: stations.slice(0, 3),
        total: 7,
        isDefault: true
      };
    }

    const matchedServices = services.filter(srv =>
      srv.title.toLowerCase().includes(q) ||
      srv.code.toLowerCase().includes(q) ||
      srv.description.toLowerCase().includes(q) ||
      srv.remarks.toLowerCase().includes(q) ||
      srv.keyCapabilities.some(c => c.toLowerCase().includes(q))
    );

    const matchedStations = stations.filter(st =>
      st.name.toLowerCase().includes(q) ||
      st.location.toLowerCase().includes(q) ||
      st.county.toLowerCase().includes(q) ||
      st.description.toLowerCase().includes(q) ||
      st.primaryFocus.some(f => f.toLowerCase().includes(q))
    );

    let filteredServices = matchedServices;
    let filteredStations = matchedStations;

    if (activeFilter === 'services') {
      filteredStations = [];
    } else if (activeFilter === 'stations') {
      filteredServices = [];
    } else if (activeFilter === 'education') {
      filteredServices = matchedServices.filter(s =>
        s.category === 'education' || s.category === 'training' || s.category === 'internship'
      );
      filteredStations = [];
    }

    return {
      services: filteredServices,
      stations: filteredStations,
      total: filteredServices.length + filteredStations.length,
      isDefault: false
    };
  }, [services, stations, query, activeFilter]);

  // Flat list of actions for keyboard navigation
  const actions = useMemo(
    () => [
      ...searchResults.services.map((srv) => () => onNavigate('service_detail', srv.slug)),
      ...searchResults.stations.map((st) => () => onNavigate('stations', st.id)),
    ],
    [searchResults, onNavigate]
  );

  useEffect(() => setHighlight(0), [query, activeFilter]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  if (!isOpen) return null;

  const run = (i: number) => {
    actions[i]?.();
    onClose();
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!actions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % actions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + actions.length) % actions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(highlight);
    }
  };

  const resultCls = (idx: number) =>
    `group w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-colors ${
      idx === highlight ? 'bg-navy-50 border-[#cfdcef]' : 'border-transparent hover:bg-canvas hover:border-line'
    }`;

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
            {FILTERS.map((f) => (
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
          {searchResults.total === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Search className="w-10 h-10 mx-auto text-line-strong" aria-hidden="true" />
              <p className="font-heading font-semibold text-navy-800">No matches found for "{query}"</p>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Try searching for keywords like "water testing", "RV Mtafiti", "tilapia", "Kisumu", or "attachment".
              </p>
            </div>
          ) : (
            <>
              {/* Services matches */}
              {searchResults.services.length > 0 && (
                <div>
                  <p className="flex items-center justify-between px-2 mb-2 k-tag">
                    <span>Enterprise &amp; Commercial Services</span>
                    <span className="text-subtle">{searchResults.services.length} items</span>
                  </p>
                  <ul className="space-y-1">
                    {searchResults.services.map((srv, i) => (
                      <li key={srv.id}>
                        <button type="button" data-idx={i} onClick={() => run(i)} onMouseEnter={() => setHighlight(i)} className={resultCls(i)}>
                          <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-teal-50 text-teal-700 border border-[#bfe8ec]">
                            <ServiceIcon category={srv.category} className="w-4.5 h-4.5" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[0.72rem] font-semibold text-subtle">{srv.code}</span>
                              <span className="text-xs font-semibold text-teal-800">{srv.categoryLabel}</span>
                            </span>
                            <span className="block font-heading font-semibold text-navy-800 truncate">{srv.title}</span>
                            <span className="block text-sm text-muted line-clamp-1">{srv.description}</span>
                            <span className="flex items-center gap-2 mt-1 text-xs text-subtle min-w-0">
                              <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span className="shrink-0">TAT: {srv.turnaroundTime.split('(')[0]}</span>
                              <span aria-hidden="true">&bull;</span>
                              <span className="truncate">Client: {srv.remarks}</span>
                            </span>
                          </span>
                          <ArrowRight className="w-4 h-4 shrink-0 self-center text-subtle group-hover:text-navy-600" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Research Stations matches */}
              {searchResults.stations.length > 0 && (
                <div className={searchResults.services.length ? 'mt-4 pt-4 border-t border-line' : ''}>
                  <p className="flex items-center justify-between px-2 mb-2 k-tag">
                    <span>Research Stations &amp; Centres</span>
                    <span className="text-subtle">{searchResults.stations.length} stations</span>
                  </p>
                  <ul className="space-y-1">
                    {searchResults.stations.map((st, j) => {
                      const i = searchResults.services.length + j;
                      return (
                        <li key={st.id}>
                          <button type="button" data-idx={i} onClick={() => run(i)} onMouseEnter={() => setHighlight(i)} className={resultCls(i)}>
                            <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-navy-600 text-white">
                              <MapPin className="w-4 h-4" aria-hidden="true" />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[0.72rem] font-semibold text-subtle">{st.code}</span>
                                <span className="text-xs font-semibold text-teal-800">{st.county}</span>
                              </span>
                              <span className="block font-heading font-semibold text-navy-800 truncate">{st.name}</span>
                              <span className="block text-sm text-muted line-clamp-1">{st.description}</span>
                            </span>
                            <ArrowRight className="w-4 h-4 shrink-0 self-center text-subtle group-hover:text-navy-600" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
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
            <span>Search live across all 10 services and 8 stations</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onNavigate('services');
              onClose();
            }}
            className="k-link text-sm"
          >
            View All Services Directory
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
