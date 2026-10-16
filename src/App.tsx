/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { ServicesDirectory } from './components/ServicesDirectory';
import { ServiceDetailView } from './components/ServiceDetailView';
import { StationsView } from './components/StationsView';
import { CharterView } from './components/CharterView';
import { HeroIntegrationDemo } from './components/HeroIntegrationDemo';
import { ArchitectureHub } from './components/ArchitectureHub';
import { InquiryModal } from './components/InquiryModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { useHubData } from './data/HubData';

export default function App() {
  const { services } = useHubData();
  const [activeMode, setActiveMode] = useState<'subsite' | 'hero_preview' | 'architecture'>('subsite');
  const [currentView, setCurrentView] = useState<'home' | 'services' | 'service_detail' | 'stations' | 'charter'>('home');
  const [selectedSlug, setSelectedSlug] = useState<string>('laboratory-analytical-services');
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryPrefillSlug, setInquiryPrefillSlug] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Station anchor requested from the header dropdown / search (scrolled into view by StationsView)
  const [focusStationId, setFocusStationId] = useState<string | undefined>(undefined);

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
  }, [currentView, activeMode, selectedSlug]);

  const handleNavigate = (view: string, slug?: string) => {
    setFocusStationId(view === 'stations' ? slug : undefined);
    if (view === 'service_detail' && slug) {
      setSelectedSlug(slug);
      setCurrentView('service_detail');
    } else if (
      view === 'home' ||
      view === 'services' ||
      view === 'stations' ||
      view === 'charter'
    ) {
      setCurrentView(view as any);
    }
    setActiveMode('subsite');
  };

  const handleOpenInquiry = (slug?: string) => {
    setInquiryPrefillSlug(slug || selectedSlug);
    setIsInquiryOpen(true);
  };

  const currentServiceItem = services.find(s => s.slug === selectedSlug) || services[0];

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

            {currentView === 'services' && (
              <ServicesDirectory
                onNavigate={handleNavigate}
                onOpenInquiry={handleOpenInquiry}
              />
            )}

            {currentView === 'service_detail' && (
              <ServiceDetailView
                service={currentServiceItem}
                onNavigate={handleNavigate}
                onOpenInquiry={handleOpenInquiry}
              />
            )}

            {currentView === 'stations' && (
              <StationsView
                onNavigate={handleNavigate}
                onOpenInquiry={handleOpenInquiry}
                focusStationId={focusStationId}
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
      />

      {/* 5. Real-Time Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
