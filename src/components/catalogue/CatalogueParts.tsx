import React from 'react';
import { ExternalLink } from 'lucide-react';
import { smallVariant } from '../ui';
import {
  ECITIZEN_URL,
  availabilityOf,
  formatKES,
  type Availability,
  type CatalogueItem,
  type CatalogueNode,
} from '../../data/serviceCatalogue';

export const AVAILABILITY: Record<Availability, { label: string; cls: string }> = {
  online: { label: 'On eCitizen', cls: 'k-badge--teal' },
  partial: { label: 'Being digitised', cls: 'k-badge--navy' },
  office: { label: 'By quotation', cls: 'k-badge--navy' },
  planned: { label: 'Coming soon', cls: 'k-badge--gold' },
};

const ROW_GRID = 'lg:grid-cols-[minmax(0,1fr)_8.5rem_8.5rem_9.5rem]';

export const Fee: React.FC<{ item: CatalogueItem }> = ({ item }) =>
  item.feeKES != null ? (
    <span className="flex flex-col lg:items-end leading-tight">
      <span className="k-num">{formatKES(item.feeKES)}</span>
      <small className="text-xs text-muted">{item.feeUnit ?? 'per test'}</small>
    </span>
  ) : item.feeNote ? (
    <span className="k-num">{item.feeNote}</span>
  ) : (
    <span className="text-sm text-subtle">{availabilityOf(item) === 'planned' ? '—' : 'On quotation'}</span>
  );

/** The call to action for one service: apply on eCitizen, or request a quotation. */
export const ItemAction: React.FC<{ item: CatalogueItem; onOpenInquiry: (slug?: string) => void }> = ({ item, onOpenInquiry }) => {
  const availability = availabilityOf(item);
  if (availability === 'online') {
    return (
      <a href={ECITIZEN_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
        Apply <ExternalLink aria-hidden="true" />
        <span className="sr-only">for {item.name} on eCitizen (opens in a new tab)</span>
      </a>
    );
  }
  if (availability !== 'planned' && item.serviceSlug) {
    return (
      <button type="button" onClick={() => onOpenInquiry(item.serviceSlug)} className="btn btn-outline btn-sm">
        Get a quote<span className="sr-only"> for {item.name}</span>
      </button>
    );
  }
  return null;
};

const ItemRow: React.FC<{ item: CatalogueItem; onOpenInquiry: (slug?: string) => void }> = ({ item, onOpenInquiry }) => {
  const badge = AVAILABILITY[availabilityOf(item)];
  return (
    <li className={`grid gap-x-5 gap-y-2.5 px-4 sm:px-5 py-3.5 items-center ${ROW_GRID}`}>
      <div className="min-w-0">
        <p className="font-semibold text-navy-800 leading-snug">{item.name}</p>
        {item.blurb && <p className="text-sm text-muted mt-0.5 leading-snug">{item.blurb}</p>}
        {item.note && <p className="text-xs text-gold-700 mt-1">{item.note}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:contents">
        <div className="lg:text-right"><Fee item={item} /></div>
        <div><span className={`k-badge ${badge.cls}`}>{badge.label}</span></div>
        <div className="lg:text-right"><ItemAction item={item} onOpenInquiry={onOpenInquiry} /></div>
      </div>
    </li>
  );
};

/** One service group: optional photo + introduction, then its services. */
export const CatalogueSection: React.FC<{
  node: CatalogueNode;
  items: CatalogueItem[];
  /** Ancestor titles shown above the heading (relative to the current scope) */
  context?: string;
  heading: string;
  /** Show the group's photo and introduction */
  showIntro: boolean;
  onOpen?: () => void;
  onOpenInquiry: (slug?: string) => void;
}> = ({ node, items, context, heading, showIntro, onOpen, onOpenInquiry }) => {
  const intro = showIntro ? node.highlight ?? node.summary : undefined;
  return (
    <section className="k-panel overflow-hidden" aria-labelledby={`sec-${node.id}`}>
      <header className={`border-b border-line ${showIntro && node.image ? 'grid sm:grid-cols-[180px_minmax(0,1fr)]' : ''}`}>
        {showIntro && node.image && (
          <img src={smallVariant(node.image)} alt="" className="hidden sm:block w-full h-full min-h-[132px] object-cover" loading="lazy" />
        )}
        <div className="px-4 sm:px-5 py-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0 max-w-3xl">
            {context && <p className="k-tag">{context}</p>}
            <h3 id={`sec-${node.id}`} className="font-heading font-semibold text-lg text-navy-800">
              {onOpen ? (
                <button type="button" onClick={onOpen} className="text-left hover:text-navy-500">{heading}</button>
              ) : (
                heading
              )}
            </h3>
            {intro && <p className="text-sm text-muted mt-1.5 leading-relaxed">{intro}</p>}
          </div>
          <span className="text-xs text-subtle shrink-0">{items.length} {items.length === 1 ? 'service' : 'services'}</span>
        </div>
      </header>
      <div className={`hidden lg:grid ${ROW_GRID} gap-x-5 px-5 py-2 bg-canvas border-b border-line text-[0.72rem] font-semibold uppercase tracking-widest text-subtle`}>
        <span>Service</span>
        <span className="text-right">Tariff</span>
        <span>How to get it</span>
        <span className="sr-only">Action</span>
      </div>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <ItemRow key={item.no} item={item} onOpenInquiry={onOpenInquiry} />
        ))}
      </ul>
    </section>
  );
};
