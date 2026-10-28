import React, { useEffect, useRef, useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Accessibility,
  X,
  FileText,
} from 'lucide-react';
import { SERVICE_CATALOGUE } from '../data/serviceCatalogue';
import kmfriLogo from '../assets/images/kmfri_logo.png';
import { KMFRI_MAIN_SITE, SOCIAL_LINKS } from './ui';

interface FooterProps {
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry: (slug?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenInquiry }) => {
  const [a11yOpen, setA11yOpen] = useState(false);
  const a11yRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!a11yOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setA11yOpen(false);
    const onDown = (e: MouseEvent) => {
      if (a11yRef.current && !a11yRef.current.contains(e.target as Node)) setA11yOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [a11yOpen]);

  const QUICK_LINKS: { label: string; href?: string; onClick?: () => void }[] = [
    { label: 'Service Catalogue', onClick: () => onNavigate('catalogue') },
    { label: 'Laboratory Services', onClick: () => onNavigate('laboratories') },
    { label: 'Research Stations', onClick: () => onNavigate('stations') },
    { label: 'Tariffs & Service Charter', onClick: () => onNavigate('charter') },
    { label: 'Request a Quotation', onClick: () => onOpenInquiry() },
    { label: 'KMFRI Services (E-Citizen)', href: 'https://kmfri.ecitizen.go.ke/' },
    { label: 'KMFRI Main Website', href: KMFRI_MAIN_SITE },
  ];

  return (
    <footer className="k-footer relative z-1 -mt-(--wave-h)">
      {/* Wave transition (overlays the closing band of every page) */}
      <div className="k-footer__wave" aria-hidden="true">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0 62 C 300 26 620 90 920 68 S 1300 30 1440 44 L 1440 100 L 0 100 Z" fill="url(#k-footer-accent)" />
          <path d="M0 70 C 300 34 620 98 920 76 S 1300 38 1440 52 L 1440 100 L 0 100 Z" fill="#001D3D" />
          <defs>
            <linearGradient id="k-footer-accent" x1="0" x2="1">
              <stop offset="0" stopColor="#0A8FC4" />
              <stop offset="0.5" stopColor="#5BD1D7" />
              <stop offset="1" stopColor="#0A8FC4" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="k-footer__main">
        <div className="k-container grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1.2fr_1fr_1.2fr] lg:gap-10">
          {/* 1. Institutional identity */}
          <div className="space-y-5">
            <span className="inline-block bg-white p-2.5 rounded-xl">
              <img src={kmfriLogo} alt="Kenya Marine & Fisheries Research Institute" className="h-10 w-auto" loading="lazy" />
            </span>
            <p className="text-[0.9375rem] text-white/75 max-w-xs">
              <span className="font-semibold text-teal-400">Vision: </span>
              <span className="italic">&ldquo;A Centre of Excellence in Aquatic Research and Blue Economy&rdquo;</span>
            </p>
            <div className="flex items-center gap-4">
              <img
                src="/images/brand/kebs-iso-9001.png"
                alt="KEBS ISO 9001 Registered Firm — Quality Management System"
                width={64}
                height={64}
                className="w-16 h-16 shrink-0 rounded-full ring-4 ring-white/10"
                loading="lazy"
              />
              <ul className="k-footer__social" aria-label="KMFRI on social media">
                {SOCIAL_LINKS.filter((s) => s.label !== 'WhatsApp').map(({ label, href, color, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`} style={{ background: color }}>
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 2. Service catalogue divisions */}
          <nav aria-labelledby="footer-services">
            <h3 id="footer-services">Our Services</h3>
            <ul className="k-footer__list">
              {SERVICE_CATALOGUE.map((d) => (
                <li key={d.id}>
                  <button type="button" onClick={() => onNavigate('catalogue', d.id)}>{d.title}</button>
                </li>
              ))}
            </ul>
          </nav>

          {/* 3. Quick links */}
          <nav aria-labelledby="footer-quick">
            <h3 id="footer-quick">Quick Links</h3>
            <ul className="k-footer__list">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  {l.href ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
                  ) : (
                    <button type="button" onClick={l.onClick}>{l.label}</button>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* 4. Headquarters & contacts */}
          <div>
            <h3>Contact Us</h3>
            <ul className="k-footer__contact">
              <li>
                <MapPin aria-hidden="true" />
                <span>P.O. Box 81651 - 80100, Mombasa, KENYA</span>
              </li>
              <li>
                <Phone aria-hidden="true" />
                <span>
                  <a href="tel:+254208021561">+254 (20) 8021561</a> or <a href="tel:+254712003853">712003853</a>
                </span>
              </li>
              <li>
                <Mail aria-hidden="true" />
                <a href="mailto:director@kmfri.go.ke">director@kmfri.go.ke</a>
              </li>
            </ul>
            <button type="button" onClick={() => onOpenInquiry()} className="btn btn-teal btn-sm mt-5">
              <FileText aria-hidden="true" /> Submit Service Request
            </button>
          </div>
        </div>
      </div>

      {/* Bottom legal bar */}
      <div className="k-footer__bottom">
        <div className="k-container py-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-center md:text-left">
          <p>&copy; {new Date().getFullYear()} Kenya Marine and Fisheries Research Institute (KMFRI). All Rights Reserved.</p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Legal and institutional links">
            <li><a href={`${KMFRI_MAIN_SITE}/privacy-notice`} target="_blank" rel="noopener noreferrer">Privacy Notice</a></li>
            <li><a href={`${KMFRI_MAIN_SITE}/about`} target="_blank" rel="noopener noreferrer">About KMFRI</a></li>
            <li><button type="button" onClick={() => onOpenInquiry()}>Feedback</button></li>
            <li><button type="button" onClick={() => onNavigate('charter')} className="hover:text-teal-400!">Citizens&rsquo; Charter</button></li>
          </ul>
        </div>
      </div>

      {/* Accessibility quick-help (bottom-left, as on kmfri.go.ke) */}
      <div ref={a11yRef} className="fixed left-5 bottom-5 z-900">
        {a11yOpen && (
          <div
            id="a11y-panel"
            role="dialog"
            aria-label="Accessibility options"
            className="absolute bottom-16 left-0 w-[min(320px,calc(100vw-2.5rem))] k-panel p-5 text-ink animate-[kRise_220ms_ease_both]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-heading font-semibold text-navy-800">Accessibility</p>
              <button type="button" onClick={() => setA11yOpen(false)} className="k-icon-btn w-8! h-8!" aria-label="Close accessibility options">
                <X className="w-4! h-4!" aria-hidden="true" />
              </button>
            </div>
            <ul className="space-y-2 text-sm text-muted">
              <li className="k-check"><CheckCircle2 aria-hidden="true" />Screen reader friendly semantic HTML</li>
              <li className="k-check"><CheckCircle2 aria-hidden="true" />High contrast institutional colours (WCAG AA)</li>
              <li className="k-check"><CheckCircle2 aria-hidden="true" />Keyboard shortcut: <kbd className="font-mono text-xs px-1.5 py-0.5 rounded border border-line bg-canvas">Ctrl / ⌘ + K</kbd> for real-time search</li>
              <li className="k-check"><CheckCircle2 aria-hidden="true" />Full responsive viewport scaling</li>
            </ul>
          </div>
        )}
        <button
          type="button"
          onClick={() => setA11yOpen((o) => !o)}
          className="k-a11y-fab static!"
          aria-label="Accessibility options"
          aria-expanded={a11yOpen}
          aria-controls="a11y-panel"
        >
          <Accessibility aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
};
