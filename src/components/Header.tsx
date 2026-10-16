import React, { useEffect, useRef, useState } from 'react';
import kmfriLogo from '../assets/images/kmfri_logo.png';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Home as HomeIcon,
  Globe,
  FileText,
  UserCog,
  Newspaper,
  IdCard,
  Phone,
  MapPin,
  FileSignature,
} from 'lucide-react';
import { useHubData } from '../data/HubData';
import { KMFRI_MAIN_SITE, SOCIAL_LINKS, ServiceIcon } from './ui';

type Mode = 'subsite' | 'hero_preview' | 'architecture';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, slug?: string) => void;
  activeMode: Mode;
  onModeChange: (mode: Mode) => void;
  onOpenInquiry: (serviceSlug?: string) => void;
  onOpenSearch: () => void;
}

const TOPBAR_LINKS = [
  { label: 'Tenders', href: `${KMFRI_MAIN_SITE}/resources/tenders`, Icon: FileText, show: 'hidden lg:inline-flex' },
  { label: 'Staff Portal', href: 'https://staff.kmfri.go.ke/', Icon: UserCog, show: 'hidden lg:inline-flex' },
  { label: 'News', href: `${KMFRI_MAIN_SITE}/news`, Icon: Newspaper, show: 'hidden md:inline-flex' },
  { label: 'eCitizen Services', href: 'https://kmfri.ecitizen.go.ke/', Icon: IdCard, show: 'hidden sm:inline-flex' },
];

type MenuKey = 'services' | 'stations';

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  activeMode,
  onModeChange,
  onOpenInquiry,
  onOpenSearch,
}) => {
  const { services, stations } = useHubData();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState<MenuKey | null>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const navRef = useRef<HTMLElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const inSubsite = activeMode === 'subsite';
  const isCurrent = {
    home: inSubsite && currentView === 'home',
    services: inSubsite && (currentView === 'services' || currentView === 'service_detail'),
    stations: inSubsite && currentView === 'stations',
    charter: inSubsite && currentView === 'charter',
  };

  // Collapse the announcement strip once the page scrolls (official behaviour)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openMenu]);

  // Drawer: lock scroll, focus close button, Escape to close
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => drawerCloseRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    hamburgerRef.current?.focus();
  };

  const go = (view: string, slug?: string) => {
    setOpenMenu(null);
    setDrawerOpen(false);
    onModeChange('subsite');
    onNavigate(view, slug);
  };

  const hoverOpen = (key: MenuKey) => {
    window.clearTimeout(hoverTimer.current);
    setOpenMenu(key);
  };
  const hoverClose = () => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setOpenMenu(null), 160);
  };

  const onMenuKeyDown = (key: MenuKey) => (e: React.KeyboardEvent<HTMLLIElement>) => {
    const item = e.currentTarget;
    const links = Array.from(item.querySelectorAll<HTMLButtonElement>('.k-dropdown button'));
    const idx = links.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      setOpenMenu(null);
      item.querySelector<HTMLButtonElement>('.k-nav__toggle')?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (openMenu !== key) setOpenMenu(key);
      window.requestAnimationFrame(() => links[Math.min(idx + 1, links.length - 1)]?.focus());
    } else if (e.key === 'ArrowUp' && idx > -1) {
      e.preventDefault();
      if (idx === 0) item.querySelector<HTMLButtonElement>('.k-nav__toggle')?.focus();
      else links[idx - 1]?.focus();
    }
  };

  const onMenuBlur = (e: React.FocusEvent<HTMLLIElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpenMenu(null);
  };

  const DropdownTrigger: React.FC<{ menu: MenuKey; label: string; view: string; current: boolean }> = ({ menu, label, view, current }) => (
    <div className={`k-nav__link p-0! ${current ? 'is-current' : ''}`}>
      <button
        type="button"
        onClick={() => go(view)}
        aria-current={current ? 'page' : undefined}
        className="py-[0.55rem] pl-(--nav-px) pr-1"
      >
        {label}
      </button>
      <button
        type="button"
        className="k-nav__toggle grid place-items-center h-8 w-6 mr-[calc(var(--nav-px)-0.35rem)] rounded-md"
        aria-expanded={openMenu === menu}
        aria-controls={`menu-${menu}`}
        aria-label={`${label} menu`}
        onClick={() => setOpenMenu(openMenu === menu ? null : menu)}
      >
        <ChevronDown className="chev" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <>
      <div className={`k-header-wrap sticky top-0 z-1000 ${scrolled ? 'is-scrolled' : ''}`}>
        {/* 1. GOVERNMENT ANNOUNCEMENT STRIP */}
        <div className="k-topbar">
          <div className="k-topbar__inner">
            <div className="flex items-center min-w-0">
              <span className="k-topbar__item hidden sm:inline-flex" title="Site language">
                <Globe aria-hidden="true" />
                <span className="font-semibold text-white">English</span>
              </span>
              <span className="k-topbar__sep hidden md:block" aria-hidden="true" />
              <ul className="k-social hidden md:flex items-center gap-0.5" aria-label="KMFRI on social media">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}>
                      <Icon />
                    </a>
                  </li>
                ))}
              </ul>
              <a href="tel:+25441475151" className="sm:hidden" aria-label="Client Inquiries Desk: +254 41 475151">
                <Phone aria-hidden="true" />
                <span>+254 (0) 41 475151</span>
              </a>
            </div>

            <div className="flex items-center min-w-0">
              <a href="tel:+25441475151" className="hidden sm:inline-flex xl:inline-flex" title="Client Inquiries Desk">
                <Phone aria-hidden="true" />
                <span className="hidden xl:inline">Client Inquiries:</span>
                <span>+254 (0) 41 475151</span>
              </a>
              {TOPBAR_LINKS.map(({ label, href, Icon, show }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={show}>
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* 2. PRIMARY NAVIGATION */}
        <header className="k-header">
          <div className="k-header__inner">
            <button
              type="button"
              onClick={() => go('home')}
              className="k-brand"
              aria-label="KMFRI Commercial & Enterprise Services Hub — home"
            >
              <img src={kmfriLogo} alt="Kenya Marine and Fisheries Research Institute (KMFRI)" className="k-brand__logo" width={199} height={48} />
              <span className="k-brand__hub hidden md:flex">
                <small>Enterprise Portal</small>
                <span>Services Hub</span>
              </span>
            </button>

            <nav ref={navRef} className="hidden xl:block" aria-label="Main navigation">
              <ul className="k-nav">
                <li className="k-nav__item">
                  <button
                    type="button"
                    onClick={() => go('home')}
                    className={`k-nav__link ${isCurrent.home ? 'is-current' : ''}`}
                    aria-current={isCurrent.home ? 'page' : undefined}
                  >
                    <HomeIcon className="w-4 h-4" aria-hidden="true" />
                    <span>Home</span>
                  </button>
                </li>

                <li
                  className={`k-nav__item ${openMenu === 'services' ? 'is-open' : ''}`}
                  onMouseEnter={() => hoverOpen('services')}
                  onMouseLeave={hoverClose}
                  onKeyDown={onMenuKeyDown('services')}
                  onBlur={onMenuBlur}
                >
                  <DropdownTrigger menu="services" label="Enterprise Services" view="services" current={isCurrent.services} />
                  <div id="menu-services" className="k-dropdown" style={{ width: 'min(680px, calc(100vw - 2rem))' }}>
                    <button type="button" className="k-dropdown__overview" onClick={() => go('services')}>
                      <span>All {services.length} Enterprise Services</span>
                      <small>Browse directory <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></small>
                    </button>
                    <ul className="k-dropdown__grid">
                      {services.map((s) => (
                        <li key={s.id}>
                          <button type="button" className="k-dropdown__link" onClick={() => go('service_detail', s.slug)}>
                            <span className="ico"><ServiceIcon category={s.category} /></span>
                            <span className="min-w-0">
                              {s.title}
                              <small className="font-mono">{s.code}</small>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>

                <li
                  className={`k-nav__item ${openMenu === 'stations' ? 'is-open' : ''}`}
                  onMouseEnter={() => hoverOpen('stations')}
                  onMouseLeave={hoverClose}
                  onKeyDown={onMenuKeyDown('stations')}
                  onBlur={onMenuBlur}
                >
                  <DropdownTrigger menu="stations" label="Research Stations" view="stations" current={isCurrent.stations} />
                  <div id="menu-stations" className="k-dropdown" style={{ width: 'min(620px, calc(100vw - 2rem))' }}>
                    <button type="button" className="k-dropdown__overview" onClick={() => go('stations')}>
                      <span>Stations &amp; Centres</span>
                      <small>Overview <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></small>
                    </button>
                    <ul className="k-dropdown__grid">
                      {stations.map((st) => (
                        <li key={st.id}>
                          <button type="button" className="k-dropdown__link" onClick={() => go('stations', st.id)}>
                            <span className="ico"><MapPin aria-hidden="true" /></span>
                            <span className="min-w-0">
                              {st.name}
                              <small>{st.county}</small>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>

                <li className="k-nav__item">
                  <button
                    type="button"
                    onClick={() => go('charter')}
                    className={`k-nav__link ${isCurrent.charter ? 'is-current' : ''}`}
                    aria-current={isCurrent.charter ? 'page' : undefined}
                  >
                    Tariffs &amp; Charter
                  </button>
                </li>
              </ul>
            </nav>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                className="k-icon-btn"
                onClick={onOpenSearch}
                aria-label="Open Search Hub (Ctrl+K)"
                title="Search Hub (Ctrl+K)"
              >
                <Search aria-hidden="true" />
              </button>
              <button type="button" className="k-header-action" onClick={() => onOpenInquiry()}>
                <FileSignature aria-hidden="true" />
                <span className="hidden sm:inline">Request Quote</span>
                <span className="sm:hidden max-[400px]:sr-only">Quote</span>
              </button>
              <button
                ref={hamburgerRef}
                type="button"
                className="k-icon-btn xl:hidden"
                onClick={() => setDrawerOpen(true)}
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav"
                aria-label="Open menu"
              >
                <Menu className="w-6! h-6!" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* 3. MOBILE / TABLET OFF-CANVAS NAVIGATION */}
      <div className={`k-drawer-overlay ${drawerOpen ? 'is-open' : ''}`} onClick={closeDrawer} aria-hidden="true" />
      <aside
        id="mobile-nav"
        className={`k-drawer ${drawerOpen ? 'is-open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!drawerOpen}
        {...(!drawerOpen ? { inert: '' as unknown as boolean } : {})}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
          <img src={kmfriLogo} alt="KMFRI" className="h-9 w-auto" />
          <button ref={drawerCloseRef} type="button" className="k-icon-btn" onClick={closeDrawer} aria-label="Close menu">
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              onOpenSearch();
            }}
            className="k-input flex items-center gap-2 text-left text-subtle mb-4"
          >
            <Search className="w-4 h-4 text-navy-600" aria-hidden="true" />
            <span>Search services, stations, tariffs…</span>
          </button>

          <ul className="space-y-1">
            <li>
              <button type="button" className="k-drawer__link" onClick={() => go('home')} aria-current={isCurrent.home ? 'page' : undefined}>
                <span className="flex items-center gap-2"><HomeIcon className="w-4 h-4" aria-hidden="true" /> Home</span>
                <ChevronRight className="w-4 h-4 text-subtle" aria-hidden="true" />
              </button>
            </li>

            {([
              { key: 'services' as const, label: 'Enterprise Services', view: 'services', current: isCurrent.services },
              { key: 'stations' as const, label: 'Research Stations', view: 'stations', current: isCurrent.stations },
            ]).map((sec) => (
              <li key={sec.key}>
                <div className="flex items-center gap-1">
                  <button type="button" className="k-drawer__link flex-1" onClick={() => go(sec.view)} aria-current={sec.current ? 'page' : undefined}>
                    <span>{sec.label}</span>
                  </button>
                  <button
                    type="button"
                    className="k-icon-btn shrink-0"
                    aria-expanded={drawerSection === sec.key}
                    aria-controls={`drawer-${sec.key}`}
                    aria-label={`Show ${sec.label}`}
                    onClick={() => setDrawerSection(drawerSection === sec.key ? null : sec.key)}
                  >
                    <ChevronDown className={`transition-transform ${drawerSection === sec.key ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                </div>
                {drawerSection === sec.key && (
                  <ul id={`drawer-${sec.key}`} className="k-drawer__sub">
                    {sec.key === 'services'
                      ? services.map((s) => (
                          <li key={s.id}>
                            <button type="button" onClick={() => go('service_detail', s.slug)}>{s.title}</button>
                          </li>
                        ))
                      : stations.map((st) => (
                          <li key={st.id}>
                            <button type="button" onClick={() => go('stations', st.id)}>
                              {st.name} <span className="text-subtle text-xs">· {st.county}</span>
                            </button>
                          </li>
                        ))}
                  </ul>
                )}
              </li>
            ))}

            <li>
              <button type="button" className="k-drawer__link" onClick={() => go('charter')} aria-current={isCurrent.charter ? 'page' : undefined}>
                <span>Tariffs &amp; Charter</span>
                <ChevronRight className="w-4 h-4 text-subtle" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>

        <div className="border-t border-line p-4 space-y-3 bg-canvas">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              setDrawerOpen(false);
              onOpenInquiry();
            }}
          >
            <FileSignature aria-hidden="true" />
            Request Quotation
          </button>
          <a href="tel:+25441475151" className="flex items-center justify-center gap-2 text-sm font-semibold text-navy-800">
            <Phone className="w-4 h-4 text-teal-700" aria-hidden="true" />
            Client Inquiries: +254 (0) 41 475151
          </a>
          <ul className="flex justify-center gap-1" aria-label="KMFRI on social media">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`} className="k-icon-btn w-10! h-10! text-navy-800">
                  <Icon className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};
