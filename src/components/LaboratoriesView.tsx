import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileDown,
  FlaskConical,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Waves,
  Droplets,
  Fish,
  Anchor,
} from 'lucide-react';
import { PageBanner, CtaBand, SectionHeader } from './ui';
import {
  LAB_OVERVIEW,
  LAB_ACCREDITATIONS,
  LAB_GROUPS,
  LAB_MARICULTURE,
  LAB_EQUIPMENT,
  LAB_CLIENTS,
  LAB_FAQ,
  LAB_COMMITMENTS,
  LAB_HQ_CONTACT,
  LAB_SOURCE_URL,
  LAB_SAMPLE_FORM_URL,
  type LabContact,
} from '../data/laboratoriesData';

interface LaboratoriesViewProps {
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry: (slug?: string) => void;
}

/** Catalogue entry that carries the laboratory tariffs and quotation flow. */
const LAB_SERVICE_SLUG = 'laboratory-analytical-services';

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'ocean-coastal': Waves,
  freshwater: Droplets,
  aquaculture: Fish,
};

const STATUS_LABEL = { certified: 'Certified', designated: 'Designated', 'in-progress': 'In progress' } as const;

const telHref = (phone: string) => `tel:${phone.split('/')[0].replace(/[^\d+]/g, '')}`;

const ContactList: React.FC<{ contact: LabContact }> = ({ contact }) => (
  <ul className="space-y-2.5 text-sm text-muted">
    <li className="flex gap-2.5">
      <MapPin className="w-4 h-4 mt-0.5 text-teal-700 shrink-0" aria-hidden="true" />
      <span><strong className="text-ink font-semibold">{contact.locationLabel}:</strong> {contact.location}</span>
    </li>
    {contact.postal && (
      <li className="flex gap-2.5">
        <Mail className="w-4 h-4 mt-0.5 text-teal-700 shrink-0" aria-hidden="true" />
        <span><strong className="text-ink font-semibold">Postal:</strong> {contact.postal}</span>
      </li>
    )}
    <li className="flex gap-2.5">
      <Phone className="w-4 h-4 mt-0.5 text-teal-700 shrink-0" aria-hidden="true" />
      <a href={telHref(contact.phone)} className="hover:text-navy-600">{contact.phone}</a>
    </li>
    <li className="flex gap-2.5">
      <Mail className="w-4 h-4 mt-0.5 text-teal-700 shrink-0" aria-hidden="true" />
      <a href={`mailto:${contact.email}`} className="text-navy-600 hover:underline">{contact.email}</a>
    </li>
  </ul>
);

export const LaboratoriesView: React.FC<LaboratoriesViewProps> = ({ onNavigate, onOpenInquiry }) => {
  const [activeGroup, setActiveGroup] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const group = LAB_GROUPS[activeGroup];

  const onTabKey = (e: React.KeyboardEvent) => {
    const n = LAB_GROUPS.length;
    let next = -1;
    if (e.key === 'ArrowRight') next = (activeGroup + 1) % n;
    else if (e.key === 'ArrowLeft') next = (activeGroup - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === -1) return;
    e.preventDefault();
    setActiveGroup(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div>
      <PageBanner
        crumbs={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Laboratory Services' }]}
        title={<>KMFRI <em>Laboratory Services</em></>}
        subtitle={LAB_OVERVIEW.intro}
        image="/images/labs/lab-banner.webp"
        imagePosition="center 60%"
        next="#E4F4F6"
      />

      {/* Overview & accreditation */}
      <section className="band-teal k-section pt-8!" aria-labelledby="lab-quality-heading">
        <div className="k-container">
          <SectionHeader
            id="lab-quality-heading"
            eyebrow="Accreditation & Quality"
            title={<>A national centre of <em>analytical excellence</em></>}
            lead={LAB_OVERVIEW.quality}
            layout="split"
          />
          <ul className="grid gap-6 md:grid-cols-3">
            {LAB_ACCREDITATIONS.map((a) => (
              <li key={a.standard} className="k-card p-6 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid place-items-center w-12 h-12 rounded-full bg-navy-600 text-white">
                    {a.status === 'in-progress' ? <ShieldCheck className="w-5 h-5" aria-hidden="true" /> : <BadgeCheck className="w-5 h-5" aria-hidden="true" />}
                  </span>
                  <span className={`k-badge ${a.status === 'in-progress' ? 'k-badge--gold' : 'k-badge--teal'}`}>{STATUS_LABEL[a.status]}</span>
                </div>
                <h3 className="k-h3 mt-4">{a.standard}</h3>
                <p className="k-tag mt-1">{a.body}</p>
                <p className="text-[0.95rem] text-muted mt-3 leading-relaxed">{a.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Specialized laboratories — tabbed by laboratory network */}
      <section className="k-section" aria-labelledby="lab-groups-heading">
        <div className="k-container">
          <SectionHeader
            id="lab-groups-heading"
            eyebrow="Our Specialized Laboratories"
            title={<>Laboratories &amp; <em>services</em></>}
            lead="Choose a laboratory network to see its units, the tests and services each one offers, and who to contact."
          />

          <div className="k-tabs mb-8" role="tablist" aria-label="Laboratory networks" onKeyDown={onTabKey}>
            {LAB_GROUPS.map((g, i) => {
              const Icon = GROUP_ICONS[g.id] ?? FlaskConical;
              return (
                <button
                  key={g.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`lab-tab-${g.id}`}
                  className="k-tab"
                  aria-selected={i === activeGroup}
                  aria-controls={`lab-panel-${g.id}`}
                  tabIndex={i === activeGroup ? 0 : -1}
                  onClick={() => setActiveGroup(i)}
                >
                  <Icon aria-hidden="true" /> {g.shortName}
                </button>
              );
            })}
            <a href={LAB_MARICULTURE.url} target="_blank" rel="noopener noreferrer" className="k-tab">
              <Anchor aria-hidden="true" /> {LAB_MARICULTURE.name}
              <ExternalLink aria-hidden="true" />
              <span className="sr-only">(opens kmfri.go.ke in a new tab)</span>
            </a>
          </div>

          <div id={`lab-panel-${group.id}`} role="tabpanel" aria-labelledby={`lab-tab-${group.id}`} tabIndex={0} className="focus:outline-none">
            <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-12 mb-10">
              <div>
                <h3 className="k-h3 text-2xl!">{group.name}</h3>
                <p className="k-lead mt-3">{group.intro}</p>
                {group.note && <p className="text-[0.95rem] text-muted mt-4 leading-relaxed">{group.note}</p>}
              </div>
              <aside className="k-card p-6" aria-label={`Contact the ${group.shortName} laboratories`}>
                <h4 className="k-tag mb-3">Contact</h4>
                <ContactList contact={group.contact} />
                <a href={group.sourceUrl} target="_blank" rel="noopener noreferrer" className="k-link mt-5 text-sm">
                  View on kmfri.go.ke <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </aside>
            </div>

            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {group.units.map((u) => (
                <li key={u.name} className="k-card p-6">
                  <h4 className="font-heading font-semibold text-lg text-navy-800 flex items-start gap-2.5">
                    <FlaskConical className="w-5 h-5 mt-0.5 text-teal-700 shrink-0" aria-hidden="true" />
                    {u.name}
                  </h4>
                  <ul className="mt-4 space-y-2 text-[0.925rem] text-muted">
                    {u.services.map((s) => (
                      <li key={s} className="flex gap-2">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-teal-600 shrink-0" aria-hidden="true" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            <div className="grid gap-10 lg:grid-cols-2 mt-14">
              <div>
                <h4 className="k-h3">{group.applicationsTitle}</h4>
                <dl className="mt-5 space-y-4">
                  {group.applications.map((a) => (
                    <div key={a.title} className="border-l-4 border-teal-400 pl-4">
                      <dt className="font-semibold text-navy-800">{a.title}</dt>
                      <dd className="text-[0.925rem] text-muted mt-1">{a.text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h4 className="k-h3">{group.whyTitle}</h4>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {group.why.map((w) => (
                    <li key={w.title} className="rounded-[var(--radius-card)] bg-canvas p-5 border border-line">
                      <p className="font-semibold text-navy-800">{w.title}</p>
                      <p className="text-sm text-muted mt-1.5">{w.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment gallery */}
      <section className="band-mist k-section" aria-labelledby="lab-equipment-heading">
        <div className="k-container">
          <SectionHeader id="lab-equipment-heading" eyebrow="Our Laboratories" title={<>Analytical &amp; <em>field equipment</em></>} />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {LAB_EQUIPMENT.map((eq) => (
              <li key={eq.name}>
                <figure className="k-card k-card--hover h-full">
                  <div className="k-card__media aspect-[3/2]!">
                    <img src={eq.image} alt={eq.alt} width={800} height={533} loading="lazy" decoding="async" />
                  </div>
                  <figcaption className="px-5 py-4 font-heading font-semibold text-navy-800">{eq.name}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Clients & commitments */}
      <section className="k-section" aria-labelledby="lab-clients-heading">
        <div className="k-container">
          <SectionHeader id="lab-clients-heading" eyebrow="Who We Serve" title={<>Clients &amp; <em>partners</em> we serve</>} />
          <div className="grid gap-6 md:grid-cols-3">
            {LAB_CLIENTS.map((c) => (
              <div key={c.group} className="k-card p-6">
                <h3 className="k-h3">{c.group}</h3>
                <ul className="mt-4 space-y-2 text-[0.95rem] text-muted">
                  {c.members.map((m) => (
                    <li key={m} className="flex gap-2">
                      <ArrowRight className="w-4 h-4 mt-1 text-teal-700 shrink-0" aria-hidden="true" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h3 className="k-tag mt-14 mb-5">Our Commitment</h3>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LAB_COMMITMENTS.map((c) => (
              <li key={c.title} className="rounded-[var(--radius-card)] bg-canvas p-5 border border-line">
                <p className="font-semibold text-navy-800">{c.title}</p>
                <p className="text-sm text-muted mt-1.5">{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ + resources */}
      <section className="band-teal k-section" aria-labelledby="lab-faq-heading">
        <div className="k-container grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
          <div>
            <SectionHeader
              id="lab-faq-heading"
              eyebrow="Laboratory Services"
              title={<>Frequently asked <em>questions</em></>}
              lead="The tests on offer, how to submit samples, turnaround times, accreditation and confidentiality."
            />
            <div className="space-y-3">
              {LAB_FAQ.map((f, i) => (
                <details key={f.q} className="group k-card px-5 sm:px-6">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 font-semibold text-navy-800 [&::-webkit-details-marker]:hidden">
                    <span><span className="k-num text-teal-700 mr-2">{String(i + 1).padStart(2, '0')}</span>{f.q}</span>
                    <ChevronDown className="w-5 h-5 mt-0.5 shrink-0 text-teal-700 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pb-5 text-[0.95rem] text-muted leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-32 self-start">
            <div className="k-card p-6">
              <h3 className="k-h3">Sample Submission Form</h3>
              <p className="text-sm text-muted mt-2">Download the KMFRI Sample Submission &amp; Contract Review Form (PDF) before delivering samples.</p>
              <a href={LAB_SAMPLE_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm mt-4">
                <FileDown aria-hidden="true" /> Download Form (PDF)
              </a>
            </div>
            <div className="k-card p-6">
              <h3 className="k-h3">Contact Laboratory Services</h3>
              <div className="mt-4">
                <ContactList contact={LAB_HQ_CONTACT} />
              </div>
              <p className="text-sm text-muted mt-4 pt-4 border-t border-line">
                <strong className="text-ink font-semibold">Deputy Director, Laboratory Services:</strong>{' '}
                <a href={`mailto:${LAB_HQ_CONTACT.deputyDirectorEmail}`} className="text-navy-600 hover:underline">{LAB_HQ_CONTACT.deputyDirectorEmail}</a>
              </p>
            </div>
            <p className="text-xs text-subtle">
              Source:{' '}
              <a href={LAB_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-navy-600">kmfri.go.ke/infrastructure/laboratories</a>
            </p>
          </aside>
        </div>
      </section>

      <CtaBand
        eyebrow="Laboratory Services"
        title={<>Request a <em>laboratory quotation</em></>}
        text="Testing charges depend on the type of analysis, number of parameters, sample matrix, and number of samples. Request a quotation before submitting samples."
      >
        <button type="button" className="btn btn-teal" onClick={() => onOpenInquiry(LAB_SERVICE_SLUG)}>
          <ShieldCheck aria-hidden="true" /> Request Quotation
        </button>
        <button type="button" className="btn btn-ghost-light" onClick={() => onNavigate('service_detail', LAB_SERVICE_SLUG)}>
          View Lab Tariffs <ArrowRight aria-hidden="true" />
        </button>
      </CtaBand>
    </div>
  );
};
