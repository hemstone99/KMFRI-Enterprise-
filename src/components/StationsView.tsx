import React from 'react';
import { MapPin, ArrowRight, Building2, CalendarCheck } from 'lucide-react';
import { useHubData } from '../data/HubData';
import { PageBanner, CtaBand, DIVISION_ICONS, smallVariant } from './ui';
import { servicesLabel } from '../data/serviceCatalogue';
import { STATION_IMAGES, stationOffer, stationSlug } from '../data/stationServices';

interface StationsViewProps {
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry: (slug?: string, station?: string) => void;
}

/** Research stations directory: one card per station, each opening the station's own page. */
export const StationsView: React.FC<StationsViewProps> = ({ onNavigate, onOpenInquiry }) => {
  const { services, stations } = useHubData();

  return (
    <div>
      <PageBanner
        crumbs={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Research Stations' }]}
        title={<>KMFRI Research Centres &amp; <em>Stations</em></>}
        subtitle="Find the KMFRI centre nearest you, see every service it offers, and book online or request a quotation."
        image="/images/vessel-aerial.webp"
        imagePosition="center 55%"
        next="#E4F4F6"
      />

      <section className="band-teal k-section pt-8!" aria-labelledby="stations-list-heading">
        <div className="k-container">
          <div className="mb-10 max-w-3xl">
            <span className="k-eyebrow">{stations.length} Centres Nationwide</span>
            <h2 id="stations-list-heading" className="k-h2">Choose a <em>station</em></h2>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {stations.map((station) => {
              const slug = stationSlug(station);
              const offer = stationOffer(station, services);
              const open = () => onNavigate('station', slug);
              return (
                <li key={station.id} className="relative">
                  <article className="k-card k-card--hover h-full" aria-labelledby={`${slug}-title`}>
                    <div className="k-card__figure">
                      <div className="k-card__media">
                        <img src={smallVariant(STATION_IMAGES[slug] ?? '/images/vessel-aerial.webp')} alt="" loading="lazy" />
                        <span className="absolute top-3.5 left-3.5 k-badge k-badge--solid k-badge--mono">{station.code}</span>
                      </div>
                      <span className="k-card__icon" aria-hidden="true"><MapPin /></span>
                    </div>
                    <div className="k-card__body">
                      <h3 id={`${slug}-title`} className="k-h3">
                        <button type="button" onClick={open} className="text-left hover:text-navy-500 after:absolute after:inset-0">
                          {station.name}
                        </button>
                      </h3>
                      <p className="text-sm text-muted mt-1">{station.location} · <strong className="text-ink font-semibold">{station.county}</strong></p>
                      <p className="text-[0.95rem] text-muted mt-3 leading-relaxed line-clamp-3">{station.description}</p>
                      {offer.divisions.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Services offered">
                          {offer.divisions.map((d) => {
                            const Icon = DIVISION_ICONS[d.id];
                            return (
                              <li key={d.id} className="k-chip inline-flex items-center gap-1.5">
                                <Icon className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" /> {d.title}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-teal-800">
                          {servicesLabel(offer.total)}{offer.online > 0 && <> · {offer.online} online</>}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600">
                          View &amp; book <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <CtaBand
        eyebrow="Station Services"
        title={<>Book services at a <em>KMFRI centre</em></>}
        text="Open a station to see its services, or send a quotation request and choose your preferred centre."
      >
        <button type="button" className="btn btn-teal" onClick={() => onOpenInquiry()}>
          <CalendarCheck aria-hidden="true" /> Request Quotation
        </button>
        <button type="button" className="btn btn-ghost-light" onClick={() => onNavigate('catalogue')}>
          <Building2 aria-hidden="true" /> Service Catalogue <ArrowRight aria-hidden="true" />
        </button>
      </CtaBand>
    </div>
  );
};
