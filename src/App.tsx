/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { StationsView } from './components/StationsView';
import { StationDetailView } from './components/StationDetailView';
import { CharterView } from './components/CharterView';
import { LaboratoriesView } from './components/LaboratoriesView';
import { ServiceCatalogueView } from './components/ServiceCatalogueView';
import { HeroIntegrationDemo } from './components/HeroIntegrationDemo';
import { ArchitectureHub } from './components/ArchitectureHub';
import { InquiryModal } from './components/InquiryModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { findCataloguePath } from './data/serviceCatalogue';
import { useHubData } from './data/HubData';
import { findStation, stationSlug } from './data/stationServices';
import { hrefFor, resolveRoute, routeFromLocation, type Route, type View } from './router';

const VIEW_TITLES: Record<View, string> = {
  home: 'KMFRI Commercial & Enterprise Services Hub',
  catalogue: 'Service Catalogue',
  stations: 'Research Stations',
  station: 'Research Station',
  laboratories: 'Laboratory Services',
  charter: 'Tariffs & Service Charter',
};

export default function App() {
  const { stations } = useHubData();
  const [initial] = useState(routeFromLocation);
  const [activeMode, setActiveMode] = useState<'subsite' | 'hero_preview' | 'architecture'>('subsite');
  const [currentView, setCurrentView] = useState<View>(initial.view);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryPrefillSlug, setInquiryPrefillSlug] = useState<string | undefined>(undefined);
  const [inquiryStation, setInquiryStation] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Station page to show (id or web address slug)
  const [stationKey, setStationKey] = useState<string | undefined>(initial.view === 'station' ? initial.slug : undefined);
  // Catalogue division / group to open (undefined = catalogue overview)
  const [catalogueNode, setCatalogueNode] = useState<string | undefined>(initial.view === 'catalogue' ? initial.slug : undefined);

  // Station pages are addressed by slug (/stations/mombasa) whatever id the caller passed.
  const canonical = (route: Route): Route => {
    const station = route.view === 'station' ? findStation(stations, route.slug) : undefined;
    return station ? { view: 'station', slug: stationSlug(station) } : route;
  };

  const applyRoute = ({ view, slug }: Route) => {
    if (view === 'station') setStationKey(slug);
    if (view === 'catalogue') setCatalogueNode(slug);
    setCurrentView(view);
    setActiveMode('subsite');
  };

  // Every view has its own web address: normalise legacy addresses, follow Back/Forward.
  useEffect(() => {
    const canonical = hrefFor(initial);
    if (canonical !== window.location.pathname + window.location.hash) window.history.replaceState(null, '', canonical);
    const onPop = () => applyRoute(routeFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Station ids in old links resolve to the station slug once the stations are known.
  useEffect(() => {
    if (currentView !== 'station') return;
    const href = hrefFor(canonical({ view: 'station', slug: stationKey }));
    if (href !== window.location.pathname) window.history.replaceState(null, '', href);
  }, [stations, currentView, stationKey]);

  useEffect(() => {
    const node = currentView === 'catalogue' ? findCataloguePath(catalogueNode).at(-1) : undefined;
    const station = currentView === 'station' ? findStation(stations, stationKey) : undefined;
    document.title = node
      ? `${node.title} | KMFRI Service Catalogue`
      : station ? `${station.name} | KMFRI` : `${VIEW_TITLES[currentView]} | KMFRI`;
  }, [currentView, catalogueNode, stationKey, stations]);

  // Global Keyboard Shortcuts (⌘K / Ctrl+K for real-time search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to top on view changes
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [currentView, activeMode, stationKey]);

  // The catalogue is the single home of every service: the former directory
  // ('services') and portfolio pages ('service_detail') open its divisions.
  const handleNavigate = (view: string, slug?: string) => {
    const route = canonical(resolveRoute(view, slug));
    const href = hrefFor(route);
    if (href !== window.location.pathname + window.location.hash) window.history.pushState(null, '', href);
    applyRoute(route);
  };

  /** Opens the quotation form for a service portfolio, optionally at a given station. */
  const handleOpenInquiry = (slug?: string, station?: string) => {
    setInquiryPrefillSlug(slug);
    setInquiryStation(station);
    setIsInquiryOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[2000] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-navy-800 focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* 1. Official Header with Real-Time Search */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        onOpenInquiry={handleOpenInquiry}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 2. Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-1 w-full focus:outline-none">
        {activeMode === 'hero_preview' && (
          <HeroIntegrationDemo
            onLaunchSubsite={(view, slug) => {
              setActiveMode('subsite');
              if (view) handleNavigate(view, slug);
            }}
          />
        )}

        {activeMode === 'architecture' && (
          <ArchitectureHub onNavigate={handleNavigate} />
        )}

        {activeMode === 'subsite' && (
          <>
            {currentView === 'home' && (
              <HomeView
                onNavigate={handleNavigate}
                onOpenInquiry={handleOpenInquiry}
                onOpenSearch={() => setIsSearchOpen(true)}
                onSwitchToHeroPreview={() => setActiveMode('hero_preview')}
              />
            )}

            {currentView === 'stations' && (
              <StationsView
                onNavigate={handleNavigate}
                onOpenInquiry={handleOpenInquiry}
              />
            )}

            {currentView === 'station' && (
              <StationDetailView
                stationKey={stationKey}
                onNavigate={handleNavigate}
                onOpenInquiry={handleOpenInquiry}
              />
            )}

            {currentView === 'catalogue' && (
              <ServiceCatalogueView
                nodeId={catalogueNode}
                onNavigate={handleNavigate}
                onOpenInquiry={handleOpenInquiry}
              />
            )}

            {currentView === 'laboratories' && (
              <LaboratoriesView
                onNavigate={handleNavigate}
                onOpenInquiry={handleOpenInquiry}
              />
            )}

            {currentView === 'charter' && (
              <CharterView
                onNavigate={handleNavigate}
                onOpenInquiry={handleOpenInquiry}
              />
            )}
          </>
        )}
      </main>

      {/* 3. Restyled Official Institutional Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenInquiry={handleOpenInquiry}
      />

      {/* 4. Interactive Inquiry / Quote Request Modal */}
      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        preselectedSlug={inquiryPrefillSlug}
        preselectedStation={inquiryStation}
      />

      {/* 5. Real-Time Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
        onOpenInquiry={handleOpenInquiry}
      />
    </div>
  );
}
