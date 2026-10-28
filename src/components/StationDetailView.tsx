import React from 'react';
import { ArrowRight, CalendarCheck, ChevronDown, ExternalLink, Mail, MapPin, Navigation, Phone, User } from 'lucide-react';
import { useHubData } from '../data/HubData';
import { PageBanner, CtaBand, DIVISION_ICONS } from './ui';
import { CatalogueSection } from './catalogue/CatalogueParts';
import { ECITIZEN_URL, findCataloguePath, formatKES, itemsUnder, lowestFee, onlineCount, servicesLabel, type CatalogueNode } from '../data/serviceCatalogue';
import { STATION_IMAGES, findStation, stationOffer, stationSlug } from '../data/stationServices';

interface StationDetailViewProps {
  /** Station web address slug or id */
  stationKey?: string;
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry: (slug?: string, station?: string) => void;
}

/** Every node at or below `node` that lists services. */
const sectionsUnder = (node: CatalogueNode): CatalogueNode[] => [
  ...(node.items?.length ? [node] : []),
  ...(node.children ?? []).flatMap(sectionsUnder),
];

const telHref = (phone: string) => `tel:${phone.split('/')[0].replace(/[^\d+]/g, '')}`;

/**
 * One research station: overview and contacts, every catalogue service offered there
 * (grouped by division), and booking — apply on eCitizen or request a quotation that
 * names this station as the preferred centre.
 */
export const StationDetailView: React.FC<StationDetailViewProps> = ({ stationKey, onNavigate, onOpenInquiry }) => {
  const { services, stations } = useHubData();
  const station = findStation(stations, stationKey);

  if (!station) {
    return (
      <div>
        <PageBanner
          crumbs={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Research Stations', onClick: () => onNavigate('stations') }, { label: 'Not found' }]}
          title="Station not found"
          subtitle="This research station does not exist or has moved."
          image="/images/vessel-aerial.webp"
          next="#F7F9FC"
        />
        <section className="band-mist k-section pt-6! text-center">
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('stations')}>All research stations</button>
        </section>
      </div>
    );
  }

  const slug = stationSlug(station);
  const offer = stationOffer(station, services);
  const book = (serviceSlug?: string) => onOpenInquiry(serviceSlug, slug);
  const scrollToServices = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('station-services')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${station.coordinates.lat},${station.coordinates.lng}`;
  const others = stations.filter((st) => st.id !== station.id);
  // "Kegati, Kisii County" already names the county.
  const address = station.location.includes(station.county) ? station.location : `${station.location}, ${station.county}`;

  return (
    <div>
      <PageBanner
        crumbs={[
          { label: 'Home', onClick: () => onNavigate('home') },
          { label: 'Research Stations', onClick: () => onNavigate('stations') },
          { label: station.name },
        ]}
        title={station.name}
        subtitle={address}
        image={STATION_IMAGES[slug] ?? '/images/vessel-aerial.webp'}
        imagePosition="center 50%"
        next="#F7F9FC"
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-teal" onClick={scrollToServices}>
            <CalendarCheck aria-hidden="true" /> Book a service
          </button>
          <button type="button" className="btn btn-ghost-light" onClick={() => book()}>Request a quotation</button>
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light">
            <Navigation aria-hidden="true" /> Directions
          </a>
        </div>
      </PageBanner>

      <section className="band-mist k-section pt-6!" aria-label={`${station.name} overview and services`}>
        <div className="k-container space-y-8">
          {/* Overview */}
          <section className="k-panel overflow-hidden grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" aria-labelledby="station-overview">
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="k-tag">Overview</span>
                <span className="k-badge k-badge--teal k-badge--mono">{station.code}</span>
              </div>
              <h2 id="station-overview" className="k-h3 mt-2">What happens at {station.name.split(' (')[0]}</h2>
              <p className="mt-3 text-[1.0125rem] leading-relaxed text-ink">{station.description}</p>
              {station.primaryFocus.length > 0 && (
                <>
                  <h3 className="k-tag mt-6 mb-2.5">Facilities &amp; focus</h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {station.primaryFocus.map((f) => <li key={f} className="k-chip">{f}</li>)}
                  </ul>
                </>
              )}
              <dl className="mt-6 grid grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
                {[
                  { label: 'Service areas', value: offer.divisions.length },
                  { label: 'Services', value: offer.total },
                  { label: 'Apply online', value: offer.online },
                ].map((f) => (
                  <div key={f.label} className="bg-white p-3 sm:p-4">
                    <dt className="text-[0.7rem] font-semibold uppercase tracking-widest text-subtle">{f.label}</dt>
                    <dd className="k-num text-xl mt-0.5">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="bg-canvas border-t lg:border-t-0 lg:border-l border-line p-5 sm:p-7 space-y-4 text-sm">
              <h3 className="k-tag">Contact the station</h3>
              <p className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span><span className="block text-xs text-subtle">Head of station</span><span className="font-semibold text-navy-800">{station.headOfStation}</span></span>
              </p>
              <a href={telHref(station.phone)} className="flex items-center gap-2.5 text-ink hover:text-navy-600">
                <Phone className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" /> {station.phone}
              </a>
              <a href={`mailto:${station.contactEmail}`} className="flex items-center gap-2.5 text-navy-600 font-medium hover:underline break-all">
                <Mail className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" /> {station.contactEmail}
              </a>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 text-ink hover:text-navy-600">
                <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{address}<span className="block text-xs text-navy-600 font-semibold mt-0.5">Open in Google Maps</span></span>
              </a>
              <div className="pt-2 flex flex-wrap gap-2">
                <button type="button" className="btn btn-primary btn-sm" onClick={scrollToServices}>
                  <CalendarCheck aria-hidden="true" /> Book a service
                </button>
                {offer.online > 0 && (
                  <a href={ECITIZEN_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                    eCitizen <ExternalLink aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Services offered here */}
          <section id="station-services" className="scroll-mt-32 space-y-5" aria-labelledby="station-services-heading">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="k-eyebrow">Services &amp; Booking</span>
                <h2 id="station-services-heading" className="k-h2">Services at this <em>station</em></h2>
                <p className="text-muted mt-2 max-w-2xl">
                  {servicesLabel(offer.total)} in {offer.divisions.length} areas. Apply online where available, or request a quotation —
                  your request names {station.name.split(' (')[0]} as the preferred centre.
                </p>
              </div>
              {offer.divisions.length > 1 && (
                <ul className="flex flex-wrap gap-2" aria-label="Jump to a service area">
                  {offer.divisions.map((d) => {
                    const Icon = DIVISION_ICONS[d.id];
                    return (
                      <li key={d.id}>
                        <a href={`#station-${d.id}`} className="k-tab min-h-8.5! py-1! px-3! text-[0.8125rem]! bg-white!">
                          <Icon aria-hidden="true" /> {d.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {offer.divisions.length === 0 && (
              <div className="k-panel p-8 text-center text-muted">
                Services for this station are being listed. Call {station.phone} or request a quotation.
              </div>
            )}

            {offer.divisions.map((d, i) => {
              const Icon = DIVISION_ICONS[d.id];
              const from = lowestFee(d);
              return (
                <details key={d.id} id={`station-${d.id}`} className="group k-panel overflow-hidden scroll-mt-32" open={i === 0}>
                  <summary className="cursor-pointer list-none flex flex-wrap items-center gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                    <span className="grid place-items-center w-11 h-11 shrink-0 rounded-xl bg-teal-50 text-teal-700 border border-[#bfe8ec]">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="flex-1 min-w-[12rem]">
                      <span className="block font-heading font-semibold text-lg text-navy-800">{d.title}</span>
                      <span className="block text-sm text-muted">{d.tagline}</span>
                    </span>
                    <span className="text-sm font-semibold text-teal-800">
                      {servicesLabel(itemsUnder(d).length)}{from != null && <> · from {formatKES(from)}</>}
                      {onlineCount(d) > 0 && <> · {onlineCount(d)} online</>}
                    </span>
                    <ChevronDown className="w-5 h-5 text-subtle transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="border-t border-line bg-canvas p-3 sm:p-4 space-y-4">
                    {sectionsUnder(d).map((node) => {
                      const trail = findCataloguePath(node.id).map((n) => n.title).slice(1);
                      return (
                        <CatalogueSection
                          key={node.id}
                          node={node}
                          items={node.items ?? []}
                          context={trail.length > 1 ? trail[0] : undefined}
                          heading={trail.length > 1 ? trail.slice(1).join(' › ') : trail[0] ?? node.title}
                          showIntro={false}
                          onOpen={() => onNavigate('catalogue', node.id)}
                          onOpenInquiry={book}
                        />
                      );
                    })}
                    <button type="button" className="k-link text-sm" onClick={() => onNavigate('catalogue', d.id)}>
                      About {d.title}: requirements, turnaround &amp; contacts <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </details>
              );
            })}

            {offer.other.length > 0 && (
              <div className="k-panel p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="k-tag">Also available on request</h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {offer.other.map((o) => <li key={o} className="k-chip">{o}</li>)}
                  </ul>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => book()}>Request a quotation</button>
              </div>
            )}
          </section>

          {/* Other stations */}
          {others.length > 0 && (
            <nav aria-label="Other research stations" className="pt-2">
              <h2 className="k-tag mb-3">Other research stations</h2>
              <ul className="flex flex-wrap gap-2">
                {others.map((st) => (
                  <li key={st.id}>
                    <button type="button" className="k-tab min-h-9! py-1! px-3.5! text-[0.8125rem]! bg-white!" onClick={() => onNavigate('station', stationSlug(st))}>
                      <MapPin aria-hidden="true" /> {st.name.split(' (')[0]}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>

      <CtaBand
        eyebrow={station.code}
        title={<>Book a service at <em>{station.name.split(' (')[0]}</em></>}
        text="Send your sample list, quantities or visit dates and the station will confirm availability with an official KMFRI quotation."
      >
        <button type="button" className="btn btn-teal" onClick={() => book()}>Request a Quotation</button>
        <a href={telHref(station.phone)} className="btn btn-ghost-light"><Phone aria-hidden="true" /> Call the station</a>
      </CtaBand>
    </div>
  );
};
