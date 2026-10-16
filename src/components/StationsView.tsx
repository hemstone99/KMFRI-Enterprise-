import React, { useEffect } from 'react';
import { MapPin, Phone, Mail, User, ArrowRight, Navigation, Building2, ChevronRight } from 'lucide-react';
import { useHubData } from '../data/HubData';
import { PageBanner, CtaBand } from './ui';

interface StationsViewProps {
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry: (slug?: string) => void;
  /** Station id to scroll into view (from the header dropdown, footer or search). */
  focusStationId?: string;
}

export const StationsView: React.FC<StationsViewProps> = ({
  onNavigate,
  onOpenInquiry,
  focusStationId
}) => {
  const { services, stations } = useHubData();
  // Station records list services by name; resolve them to catalogue entries where possible.
  const findService = (name: string) =>
    services.find((s) => s.title === name || s.title.startsWith(name) || name.startsWith(s.title));

  useEffect(() => {
    if (!focusStationId) return;
    // Wait for the view-change scroll-to-top to start, then bring the station into view.
    const t = window.setTimeout(() => {
      const el = document.getElementById(focusStationId);
      if (!el) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      el.focus({ preventScroll: true });
    }, 120);
    return () => window.clearTimeout(t);
  }, [focusStationId]);

  return (
    <div>
      <PageBanner
        crumbs={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Research Stations Directory' }]}
        title={<>KMFRI Research Centres &amp; <em>Mariculture Stations</em></>}
        subtitle="KMFRI operates a nationwide network of marine and freshwater research stations equipped with specialized laboratories, fingerling nurseries, survey vessels, and conference infrastructure to serve stakeholders across Kenya."
        image="/images/vessel-aerial.webp"
        imagePosition="center 55%"
        next="#E4F4F6"
      />

      <section className="band-teal k-section pt-8!" aria-labelledby="stations-list-heading">
        <div className="k-container">
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-16 items-end mb-10">
            <div>
              <span className="k-eyebrow">National Operational Infrastructure</span>
              <h2 id="stations-list-heading" className="k-h2">Explore Stations &amp; <em>Centres</em></h2>
            </div>
            <nav aria-label="Jump to station">
              <ul className="k-tabs">
                {stations.map((st) => (
                  <li key={st.id}>
                    <a href={`#${st.id}`} className="k-tab text-[0.8125rem]! min-h-9!">
                      {st.name.split(' (')[0].replace(' Headquarters & Marine Centre', ' HQ')}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stations.map((station) => (
              <li key={station.id}>
                <article
                  id={station.id}
                  tabIndex={-1}
                  className={`k-card h-full scroll-mt-32 focus:outline-none ${focusStationId === station.id ? 'ring-4 ring-teal-400/60' : ''}`}
                  aria-labelledby={`${station.id}-title`}
                >
                  <div className="p-6 sm:p-7 flex-1">
                    <div className="flex items-start gap-4">
                      <span className="grid place-items-center w-12 h-12 shrink-0 rounded-full bg-navy-600 text-white shadow-[0_8px_18px_-8px_rgba(0,43,87,.6)]">
                        <MapPin className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <span className="k-badge k-badge--teal k-badge--mono">{station.code}</span>
                        <h3 id={`${station.id}-title`} className="k-h3 mt-2">{station.name}</h3>
                        <p className="flex items-center gap-1.5 text-sm text-muted mt-1">
                          <span>{station.location} &bull; <strong className="text-ink font-semibold">{station.county}</strong></span>
                        </p>
                      </div>
                    </div>

                    <p className="text-[0.95rem] text-muted mt-5 leading-relaxed">{station.description}</p>

                    {/* Primary Research Focus Areas */}
                    <div className="mt-5 pt-5 border-t border-line">
                      <h4 className="k-tag mb-2.5">Specialized Infrastructure &amp; Focus</h4>
                      <ul className="flex flex-wrap gap-1.5">
                        {station.primaryFocus.map((focus, i) => (
                          <li key={i} className="k-chip">{focus}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Commercial Services Available Here */}
                    <div className="mt-5 pt-5 border-t border-line">
                      <h4 className="k-tag mb-2.5">Enterprise Services Delivered</h4>
                      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                        {station.servicesOffered.map((srvName, idx) => {
                          const srv = findService(srvName);
                          return (
                            <li key={idx}>
                              {srv ? (
                                <button
                                  type="button"
                                  onClick={() => onNavigate('service_detail', srv.slug)}
                                  className="inline-flex items-start gap-1.5 text-left text-navy-800 hover:text-navy-500 hover:underline underline-offset-2"
                                >
                                  <ChevronRight className="w-4 h-4 mt-0.5 text-teal-700 shrink-0" aria-hidden="true" />
                                  {srvName}
                                </button>
                              ) : (
                                <span className="inline-flex items-start gap-1.5">
                                  <ChevronRight className="w-4 h-4 mt-0.5 text-teal-700 shrink-0" aria-hidden="true" />
                                  {srvName}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  {/* Station Contact Strip */}
                  <div className="bg-canvas px-6 sm:px-7 py-4 border-t border-line flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-navy-800 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-subtle shrink-0" aria-hidden="true" />
                        <span>Head: {station.headOfStation}</span>
                      </p>
                      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
                        <a href={`tel:${station.phone.split('/')[0].replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-navy-600">
                          <Phone className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                          {station.phone}
                        </a>
                        <a href={`mailto:${station.contactEmail}`} className="inline-flex items-center gap-1.5 text-navy-600 hover:underline">
                          <Mail className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                          {station.contactEmail}
                        </a>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${station.coordinates.lat},${station.coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                        aria-label={`Directions to ${station.name} (opens Google Maps)`}
                      >
                        <Navigation aria-hidden="true" /> Map
                      </a>
                      <button type="button" onClick={() => onOpenInquiry()} className="btn btn-primary btn-sm">
                        Inquire at Station
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        eyebrow="Station Services"
        title={<>Book services at a <em>KMFRI centre</em></>}
        text="Choose your preferred research centre when you submit a quotation request — the inquiry is coordinated nationally via KMFRI Mombasa HQ."
      >
        <button type="button" className="btn btn-teal" onClick={() => onOpenInquiry()}>
          <Building2 aria-hidden="true" /> Request Quotation
        </button>
        <button type="button" className="btn btn-ghost-light" onClick={() => onNavigate('services')}>
          Browse Services <ArrowRight aria-hidden="true" />
        </button>
      </CtaBand>
    </div>
  );
};
