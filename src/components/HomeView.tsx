import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Pause,
  Play,
  MapPin,
  Microscope,
  Users,
  Search,
  FileText,
  Building2,
  Briefcase,
  GraduationCap,
  Fish,
  Store,
  ExternalLink,
} from 'lucide-react';
import { useHubData } from '../data/HubData';
import { SectionHeader, Wave, CtaBand, imgSrcSet, DIVISION_ICONS } from './ui';
import { DivisionCard } from './ServiceCatalogueView';
import { ItemAction } from './catalogue/CatalogueParts';
import {
  SERVICE_CATALOGUE,
  CATALOGUE_TOTAL,
  ECITIZEN_URL,
  FEATURED_ITEMS,
  divisionForService,
  formatFee,
  onlineCount,
} from '../data/serviceCatalogue';

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
  /** Internal page this slide introduces (non-service slides) */
  view?: { id: string; label: string; quoteSlug?: string };
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hub',
    eyebrow: 'State Corporation Mandate · Commercial & Enterprise Services',
    title: ['A Centre of Excellence', 'in Aquatic Research', '& Blue Economy'],
    subtitle:
      'Laboratory testing, quality fish seed and feeds, research vessel charter, museum and aquarium visits, conference venues and marine data — with official tariffs and online applications.',
    image: '/images/vessel-aerial.webp',
    alt: 'KMFRI research vessel operating off the Kenyan coast',
    position: '62% center',
  },
  {
    id: 'lab',
    eyebrow: 'ISO 9001:2015 Certified · NEMA Designated',
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
    id: 'visits',
    eyebrow: 'Museum · Aquarium · Laboratories · Hatchery',
    title: ['Museum &', 'Educational', 'Visits'],
    image: '/images/kmfri/museum-exhibition-hall.webp',
    alt: 'Exhibition hall of the KMFRI marine museum',
    position: 'center 55%',
    slug: 'educational-visits',
  },
  {
    id: 'conference',
    eyebrow: 'Halls · Boardrooms · Grounds',
    title: ['Conference', '& Meeting', 'Facilities'],
    image: '/images/kmfri/hq-harbour-view.webp',
    alt: 'KMFRI Mombasa campus overlooking the harbour',
    position: 'center 60%',
    slug: 'conference-and-meeting-facilities',
  },

  {
    id: 'laboratories',
    eyebrow: 'NEMA Designated · ISO 9001:2015 Certified',
    title: ['KMFRI', 'Laboratory', 'Services'],
    subtitle:
      'A national network of specialized laboratories providing scientific testing, research and analytical services for fisheries, aquaculture, food safety, environmental stewardship and climate resilience.',
    image: '/images/labs/lab-banner.webp',
    alt: 'Dhow sailing on the Kenyan coast beneath a coastal tree',
    position: 'center 62%',
    view: { id: 'laboratories', label: 'Explore Laboratory Services', quoteSlug: 'laboratory-analytical-services' },
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
        const division = divisionForService(slide.slug);
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
              <p className="k-hero__subtitle k-hero__anim">{slide.subtitle ?? division?.tagline ?? service?.description}</p>

              <div className="k-hero__actions k-hero__anim">
                {slide.view ? (
                  <>
                    <button type="button" className="btn btn-teal" onClick={() => onNavigate(slide.view!.id)}>
                      {slide.view.label} <ArrowRight aria-hidden="true" />
                    </button>
                    <button type="button" className="btn btn-ghost-light" onClick={() => onOpenInquiry(slide.view!.quoteSlug)}>
                      <ShieldCheck aria-hidden="true" /> Request Quotation
                    </button>
                  </>
                ) : division ? (
                  <>
                    <button type="button" className="btn btn-teal" onClick={() => onNavigate('catalogue', division.id)}>
                      Services &amp; Prices <ArrowRight aria-hidden="true" />
                    </button>
                    <button type="button" className="btn btn-ghost-light" onClick={() => onOpenInquiry(division.serviceSlug)}>
                      <ShieldCheck aria-hidden="true" /> Request Quotation
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="btn btn-teal" onClick={() => onNavigate('catalogue')}>
                      Browse All {CATALOGUE_TOTAL} Services <ArrowRight aria-hidden="true" />
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
   HOMEPAGE — brief by design: hero → catalogue → ready to order →
   how it works → request banner. Detail lives in the catalogue.
   ------------------------------------------------------------------ */

/** "Find services for…" shortcuts: client type → the division they usually need. */
const AUDIENCES: { label: string; division: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'Fish farmers', division: 'aquaculture', Icon: Fish },
  { label: 'Processors & exporters', division: 'laboratory', Icon: Store },
  { label: 'Consultants & counties', division: 'laboratory', Icon: Briefcase },
  { label: 'Researchers', division: 'maritime', Icon: Microscope },
  { label: 'Schools & families', division: 'visits', Icon: Users },
  { label: 'Event organisers', division: 'conference', Icon: Building2 },
  { label: 'Students', division: 'attachment', Icon: GraduationCap },
];

const STEPS = [
  { title: 'Find your service', text: 'Every service shows its official tariff.', Icon: Search },
  { title: 'Apply or get a quote', text: 'Online on eCitizen, or by quotation.', Icon: FileText },
  { title: 'Pay electronically', text: 'Official channels and KMFRI receipts.', Icon: ShieldCheck },
  { title: 'Receive your service', text: 'Products, results, visits or events.', Icon: CheckCircle2 },
];

const TRUST = ['ISO 9001:2015 certified', 'NEMA designated laboratories', 'Published government tariffs', 'State corporation mandate'];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenInquiry, onOpenSearch }) => {
  const openDivision = (id?: string) => onNavigate('catalogue', id);
  const onlineTotal = SERVICE_CATALOGUE.reduce((n, d) => n + onlineCount(d), 0);

  return (
    <div className="w-full">
      {/* 1. HERO */}
      <HeroSlider onNavigate={onNavigate} onOpenInquiry={onOpenInquiry} onOpenSearch={onOpenSearch} />

      {/* 2. SERVICE CATALOGUE — the entry point to every service */}
      <section className="band-teal k-section pt-10!" aria-labelledby="catalogue-heading">
        <div className="k-container">
          <SectionHeader
            layout="split"
            eyebrow="Service Catalogue"
            id="catalogue-heading"
            title={<>Everything KMFRI offers, <em>in one place</em></>}
            lead={`${CATALOGUE_TOTAL} services with official tariffs — ${onlineTotal} of them available online today.`}
            action={
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn btn-primary" onClick={() => openDivision()}>
                  Open the Catalogue <ArrowRight aria-hidden="true" />
                </button>
                {onOpenSearch && (
                  <button type="button" className="btn btn-outline" onClick={onOpenSearch}>
                    <Search aria-hidden="true" /> Search a service
                  </button>
                )}
              </div>
            }
          />
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {SERVICE_CATALOGUE.map((d) => (
              <li key={d.id} className="relative">
                <DivisionCard division={d} onSelect={openDivision} showGroups={false} />
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-navy-800 mr-1">Find services for:</span>
            {AUDIENCES.map(({ label, division, Icon }) => (
              <button key={label} type="button" className="k-tab min-h-9! py-1! px-3.5! text-[0.8125rem]! bg-white!" onClick={() => openDivision(division)}>
                <Icon aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Wave from="#CDE9ED" to="#FFFFFF" />

      {/* 3. READY TO ORDER — a short price list, not a second catalogue */}
      <section className="bg-white k-section pt-4!" aria-labelledby="popular-heading">
        <div className="k-container">
          <div className="k-panel overflow-hidden grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)]">
            <div className="p-6 sm:p-8 bg-navy-800 text-white flex flex-col">
              <span className="k-eyebrow k-eyebrow--light">Ready to Order</span>
              <h2 id="popular-heading" className="k-h2 k-h2--light text-[clamp(1.6rem,2.4vw,2.1rem)]!">
                Popular services <em>&amp; prices</em>
              </h2>
              <p className="mt-3 text-white/80 leading-relaxed">Published government tariffs — no hidden costs.</p>
              <button type="button" className="btn btn-teal btn-sm mt-6 lg:mt-auto self-start" onClick={() => openDivision()}>
                All {CATALOGUE_TOTAL} prices <ArrowRight aria-hidden="true" />
              </button>
            </div>
            <ul className="min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-px bg-line">
              {FEATURED_ITEMS.map(({ item, path }) => {
                const group = path[path.length - 1];
                const Icon = DIVISION_ICONS[path[0].id];
                return (
                  <li key={item.no} className="bg-white p-5 flex items-center gap-4">
                    <span className="grid place-items-center w-11 h-11 shrink-0 rounded-xl bg-teal-50 text-teal-700 border border-[#bfe8ec]">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <button type="button" className="block text-left text-xs font-semibold text-teal-800 hover:text-navy-600 truncate max-w-full" onClick={() => openDivision(group.id)}>
                        {group.title}
                      </button>
                      <h3 className="font-heading font-semibold text-navy-800 leading-snug line-clamp-2">{item.name}</h3>
                      <p className="k-num mt-0.5">{formatFee(item)}</p>
                    </div>
                    <ItemAction item={item} onOpenInquiry={onOpenInquiry} />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS + TRUST — one slim band */}
      <section className="bg-white pb-16 lg:pb-20" aria-labelledby="steps-heading">
        <div className="k-container">
          <h2 id="steps-heading" className="sr-only">How it works</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
            {STEPS.map(({ title, text, Icon }, i) => (
              <li key={title} className="flex items-start gap-3">
                <span className="relative grid place-items-center w-11 h-11 shrink-0 rounded-full bg-navy-50 text-navy-600">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 grid place-items-center w-5 h-5 rounded-full bg-teal-600 text-white text-[0.65rem] font-semibold" aria-hidden="true">{i + 1}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-heading font-semibold text-navy-800 leading-snug">{title}</span>
                  <span className="block text-sm text-muted mt-0.5">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted" aria-label="Quality and mandate">
              <li><img src="/images/brand/kebs-iso-9001.png" alt="KEBS ISO 9001 registered" width={40} height={40} className="w-10 h-10 rounded-full" loading="lazy" /></li>
              {TRUST.map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-700" aria-hidden="true" /> {t}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => onNavigate('stations')}>
                <MapPin aria-hidden="true" /> Find a station
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => onNavigate('charter')}>Service Charter</button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. REQUEST BANNER */}
      <CtaBand
        eyebrow="Service Requests"
        title={<>Planning a project, bulk order <em>or event?</em></>}
        text="Send your sample list, quantities, cruise plan or event dates and receive an official KMFRI quotation."
      >
        <button type="button" className="btn btn-teal" onClick={() => onOpenInquiry()}>
          <FileText aria-hidden="true" /> Request a Quotation
        </button>
        <a href={ECITIZEN_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light">
          Apply on eCitizen <ExternalLink aria-hidden="true" />
        </a>
      </CtaBand>
    </div>
  );
};
