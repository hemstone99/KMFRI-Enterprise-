import React, { useState } from 'react';
import { 
  FileCode, 
  Database, 
  Layers, 
  Palette, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Network, 
  FileText, 
  FolderTree, 
  Terminal,
  Shield,
  Server
} from 'lucide-react';
import { PHP_CODEBASE, CodeFile } from '../data/phpCodeTemplates';
import { PageBanner, CtaBand } from './ui';

export const ArchitectureHub: React.FC<{ onNavigate?: (view: string, slug?: string) => void }> = ({ onNavigate }) => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(PHP_CODEBASE[0]);
  const [copiedFile, setCopiedFile] = useState(false);
  const [activeSection, setActiveSection] = useState<'sitemap' | 'database' | 'php_files' | 'css_strategy' | 'hero_guide'>('sitemap');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate a downloadable text bundle
    let fullBundle = `====================================================================\n`;
    fullBundle += `KENYA MARINE AND FISHERIES RESEARCH INSTITUTE (KMFRI)\n`;
    fullBundle += `COMMERCIAL & ENTERPRISE SERVICES SUB-WEBSITE CODEBASE ARCHITECTURE\n`;
    fullBundle += `====================================================================\n\n`;

    PHP_CODEBASE.forEach(file => {
      fullBundle += `\n/* =================================================================\n`;
      fullBundle += `   FILE: ${file.path} (${file.language.toUpperCase()})\n`;
      fullBundle += `   DESCRIPTION: ${file.description}\n`;
      fullBundle += `   ================================================================= */\n\n`;
      fullBundle += file.content;
      fullBundle += `\n\n`;
    });

    const blob = new Blob([fullBundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kmfri-services-subsite-codebase.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const SECTIONS = [
    { id: 'sitemap' as const, label: '1. Site Map & Routing', Icon: Network },
    { id: 'database' as const, label: '2. MySQL Database Schema', Icon: Database },
    { id: 'php_files' as const, label: '3. Core PHP MVC Codebase', Icon: FileCode },
    { id: 'css_strategy' as const, label: '4. CSS & Design Parity', Icon: Palette },
    { id: 'hero_guide' as const, label: '5. Hero Tab Integration', Icon: Sparkles },
  ];

  return (
    <div>
      <PageBanner
        crumbs={[{ label: 'Home', onClick: () => onNavigate?.('home') }, { label: 'Architecture & PHP Codebase Hub' }]}
        title={<>KMFRI Enterprise Sub-Website <em>Technical Blueprint</em></>}
        subtitle="Complete production architectural deliverables: site map, relational database schema, clean MVC PHP code templates, visual CSS parity system, and hero tab integration guide."
        image="/images/ocean-surface.webp"
        imagePosition="center 40%"
        next="#F7F9FC"
      >
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <span className="k-badge bg-teal-400/15 border border-teal-400/40 text-teal-400">Full-Stack Architecture</span>
          <span className="text-sm text-white/80">PHP 8.2+ &bull; MySQL 8.0 &bull; Apache &bull; kmfri.go.ke Parity</span>
        </div>
        <div className="mt-6">
          <button type="button" onClick={handleDownloadAll} className="btn btn-teal">
            <Download aria-hidden="true" />
            Export Code Package (.txt)
          </button>
        </div>
      </PageBanner>

      <section className="band-mist k-section pt-6!">
      <div className="k-container">
      {/* Section Navigation Tabs */}
      <div className="k-tabs mb-8" role="tablist" aria-label="Blueprint sections">
        {SECTIONS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`arch-tab-${id}`}
            aria-selected={activeSection === id}
            aria-controls="arch-panel"
            onClick={() => setActiveSection(id)}
            className="k-tab"
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div id="arch-panel" role="tabpanel" aria-labelledby={`arch-tab-${activeSection}`}>
      {/* SECTION 1: SITE MAP & ROUTING */}
      {activeSection === 'sitemap' && (
        <div className="space-y-6">
          <div className="k-panel p-5 sm:p-7">
            <h2 className="text-xl font-semibold text-navy-800 mb-2 flex items-center gap-2">
              <Network className="w-5 h-5 text-teal-700" />
              <span>Multi-Page Site Map &amp; Hierarchical Navigation Structure</span>
            </h2>
            <p className="text-sm text-muted mb-6">
              The sub-site structure provides a shallow, intuitive taxonomy allowing visitors to transition from the main <code>kmfri.go.ke</code> hero tab directly into specific service specifications, tariffs, and booking workflows.
            </p>

            {/* ASCII / Visual Tree Representation */}
            <div className="k-code p-5">
              <pre className="text-emerald-400 font-bold mb-2">Main Site Hero Tab: https://www.kmfri.go.ke/#tab-enterprise-services</pre>
              <pre>
{`└── services.kmfri.go.ke/ (Sub-Website Root)
    │
    ├── / (Home Page)
    │   ├── Mandate & Enterprise Mission Statement
    │   ├── Quick Service Finder / Search Bar
    │   ├── Spotlight Flagships (Labs, RV Mtafiti, Fingerlings, Data)
    │   ├── Target Sectors Matrix (Government, Counties, Private, SMEs)
    │   └── Direct Link back to Main Institute Portal
    │
    ├── /services (Comprehensive Services Directory)
    │   ├── Category Filters (Analytical, Consultancy, Aquaculture, Data, Vessels, Tours)
    │   ├── Sector Filter (Government, Counties, Private, Researchers, SMEs)
    │   └── Real-time Keyword Search Bar
    │
    ├── /services/{slug} (Individual Service Detail Pages)
    │   ├── /services/laboratory-analytical-services
    │   ├── /services/technical-consultancy-services
    │   ├── /services/fish-and-aquaculture-services
    │   ├── /services/scientific-data-and-information-services
    │   ├── /services/research-vessel-hire-services
    │   ├── /services/fish-products-and-value-addition-services
    │   ├── /services/educational-visits
    │   ├── /services/training-and-capacity-building
    │   ├── /services/conference-and-meeting-facilities
    │   └── /services/student-attachment-and-internship-services
    │       │
    │       ├── Executive Overview & Capabilities
    │       ├── Approved Public Tariff Schedule (KES / USD)
    │       ├── Client Sample Protocols & Quality Requirements
    │       ├── Nationwide Accredited Stations Map
    │       └── Technical Officer In-Charge Direct Contacts
    │
    ├── /stations (Nationwide Research Stations Directory)
    │   ├── Mombasa HQ & Marine Centre (Kilindini Pier, KeNODC, Labs)
    │   ├── Kisumu Centre (Freshwater, Lake Victoria, Value Addition)
    │   ├── Naivasha Centre (Rift Valley Lakes, Limnology)
    │   ├── Shimoni Mariculture Centre (Marine Hatcheries, Seaweed)
    │   ├── Kegati & Sangoro (Aquaculture Seed Multiplication)
    │   └── Baringo & Turkana (Arid Lake Fisheries)
    │
    ├── /charter (Official Citizens' & Enterprise Service Charter)
    │   ├── Turnaround Time (TAT) Commitments
    │   ├── Quality Assurances (ISO/IEC 17025 & ISO 9001:2015)
    │   └── Standard Gazetted Tariffs Matrix
    │
    ├── /inquire (Quotation & Booking Request Portal)
    │   ├── Interactive Service & Pricing Tier Selector
    │   ├── Instant Fee Calculator (KES)
    │   ├── KRA PIN & Organization Profile Verification
    │   └── Reference Generator (e.g. KMFRI-SRV-2026-XXXX)
    │
    └── /api/ (RESTful JSON Endpoints for Integrations)
        ├── GET  /api/services          (Returns active services JSON)
        ├── GET  /api/services/{slug}   (Returns service details + tiers + stations)
        └── POST /api/inquire           (Registers customer quote request)`}
              </pre>
            </div>
          </div>

          {/* Routing Table */}
          <div className="k-panel p-5 sm:p-7">
            <h3 className="text-lg font-semibold text-navy-800 mb-3">Clean URL Routing &amp; Controller Dispatch Table</h3>
            <div className="k-table-wrap">
              <table className="k-table min-w-[720px]">
                <thead className="bg-navy-800 text-white">
                  <tr>
                    <th className="py-2.5 px-3">HTTP</th>
                    <th className="py-2.5 px-3">Public Clean URL</th>
                    <th className="py-2.5 px-3">Dispatched Controller Method</th>
                    <th className="py-2.5 px-3">View Template</th>
                    <th className="py-2.5 px-3">Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr className="hover:bg-navy-50">
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600">GET</td>
                    <td className="py-2 px-3 font-mono text-ink">/</td>
                    <td className="py-2 px-3 font-mono text-muted">ServiceController@home</td>
                    <td className="py-2 px-3 font-mono text-muted">views/home.php</td>
                    <td className="py-2 px-3">Sub-site portal homepage</td>
                  </tr>
                  <tr className="hover:bg-navy-50">
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600">GET</td>
                    <td className="py-2 px-3 font-mono text-ink">/services</td>
                    <td className="py-2 px-3 font-mono text-muted">ServiceController@index</td>
                    <td className="py-2 px-3 font-mono text-muted">views/services/index.php</td>
                    <td className="py-2 px-3">Filterable 10-services catalog</td>
                  </tr>
                  <tr className="hover:bg-navy-50">
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600">GET</td>
                    <td className="py-2 px-3 font-mono text-ink">/services/&#123;slug&#125;</td>
                    <td className="py-2 px-3 font-mono text-muted">ServiceController@show</td>
                    <td className="py-2 px-3 font-mono text-muted">views/services/detail.php</td>
                    <td className="py-2 px-3">Individual service detail &amp; tariffs</td>
                  </tr>
                  <tr className="hover:bg-navy-50">
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600">GET</td>
                    <td className="py-2 px-3 font-mono text-ink">/stations</td>
                    <td className="py-2 px-3 font-mono text-muted">StationController@index</td>
                    <td className="py-2 px-3 font-mono text-muted">views/stations.php</td>
                    <td className="py-2 px-3">Directory of 8 research centres</td>
                  </tr>
                  <tr className="hover:bg-navy-50">
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600">GET</td>
                    <td className="py-2 px-3 font-mono text-ink">/inquire</td>
                    <td className="py-2 px-3 font-mono text-muted">InquiryController@create</td>
                    <td className="py-2 px-3 font-mono text-muted">views/inquiry.php</td>
                    <td className="py-2 px-3">Service booking / quote form</td>
                  </tr>
                  <tr className="hover:bg-navy-50">
                    <td className="py-2 px-3 font-mono font-bold text-blue-600">POST</td>
                    <td className="py-2 px-3 font-mono text-ink">/inquire</td>
                    <td className="py-2 px-3 font-mono text-muted">InquiryController@store</td>
                    <td className="py-2 px-3 font-mono text-muted">redirect / confirmation</td>
                    <td className="py-2 px-3">Save inquiry &amp; email notifications</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MYSQL DATABASE SCHEMA */}
      {activeSection === 'database' && (
        <div className="space-y-6">
          <div className="k-panel p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-navy-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-teal-700" />
                  <span>Production MySQL Relational Schema (kmfri_services.sql)</span>
                </h2>
                <p className="text-sm text-muted mt-1">
                  Engine: InnoDB &bull; Charset: utf8mb4 &bull; Complete with FK constraints, Full-Text indexes, and seeds for all 10 services.
                </p>
              </div>
              <button
                onClick={() => {
                  const sqlFile = PHP_CODEBASE.find(f => f.filename === 'kmfri_services.sql');
                  if (sqlFile) navigator.clipboard.writeText(sqlFile.content);
                  setCopiedFile(true);
                  setTimeout(() => setCopiedFile(false), 2000);
                }}
                className="btn btn-outline btn-sm"
              >
                {copiedFile ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied SQL!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Schema</span>
                  </>
                )}
              </button>
            </div>

            {/* Schema Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 text-xs">
              <div className="p-4 bg-canvas rounded-xl border border-line">
                <span className="font-bold text-navy-800 block">1. services</span>
                <span className="text-muted">Stores code, title, slug, remarks, TAT, ISO standard, contact officer.</span>
              </div>
              <div className="p-4 bg-canvas rounded-xl border border-line">
                <span className="font-bold text-navy-800 block">2. pricing_tiers</span>
                <span className="text-muted">Stores multiple cost options (KES/USD), units, and delivery TAT.</span>
              </div>
              <div className="p-4 bg-canvas rounded-xl border border-line">
                <span className="font-bold text-navy-800 block">3. research_stations</span>
                <span className="text-muted">Locations, coordinates, heads of station, contact details.</span>
              </div>
              <div className="p-4 bg-canvas rounded-xl border border-line">
                <span className="font-bold text-navy-800 block">4. service_inquiries</span>
                <span className="text-muted">Tracks booking submissions, reference codes, KRA PIN, and status.</span>
              </div>
            </div>

            {/* Syntax-Highlighted SQL Code Block */}
            <div className="k-code p-4 max-h-[500px]">
              <pre>{PHP_CODEBASE.find(f => f.filename === 'kmfri_services.sql')?.content}</pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CORE PHP CODEBASE */}
      {activeSection === 'php_files' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Explorer Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="k-panel p-4 sm:p-5">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-navy-800" />
                <span>PHP Code Files</span>
              </h3>
              <div className="space-y-1">
                {PHP_CODEBASE.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center justify-between ${
                      selectedFile.path === file.path
                        ? 'bg-navy-800 text-white font-bold'
                        : 'hover:bg-navy-50 text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{file.path}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60 uppercase shrink-0">
                      {file.language}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="k-panel p-4 sm:p-5 text-xs space-y-2">
              <span className="font-bold text-ink block">PHP Architecture Pattern</span>
              <p className="text-muted leading-relaxed">
                Clean MVC with a Front Controller router (<code className="font-mono text-navy-800">index.php</code>), PDO singleton connection, repository models with prepared statements, and secure HTML output escaping with <code className="font-mono text-navy-800">htmlspecialchars()</code>.
              </p>
            </div>
          </div>

          {/* Code Viewer (8 cols) */}
          <div className="lg:col-span-8">
            <div className="k-code overflow-hidden shadow-card">
              {/* Header Bar */}
              <div className="bg-navy-950 px-4 py-3 border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Terminal className="w-4 h-4 text-teal-400" />
                  <span className="font-mono font-bold">{selectedFile.path}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-white/55 hidden sm:inline">{selectedFile.description}</span>
                  <button
                    onClick={handleCopy}
                    className="btn btn-sm btn-ghost-light min-h-8!"
                  >
                    {copiedFile ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Content */}
              <div className="p-4 overflow-auto max-h-[580px]">
                <pre>{selectedFile.content}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: CSS STRATEGY */}
      {activeSection === 'css_strategy' && (
        <div className="space-y-6">
          <div className="k-panel p-5 sm:p-7">
            <h2 className="text-xl font-semibold text-navy-800 mb-2 flex items-center gap-2">
              <Palette className="w-5 h-5 text-teal-700" />
              <span>CSS Strategy for 100% Visual Parity with kmfri.go.ke</span>
            </h2>
            <p className="text-sm text-muted mb-6">
              To ensure the sub-website looks and feels like an organic, native component of the main Institute website, we maintain strict parity across color tokens, typography scales, spacing units, and governmental brand motifs.
            </p>

            {/* Design Token Swatches (as implemented in src/index.css @theme) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-line bg-white">
                <div className="w-full h-12 rounded-lg mb-3 border border-line" style={{ background: '#003D7A' }}></div>
                <div className="font-semibold text-sm text-navy-800">KMFRI Primary Navy</div>
                <div className="font-mono text-xs text-muted">#003D7A / #002B57</div>
                <div className="text-xs text-subtle mt-1">Primary buttons, nav text, headings, header action</div>
              </div>

              <div className="p-4 rounded-xl border border-line bg-white">
                <div className="w-full h-12 rounded-lg mb-3 border border-line" style={{ background: '#001D3D' }}></div>
                <div className="font-semibold text-sm text-navy-800">Deep Ocean Navy</div>
                <div className="font-mono text-xs text-muted">#001D3D / #00132B</div>
                <div className="text-xs text-subtle mt-1">Footer, hero overlays, legal bar</div>
              </div>

              <div className="p-4 rounded-xl border border-line bg-white">
                <div className="w-full h-12 rounded-lg mb-3 border border-line" style={{ background: '#5BD1D7' }}></div>
                <div className="font-semibold text-sm text-navy-800">Aquatic Teal</div>
                <div className="font-mono text-xs text-muted">#5BD1D7 / #00B0BD</div>
                <div className="text-xs text-subtle mt-1">Active nav underline, eyebrows, hero accents</div>
              </div>

              <div className="p-4 rounded-xl border border-line bg-white">
                <div className="w-full h-12 rounded-lg mb-3 border border-line" style={{ background: '#E4F4F6' }}></div>
                <div className="font-semibold text-sm text-navy-800">Section Bands</div>
                <div className="font-mono text-xs text-muted">#E4F4F6 / #ECF1F7</div>
                <div className="text-xs text-subtle mt-1">Alternating pale teal & mist backgrounds</div>
              </div>
            </div>

            {/* Typography & Spacing Discipline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 sm:p-5 bg-canvas rounded-xl border border-line">
                <h3 className="font-semibold text-navy-800 mb-2">Typography Hierarchy</h3>
                <ul className="space-y-1.5 text-muted">
                  <li><strong>Headings:</strong> Geologica (SemiBold 600 / Bold 700), tight tracking</li>
                  <li><strong>Body Copy:</strong> Hind (Regular 400 / SemiBold 600), line-height 1.6</li>
                  <li><strong>Hero &amp; Accent Words:</strong> Source Serif 4 (italic accent in aquatic teal)</li>
                  <li><strong>Tariff Figures &amp; Code:</strong> tabular figures (<code className="font-mono text-navy-800">tabular-nums</code>) &amp; JetBrains Mono</li>
                  <li><strong>Government Top Banner:</strong> 13px on navy #002B57, teal icons</li>
                </ul>
              </div>

              <div className="p-4 sm:p-5 bg-canvas rounded-xl border border-line">
                <h3 className="font-semibold text-navy-800 mb-2">Component Specifications</h3>
                <ul className="space-y-1.5 text-muted">
                  <li><strong>Container:</strong> 1200px content width with fluid gutters (<code className="font-mono text-navy-800">.k-container</code>)</li>
                  <li><strong>Border Radii:</strong> 18px cards, 10px inputs &amp; header controls, pill buttons; square hero CTAs</li>
                  <li><strong>Depth &amp; Shadows:</strong> soft navy-tinted card elevation (<code className="font-mono text-navy-800">shadow-card</code>)</li>
                  <li><strong>Section Rhythm:</strong> alternating bands joined by wave separators</li>
                  <li><strong>Responsive Baseline:</strong> 1920px wide desktop down to 360px mobile</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: HERO TAB INTEGRATION GUIDANCE */}
      {activeSection === 'hero_guide' && (
        <div className="space-y-6">
          <div className="k-panel p-5 sm:p-7">
            <h2 className="text-xl font-semibold text-navy-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-700" />
              <span>Implementation Guidance: Linking Sub-Site from kmfri.go.ke Hero Section</span>
            </h2>
            <p className="text-sm text-muted mb-6">
              The sub-website is architected specifically to be accessed via a tab within the hero section of the main <code>kmfri.go.ke</code> website. Follow these 4 standard steps for complete deployment:
            </p>

            <div className="space-y-4 text-xs">
              <div className="p-4 sm:p-5 bg-canvas rounded-xl border border-line border-l-4 border-l-teal-500">
                <h3 className="font-bold text-navy-800 text-sm">Step 1: Domain &amp; Sub-Directory Configuration</h3>
                <p className="text-muted mt-1">
                  Deploy this PHP application either on a dedicated subdomain <code>services.kmfri.go.ke</code> or as a reverse-proxied subdirectory <code>kmfri.go.ke/services-hub/</code>. Both approaches share identical session and cookie domains for single-sign-on (SSO).
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-canvas rounded-xl border border-line border-l-4 border-l-navy-600">
                <h3 className="font-bold text-navy-800 text-sm">Step 2: Injecting the Hero Tab Trigger in kmfri.go.ke</h3>
                <p className="text-muted mt-1">
                  In the main site's hero carousel navigation list (e.g., <code>&lt;ul class="kmfri-hero-tabs"&gt;</code>), append the third tab item:
                </p>
                <div className="k-code p-3 mt-2 whitespace-pre">
{`<li class="kmfri-hero-tab-item">
    <a href="https://services.kmfri.go.ke" class="kmfri-hero-tab-link" id="tab-enterprise-services">
        <span class="kmfri-tab-title">Commercial &amp; Enterprise Services</span>
        <span class="kmfri-tab-badge">Central Hub</span>
    </a>
</li>`}
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-canvas rounded-xl border border-line border-l-4 border-l-navy-600">
                <h3 className="font-bold text-navy-800 text-sm">Step 3: Responsive Hero Panel with Instant Deep-Links</h3>
                <p className="text-muted mt-1">
                  When visitors activate the tab on kmfri.go.ke, the active hero panel renders the quick shortcuts directly to the 4 major enterprise flagships:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-ink">
                  <li><strong>Analytical Lab Tests:</strong> Deep-links to <code>/services/laboratory-analytical-services</code></li>
                  <li><strong>RV Mtafiti Vessel Charter:</strong> Deep-links to <code>/services/research-vessel-hire-services</code></li>
                  <li><strong>Aquaculture Fingerlings:</strong> Deep-links to <code>/services/fish-and-aquaculture-services</code></li>
                  <li><strong>KeNODC Oceanographic Data:</strong> Deep-links to <code>/services/scientific-data-and-information-services</code></li>
                </ul>
              </div>

              <div className="p-4 sm:p-5 bg-canvas rounded-xl border border-line border-l-4 border-l-teal-700">
                <h3 className="font-bold text-navy-800 text-sm">Step 4: Mutual Navigation Loop</h3>
                <p className="text-muted mt-1">
                  The sub-site's top utility bar features a permanent <code>&larr; Return to Main KMFRI Portal</code> link, maintaining a seamless, zero-friction loop between institutional research and commercial enterprise activities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
      </section>

      <CtaBand
        eyebrow="Deployment"
        title={<>Linking the hub from the <em>kmfri.go.ke</em> hero</>}
        text="Export the complete code package for the webmaster, or preview how the Enterprise Services tab sits inside the main website hero."
      >
        <button type="button" className="btn btn-teal" onClick={handleDownloadAll}>
          <Download aria-hidden="true" /> Export Code Package
        </button>
        <button type="button" className="btn btn-ghost-light" onClick={() => onNavigate?.('home')}>
          Return to Services Hub
        </button>
      </CtaBand>
    </div>
  );
};
