import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowRight, Clock, RotateCcw, ShieldCheck, Layers } from 'lucide-react';
import { useHubData } from '../data/HubData';
import { PageBanner, ServiceIcon, CtaBand, smallVariant } from './ui';

interface ServicesDirectoryProps {
  onNavigate: (view: string, slug?: string) => void;
  onOpenInquiry: (slug?: string) => void;
}

export const ServicesDirectory: React.FC<ServicesDirectoryProps> = ({
  onNavigate,
  onOpenInquiry
}) => {
  const { services } = useHubData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Services (10)' },
    { id: 'analytical', label: 'Laboratory Analytical' },
    { id: 'consultancy', label: 'Technical Consultancy' },
    { id: 'aquaculture', label: 'Fish & Aquaculture' },
    { id: 'data', label: 'Marine Data & Informatics' },
    { id: 'vessel', label: 'Research Vessels' },
    { id: 'value_addition', label: 'Post-Harvest & Value Addition' },
    { id: 'education', label: 'Educational Tours' },
    { id: 'training', label: 'Professional Training' },
    { id: 'facilities', label: 'Conference Facilities' },
    { id: 'internship', label: 'Internships & Attachments' }
  ];

  const sectors = [
    { id: 'all', label: 'All Sectors' },
    { id: 'government', label: 'Government & Parastatals' },
    { id: 'counties', label: 'County Governments' },
    { id: 'private', label: 'Private Sector' },
    { id: 'researchers', label: 'Researchers & Universities' },
    { id: 'farmers', label: 'Fish Farmers' },
    { id: 'smes', label: 'SMEs & Cooperatives' },
    { id: 'students', label: 'Students & Institutions' }
  ];

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Category match
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;

      // Sector match (matching against remarks and targetClients)
      let matchesSector = true;
      if (selectedSector !== 'all') {
        const textToCheck = (service.remarks + ' ' + service.targetClients.join(' ')).toLowerCase();
        if (selectedSector === 'government') matchesSector = textToCheck.includes('government');
        else if (selectedSector === 'counties') matchesSector = textToCheck.includes('counties') || textToCheck.includes('county');
        else if (selectedSector === 'private') matchesSector = textToCheck.includes('private');
        else if (selectedSector === 'researchers') matchesSector = textToCheck.includes('researcher') || textToCheck.includes('universities');
        else if (selectedSector === 'farmers') matchesSector = textToCheck.includes('farmer') || textToCheck.includes('aquaculture');
        else if (selectedSector === 'smes') matchesSector = textToCheck.includes('sme') || textToCheck.includes('cooperative') || textToCheck.includes('processor');
        else if (selectedSector === 'students') matchesSector = textToCheck.includes('student') || textToCheck.includes('institution') || textToCheck.includes('school');
      }

      // Query match
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = !query ||
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.code.toLowerCase().includes(query) ||
        service.keyCapabilities.some(cap => cap.toLowerCase().includes(query)) ||
        service.remarks.toLowerCase().includes(query);

      return matchesCategory && matchesSector && matchesQuery;
    });
  }, [services, selectedCategory, selectedSector, searchQuery]);

  const hasFilters = searchQuery || selectedCategory !== 'all' || selectedSector !== 'all';
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSector('all');
  };

  return (
    <div>
      <PageBanner
        crumbs={[{ label: 'Home', onClick: () => onNavigate('home') }, { label: 'Services Directory' }]}
        title={<>Comprehensive Services <em>Directory</em></>}
        subtitle="Browse and filter all 10 enterprise and commercial services provided across KMFRI’s national oceanographic and freshwater stations, featuring accredited testing, expert marine advisory, seed multiplication, and infrastructure hire."
        image="/images/analytical-lab.webp"
        imagePosition="center 40%"
        next="#F7F9FC"
      />

      <section className="band-mist k-section pt-8!" aria-label="KMFRI Commercial Portfolio">
        <div className="k-container">
          {/* Filter and Search Panel */}
          <div className="k-panel p-5 sm:p-6 mb-8" role="search" aria-label="Filter services">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
              <div>
                <label htmlFor="svc-search" className="k-label">Search the catalogue</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id="svc-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by service code, test name, capability, or target clientele..."
                    className="k-input pl-10!"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="sm:min-w-[240px]">
                  <label htmlFor="svc-sector" className="k-label">Target Sector</label>
                  <select
                    id="svc-sector"
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="k-input"
                  >
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                {hasFilters && (
                  <button type="button" onClick={resetFilters} className="btn btn-outline">
                    <RotateCcw aria-hidden="true" />
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="mt-5 pt-5 border-t border-line">
              <p className="k-label mb-3!" id="svc-cat-label">Service category</p>
              <div className="k-tabs" role="group" aria-labelledby="svc-cat-label">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="k-tab"
                    aria-pressed={selectedCategory === cat.id}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Count Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-3 border-b border-line-strong/60 text-sm text-muted">
            <p aria-live="polite">
              Showing <strong className="text-navy-800">{filteredServices.length}</strong> of {services.length} commercial services
            </p>
            <p className="inline-flex items-center gap-1.5 text-[0.8125rem]">
              <ShieldCheck className="w-4 h-4 text-teal-700" aria-hidden="true" />
              Official Government Tariffs &bull; ISO 9001:2015
            </p>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="k-panel p-12 text-center">
              <Filter className="w-10 h-10 text-line-strong mx-auto mb-3" aria-hidden="true" />
              <h2 className="k-h3">No Services Match Your Filter</h2>
              <p className="text-sm text-muted mt-2 max-w-md mx-auto">
                Try adjusting your search keywords or switching back to "All Services" or "All Sectors".
              </p>
              <button type="button" onClick={resetFilters} className="btn btn-primary mt-6">
                Show All 10 Services
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <li key={service.id}>
                  <article className="k-card k-card--hover h-full">
                    <div className="k-card__figure">
                      <div className="k-card__media">
                        <img src={smallVariant(service.featuredImage)} alt={service.title} loading="lazy" />
                        <span className="absolute top-3.5 left-3.5 k-badge k-badge--solid k-badge--mono">{service.code}</span>
                        {service.status === 'coming_soon' && (
                          <span className="absolute top-3.5 right-3.5 k-badge k-badge--gold">Coming Soon</span>
                        )}
                      </div>
                      <span className="k-card__icon" aria-hidden="true"><ServiceIcon category={service.category} /></span>
                    </div>

                    <div className="k-card__body">
                      <span className="k-tag">{service.categoryLabel}</span>
                      <h2 className="k-h3 mt-1.5">{service.title}</h2>
                      <p className="text-[0.95rem] text-muted mt-2.5 leading-relaxed line-clamp-3">{service.description}</p>

                      <div className="mt-4 p-3 rounded-xl bg-canvas border border-line text-sm">
                        <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-teal-800">Target Clientele</span>
                        <span className="line-clamp-2 text-ink">{service.remarks}</span>
                      </div>

                      <div className="mt-auto pt-5">
                        <div className="flex items-center justify-between gap-3 text-sm text-muted mb-4">
                          <span className="inline-flex items-center gap-1.5 min-w-0">
                            <Clock className="w-4 h-4 text-subtle shrink-0" aria-hidden="true" />
                            <span className="truncate">{service.turnaroundTime.split('(')[0]}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-semibold text-navy-600 shrink-0">
                            <Layers className="w-4 h-4" aria-hidden="true" />
                            {service.pricingTiers.length} Pricing Tiers
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onNavigate('service_detail', service.slug)}
                            className="btn btn-primary btn-sm flex-1"
                          >
                            View Scope &amp; Tariffs <ArrowRight aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenInquiry(service.slug)}
                            className="btn btn-outline btn-sm"
                            aria-label={`Request quotation for ${service.title}`}
                          >
                            Quote
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <CtaBand
        eyebrow="Quotations"
        title={<>Not sure which service <em>fits your project?</em></>}
        text="Submit your project scope, sample volume, or vessel charter schedule to receive an official KMFRI reference quote and terms of delivery."
      >
        <button type="button" className="btn btn-teal" onClick={() => onOpenInquiry()}>Submit Service Request</button>
        <button type="button" className="btn btn-ghost-light" onClick={() => onNavigate('charter')}>Tariffs &amp; Charter</button>
      </CtaBand>
    </div>
  );
};
