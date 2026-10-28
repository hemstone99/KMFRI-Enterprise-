import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  FlaskConical,
  Ship,
  Home as HomeIcon,
  Search,
  CalendarDays,
} from 'lucide-react';
import { PHP_CODEBASE } from '../data/phpCodeTemplates';
import kmfriLogo from '../assets/images/kmfri_logo.png';
import { PageBanner, CtaBand } from './ui';

interface HeroIntegrationDemoProps {
  onLaunchSubsite: (view?: string, slug?: string) => void;
}

type HeroTab = 'research' | 'blue_economy' | 'services';

const TABS: { id: HeroTab; index: string; label: string }[] = [
  { id: 'research', index: '01. RESEARCH', label: 'Marine & Freshwater Science' },
  { id: 'blue_economy', index: '02. NATIONAL BLUE ECONOMY', label: 'Sustainable Maritime Wealth' },
  { id: 'services', index: '03. COMMERCIAL SERVICES', label: 'Enterprise Services Portal' },
];

export const HeroIntegrationDemo: React.FC<HeroIntegrationDemoProps> = ({ onLaunchSubsite }) => {
  const [activeHeroTab, setActiveHeroTab] = useState<HeroTab>('services');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const tabRefs = useRef<Record<HeroTab, HTMLButtonElement | null>>({ research: null, blue_economy: null, services: null });

  const heroSnippet = PHP_CODEBASE.find(f => f.filename === 'hero-embed-snippet.html')?.content || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(heroSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex(t => t.id === activeHeroTab);
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
    if (e.key === 'ArrowLeft') n = (i - 1 + TABS.length) % TABS.length;
    if (n < 0) return;
    e.preventDefault();
    setActiveHeroTab(TABS[n].id);
    tabRefs.current[TABS[n].id]?.focus();
  };

  return (
    <div>
      <PageBanner
        crumbs={[{ label: 'Home', onClick: () => onLaunchSubsite('home') }, { label: 'Main Website Hero Integration' }]}
        title={<>Main Website (kmfri.go.ke) Hero Section <em>Integration Preview</em></>}
        subtitle={<>This preview simulates the actual hero slider on the main <strong className="text-white">kmfri.go.ke</strong> website, demonstrating how visitors seamlessly discover and launch the Commercial &amp; Enterprise Services sub-site via a dedicated hero tab.</>}
        image="/images/vessel-aerial.webp"
        next="#F7F9FC"
      >
        <div className="mt-6">
          <button type="button" onClick={() => onLaunchSubsite('home')} className="btn btn-teal">
            Open Sub-Website Directly <ExternalLink aria-hidden="true" />
          </button>
        </div>
      </PageBanner>

      <section className="band-mist k-section pt-6!">
        <div className="k-container space-y-10">
          {/* 1. Interactive Simulation of kmfri.go.ke Homepage Hero */}
          <figure className="k-card overflow-hidden" aria-label="Simulated kmfri.go.ke homepage hero">
            {/* Simulated Browser Chrome / URL Bar */}
            <div className="bg-navy-950 px-4 py-2.5 flex items-center gap-3 text-xs text-white/60">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 max-w-md mx-auto rounded-md px-3 py-1 text-[11px] font-mono text-center text-white/75 bg-white/5 border border-white/10 truncate">
                https://www.kmfri.go.ke/ <span className="text-teal-400 font-semibold">#tab-enterprise-services</span>
              </div>
            </div>

            {/* Simulated kmfri.go.ke announcement strip + header */}
            <div className="bg-navy-800 h-7" aria-hidden="true" />
            <div className="bg-white px-4 sm:px-6 py-3 border-b border-line flex items-center justify-between gap-4" aria-hidden="true">
              <div className="flex items-center gap-2 shrink-0">
                <img src={kmfriLogo} alt="" className="h-10 sm:h-11 w-auto" />
              </div>
              <div className="hidden lg:flex items-center gap-4 text-[0.8125rem] font-semibold text-navy-800">
                <span className="inline-flex items-center gap-1"><HomeIcon className="w-3.5 h-3.5" /> Home</span>
                <span>About Us</span>
                <span>Research Dissemination</span>
                <span>Stations</span>
                <span>Knowledge Hub</span>
                <span className="text-navy-600 border-b-2 border-teal-500 pb-0.5">Enterprise Hub (Active)</span>
              </div>
              <div className="flex items-center gap-2 text-navy-600">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-navy-600 text-white text-xs font-semibold">
                  <CalendarDays className="w-3.5 h-3.5" /> Events
                </span>
              </div>
            </div>

            {/* Hero Section Container with Tabs */}
            <div className="relative min-h-[480px] flex flex-col justify-between text-white isolate">
              <div className="absolute inset-0 -z-10">
                <img src="/images/vessel-aerial.webp" alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(0,22,50,.9)_0%,rgba(0,22,50,.72)_40%,rgba(0,22,50,.3)_100%)]" />
              </div>

              {/* Hero Content Panel */}
              <div
                id="sim-hero-panel"
                role="tabpanel"
                aria-labelledby={`sim-tab-${activeHeroTab}`}
                className="p-6 sm:p-10 lg:p-12 max-w-2xl"
              >
                {activeHeroTab === 'services' && (
                  <div className="space-y-5 animate-[kRise_400ms_ease_both]">
                    <p className="k-hero__eyebrow text-xs! mb-0!">
                      <Sparkles className="w-3.5 h-3.5 text-teal-300 -ml-2" aria-hidden="true" />
                      Integrated Sub-Website Portal
                    </p>
                    <h2 className="font-serif text-white text-3xl sm:text-[2.6rem] font-semibold leading-[1.08]">
                      KMFRI Commercial &amp; <em className="text-teal-300 font-medium">Enterprise Services</em> Hub
                    </h2>
                    <p className="text-[1.0625rem] text-white/85 leading-relaxed">
                      Access accredited water and fish analytical testing, certified fingerling hatcheries, oceanographic datasets, technical marine consultancy, and the RV Mtafiti research vessel charter through our centralized services hub.
                    </p>

                    {/* Quick Shortcuts inside Hero Panel */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onLaunchSubsite('service_detail', 'laboratory-analytical-services')}
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left flex items-center gap-3 transition-colors"
                      >
                        <FlaskConical className="w-5 h-5 text-teal-300 shrink-0" aria-hidden="true" />
                        <span>
                          <span className="block font-semibold">Analytical Lab Tests</span>
                          <span className="block text-xs text-white/70">ISO 17025 Accredited</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onLaunchSubsite('service_detail', 'research-vessel-hire-services')}
                        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-left flex items-center gap-3 transition-colors"
                      >
                        <Ship className="w-5 h-5 text-teal-300 shrink-0" aria-hidden="true" />
                        <span>
                          <span className="block font-semibold">RV Mtafiti Charter</span>
                          <span className="block text-xs text-white/70">53m Oceanographic Ship</span>
                        </span>
                      </button>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => onLaunchSubsite('home')} className="btn btn-teal btn-square">
                        Launch Services Hub <ArrowRight aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => onLaunchSubsite('services')} className="btn btn-ghost-light btn-square">
                        View All External Services
                      </button>
                    </div>
                  </div>
                )}

                {activeHeroTab === 'research' && (
                  <div className="space-y-5 animate-[kRise_400ms_ease_both]">
                    <p className="k-hero__eyebrow text-xs! mb-0!">Statutory Mandate</p>
                    <h2 className="font-serif text-white text-3xl sm:text-[2.6rem] font-semibold leading-[1.08]">
                      Aquatic Research <em className="text-teal-300 font-medium">Excellence</em>
                    </h2>
                    <p className="text-[1.0625rem] text-white/85">
                      Leading Kenya’s scientific inquiry across the Western Indian Ocean and Great Lakes to preserve marine ecosystems and maximize sustainable yields.
                    </p>
                    <button type="button" onClick={() => setActiveHeroTab('services')} className="btn btn-ghost-light btn-sm">
                      Switch to Enterprise Services Tab <ArrowRight aria-hidden="true" />
                    </button>
                  </div>
                )}

                {activeHeroTab === 'blue_economy' && (
                  <div className="space-y-5 animate-[kRise_400ms_ease_both]">
                    <p className="k-hero__eyebrow text-xs! mb-0!">National Development</p>
                    <h2 className="font-serif text-white text-3xl sm:text-[2.6rem] font-semibold leading-[1.08]">
                      Unlocking the <em className="text-teal-300 font-medium">Blue Economy</em>
                    </h2>
                    <p className="text-[1.0625rem] text-white/85">
                      Supporting Kenya’s Vision 2030 and Bottom-up Economic Transformation Agenda (BETA) through evidence-based maritime policies.
                    </p>
                    <button type="button" onClick={() => setActiveHeroTab('services')} className="btn btn-ghost-light btn-sm">
                      Switch to Enterprise Services Tab <ArrowRight aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              {/* The Hero Navigation Tabs */}
              <div className="relative bg-navy-950/85 backdrop-blur-md border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-3" role="tablist" aria-label="Main site hero tabs" onKeyDown={onTabKey}>
                  {TABS.map((tab) => {
                    const selected = activeHeroTab === tab.id;
                    const isServices = tab.id === 'services';
                    return (
                      <button
                        key={tab.id}
                        ref={(el) => {
                          tabRefs.current[tab.id] = el;
                        }}
                        id={`sim-tab-${tab.id}`}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls="sim-hero-panel"
                        tabIndex={selected ? 0 : -1}
                        onClick={() => setActiveHeroTab(tab.id)}
                        className={`relative py-4 px-5 text-left transition-colors border-t-[3px] ${
                          selected ? 'border-teal-300 bg-navy-600/70' : 'border-transparent hover:bg-white/5'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className={`text-[0.68rem] font-semibold tracking-[0.14em] ${selected ? 'text-teal-300' : 'text-white/55'}`}>{tab.index}</span>
                          {isServices && (
                            <span className="text-[0.62rem] font-bold uppercase tracking-wide bg-teal-300 text-navy-900 px-1.5 py-0.5 rounded">
                              Central Hub
                            </span>
                          )}
                        </span>
                        <span className={`mt-1 flex items-center gap-1.5 font-semibold truncate ${selected ? 'text-white' : 'text-white/75'}`}>
                          {tab.label}
                          {isServices && <ExternalLink className="w-3.5 h-3.5 text-teal-300 shrink-0" aria-hidden="true" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </figure>

          {/* 2. Implementation Guidance & Embed Snippet for Webmaster */}
          <section className="k-panel" aria-labelledby="snippet-heading">
            <div className="k-panel__head flex-wrap justify-between">
              <div>
                <h2 id="snippet-heading">Hero Section Integration Code &amp; Guidance</h2>
                <p className="text-sm text-muted">
                  Drop-in snippet for the webmaster of <strong>kmfri.go.ke</strong> (supports WordPress, Joomla, Drupal, or custom PHP templates).
                </p>
              </div>
              <button type="button" onClick={handleCopy} className="btn btn-outline btn-sm" aria-live="polite">
                {copiedSnippet ? (
                  <>
                    <Check className="text-teal-700" aria-hidden="true" />
                    <span className="text-teal-800">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy aria-hidden="true" />
                    <span>Copy Hero Snippet</span>
                  </>
                )}
              </button>
            </div>

            <div className="k-panel__body space-y-5">
              {/* Integration Instructions */}
              <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <li className="p-4 bg-canvas rounded-xl border border-line">
                  <span className="k-tag block mb-1.5">Step 1: Subdomain Routing</span>
                  <p className="text-muted">
                    Configure DNS record <code className="bg-white border border-line px-1 py-0.5 rounded font-mono text-xs">services.kmfri.go.ke</code> pointing to the PHP virtual host directory containing this sub-site.
                  </p>
                </li>
                <li className="p-4 bg-canvas rounded-xl border border-line">
                  <span className="k-tag block mb-1.5">Step 2: Add Hero Tab Item</span>
                  <p className="text-muted">
                    Insert the HTML snippet into the main site's hero tab bar (<code className="bg-white border border-line px-1 py-0.5 rounded font-mono text-xs">&lt;ul class="kmfri-hero-tabs"&gt;</code>).
                  </p>
                </li>
                <li className="p-4 bg-canvas rounded-xl border border-line">
                  <span className="k-tag block mb-1.5">Step 3: Shared Authentication &amp; CSS</span>
                  <p className="text-muted">
                    Both portals share common CSS tokens (Navy <code className="font-mono text-navy-600">#003D7A</code> and Teal <code className="font-mono text-teal-800">#5BD1D7</code>) for 100% visual parity.
                  </p>
                </li>
              </ol>

              {/* Code Block */}
              <div className="k-code p-4">
                <pre>{heroSnippet}</pre>
              </div>
            </div>
          </section>
        </div>
      </section>

      <CtaBand
        eyebrow="Enterprise Services Hub"
        title={<>Explore the <em>Services Hub</em></>}
        text="Open the sub-website exactly as visitors arrive from the kmfri.go.ke hero tab."
      >
        <button type="button" className="btn btn-teal" onClick={() => onLaunchSubsite('home')}>
          Launch Services Hub <ArrowRight aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-ghost-light" onClick={() => onLaunchSubsite('services')}>
          View All External Services
        </button>
      </CtaBand>
    </div>
  );
};
