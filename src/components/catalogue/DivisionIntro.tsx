import React from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  ExternalLink,
  Info,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Ship,
  Users,
} from 'lucide-react';
import type { ServiceItem } from '../../types';
import { useHubData } from '../../data/HubData';
import { stationSlug, stationsForDivision } from '../../data/stationServices';
import { imgSrcSet, smallVariant } from '../ui';
import {
  ECITIZEN_URL,
  itemsUnder,
  lowestFee,
  onlineCount,
  formatKES,
  type CatalogueDivision,
} from '../../data/serviceCatalogue';

/** Client inquiries desk — the published KMFRI number for every service. */
const INQUIRIES_PHONE = '+254 (0) 41 475151';

interface DivisionIntroProps {
  division: CatalogueDivision;
  /** Portfolio record for the division (scope, requirements, contacts) */
  service?: ServiceItem;
  onOpenInquiry: (slug?: string) => void;
  onNavigate: (view: string, slug?: string) => void;
}

/**
 * What a client needs to know before choosing a service in this division:
 * what it is, why KMFRI, who it is for, how to apply and whom to contact.
 */
export const DivisionIntro: React.FC<DivisionIntroProps> = ({ division, service, onOpenInquiry, onNavigate }) => {
  const { services, stations } = useHubData();
  const stationsHere = stationsForDivision(stations, services, division);
  const count = itemsUnder(division).length;
  const online = onlineCount(division);
  const from = lowestFee(division);
  // Portfolio packages are shown only where the register publishes no per-item tariffs.
  const packages = from == null ? service?.pricingTiers ?? [] : [];
  const gallery = division.gallery.slice(0, 3);

  const facts = [
    { label: 'Services', value: `${count} in this division`, Icon: ClipboardList },
    from != null
      ? { label: 'Prices from', value: formatKES(from), Icon: Receipt }
      : { label: 'Pricing', value: 'On official quotation', Icon: Receipt },
    service?.turnaroundTime && { label: 'Turnaround', value: service.turnaroundTime.split('(')[0].trim(), Icon: Clock },
    { label: 'Apply online', value: online ? `${online} on eCitizen` : 'Request via KMFRI', Icon: ExternalLink },
  ].filter(Boolean) as { label: string; value: string; Icon: React.ComponentType<{ className?: string }> }[];

  return (
    <div className="space-y-6">
      {/* Overview, benefits and photos */}
      <section className="k-panel overflow-hidden" aria-labelledby="division-about">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="p-5 sm:p-7">
            <span className="k-tag">About this service</span>
            <h2 id="division-about" className="k-h3 mt-1">{division.tagline}</h2>
            <p className="mt-3 text-[1.0125rem] leading-relaxed text-ink">{division.highlight}</p>
            <h3 className="k-tag mt-6 mb-3">Why choose KMFRI</h3>
            <ul className="space-y-2.5">
              {division.benefits.map((b) => (
                <li key={b} className="k-check text-[0.95rem]">
                  <CheckCircle2 aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            {division.credentials && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Quality credentials">
                {division.credentials.map((c) => (
                  <li key={c} className="k-badge k-badge--navy">
                    <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" /> {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Photos fill the column height beside the text on desktop */}
          <div className={`grid grid-cols-2 gap-1 bg-line ${gallery.length > 1 ? 'lg:grid-rows-[3fr_2fr]' : ''}`}>
            {gallery.map((g, i) => (
              <img
                key={g.src + i}
                src={i === 0 ? g.src : smallVariant(g.src)}
                srcSet={i === 0 ? imgSrcSet(g.src) : undefined}
                sizes={i === 0 ? '(min-width: 1024px) 520px, 100vw' : undefined}
                alt={g.alt}
                loading="lazy"
                className={`w-full h-full object-cover ${
                  i === 0 || (gallery.length === 2 && i === 1) ? 'col-span-2 aspect-[16/9]' : 'aspect-[4/3]'
                } lg:aspect-auto lg:min-h-[140px]`}
              />
            ))}
          </div>
        </div>

        <dl className={`grid grid-cols-2 ${facts.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-px bg-line border-t border-line max-lg:[&>:last-child:nth-child(odd)]:col-span-2`}>
          {facts.map(({ label, value, Icon }) => (
            <div key={label} className="flex items-start gap-3 p-4 sm:p-5 bg-white">
              <Icon className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-widest text-subtle">{label}</dt>
                <dd className="mt-0.5 font-semibold text-navy-800 leading-snug">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Who it is for · how to apply · contact */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {service && service.targetClients.length > 0 && (
          <section className="k-panel" aria-labelledby="division-clients">
            <div className="k-panel__head">
              <Users className="w-5 h-5" aria-hidden="true" />
              <h3 id="division-clients">Who it is for</h3>
            </div>
            <ul className="k-panel__body space-y-2 text-[0.95rem]">
              {service.targetClients.map((c) => (
                <li key={c} className="k-check"><CheckCircle2 aria-hidden="true" /><span>{c}</span></li>
              ))}
            </ul>
          </section>
        )}

        <section className="k-panel" aria-labelledby="division-howto">
          <div className="k-panel__head">
            <ClipboardList className="w-5 h-5" aria-hidden="true" />
            <h3 id="division-howto">How to get it</h3>
          </div>
          <ol className="k-panel__body space-y-3 text-[0.95rem]">
            {[
              online
                ? 'Choose a service below and apply online on eCitizen, or request a quotation for anything else.'
                : 'Choose a service below and request an official quotation.',
              ...(service?.sampleRequirements ?? []),
              'Pay electronically and receive your official KMFRI receipt.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid place-items-center w-6 h-6 shrink-0 rounded-full bg-navy-600 text-white text-xs font-semibold font-heading">{i + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="k-panel md:col-span-2 xl:col-span-1" aria-labelledby="division-contact">
          <div className="k-panel__head">
            <Phone className="w-5 h-5" aria-hidden="true" />
            <h3 id="division-contact">Talk to KMFRI</h3>
          </div>
          <div className="k-panel__body space-y-3 text-sm">
            {service && <p className="font-semibold text-navy-800">{service.contactOfficer.title}</p>}
            {service && (
              <a href={`mailto:${service.contactOfficer.email}`} className="flex items-center gap-2 text-navy-600 font-medium hover:underline break-all">
                <Mail className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" /> {service.contactOfficer.email}
              </a>
            )}
            <a href="tel:+25441475151" className="flex items-center gap-2 text-ink hover:text-navy-600">
              <Phone className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" /> {INQUIRIES_PHONE}
            </a>
            {stationsHere.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="block text-xs text-subtle">Where to get it</span>
                  <ul className="flex flex-wrap gap-x-3 gap-y-1">
                    {stationsHere.map((st) => (
                      <li key={st.id}>
                        <button type="button" className="text-navy-600 font-medium hover:underline" onClick={() => onNavigate('station', stationSlug(st))}>
                          {st.name.split(' (')[0]}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {division.serviceSlug && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpenInquiry(division.serviceSlug)}>
                  Request a quotation
                </button>
              )}
              {online > 0 && (
                <a href={ECITIZEN_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                  eCitizen <ExternalLink aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Research fleet */}
      {service?.vessels && service.vessels.length > 0 && (
        <section className="k-panel" aria-labelledby="fleet-heading">
          <div className="k-panel__head">
            <Ship className="w-5 h-5" aria-hidden="true" />
            <h3 id="fleet-heading">Research fleet available for charter</h3>
          </div>
          <div className="k-panel__body">
            <div className="k-table-wrap">
              <table className="k-table min-w-[720px]">
                <caption className="sr-only">KMFRI research vessels and charter rates</caption>
                <thead>
                  <tr>
                    <th scope="col">Vessel</th>
                    <th scope="col">Specification</th>
                    <th scope="col">Scientific gear</th>
                    <th scope="col">Day rate</th>
                  </tr>
                </thead>
                <tbody>
                  {service.vessels.map((v) => (
                    <tr key={v.name}>
                      <td>
                        <span className="block font-semibold text-navy-800">{v.name}</span>
                        <span className="block text-xs text-muted">{v.homePort}</span>
                        <span className={`k-badge mt-1.5 ${v.status === 'available' ? 'k-badge--teal' : 'k-badge--gold'}`}>{v.status.replace('_', ' ')}</span>
                      </td>
                      <td className="text-sm text-muted whitespace-nowrap">
                        {v.lengthMetres} m · {v.grossTonnage} GT<br />
                        {v.cruiseSpeedKnots} kn cruise · {v.enduranceDays} day{v.enduranceDays === 1 ? '' : 's'} endurance<br />
                        {v.scientistBerths} scientist berths
                      </td>
                      <td className="text-sm text-ink max-w-[280px]">{v.gear}</td>
                      <td><span className="k-num">{formatKES(v.rateKES)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* KeNODC datasets */}
      {service?.datasets && service.datasets.length > 0 && (
        <section className="k-panel" aria-labelledby="datasets-heading">
          <div className="k-panel__head">
            <Database className="w-5 h-5" aria-hidden="true" />
            <h3 id="datasets-heading">Datasets available on request</h3>
          </div>
          <div className="k-panel__body">
            <div className="k-table-wrap">
              <table className="k-table min-w-[720px]">
                <caption className="sr-only">Curated scientific datasets with standard and academic tariffs</caption>
                <thead>
                  <tr>
                    <th scope="col">Dataset</th>
                    <th scope="col">Coverage &amp; resolution</th>
                    <th scope="col">Format</th>
                    <th scope="col">Tariff</th>
                  </tr>
                </thead>
                <tbody>
                  {service.datasets.map((d) => (
                    <tr key={d.code}>
                      <td>
                        <span className="block font-semibold text-navy-800">{d.title}</span>
                        <span className="block font-mono text-xs text-subtle">{d.code} · {d.curatingCentre}</span>
                      </td>
                      <td className="text-sm text-muted">{d.coverage}<br />{d.resolution} · {d.temporalRange}</td>
                      <td className="text-sm text-ink whitespace-nowrap">{d.format}</td>
                      <td>
                        <span className="k-num">{formatKES(d.tariffKES)}</span>
                        <span className="block text-xs text-subtle mt-0.5">Academic: {formatKES(d.academicKES)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Indicative packages where the register lists no tariff */}
      {packages.length > 0 && (
        <section className="k-panel" aria-labelledby="packages-heading">
          <div className="k-panel__head flex-wrap justify-between">
            <div className="flex items-center gap-2.5">
              <Receipt className="w-5 h-5" aria-hidden="true" />
              <h3 id="packages-heading">Indicative packages</h3>
            </div>
            <span className="text-xs text-subtle">Confirmed on your official quotation</span>
          </div>
          <ul className="divide-y divide-line">
            {packages.map((p) => (
              <li key={p.name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-semibold text-navy-800">{p.name}</p>
                  <p className="text-xs text-muted">{p.unit}{p.turnaroundTime ? ` · ${p.turnaroundTime}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="k-num">{formatKES(p.costKES)}</span>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpenInquiry(division.serviceSlug)}>
                    Get a quote<span className="sr-only"> for {p.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!service && division.serviceSlug && (
        <p className="k-alert k-alert--note text-sm">
          <Info aria-hidden="true" />
          <span>Full service details are loading or temporarily unavailable. Call {INQUIRIES_PHONE} for assistance.</span>
        </p>
      )}
    </div>
  );
};
