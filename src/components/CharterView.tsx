import React, { useMemo, useState } from 'react';
import { Award, Briefcase, Clock, FileCheck, Receipt, Search, ShieldCheck, ArrowRight } from 'lucide-react';
import { useHubData } from '../data/HubData';
import { PageBanner, CtaBand, DIVISION_ICONS } from './ui';
import { AVAILABILITY, Fee, ItemAction } from './catalogue/CatalogueParts';
import { availabilityOf, formatKES } from '../data/serviceCatalogue';
import { matchesQuery, tariffAnchor, tariffSchedule, unitOf } from '../data/tariffs';
import type { PricingTier, ServiceItem } from '../types';

interface CharterViewProps {
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry: (slug?: string) => void;
}

const PRINCIPLES = [
  {
    title: 'Strict Turnaround Timelines',
    text: 'Standard laboratory analysis delivered within 5–7 business days; express 48h emergency testing available for critical export shipments.',
    Icon: Clock,
  },
  {
    title: 'ISO/IEC 17025 Accreditation',
    text: 'All analytical testing adheres to internationally recognized quality standards and calibrated instrumentation with traceability.',
    Icon: Award,
  },
  {
    title: 'Transparent Public Tariffs',
    text: 'Standardized gazetted rates applicable across all 8 research centres with official Government of Kenya revenue receipts.',
    Icon: FileCheck,
  },
];

const REDRESS = 'director@kmfri.go.ke / Commission on Administrative Justice (Ombudsman)';

/** "Ksh 25,000 – 50,000 · 4 published tariffs" (same wording as sql/005). */
const feeSummary = (tiers: PricingTier[]) => {
  if (!tiers.length) return 'On quotation';
  const fees = tiers.map((t) => t.costKES);
  const [lo, hi] = [Math.min(...fees), Math.max(...fees)];
  return `${formatKES(lo)}${hi > lo ? ` – ${hi.toLocaleString('en-KE')}` : ''} · ${fees.length} published tariffs`;
};

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const RatesTable: React.FC<{ portfolio: ServiceItem; rates: PricingTier[]; heading: string; onOpenInquiry: (slug?: string) => void }> = ({ portfolio, rates, heading, onOpenInquiry }) => (
  <div className="border-t border-line first:border-t-0">
    <p className="px-4 sm:px-5 pt-4 pb-2 flex flex-wrap items-baseline justify-between gap-2">
      <span className="k-tag">{heading}</span>
      <span className="text-xs text-subtle">{portfolio.code} · {portfolio.contactOfficer.title}</span>
    </p>
    <div className="k-table-wrap">
      <table className="k-table sm:min-w-[760px]">
        <caption className="sr-only">{portfolio.title}: standard rates</caption>
        <thead>
          <tr>
            <th scope="col">Rate</th>
            <th scope="col" className="text-right">Tariff</th>
            <th scope="col" className="hidden md:table-cell">Turnaround</th>
            <th scope="col" className="text-right"><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {rates.map((t) => (
            <tr key={t.id ?? t.name}>
              <td className="font-semibold text-navy-800 max-w-[30rem]">{t.name}</td>
              <td className="text-right whitespace-nowrap">
                <span className="k-num">{formatKES(t.costKES)}</span>
                <small className="block text-xs text-muted">{t.unit}{t.costUSD ? ` · USD ${t.costUSD.toLocaleString()}` : ''}</small>
              </td>
              <td className="text-sm text-muted hidden md:table-cell">{t.turnaroundTime}</td>
              <td className="text-right">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpenInquiry(portfolio.slug)}>
                  Get a quote<span className="sr-only"> for {t.name}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/** Tariffs & Charter: the complete tariff schedule, service delivery standards and charter commitments. */
export const CharterView: React.FC<CharterViewProps> = ({ onNavigate, onOpenInquiry }) => {
  const { services, charter } = useHubData();
  const [query, setQuery] = useState('');
  const schedule = useMemo(() => tariffSchedule(services), [services]);

  const filtered = useMemo(() => {
    const rateText = (s: ServiceItem, t: PricingTier) => [t.name, t.unit, s.title, s.categoryLabel].join(' ');
    const divisions = schedule.divisions.map((d) => ({
      ...d,
      rows: d.rows.filter(({ item, group }) =>
        matchesQuery([item.name, item.blurb, item.note, group, d.division.title, unitOf(item), item.feeNote].filter(Boolean).join(' '), query),
      ),
      rates: d.portfolio ? d.rates.filter((t) => matchesQuery(rateText(d.portfolio!, t), query)) : [],
    }));
    const other = schedule.other.map((o) => ({ ...o, rates: o.rates.filter((t) => matchesQuery(rateText(o.portfolio, t), query)) }));
    const shown = divisions.reduce((n, d) => n + d.rows.length + d.rates.length, 0) + other.reduce((n, o) => n + o.rates.length, 0);
    return { divisions, other, shown };
  }, [schedule, query]);

  // Charter commitments from kmfri_services_db, or derived from the portfolios.
  const commitments = charter ?? services.map((s) => ({
    serviceSlug: s.slug,
    serviceCode: s.code,
    serviceName: s.title,
    turnaroundTime: s.turnaroundTime.split('(')[0].trim(),
    feeSummary: feeSummary(s.pricingTiers),
    responsibleOfficer: s.contactOfficer.title,
    redressChannel: undefined as string | undefined,
  }));
  const anchorFor = (slug: string) => {
    const d = schedule.divisions.find((x) => x.division.serviceSlug === slug);
    return d ? tariffAnchor(d.division.id) : schedule.other.some((o) => o.portfolio.slug === slug) ? tariffAnchor(slug) : undefined;
  };

  return (
    <div>
      <PageBanner
        crumbs={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Tariffs & Charter' }]}
        title={<>KMFRI Service Charter &amp; <em>Tariffs</em></>}
        subtitle={`Every published KMFRI tariff in one schedule — ${schedule.priced} catalogue services and ${schedule.rates} standard rates — with the turnaround times and officers we commit to under the Government of Kenya service delivery standards.`}
        image="/images/vessel-port.webp"
        imagePosition="center 45%"
        next="#F7F9FC"
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-teal" onClick={() => scrollTo('tariff-schedule')}><Receipt aria-hidden="true" /> View all tariffs</button>
          <button type="button" className="btn btn-ghost-light" onClick={() => scrollTo('charter-commitments')}><ShieldCheck aria-hidden="true" /> Service charter</button>
        </div>
      </PageBanner>

      {/* 1. Tariff schedule */}
      <section id="tariff-schedule" className="band-mist k-section pt-8! scroll-mt-28" aria-labelledby="schedule-heading">
        <div className="k-container space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <span className="k-eyebrow">Official Tariffs</span>
              <h2 id="schedule-heading" className="k-h2">Tariff <em>schedule</em></h2>
              <p className="text-muted mt-2">
                Prices in Kenya Shillings, as published in the KMFRI service catalogue. Laboratory tariffs are per test. Your official quotation
                confirms the final amount for your samples, quantities or dates.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line text-center shrink-0">
              {[
                { label: 'Catalogue tariffs', value: schedule.priced },
                { label: 'Standard rates', value: schedule.rates },
                { label: 'Service areas', value: schedule.divisions.length },
              ].map((f) => (
                <div key={f.label} className="bg-white px-4 py-3">
                  <dt className="text-[0.68rem] font-semibold uppercase tracking-widest text-subtle">{f.label}</dt>
                  <dd className="k-num text-xl mt-0.5">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="k-panel p-4 sm:p-5 space-y-4">
            <form role="search" className="flex flex-wrap items-center gap-3" aria-label="Search the tariff schedule" onSubmit={(e) => e.preventDefault()}>
              <label className="relative flex-1 min-w-[14rem]">
                <span className="sr-only">Search tariffs</span>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="k-input pl-10!"
                  placeholder="Search a test, product or facility — e.g. heavy metals, tilapia, vessel"
                  autoComplete="off"
                />
              </label>
              {query && <button type="button" className="btn btn-outline" onClick={() => setQuery('')}>Clear</button>}
              <p className="text-sm text-muted ml-auto" aria-live="polite"><strong className="text-navy-800">{filtered.shown}</strong> tariffs shown</p>
            </form>
            <ul className="flex flex-wrap gap-1.5" aria-label="Jump to a service area">
              {filtered.divisions.filter((d) => d.rows.length || d.rates.length).map(({ division }) => {
                const Icon = DIVISION_ICONS[division.id];
                return (
                  <li key={division.id}>
                    <button type="button" onClick={() => scrollTo(tariffAnchor(division.id))} className="k-tab min-h-8! py-0.5! px-3! text-[0.8125rem]! bg-white!">
                      <Icon className="w-4 h-4" /> {division.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {filtered.shown === 0 && (
            <div className="k-panel p-8 text-center space-y-2">
              <Search className="w-10 h-10 mx-auto text-line-strong" aria-hidden="true" />
              <p className="font-heading font-semibold text-navy-800">No tariff matches your search.</p>
              <p className="text-sm text-muted">Try another word, or request a quotation and our officers will price it for you.</p>
              <button type="button" className="btn btn-primary btn-sm mt-2" onClick={() => onOpenInquiry()}>Request a quotation</button>
            </div>
          )}

          {filtered.divisions.map((d) => {
            if (!d.rows.length && !d.rates.length) return null;
            const Icon = DIVISION_ICONS[d.division.id];
            const full = schedule.divisions.find((x) => x.division === d.division)!;
            return (
              <section key={d.division.id} id={tariffAnchor(d.division.id)} className="k-panel overflow-hidden scroll-mt-32" aria-labelledby={`${d.division.id}-tariffs`}>
                <header className="flex flex-wrap items-center gap-4 px-4 sm:px-5 py-4 border-b border-line">
                  <span className="grid place-items-center w-11 h-11 shrink-0 rounded-xl bg-teal-50 text-teal-700 border border-[#bfe8ec]"><Icon className="w-5 h-5" /></span>
                  <div className="flex-1 min-w-[12rem]">
                    <h3 id={`${d.division.id}-tariffs`} className="font-heading font-semibold text-lg text-navy-800">
                      <button type="button" className="hover:text-navy-500 text-left" onClick={() => onNavigate('catalogue', d.division.id)}>{d.division.title}</button>
                    </h3>
                    <p className="text-sm text-muted">{d.division.tagline}</p>
                  </div>
                  <p className="text-sm font-semibold text-teal-800">
                    {full.priced
                      ? `${full.priced} ${full.priced === 1 ? 'tariff' : 'tariffs'} · ${formatKES(full.min!)}${full.max! > full.min! ? ` – ${full.max!.toLocaleString('en-KE')}` : ''}`
                      : full.rates.length
                        ? `${full.rates.length} standard ${full.rates.length === 1 ? 'rate' : 'rates'}`
                        : 'On quotation'}
                  </p>
                </header>

                {d.rows.length > 0 && (
                  <div className="k-table-wrap">
                    <table className="k-table sm:min-w-[760px]">
                      <caption className="sr-only">{d.division.title}: services and tariffs</caption>
                      <thead>
                        <tr>
                          <th scope="col" className="w-14 hidden sm:table-cell">No.</th>
                          <th scope="col">Service</th>
                          <th scope="col" className="text-right">Tariff</th>
                          <th scope="col" className="hidden md:table-cell">How to get it</th>
                          <th scope="col" className="text-right"><span className="sr-only">Action</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.rows.map(({ item, group, groupNode }) => {
                          const badge = AVAILABILITY[availabilityOf(item)];
                          return (
                            <tr key={item.no}>
                              <td className="font-mono text-[0.8125rem] font-semibold text-subtle hidden sm:table-cell">{item.no}</td>
                              <td className="max-w-[30rem]">
                                <span className="block font-semibold text-navy-800 leading-snug">{item.name}</span>
                                {group && (
                                  <button type="button" className="block text-left text-xs font-semibold text-teal-800 mt-0.5 hover:underline" onClick={() => onNavigate('catalogue', groupNode.id)}>
                                    {group}
                                  </button>
                                )}
                              </td>
                              <td className="text-right whitespace-nowrap"><span className="inline-flex"><Fee item={item} /></span></td>
                              <td className="hidden md:table-cell"><span className={`k-badge ${badge.cls}`}>{badge.label}</span></td>
                              <td className="text-right"><ItemAction item={item} onOpenInquiry={onOpenInquiry} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {d.portfolio && d.rates.length > 0 && <RatesTable portfolio={d.portfolio} rates={d.rates} heading="Standard rates" onOpenInquiry={onOpenInquiry} />}
              </section>
            );
          })}

          {filtered.other.some((o) => o.rates.length) && (
            <section id="tariffs-other" className="k-panel overflow-hidden scroll-mt-32" aria-labelledby="tariffs-other-title">
              <header className="flex flex-wrap items-center gap-4 px-4 sm:px-5 py-4 border-b border-line">
                <span className="grid place-items-center w-11 h-11 shrink-0 rounded-xl bg-navy-50 text-navy-600 border border-[#cfdcef]"><Briefcase className="w-5 h-5" /></span>
                <div className="flex-1 min-w-[12rem]">
                  <h3 id="tariffs-other-title" className="font-heading font-semibold text-lg text-navy-800">Consultancy, Value Addition &amp; Training</h3>
                  <p className="text-sm text-muted">Enterprise services delivered on request, at standard rates.</p>
                </div>
              </header>
              {filtered.other.filter((o) => o.rates.length).map((o) => (
                <div key={o.portfolio.slug} id={tariffAnchor(o.portfolio.slug)} className="scroll-mt-32">
                  <RatesTable portfolio={o.portfolio} rates={o.rates} heading={o.portfolio.title} onOpenInquiry={onOpenInquiry} />
                </div>
              ))}
            </section>
          )}
        </div>
      </section>

      {/* 2. Service delivery standards */}
      <section className="band-teal k-section" aria-labelledby="principles-heading">
        <div className="k-container">
          <span className="k-eyebrow">Our Commitments</span>
          <h2 id="principles-heading" className="k-h2 mb-10">Service Delivery <em>Standards</em></h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRINCIPLES.map(({ title, text, Icon }) => (
              <li key={title} className="k-card p-7">
                <span className="grid place-items-center w-14 h-14 rounded-full bg-navy-50 text-navy-600 ring-8 ring-navy-50/50">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </span>
                <h3 className="k-h3 mt-6">{title}</h3>
                <span className="k-rule my-4" aria-hidden="true" />
                <p className="text-[0.95rem] text-muted leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Charter commitments per portfolio */}
      <section id="charter-commitments" className="band-mist k-section scroll-mt-28" aria-labelledby="matrix-heading">
        <div className="k-container">
          <div className="k-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-5 border-b border-line">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-full bg-navy-600 text-white">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                </span>
                <h2 id="matrix-heading" className="font-heading text-lg sm:text-xl font-semibold text-navy-800">Citizens' Service Charter</h2>
              </div>
              <span className="k-badge k-badge--teal">{commitments.length} service portfolios</span>
            </div>
            <div className="p-4 sm:p-6">
              <div className="k-table-wrap">
                <table className="k-table min-w-[900px]">
                  <caption className="sr-only">Citizens' service charter: statutory turnaround, official fees and responsible officers</caption>
                  <thead>
                    <tr>
                      <th scope="col">Code</th>
                      <th scope="col">Service</th>
                      <th scope="col">Statutory Turnaround</th>
                      <th scope="col">Official Fee</th>
                      <th scope="col">Responsible Officer</th>
                      <th scope="col" className="text-right">Tariffs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commitments.map((c) => {
                      const anchor = anchorFor(c.serviceSlug);
                      return (
                        <tr key={c.serviceCode + c.serviceName}>
                          <td className="font-mono text-[0.8125rem] font-semibold text-navy-600 whitespace-nowrap">{c.serviceCode}</td>
                          <td className="font-semibold text-navy-800 max-w-[260px]">
                            <button type="button" className="text-left hover:text-navy-500" onClick={() => onNavigate('service_detail', c.serviceSlug)}>{c.serviceName}</button>
                          </td>
                          <td className="text-ink font-medium">{c.turnaroundTime}</td>
                          <td><span className="k-num whitespace-normal!">{c.feeSummary}</span></td>
                          <td className="text-muted text-[0.8125rem]">{c.responsibleOfficer}</td>
                          <td className="text-right">
                            {anchor && (
                              <button type="button" onClick={() => scrollTo(anchor)} className="k-link text-sm whitespace-nowrap" aria-label={`Tariffs for ${c.serviceName}`}>
                                See tariffs
                                <span className="k-link__arrow w-7! h-7!"><ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-muted">
                <strong className="text-navy-800">Complaints &amp; redress:</strong> {charter?.[0]?.redressChannel ?? REDRESS}
              </p>
              <p className="mt-3 text-xs text-subtle md:hidden">Scroll the table horizontally to see all columns.</p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Quotations"
        title={<>Get an official <em>fee quotation</em></>}
        text="Submit your project scope, sample volume, or vessel charter schedule to receive an official KMFRI reference quote and terms of delivery."
      >
        <button type="button" className="btn btn-teal" onClick={() => onOpenInquiry()}>Submit Service Request</button>
        <button type="button" className="btn btn-ghost-light" onClick={() => onNavigate('services')}>Browse Services</button>
      </CtaBand>
    </div>
  );
};
