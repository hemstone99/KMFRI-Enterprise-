import React from 'react';
import {
  FlaskConical,
  Briefcase,
  Fish,
  Database,
  Ship,
  PackageCheck,
  Users,
  Clock,
  Building2,
  GraduationCap,
  Landmark,
  Headset,
} from 'lucide-react';
import { ServiceItem } from '../types';

/* ------------------------------------------------------------------
   Shared brand constants (official KMFRI channels, as linked from kmfri.go.ke)
   ------------------------------------------------------------------ */
export const KMFRI_MAIN_SITE = 'https://kmfri.go.ke';

export const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com/Kmfri1979', color: '#1877f2', Icon: FacebookIcon },
  { label: 'X (Twitter)', href: 'https://x.com/KmfriResearch', color: '#000000', Icon: XIcon },
  { label: 'YouTube', href: 'https://www.youtube.com/@KMFRITV', color: '#ff0000', Icon: YouTubeIcon },
  { label: 'WhatsApp', href: 'https://wa.me/254712003853', color: '#25d366', Icon: WhatsAppIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/kenya-marine-and-fisheries-research-institute-kmfri/', color: '#0a66c2', Icon: LinkedInIcon },
];

/** Responsive variant of an optimised image: `/images/x.webp` -> `/images/x-sm.webp`. */
export const smallVariant = (src: string) => src.replace(/\.webp$/, '-sm.webp');
export const imgSrcSet = (src: string) =>
  src.endsWith('.webp') ? `${smallVariant(src)} 760w, ${src} 1376w` : undefined;

/* ------------------------------------------------------------------
   Service category icon (single source of truth for every view)
   ------------------------------------------------------------------ */
const SERVICE_ICONS: Record<ServiceItem['category'], React.ComponentType<{ className?: string }>> = {
  analytical: FlaskConical,
  consultancy: Briefcase,
  aquaculture: Fish,
  data: Database,
  vessel: Ship,
  value_addition: PackageCheck,
  education: Users,
  training: Clock,
  facilities: Building2,
  internship: GraduationCap,
};

export const ServiceIcon: React.FC<{ category: ServiceItem['category']; className?: string }> = ({
  category,
  className = 'w-5 h-5',
}) => {
  const Icon = SERVICE_ICONS[category] ?? FlaskConical;
  return <Icon className={className} aria-hidden="true" />;
};

/** Icons for the top-level divisions of the service catalogue (src/data/serviceCatalogue.ts). */
export const DIVISION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  laboratory: FlaskConical,
  aquaculture: Fish,
  visits: Landmark,
  maritime: Ship,
  research: Database,
  conference: Building2,
  attachment: GraduationCap,
  customer: Headset,
};

/* ------------------------------------------------------------------
   Wave separator between two background bands
   ------------------------------------------------------------------ */
export const Wave: React.FC<{ from: string; to: string; accent?: boolean; flip?: boolean; className?: string }> = ({
  from,
  to,
  accent = false,
  flip = false,
  className = '',
}) => (
  <div className={`k-wave ${className}`} style={{ background: from }} aria-hidden="true">
    <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      {accent && (
        <path d="M0 58 C 300 22 620 86 920 64 S 1300 26 1440 40 L 1440 100 L 0 100 Z" fill="url(#k-wave-accent)" />
      )}
      <path d="M0 64 C 300 28 620 92 920 70 S 1300 32 1440 46 L 1440 100 L 0 100 Z" fill={to} />
      {accent && (
        <defs>
          <linearGradient id="k-wave-accent" x1="0" x2="1">
            <stop offset="0" stopColor="#0A8FC4" />
            <stop offset="0.5" stopColor="#5BD1D7" />
            <stop offset="1" stopColor="#0A8FC4" />
          </linearGradient>
        </defs>
      )}
    </svg>
  </div>
);

/* ------------------------------------------------------------------
   Section heading: eyebrow + title (with optional serif accent) + lead
   ------------------------------------------------------------------ */
interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** 'split' puts the lead beside the heading on desktop (official directorates pattern). */
  layout?: 'stack' | 'split' | 'center';
  light?: boolean;
  action?: React.ReactNode;
  id?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  lead,
  layout = 'stack',
  light = false,
  action,
  id,
}) => {
  const eyebrowCls = `k-eyebrow ${light ? 'k-eyebrow--light' : ''}`;
  const titleCls = `k-h2 ${light ? 'k-h2--light' : ''}`;
  const leadCls = `k-lead ${light ? 'text-white/85!' : ''}`;

  if (layout === 'split') {
    return (
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-16 items-end mb-10 lg:mb-14">
        <div>
          <span className={eyebrowCls}>{eyebrow}</span>
          <h2 id={id} className={titleCls}>{title}</h2>
        </div>
        <div className="flex flex-col gap-5 lg:items-start">
          {lead && <p className={leadCls}>{lead}</p>}
          {action}
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-10 lg:mb-12 ${layout === 'center' ? 'text-center mx-auto max-w-3xl flex flex-col items-center' : 'max-w-3xl'}`}>
      <span className={eyebrowCls}>{eyebrow}</span>
      <h2 id={id} className={titleCls}>{title}</h2>
      {lead && <p className={`${leadCls} mt-4`}>{lead}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------
   Internal page banner (official .page-banner): photo, navy wash,
   breadcrumb eyebrow, large title, wave into the next band.
   ------------------------------------------------------------------ */
export interface Crumb {
  label: string;
  onClick?: () => void;
}

interface PageBannerProps {
  crumbs: Crumb[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  image: string;
  imageAlt?: string;
  imagePosition?: string;
  /** Background colour of the band that follows (the wave fills into it). */
  next?: string;
  children?: React.ReactNode;
}

export const PageBanner: React.FC<PageBannerProps> = ({
  crumbs,
  title,
  subtitle,
  image,
  imageAlt = '',
  imagePosition,
  next = '#E4F4F6',
  children,
}) => (
  <section className="k-banner">
    <div className="k-banner__bg">
      <img
        src={image}
        srcSet={imgSrcSet(image)}
        sizes="100vw"
        alt={imageAlt}
        style={imagePosition ? ({ '--pos': imagePosition } as React.CSSProperties) : undefined}
        fetchPriority="high"
      />
    </div>
    <div className="k-banner__inner k-container">
      <nav aria-label="Breadcrumb">
        <ol className="k-crumbs">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={c.label} className="flex items-center gap-2">
                {c.onClick && !last ? (
                  <button type="button" onClick={c.onClick}>{c.label}</button>
                ) : (
                  <span aria-current={last ? 'page' : undefined}>{c.label}</span>
                )}
                {!last && <span className="sep" aria-hidden="true">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      <h1 className="k-banner__title">{title}</h1>
      {subtitle && <p className="k-banner__subtitle">{subtitle}</p>}
      {children}
    </div>
    <div className="k-banner__wave" aria-hidden="true">
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path d="M0 40 C 260 78 520 98 760 94 S 1220 62 1440 20 L 1440 100 L 0 100 Z" fill="url(#k-banner-accent)" />
        <path d="M0 48 C 260 84 520 100 760 98 S 1220 70 1440 30 L 1440 100 L 0 100 Z" fill={next} />
        <defs>
          <linearGradient id="k-banner-accent" x1="0" x2="1">
            <stop offset="0" stopColor="#0A8FC4" />
            <stop offset="0.5" stopColor="#5BD1D7" />
            <stop offset="1" stopColor="#0A8FC4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </section>
);

/* ------------------------------------------------------------------
   Closing call-to-action band (official .page-cta, blue band).
   Ends every page so the footer wave always meets the same colour.
   ------------------------------------------------------------------ */
export const CTA_BAND_BOTTOM = '#003D7A';

export const CtaBand: React.FC<{ eyebrow?: string; title: React.ReactNode; text?: React.ReactNode; children: React.ReactNode }> = ({
  eyebrow,
  title,
  text,
  children,
}) => (
  <section className="band-blue k-section-sm pb-[calc(var(--wave-h)+2.5rem)]!">
    <div className="k-container flex flex-col lg:flex-row lg:items-center justify-between gap-8">
      <div className="max-w-2xl">
        {eyebrow && <span className="k-eyebrow k-eyebrow--light">{eyebrow}</span>}
        <h2 className="k-h2 k-h2--light">{title}</h2>
        {text && <p className="mt-4 text-white/85 text-lg leading-relaxed">{text}</p>}
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 shrink-0">{children}</div>
    </div>
  </section>
);

/* ------------------------------------------------------------------
   Brand social icons (inline SVG — no external icon font)
   ------------------------------------------------------------------ */
type IconProps = { className?: string };

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
export function XIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}
export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
