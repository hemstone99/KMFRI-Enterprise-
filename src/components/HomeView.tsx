import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  Award,
  CheckCircle2,
  Phone,
  Pause,
  Play,
  MapPin,
  Microscope,
  Users,
  Search,
  FileText,
  Landmark,
  Building2,
  Briefcase,
  GraduationCap,
  Fish,
  Store,
  FlaskConical,
  Ship,
} from 'lucide-react';
import { useHubData } from '../data/HubData';
import { ServiceIcon, SectionHeader, Wave, CtaBand, imgSrcSet, smallVariant } from './ui';

interface HomeViewProps {
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry: (slug?: string) => void;
  onOpenSearch?: () => void;
  onSwitchToHeroPreview?: () => void;
}

/* ------------------------------------------------------------------
   HERO SLIDES — slide 1 carries the hub's own mandate messaging;
   slides 2-5 spotlight flagship services using their catalogue copy.
   ------------------------------------------------------------------ */
interface HeroSlide {
  id: string;
  /** Defaults to the service ISO standard for service slides */
  eyebrow?: string;
  title: [string, string, string];
  /** Defaults to the service catalogue description for service slides */
  subtitle?: string;
  image: string;
  alt: string;
  position?: string;
  slug?: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hub',
    eyebrow: 'State Corporation Mandate · Commercial & Enterprise Services',
    title: ['A Centre of Excellence', 'in Aquatic Research', '& Blue Economy'],
    subtitle:
      'Direct access to accredited analytical testing laboratories, certified aquaculture fingerlings, specialized technical consultancy, the 53m RV Mtafiti oceanographic vessel charter, and comprehensive marine data.',
    image: '/images/vessel-aerial.webp',
    alt: 'KMFRI research vessel operating off the Kenyan coast',
    position: '62% center',
  },
  {
    id: 'lab',
    title: ['Laboratory', 'Analytical', 'Services'],
    image: '/images/analytical-lab.webp',
    alt: 'KMFRI analyst running laboratory analytical tests',
    position: '70% center',
    slug: 'laboratory-analytical-services',
  },
  {
    id: 'aquaculture',
    eyebrow: 'Certified Seed Stock · Kegati & Sangoro Hatcheries',
    title: ['Fish &', 'Aquaculture', 'Services'],
    image: '/images/aquaculture-hatchery.webp',
    alt: 'Fingerlings being sampled at a KMFRI aquaculture hatchery',
    position: '65% center',
    slug: 'fish-and-aquaculture-services',
  },
  {
    id: 'vessel',
    eyebrow: 'RV Mtafiti · 200nm EEZ Coverage',
    title: ['Research', 'Vessel Hire', 'Services'],
    image: '/images/vessel-port.webp',
    alt: 'Research vessel RV Mtafiti berthed at port',
    position: '58% center',
    slug: 'research-vessel-hire-services',
  },
  {
    id: 'consultancy',
    eyebrow: 'Marine Science & Blue Economy Advisory',
    title: ['Technical', 'Consultancy', 'Services'],
    image: '/images/coral-reef-survey.webp',
    alt: 'KMFRI divers conducting a coral reef survey',
    position: '60% center',
    slug: 'technical-consultancy-services',
  },
];

const SLIDE_MS = 7000;

const HeroSlider: React.FC<Pick<HomeViewProps, 'onNavigate' | 'onOpenInquiry' | 'onOpenSearch'>> = ({
  onNavigate,
  onOpenInquiry,
  onOpenSearch,
}) => {
  const { services } = useHubData();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hoverHold, setHoverHold] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchX = useRef<number | null>(null);
  const count = HERO_SLIDES.length;

  // Respect reduced-motion: no autoplay
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true);
  }, []);

  const goTo = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || hoverHold) return;
    const t = window.setTimeout(() => goTo(active + 1), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, hoverHold, goTo]);

  const onTabKey = (e: React.KeyboardEvent) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = active + 1;
    else if (e.key === 'ArrowLeft') next = active - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    if (next === -1) return;
    e.preventDefault();
    const idx = ((next % count) + count) % count;
    goTo(idx);
    tabRefs.current[idx]?.focus();
  };

  return (
    <section
      className={`k-hero ${paused || hoverHold ? 'is-paused' : ''}`}
      aria-roledescription="carousel"
      aria-label="KMFRI Enterprise Services highlights"
      onMouseEnter={() => setHoverHold(true)}
      onMouseLeave={() => setHoverHold(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) goTo(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      style={{ '--seg': `${SLIDE_MS}ms` } as React.CSSProperties}
    >
      {HERO_SLIDES.map((slide, i) => {
        const isActive = i === active;
        const service = slide.slug ? services.find((s) => s.slug === slide.slug) : undefined;
        return (
          <div
            key={slide.id}
            id={`hero-slide-${slide.id}`}
            className={`k-hero__slide ${isActive ? 'is-active' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${slide.title.join(' ')}`}
            aria-hidden={!isActive}
            {...(!isActive ? { inert: '' as unknown as boolean } : {})}
          >
            <div className="k-hero__bg">
              <img
                src={slide.image}
                srcSet={imgSrcSet(slide.image)}
                sizes="100vw"
                alt={slide.alt}
                style={{ '--pos': slide.position } as React.CSSProperties}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
              />
            </div>
            <div className="k-hero__overlay" />

            <div className="k-hero__content">
              <p className="k-hero__eyebrow k-hero__anim">{slide.eyebrow ?? service?.isoStandard ?? service?.categoryLabel}</p>
              {i === 0 ? (
                <h1 className="k-hero__title k-hero__anim">
                  <span>{slide.title[0]}</span>
                  <span><em>{slide.title[1]}</em></span>
                  <span>{slide.title[2]}</span>
                </h1>
              ) : (
                <p className="k-hero__title k-hero__anim" role="heading" aria-level={2}>
                  <span>{slide.title[0]}</span>
                  <span><em>{slide.title[1]}</em></span>
                  <span>{slide.title[2]}</span>
                </p>
              )}
              <p className="k-hero__subtitle k-hero__anim">{slide.subtitle ?? service?.description}</p>

              <div className="k-hero__actions k-hero__anim">
                {service ? (
                  <>
                    <button type="button" className="btn btn-teal" onClick={() => onNavigate('service_detail', service.slug)}>
                      View Scope &amp; Tariffs <ArrowRight aria-hidden="true" />
                    </button>
                    <button type="button" className="btn btn-ghost-light" onClick={() => onOpenInquiry(service.slug)}>
                      <ShieldCheck aria-hidden="true" /> Request Quotation
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-teal" onClick={() => onNavigate('services')}>
                      Browse All {services.length} Services <ArrowRight aria-hidden="true" />
                    </button>
                    <button type="button" className="btn btn-ghost-light" onClick={() => onOpenInquiry()}>
                      <ShieldCheck aria-hidden="true" /> Request Quotation
                    </button>
                    <button type="button" className="k-hero__link" onClick={() => onNavigate('charter')}>
                      Service Charter &amp; Tariffs <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                    {onOpenSearch && (
                      <button type="button" className="k-hero__link" onClick={onOpenSearch}>
                        <Search className="w-4 h-4" aria-hidden="true" /> Search Hub
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Slide controls + key institutional figures */}
      <div className="k-hero__bar">
        <div className="k-hero__controls">
          <button type="button" className="k-hero__arrow k-hero__arrow--prev" onClick={() => goTo(active - 1)} aria-label="Previous slide">
            <ArrowLeft aria-hidden="true" />
          </button>
          <div className="k-hero__tabs" role="tablist" aria-label="Choose slide" onKeyDown={onTabKey}>
            {HERO_SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                className="k-hero__tab"
                aria-selected={i === active}
                aria-controls={`hero-slide-${slide.id}`}
                aria-label={`Slide ${i + 1}: ${slide.title.join(' ')}`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button type="button" className="k-hero__arrow k-hero__arrow--next" onClick={() => goTo(active + 1)} aria-label="Next slide">
            <ArrowRight aria-hidden="true" />
          </button>
          <span className="k-hero__divider" aria-hidden="true" />
          <button
            type="button"
            className="k-hero__pause"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
          >
            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          </button>
          <span className="k-hero__counter" aria-live="polite">
            {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
        </div>

        <ul className="k-hero__stats" aria-label="KMFRI at a glance">
          <li className="k-hero__stat">
            <Microscope aria-hidden="true" />
            <span>
              <span className="k-hero__stat-value">45+</span>
              <span className="k-hero__stat-label">Years of Research</span>
            </span>
          </li>
          <li className="k-hero__stat">
            <MapPin aria-hidden="true" />
            <span>
              <span className="k-hero__stat-value">13</span>
              <span className="k-hero__stat-label">Stations Nationwide</span>
            </span>
          </li>
          <li className="k-hero__stat">
            <Users aria-hidden="true" />
            <span>
              <span className="k-hero__stat-value">200+</span>
              <span className="k-hero__stat-label">Scientists</span>
            </span>
          </li>
        </ul>
      </div>

      <div className="k-hero__wave" aria-hidden="true">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0 64 C 320 28 640 96 960 70 S 1320 30 1440 44 L 1440 100 L 0 100 Z" fill="url(#k-hero-accent)" />
          <path d="M0 74 C 320 38 640 104 960 80 S 1320 42 1440 56 L 1440 100 L 0 100 Z" fill="#E4F4F6" />
          <defs>
            <linearGradient id="k-hero-accent" x1="0" x2="1">
              <stop offset="0" stopColor="#0A8FC4" />
              <stop offset="0.5" stopColor="#5BD1D7" />
              <stop offset="1" stopColor="#0A8FC4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------
   HOMEPAGE
   ------------------------------------------------------------------ */
const SECTORS = [
  { label: 'National Government', desc: 'Ministries, regulators & parastatals', Icon: Landmark },
  { label: 'County Governments', desc: 'Fisheries & blue economy masterplans', Icon: Building2 },
  { label: 'Private Sector', desc: 'Food processors, exporters & consultancies', Icon: Briefcase },
  { label: 'Researchers & Unis', desc: 'Postgraduate scholars & marine datasets', Icon: GraduationCap },
  { label: 'Fish Farmers', desc: 'Hatchery seed, broodstock & high-protein feed', Icon: Fish },
  { label: 'SMEs & Cooperatives', desc: 'Post-harvest value addition & BMUs', Icon: Store },
];

const FLAGSHIPS = [
  {
    slug: 'laboratory-analytical-services',
    code: 'KMFRI-LAB-01',
    title: 'Laboratory Analytical Services',
    badge: 'ISO/IEC 17025',
    image: '/images/analytical-lab.webp',
    alt: 'KMFRI Laboratory Analytical Services',
    text: 'Water analysis, fish tissue testing, microbiology, heavy metal detection, and environmental compliance testing across accredited laboratories in Mombasa, Kisumu, and Naivasha.',
    meta: 'TAT: 5–7 Days',
    cta: 'View Tariffs',
    Icon: FlaskConical,
  },
  {
    slug: 'research-vessel-hire-services',
    code: 'KMFRI-VES-05',
    title: 'Research Vessel Hire Services',
    badge: 'Flagship Vessel',
    image: '/images/vessel-port.webp',
    alt: 'Research Vessel Hire RV Mtafiti',
    text: 'Charter the 53-meter RV Mtafiti equipped with multibeam echosounders, CTD rosettes, and scientific winches for marine surveys, offshore expeditions, and environmental impact assessments.',
    meta: '200nm EEZ Coverage',
    cta: 'Charter Specs',
    Icon: Ship,
  },
  {
    slug: 'fish-and-aquaculture-services',
    code: 'KMFRI-AQU-03',
    title: 'Fish & Aquaculture Services',
    badge: 'Certified Seed Stock',
    image: '/images/aquaculture-hatchery.webp',
    alt: 'Fish and Aquaculture Fingerlings',
    text: 'Certified monosex Tilapia and African Catfish fingerlings, marine mud crab seed, optimized high-protein floating feeds, and turnkey aquaculture setup support.',
    meta: 'Kegati & Sangoro Hatcheries',
    cta: 'Seed Pricing',
    Icon: Fish,
  },
];

const CREDENTIALS = [
  { title: 'State Corporation Mandate', text: 'Science & Technology Act Cap 250', Icon: ShieldCheck },
  { title: 'ISO 9001:2015 Certified', text: 'Quality Management System', Icon: Award },
  { title: 'ISO/IEC 17025 Labs', text: 'Accredited Analytical Testing', Icon: CheckCircle2 },
  { title: 'Client Inquiries Desk', text: '+254 (0) 41 475151 / 475154', Icon: Phone, href: 'tel:+25441475151' },
];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenInquiry, onOpenSearch }) => {
  const { services, stations } = useHubData();
  return (
    <div className="w-full">
      {/* 1. HERO */}
      <HeroSlider onNavigate={onNavigate} onOpenInquiry={onOpenInquiry} onOpenSearch={onOpenSearch} />

      {/* 2. CLIENT ENGAGEMENT (official "Who We Are" panel) */}
      <section className="band-teal k-section pt-10! overflow-x-clip" aria-labelledby="engagement-heading">
        <div className="k-container">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
            <div>
              <span className="k-eyebrow">Client Engagement</span>
              <h2 id="engagement-heading" className="k-h2">
                Tailored for Kenya&rsquo;s Blue Economy <em>Stakeholders</em>
              </h2>
              <span className="k-rule my-6" aria-hidden="true" />
              <p className="k-lead">
                Our commercial catalogue delivers specialized scientific capacity directly to mandated public agencies, county governments,
                private enterprises, and community cooperatives.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" className="btn btn-primary" onClick={() => onNavigate('services')}>
                  Open Services Directory <ArrowRight aria-hidden="true" />
                </button>
                <button type="button" className="btn btn-outline" onClick={() => onOpenInquiry()}>
                  Request Quotation
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 sm:-inset-5 rounded-[28px] bg-white/55 rotate-[-2.5deg]" aria-hidden="true" />
              <img
                src="/images/vessel-aerial.webp"
                srcSet={imgSrcSet('/images/vessel-aerial.webp')}
                sizes="(min-width: 1024px) 560px, 100vw"
                alt="KMFRI oceanographic research vessel off the Kenyan coast"
                className="relative w-full aspect-[16/10] object-cover rounded-[24px] shadow-card-hover"
                loading="lazy"
              />
            </div>
          </div>

          <ul className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Client sectors served">
            {SECTORS.map(({ label, desc, Icon }) => (
              <li key={label} className="k-card k-card--hover flex-row! items-start gap-4 p-5">
                <span className="grid place-items-center w-12 h-12 shrink-0 rounded-full bg-navy-50 text-navy-600">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-heading font-semibold text-navy-800">{label}</span>
                  <span className="block text-sm text-muted mt-1 leading-snug">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Wave from="#CDE9ED" to="#DCE5F1" />

      {/* 3. FLAGSHIP SERVICES (official directorate cards) */}
      <section className="band-navy k-section pt-6!" aria-labelledby="flagships-heading">
        <div className="k-container">
          <SectionHeader
            layout="split"
            eyebrow="Enterprise Highlights"
            id="flagships-heading"
            title={<>Key Commercial <em>Flagships</em></>}
            action={
              <button type="button" className="k-link" onClick={() => onNavigate('services')}>
                View all {services.length} services
                <span className="k-link__arrow"><ArrowRight className="w-4 h-4" aria-hidden="true" /></span>
              </button>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FLAGSHIPS.map((f, i) => (
              <article key={f.slug} className="k-card k-card--hover">
                <div className="k-card__figure">
                  <div className="k-card__media">
                    <img src={smallVariant(f.image)} alt={f.alt} loading="lazy" />
                    <span className="k-card__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <span className="absolute top-3.5 left-3.5 k-badge k-badge--solid">{f.badge}</span>
                  </div>
                  <span className="k-card__icon" aria-hidden="true"><f.Icon /></span>
                </div>
                <div className="k-card__body">
                  <span className="k-tag font-mono tracking-normal!">{f.code}</span>
                  <h3 className="k-h3 mt-1.5">{f.title}</h3>
                  <span className="k-rule my-4" aria-hidden="true" />
                  <p className="text-[0.95rem] text-muted leading-relaxed flex-1">{f.text}</p>
                  <div className="mt-6 pt-4 border-t border-line flex items-center justify-between gap-3">
                    <span className="text-sm text-muted">{f.meta}</span>
                    <button type="button" className="k-link text-[0.95rem]" onClick={() => onNavigate('service_detail', f.slug)}>
                      {f.cta}
                      <span className="k-link__arrow"><ArrowRight className="w-4 h-4" aria-hidden="true" /></span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Wave from="#D3DEED" to="#F7F9FC" />

      {/* 4. COMPLETE CATALOGUE */}
      <section className="band-mist k-section pt-6!" aria-labelledby="catalogue-heading">
        <div className="k-container">
          <SectionHeader
            layout="split"
            eyebrow="Complete Directory"
            id="catalogue-heading"
            title={<>Enterprise Service <em>Catalogue</em></>}
            lead="Official list of commercial services as outlined in the KMFRI enterprise framework."
          />
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv) => (
              <li key={srv.id}>
                <button
                  type="button"
                  onClick={() => onNavigate('service_detail', srv.slug)}
                  className="k-card k-card--hover group w-full h-full flex-row! items-start gap-4 p-5 text-left"
                >
                  <span className="grid place-items-center w-12 h-12 shrink-0 rounded-xl bg-teal-50 text-teal-700 border border-[#bfe8ec]">
                    <ServiceIcon category={srv.category} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold text-subtle">{srv.code}</span>
                      {srv.status === 'coming_soon' ? (
                        <span className="k-badge k-badge--gold">Coming Soon</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800">
                          <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Available
                        </span>
                      )}
                    </span>
                    <span className="block mt-1 font-heading font-semibold text-[1.05rem] text-navy-800 group-hover:text-navy-500 transition-colors">
                      {srv.title}
                    </span>
                    <span className="block text-sm text-muted mt-1 line-clamp-2">{srv.description}</span>
                    <span className="block mt-2.5 text-[0.8125rem] text-muted truncate">
                      <span className="font-semibold text-ink">Client Base:</span> {srv.remarks}
                    </span>
                  </span>
                  <ArrowRight className="w-5 h-5 shrink-0 self-center text-subtle group-hover:text-navy-600 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('services')}>
              Open Filterable Services Directory <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. INSTITUTIONAL CREDENTIALS */}
      <section className="bg-white k-section" aria-labelledby="credentials-heading">
        <div className="k-container grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-center">
          <div>
            <span className="k-eyebrow">Quality &amp; Mandate</span>
            <h2 id="credentials-heading" className="k-h2">
              Institutional <em>Credentials</em>
            </h2>
            <p className="k-lead mt-5">
              In line with the Government of Kenya Service Delivery Standards, KMFRI is committed to transparent timelines, professional
              integrity, and standardized pricing for all public and private enterprise stakeholders.
            </p>
            <div className="mt-7 flex items-center gap-5">
              <img src="/images/brand/kebs-iso-9001.png" alt="KEBS ISO 9001 Registered Firm — Quality Management System" width={84} height={84} className="w-[84px] h-[84px] rounded-full shadow-card" loading="lazy" />
              <button type="button" className="k-link" onClick={() => onNavigate('charter')}>
                View Service Charter
                <span className="k-link__arrow"><ArrowRight className="w-4 h-4" aria-hidden="true" /></span>
              </button>
            </div>
          </div>
          <ul className="grid sm:grid-cols-2 gap-5">
            {CREDENTIALS.map(({ title, text, Icon, href }) => (
              <li key={title} className="k-card p-6">
                <span className="grid place-items-center w-14 h-14 rounded-full bg-navy-50 text-navy-600 ring-8 ring-navy-50/50">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </span>
                <span className="k-tag mt-5">{title}</span>
                {href ? (
                  <a href={href} className="mt-1.5 font-heading font-semibold text-lg text-navy-800 hover:text-navy-500">{text}</a>
                ) : (
                  <span className="mt-1.5 font-heading font-semibold text-lg text-navy-800">{text}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Wave from="#FFFFFF" to="#E4F4F6" />

      {/* 6. RESEARCH STATIONS */}
      <section className="band-teal k-section pt-6!" aria-labelledby="stations-heading">
        <div className="k-container">
          <SectionHeader
            layout="split"
            eyebrow="National Operational Infrastructure"
            id="stations-heading"
            title={<>Research Stations &amp; <em>Centres</em></>}
            lead="KMFRI operates a nationwide network of marine and freshwater research stations equipped with specialized laboratories, fingerling nurseries, survey vessels, and conference infrastructure to serve stakeholders across Kenya."
            action={
              <button type="button" className="k-link" onClick={() => onNavigate('stations')}>
                Explore all stations
                <span className="k-link__arrow"><ArrowRight className="w-4 h-4" aria-hidden="true" /></span>
              </button>
            }
          />
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stations.map((st) => (
              <li key={st.id}>
                <button
                  type="button"
                  onClick={() => onNavigate('stations', st.id)}
                  className="k-card k-card--hover group w-full h-full p-5 text-left"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="grid place-items-center w-10 h-10 rounded-full bg-navy-600 text-white">
                      <MapPin className="w-4.5 h-4.5" aria-hidden="true" />
                    </span>
                    <span className="k-badge k-badge--teal k-badge--mono">{st.code}</span>
                  </span>
                  <span className="block mt-4 font-heading font-semibold text-navy-800 leading-snug">{st.name}</span>
                  <span className="block mt-1.5 text-sm text-muted">
                    {st.location} · <strong className="text-ink font-semibold">{st.county}</strong>
                  </span>
                  <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800">
                    View station <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. FORMAL REQUEST BANNER */}
      <CtaBand
        eyebrow="Service Requests"
        title={<>Need a Formal Fee Quotation or <em>Vessel Charter?</em></>}
        text="Submit your project scope, sample volume, or vessel charter schedule to receive an official KMFRI reference quote and terms of delivery."
      >
        <button type="button" className="btn btn-teal" onClick={() => onOpenInquiry()}>
          <FileText aria-hidden="true" /> Submit Service Request
        </button>
        <button type="button" className="btn btn-ghost-light" onClick={() => onNavigate('charter')}>
          View Service Charter
        </button>
      </CtaBand>
    </div>
  );
};
