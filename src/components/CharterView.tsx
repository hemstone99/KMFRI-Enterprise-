import React from 'react';
import { Award, Clock, FileCheck, ShieldCheck, ArrowRight, Receipt } from 'lucide-react';
import { useHubData } from '../data/HubData';
import { PageBanner, CtaBand } from './ui';

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

export const CharterView: React.FC<CharterViewProps> = ({ onNavigate, onOpenInquiry }) => {
  const { services, charter } = useHubData();
  return (
    <div>
      <PageBanner
        crumbs={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: "Citizens' & Enterprise Service Charter" }]}
        title={<>KMFRI Commercial Service Delivery Charter &amp; <em>Tariffs</em></>}
        subtitle="In line with the Government of Kenya Service Delivery Standards, KMFRI is committed to transparent timelines, professional integrity, and standardized pricing for all public and private enterprise stakeholders."
        image="/images/vessel-port.webp"
        imagePosition="center 45%"
        next="#E4F4F6"
      >
        <p className="inline-flex items-center gap-2 mt-6 k-badge bg-white/12 border border-white/30 text-white">
          <ShieldCheck className="w-4 h-4 text-teal-400" aria-hidden="true" />
          Public Service Delivery Standards &bull; ISO 9001:2015
        </p>
      </PageBanner>

      {/* Core Principles */}
      <section className="band-teal k-section pt-8!" aria-labelledby="principles-heading">
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

      {/* Complete Tariffs Table */}
      <section className="band-mist k-section" aria-labelledby="matrix-heading">
        <div className="k-container">
          <div className="k-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-5 border-b border-line">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-full bg-navy-600 text-white">
                  <Receipt className="w-5 h-5" aria-hidden="true" />
                </span>
                <h2 id="matrix-heading" className="font-heading text-lg sm:text-xl font-semibold text-navy-800">
                  Standard Enterprise Service Charters &amp; Tariffs Matrix
                </h2>
              </div>
              <span className="k-badge k-badge--teal">All {services.length} Portfolios</span>
            </div>

            <div className="p-4 sm:p-6">
              <div className="k-table-wrap">
                {charter ? (
                  /* Official charter commitments from kmfri_services_db.service_charter */
                  <table className="k-table min-w-[900px]">
                    <caption className="sr-only">Citizens' service charter: statutory turnaround, official fees and responsible officers</caption>
                    <thead>
                      <tr>
                        <th scope="col">Code</th>
                        <th scope="col">Service</th>
                        <th scope="col">Statutory Turnaround</th>
                        <th scope="col">Official Fee</th>
                        <th scope="col">Responsible Officer</th>
                        <th scope="col" className="text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {charter.map((c) => (
                        <tr key={c.serviceCode + c.serviceName}>
                          <td className="font-mono text-[0.8125rem] font-semibold text-navy-600 whitespace-nowrap">{c.serviceCode}</td>
                          <td className="font-semibold text-navy-800 max-w-[260px]">{c.serviceName}</td>
                          <td className="text-ink font-medium">{c.turnaroundTime}</td>
                          <td><span className="k-num whitespace-normal!">{c.feeSummary}</span></td>
                          <td className="text-muted text-[0.8125rem]">{c.responsibleOfficer}</td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => onNavigate('service_detail', c.serviceSlug)}
                              className="k-link text-sm whitespace-nowrap"
                              aria-label={'View ' + c.serviceName}
                            >
                              View
                              <span className="k-link__arrow w-7! h-7!"><ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="k-table min-w-[860px]">
                    <caption className="sr-only">Baseline tariffs, turnaround times and client base for all enterprise services</caption>
                    <thead>
                      <tr>
                        <th scope="col">Code</th>
                        <th scope="col">Enterprise Service Portfolio</th>
                        <th scope="col">Approved Baseline Tariff (KES)</th>
                        <th scope="col">Guaranteed TAT</th>
                        <th scope="col">Client Base</th>
                        <th scope="col" className="text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((srv) => {
                        const prices = srv.pricingTiers.map(t => t.costKES);
                        return (
                          <tr key={srv.id}>
                            <td className="font-mono text-[0.8125rem] font-semibold text-navy-600 whitespace-nowrap">{srv.code}</td>
                            <td className="max-w-[320px]">
                              <span className="block font-semibold text-navy-800">{srv.title}</span>
                              <span className="block text-[0.8125rem] text-muted truncate">{srv.description}</span>
                            </td>
                            <td>
                              <span className="k-num">{prices.length ? 'From KES ' + Math.min(...prices).toLocaleString() : 'On quotation'}</span>
                            </td>
                            <td className="text-ink font-medium">{srv.turnaroundTime.split('(')[0]}</td>
                            <td className="text-muted text-[0.8125rem]">{srv.remarks}</td>
                            <td className="text-right">
                              <button
                                type="button"
                                onClick={() => onNavigate('service_detail', srv.slug)}
                                className="k-link text-sm whitespace-nowrap"
                                aria-label={'View ' + srv.title}
                              >
                                View
                                <span className="k-link__arrow w-7! h-7!"><ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              {charter?.[0]?.redressChannel && (
                <p className="mt-4 text-sm text-muted">
                  <strong className="text-navy-800">Complaints &amp; redress:</strong> {charter[0].redressChannel}
                </p>
              )}
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
