import { useHubData } from '../data/HubData';
import React from 'react';
import {
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Download,
  ArrowRight,
  Building,
  Info,
  Layers,
  ClipboardList,
  Receipt,
  Microscope,
  UserRound,
  Ship,
  Database,
} from 'lucide-react';
import { ServiceItem } from '../types';
import { PageBanner, ServiceIcon, CtaBand, smallVariant } from './ui';

interface ServiceDetailViewProps {
  service: ServiceItem;
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry: (slug?: string) => void;
}

export const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({
  service,
  onNavigate,
  onOpenInquiry
}) => {
  const { services } = useHubData();
  // Related services in the same or adjacent category
  const relatedServices = services.filter(s => s.id !== service.id).slice(0, 3);

  return (
    <div>
      <PageBanner
        crumbs={[
          { label: 'Home', onClick: () => onNavigate('home') },
          { label: 'Services Directory', onClick: () => onNavigate('services') },
          { label: service.title },
        ]}
        title={service.title}
        subtitle={service.description}
        image={service.featuredImage}
        imageAlt=""
        next="#F7F9FC"
      >
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <span className="k-badge k-badge--mono bg-white/12 border border-white/30 text-white">{service.code}</span>
          <span className="k-badge bg-teal-400/15 border border-teal-400/40 text-teal-400">{service.categoryLabel}</span>
          {service.isoStandard && (
            <span className="k-badge bg-white/12 border border-white/30 text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              {service.isoStandard}
            </span>
          )}
          {service.status === 'coming_soon' && <span className="k-badge k-badge--gold">Coming Soon</span>}
        </div>
      </PageBanner>

      <section className="band-mist k-section pt-6!">
        <div className="k-container">
          {/* Quick Meta Specs Strip */}
          <dl className="k-panel grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line mb-8">
            {[
              { label: 'Standard TAT', value: service.turnaroundTime, Icon: Clock },
              { label: 'Pricing Tiers', value: `${service.pricingTiers.length} Approved Options`, Icon: Layers },
              { label: 'Centers Available', value: `${service.availableStations.length} Regional Stations`, Icon: MapPin },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="flex items-start gap-3.5 p-5">
                <span className="grid place-items-center w-11 h-11 shrink-0 rounded-full bg-navy-50 text-navy-600">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <div>
                  <dt className="k-tag">{label}</dt>
                  <dd className="mt-1 font-semibold text-navy-800 leading-snug">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Scope, Tariffs & Capabilities */}
            <div className="lg:col-span-8 space-y-8 min-w-0">
              {/* Remarks highlight from PDF */}
              <div className="k-alert k-alert--teal">
                <Info aria-hidden="true" />
                <div>
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em]">Mandated Clientele (Official Catalogue Remarks)</p>
                  <p className="mt-1 font-semibold text-navy-800">{service.remarks}</p>
                </div>
              </div>

              {/* Detailed Scientific Overview */}
              <section className="k-panel" aria-labelledby="scope-heading">
                <div className="k-panel__head">
                  <Microscope className="w-5 h-5" aria-hidden="true" />
                  <h2 id="scope-heading">Detailed Scope &amp; Scientific Capabilities</h2>
                </div>
                <div className="k-panel__body">
                  <p className="text-[1.0625rem] leading-relaxed text-ink">{service.fullOverview}</p>

                  <h3 className="k-tag mt-7 mb-3.5">Key Technical Capacities &amp; Tests</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {service.keyCapabilities.map((cap, i) => (
                      <li key={i} className="k-check p-3.5 rounded-xl bg-canvas border border-line text-[0.95rem]">
                        <CheckCircle2 aria-hidden="true" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Official Tariffs & Fee Schedule */}
              <section className="k-panel" aria-labelledby="tariffs-heading">
                <div className="k-panel__head flex-wrap justify-between">
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-5 h-5" aria-hidden="true" />
                    <div>
                      <h2 id="tariffs-heading">Approved Tariffs &amp; Fee Schedule</h2>
                      <p className="text-sm text-muted">Government gazetted public service rates (KES &amp; USD equivalents)</p>
                    </div>
                  </div>
                  <span className="k-badge k-badge--navy">Official Rates</span>
                </div>
                <div className="k-panel__body">
                  {service.pricingTiers.length === 0 ? (
                    <div className="k-alert k-alert--info">
                      <Info aria-hidden="true" />
                      <span>Tariffs for this service have not yet been published. Submit a request and the responsible officer will issue an official quotation.</span>
                    </div>
                  ) : (
                  <div className="k-table-wrap">
                    <table className="k-table min-w-[640px]">
                      <caption className="sr-only">Approved tariffs for {service.title}</caption>
                      <thead>
                        <tr>
                          <th scope="col">Service Description / Specimen Tier</th>
                          <th scope="col">Billing Unit</th>
                          <th scope="col">Fee (KES)</th>
                          <th scope="col">TAT</th>
                          <th scope="col" className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {service.pricingTiers.map((tier, idx) => (
                          <tr key={idx}>
                            <td className="font-semibold text-navy-800">{tier.name}</td>
                            <td className="text-muted">{tier.unit}</td>
                            <td>
                              <span className="k-num">KES {tier.costKES.toLocaleString()}</span>
                              {tier.costUSD && (
                                <span className="block text-xs text-subtle mt-0.5">approx. ${tier.costUSD} USD</span>
                              )}
                            </td>
                            <td className="text-muted whitespace-nowrap">{tier.turnaroundTime}</td>
                            <td className="text-right">
                              <button
                                type="button"
                                onClick={() => onOpenInquiry(service.slug)}
                                className="btn btn-outline btn-sm"
                                aria-label={`Select ${tier.name}`}
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}

                  <div className="k-alert k-alert--note mt-4">
                    <Info aria-hidden="true" />
                    <span>
                      Note: Rates are subject to standard KRA statutory requirements and project-specific logistical scope (e.g., vessel mobilization miles, specialized reagent procurement).
                    </span>
                  </div>
                </div>
              </section>

              {/* Research fleet (from research_vessels) */}
              {service.vessels && service.vessels.length > 0 && (
                <section className="k-panel" aria-labelledby="fleet-heading">
                  <div className="k-panel__head">
                    <Ship className="w-5 h-5" aria-hidden="true" />
                    <h2 id="fleet-heading">Research Fleet Available for Charter</h2>
                  </div>
                  <div className="k-panel__body">
                    <div className="k-table-wrap">
                      <table className="k-table min-w-[720px]">
                        <caption className="sr-only">KMFRI research vessels and charter rates</caption>
                        <thead>
                          <tr>
                            <th scope="col">Vessel</th>
                            <th scope="col">Specification</th>
                            <th scope="col">Scientific Gear</th>
                            <th scope="col">Day Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {service.vessels.map((v) => (
                            <tr key={v.name}>
                              <td>
                                <span className="block font-semibold text-navy-800">{v.name}</span>
                                <span className="block text-xs text-muted">{v.homePort}</span>
                                <span className={`k-badge mt-1.5 ${v.status === 'available' ? 'k-badge--teal' : 'k-badge--gold'}`}>
                                  {v.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="text-sm text-muted whitespace-nowrap">
                                {v.lengthMetres} m · {v.grossTonnage} GT<br />
                                {v.cruiseSpeedKnots} kn cruise · {v.enduranceDays} day{v.enduranceDays === 1 ? '' : 's'} endurance<br />
                                {v.scientistBerths} scientist berths
                              </td>
                              <td className="text-sm text-ink max-w-[280px]">{v.gear}</td>
                              <td>
                                <span className="k-num">KES {v.rateKES.toLocaleString()}</span>
                                <span className="block text-xs text-subtle mt-0.5">approx. ${v.rateUSD.toLocaleString()} USD</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}

              {/* KeNODC dataset catalogue (from scientific_datasets) */}
              {service.datasets && service.datasets.length > 0 && (
                <section className="k-panel" aria-labelledby="datasets-heading">
                  <div className="k-panel__head">
                    <Database className="w-5 h-5" aria-hidden="true" />
                    <h2 id="datasets-heading">KeNODC Dataset Catalogue</h2>
                  </div>
                  <div className="k-panel__body">
                    <div className="k-table-wrap">
                      <table className="k-table min-w-[720px]">
                        <caption className="sr-only">Curated scientific datasets with standard and academic tariffs</caption>
                        <thead>
                          <tr>
                            <th scope="col">Dataset</th>
                            <th scope="col">Coverage &amp; Resolution</th>
                            <th scope="col">Format</th>
                            <th scope="col">Tariff (KES)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {service.datasets.map((d) => (
                            <tr key={d.code}>
                              <td>
                                <span className="block font-semibold text-navy-800">{d.title}</span>
                                <span className="block font-mono text-xs text-subtle">{d.code} · {d.curatingCentre}</span>
                              </td>
                              <td className="text-sm text-muted">
                                {d.coverage}<br />{d.resolution} · {d.temporalRange}
                              </td>
                              <td className="text-sm text-ink whitespace-nowrap">{d.format}</td>
                              <td>
                                <span className="k-num">{d.tariffKES.toLocaleString()}</span>
                                <span className="block text-xs text-subtle mt-0.5">Academic: {d.academicKES.toLocaleString()}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}

              {/* Sample Protocols / Requirements */}
              {service.sampleRequirements && (
                <section className="k-panel" aria-labelledby="req-heading">
                  <div className="k-panel__head">
                    <ClipboardList className="w-5 h-5" aria-hidden="true" />
                    <h2 id="req-heading">Client Submission &amp; Quality Requirements</h2>
                  </div>
                  <ol className="k-panel__body space-y-3.5">
                    {service.sampleRequirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3.5">
                        <span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-navy-600 text-white text-sm font-semibold font-heading">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{req}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>

            {/* Right Column: Action, Stations, Officer Contact & Related */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28" aria-label="Service actions and contacts">
              <div className="k-card">
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={smallVariant(service.featuredImage)} alt={service.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-5">
                  <p className="font-heading font-semibold text-lg text-navy-800">Need this service?</p>
                  <p className="text-sm text-muted mt-1">Generate an official fee quote or initiate a formal booking request today.</p>
                  <div className="mt-5 space-y-2.5">
                    <button type="button" onClick={() => onOpenInquiry(service.slug)} className="btn btn-primary btn-block">
                      <ShieldCheck aria-hidden="true" />
                      Request Quotation / Book
                    </button>
                    <button type="button" onClick={() => window.print()} className="btn btn-outline btn-block">
                      <Download aria-hidden="true" />
                      Download Service Specs (PDF)
                    </button>
                  </div>
                </div>
              </div>

              {/* Available Research Stations */}
              <section className="k-panel" aria-labelledby="centres-heading">
                <div className="k-panel__head">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                  <h2 id="centres-heading" className="text-base!">Available KMFRI Centres</h2>
                </div>
                <div className="k-panel__body pt-4!">
                  <ul className="space-y-2">
                    {service.availableStations.map((station, i) => (
                      <li key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-canvas border border-line text-sm">
                        <Building className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                        <span className="font-medium text-ink">{station}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-subtle text-center">Coordinated nationally via KMFRI Mombasa HQ</p>
                </div>
              </section>

              {/* Direct Technical Officer In-Charge */}
              <section className="k-panel" aria-labelledby="officer-heading">
                <div className="k-panel__head">
                  <UserRound className="w-5 h-5" aria-hidden="true" />
                  <h2 id="officer-heading" className="text-base!">Technical Division In-Charge</h2>
                </div>
                <div className="k-panel__body pt-4! space-y-3 text-sm">
                  <div>
                    <span className="block text-xs text-subtle">Designation</span>
                    <span className="font-semibold text-navy-800">{service.contactOfficer.title}</span>
                  </div>
                  <a href={`mailto:${service.contactOfficer.email}`} className="flex items-center gap-2 text-navy-600 font-medium hover:underline break-all">
                    <Mail className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                    {service.contactOfficer.email}
                  </a>
                  <a href={`tel:${service.contactOfficer.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-ink hover:text-navy-600">
                    <Phone className="w-4 h-4 text-teal-700 shrink-0" aria-hidden="true" />
                    {service.contactOfficer.phone}
                  </a>
                  <button type="button" onClick={() => onOpenInquiry(service.slug)} className="btn btn-teal btn-sm btn-block mt-2">
                    Inquire With Officer
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="bg-white k-section" aria-labelledby="related-heading">
        <div className="k-container">
          <span className="k-eyebrow">Explore More</span>
          <h2 id="related-heading" className="k-h2 mb-8">Related Catalogue <em>Portfolios</em></h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedServices.map((rel) => (
              <li key={rel.id}>
                <button
                  type="button"
                  onClick={() => onNavigate('service_detail', rel.slug)}
                  className="k-card k-card--hover group w-full h-full p-5 text-left"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid place-items-center w-11 h-11 rounded-xl bg-teal-50 text-teal-700 shrink-0">
                      <ServiceIcon category={rel.category} />
                    </span>
                    <span className="text-xs font-mono font-semibold text-subtle">{rel.code}</span>
                  </span>
                  <span className="block mt-4 font-heading font-semibold text-navy-800 group-hover:text-navy-500 transition-colors">{rel.title}</span>
                  <span className="block mt-1.5 text-sm text-muted line-clamp-2">{rel.remarks}</span>
                  <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800">
                    View service <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        eyebrow={service.code}
        title={<>Request a quotation for <em>{service.title}</em></>}
        text="Submit your project scope, sample volume, or schedule to receive an official KMFRI reference quote and terms of delivery."
      >
        <button type="button" className="btn btn-teal" onClick={() => onOpenInquiry(service.slug)}>Request Quotation</button>
        <button type="button" className="btn btn-ghost-light" onClick={() => onNavigate('services')}>All Services</button>
      </CtaBand>
    </div>
  );
};
