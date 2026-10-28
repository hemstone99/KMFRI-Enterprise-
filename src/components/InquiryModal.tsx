import React, { useState, useId, useEffect, useRef } from 'react';
import { X, ShieldCheck, CheckCircle2, Calculator, Printer, AlertTriangle, Loader2 } from 'lucide-react';
import { useHubData, submitInquiry, InquiryError, type InquiryReceipt } from '../data/HubData';
import { findStation } from '../data/stationServices';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSlug?: string;
  /** Station id or web address slug to preselect as the preferred centre */
  preselectedStation?: string;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({
  isOpen,
  onClose,
  preselectedSlug,
  preselectedStation
}) => {
  const { services, stations, live } = useHubData();
  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string>(
    preselectedSlug || services[0].slug
  );
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [clientType, setClientType] = useState<string>('private');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredStation, setPreferredStation] = useState(stations[0].id);
  const [notes, setNotes] = useState('');

  const [receipt, setReceipt] = useState<InquiryReceipt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Apply the service the modal was opened for (the modal stays mounted between openings)
  useEffect(() => {
    if (!isOpen) return;
    if (preselectedSlug && services.some(s => s.slug === preselectedSlug)) {
      setSelectedServiceSlug(preselectedSlug);
      setSelectedTierIndex(0);
    }
  }, [isOpen, preselectedSlug, services]);

  // Booking from a station page: that station is the preferred centre
  useEffect(() => {
    if (!isOpen) return;
    const station = findStation(stations, preselectedStation);
    if (station) setPreferredStation(station.id);
  }, [isOpen, preselectedStation, stations]);

  // Keep the station selection valid when the catalogue reloads from the database
  useEffect(() => {
    if (!stations.some(st => st.id === preferredStation)) setPreferredStation(stations[0].id);
  }, [stations, preferredStation]);

  // Dialog behaviour: scroll lock, initial focus, Escape to close, focus trap, restore focus
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => firstFieldRef.current?.focus() ?? dialogRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>('button, input, select, textarea, [href]');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentService = services.find(s => s.slug === selectedServiceSlug) || services[0];
  const currentTier = currentService.pricingTiers[selectedTierIndex] || currentService.pricingTiers[0];
  const currentStation = stations.find(st => st.id === preferredStation) || stations[0];

  const estimatedTotalKES = currentTier ? currentTier.costKES * (quantity || 1) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!live || currentService.dbId == null) {
      setFormError('Online requests are temporarily unavailable. Please call the Client Inquiries Desk on +254 (0) 41 475151 or email director@kmfri.go.ke.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const result = await submitInquiry({
        serviceId: currentService.dbId,
        pricingTierId: currentTier?.id ?? null,
        stationId: currentStation?.dbId ?? null,
        clientType,
        fullName,
        organization,
        kraPin,
        email,
        phone,
        quantity,
        notes,
      });
      setReceipt(result);
    } catch (err) {
      if (err instanceof InquiryError) {
        setFormError(err.message);
        setFieldErrors(err.fields);
      } else {
        setFormError('Your request could not be submitted. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Server validation messages, linked to their inputs
  const invalid = (key: string) =>
    fieldErrors[key] ? { 'aria-invalid': true, 'aria-describedby': fid(key + '-err') } : {};
  const FieldError = ({ k }: { k: string }) =>
    fieldErrors[k] ? <p id={fid(k + '-err')} className="mt-1.5 text-sm text-[#b91c1c]">{fieldErrors[k]}</p> : null;

  const handleReset = () => {
    setReceipt(null);
    setFormError(null);
    setFieldErrors({});
    setQuantity(1);
    setFullName('');
    setOrganization('');
    setKraPin('');
    setEmail('');
    setPhone('');
    setNotes('');
  };

  return (
    <div className="k-modal-backdrop">
      <div
        ref={dialogRef}
        className="k-modal max-w-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={fid('title')}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="k-modal__head">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-white/10 border border-white/20">
              <ShieldCheck className="w-5 h-5 text-teal-400" aria-hidden="true" />
            </span>
            <div>
              <h2 id={fid('title')} className="text-white font-heading text-lg font-semibold leading-tight">
                KMFRI Official Service &amp; Quotation Request
              </h2>
              <p className="text-[0.8125rem] text-white/70">Commercial &amp; Enterprise Services Portal</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="k-modal__close" aria-label="Close quotation request">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7">
          {receipt ? (
            /* Success / Confirmation State */
            <div className="space-y-6 text-center py-2" role="status" aria-live="polite">
              <span className="grid place-items-center w-16 h-16 mx-auto rounded-full bg-teal-50 text-teal-700 ring-8 ring-teal-50/60">
                <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
              </span>

              <div className="space-y-2">
                <h3 className="k-h3 text-xl!">Inquiry Successfully Registered</h3>
                <p className="text-[0.95rem] text-muted max-w-md mx-auto">
                  Your enterprise request has been logged into the KMFRI Service Delivery System. An official pro-forma invoice and technical instructions will be dispatched to your email.
                </p>
              </div>

              {/* Official Tracking Receipt */}
              <dl className="max-w-md mx-auto text-left text-sm rounded-xl border border-line bg-canvas overflow-hidden">
                <div className="flex justify-between gap-4 px-4 py-3 bg-navy-800 text-white">
                  <dt className="font-semibold tracking-wide">OFFICIAL REFERENCE</dt>
                  <dd className="font-mono font-semibold text-teal-400">{receipt.reference}</dd>
                </div>
                {[
                  ['Service:', currentService.title],
                  ['Pricing Tier:', currentTier?.name ?? 'To be quoted'],
                  ['Estimated Units:', currentTier ? `${quantity} (${currentTier.unit})` : String(quantity)],
                  ['Status:', receipt.status.replace('_', ' ')],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-2 border-b border-line">
                    <dt className="text-muted shrink-0">{k}</dt>
                    <dd className="font-medium text-ink text-right">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 px-4 py-2.5 border-b border-line bg-white">
                  <dt className="font-semibold text-navy-800">Indicative Fee:</dt>
                  <dd className="k-num">{receipt.estimatedCostKes > 0 ? `KES ${receipt.estimatedCostKes.toLocaleString()}` : 'Issued on quotation'}</dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-2 border-b border-line">
                  <dt className="text-muted">Station:</dt>
                  <dd className="text-right">{currentStation?.name}</dd>
                </div>
                <div className="flex justify-between gap-4 px-4 py-2">
                  <dt className="text-muted">Contact Email:</dt>
                  <dd className="text-right break-all">{email || 'Client email'}</dd>
                </div>
              </dl>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
                <button type="button" onClick={handleReset} className="btn btn-outline btn-sm">
                  New Request
                </button>
                <button type="button" onClick={() => window.print()} className="btn btn-outline btn-sm">
                  <Printer aria-hidden="true" />
                  Print Receipt
                </button>
                <button type="button" onClick={onClose} className="btn btn-primary btn-sm">
                  Close &amp; Return to Sub-Site
                </button>
              </div>
            </div>
          ) : (
            /* Inquiry Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {!live && (
                <div className="k-alert k-alert--info" role="status">
                  <AlertTriangle aria-hidden="true" />
                  <span>Online quotation requests are temporarily unavailable. Please call the Client Inquiries Desk on <a href="tel:+25441475151" className="font-semibold underline">+254 (0) 41 475151</a>.</span>
                </div>
              )}
              {formError && (
                <div className="k-alert bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]" role="alert">
                  <AlertTriangle aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}
              {/* Service Selection */}
              <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-xl bg-canvas border border-line">
                <legend className="sr-only">Service selection</legend>
                <div>
                  <label htmlFor={fid('service')} className="k-label">
                    Select Enterprise Service <span className="req" aria-hidden="true">*</span>
                  </label>
                  <select
                    id={fid('service')}
                    {...invalid('serviceId')}
                    ref={firstFieldRef}
                    value={selectedServiceSlug}
                    onChange={(e) => {
                      setSelectedServiceSlug(e.target.value);
                      setSelectedTierIndex(0);
                    }}
                    className="k-input"
                    required
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.slug}>
                        {s.code} - {s.title}
                      </option>
                    ))}
                  </select>
                  <FieldError k="serviceId" />
                </div>

                <div>
                  <label htmlFor={fid('tier')} className="k-label">
                    Select Test / Specimen Option <span className="req" aria-hidden="true">*</span>
                  </label>
                  {currentService.pricingTiers.length ? (
                    <select
                      id={fid('tier')}
                      {...invalid('pricingTierId')}
                      value={selectedTierIndex}
                      onChange={(e) => setSelectedTierIndex(Number(e.target.value))}
                      className="k-input"
                      required
                    >
                      {currentService.pricingTiers.map((tier, idx) => (
                        <option key={tier.id ?? idx} value={idx}>
                          {tier.name} (KES {tier.costKES.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select id={fid('tier')} className="k-input" disabled>
                      <option>Tariff issued on quotation</option>
                    </select>
                  )}
                  <FieldError k="pricingTierId" />
                </div>

                <div>
                  <label htmlFor={fid('qty')} className="k-label">
                    Estimated Quantity ({currentTier?.unit || 'units'})
                  </label>
                  <input
                    id={fid('qty')}
                    {...invalid('quantity')}
                    type="number"
                    min="1"
                    max="100000"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="k-input"
                    required
                  />
                  <FieldError k="quantity" />
                </div>

                <div>
                  <label htmlFor={fid('station')} className="k-label">Preferred Research Centre</label>
                  <select
                    id={fid('station')}
                    {...invalid('stationId')}
                    value={preferredStation}
                    onChange={(e) => setPreferredStation(e.target.value)}
                    className="k-input"
                  >
                    {stations.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.county})
                      </option>
                    ))}
                  </select>
                  <FieldError k="stationId" />
                </div>
              </fieldset>

              {/* Real-time Fee Estimation Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-navy-50 border border-[#cfdcef]" aria-live="polite">
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-5 h-5 text-navy-600" aria-hidden="true" />
                  <span className="font-semibold text-navy-800">Estimated Indicative Tariff:</span>
                </div>
                <div className="text-right">
                  <span className="k-num text-xl">{currentTier ? `KES ${estimatedTotalKES.toLocaleString()}` : 'On quotation'}</span>
                  <span className="block text-xs text-muted">Excluding VAT where applicable</span>
                </div>
              </div>

              {/* Client Profile Details */}
              <fieldset className="space-y-4">
                <legend className="k-tag pb-2 mb-1 w-full border-b border-line">Client &amp; Organization Particulars</legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={fid('ctype')} className="k-label">
                      Client Category <span className="req" aria-hidden="true">*</span>
                    </label>
                    <select
                      id={fid('ctype')}
                      {...invalid('clientType')}
                      value={clientType}
                      onChange={(e) => setClientType(e.target.value)}
                      className="k-input"
                    >
                      <option value="government">National Government Ministry / Parastatal</option>
                      <option value="county">County Government</option>
                      <option value="private">Private Sector / Commercial Enterprise</option>
                      <option value="researcher">Independent Researcher / Postgrad</option>
                      <option value="university">University / Academic Institution</option>
                      <option value="sme">SME / Fish Cooperative / BMU</option>
                      <option value="individual">Individual Farmer / Citizen</option>
                    </select>
                    <FieldError k="clientType" />
                  </div>

                  <div>
                    <label htmlFor={fid('name')} className="k-label">
                      Full Name of Contact Person <span className="req" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={fid('name')}
                      {...invalid('fullName')}
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Jane Mwangi"
                      className="k-input"
                      required
                    />
                    <FieldError k="fullName" />
                  </div>

                  <div>
                    <label htmlFor={fid('org')} className="k-label">
                      Organization / Company Name <span className="req" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={fid('org')}
                      {...invalid('organization')}
                      type="text"
                      autoComplete="organization"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Mombasa Aqua-Processors Ltd"
                      className="k-input"
                      required
                    />
                    <FieldError k="organization" />
                  </div>

                  <div>
                    <label htmlFor={fid('kra')} className="k-label">KRA PIN (Optional for Individuals)</label>
                    <input
                      id={fid('kra')}
                      {...invalid('kraPin')}
                      type="text"
                      value={kraPin}
                      onChange={(e) => setKraPin(e.target.value)}
                      placeholder="e.g. P051234567Z"
                      className="k-input uppercase"
                    />
                    <FieldError k="kraPin" />
                  </div>

                  <div>
                    <label htmlFor={fid('email')} className="k-label">
                      Email Address <span className="req" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={fid('email')}
                      {...invalid('email')}
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="official@company.or.ke"
                      className="k-input"
                      required
                    />
                    <FieldError k="email" />
                  </div>

                  <div>
                    <label htmlFor={fid('phone')} className="k-label">
                      Phone Number <span className="req" aria-hidden="true">*</span>
                    </label>
                    <input
                      id={fid('phone')}
                      {...invalid('phone')}
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 7XX XXXXXX"
                      className="k-input"
                      required
                    />
                    <FieldError k="phone" />
                  </div>
                </div>

                <div>
                  <label htmlFor={fid('notes')} className="k-label">
                    Scope Details / Specific Inquiries / Expedition Dates
                  </label>
                  <textarea
                    id={fid('notes')}
                    {...invalid('notes')}
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide details about sample types, expected test dates, target coordinates, or special requirements..."
                    className="k-input"
                  ></textarea>
                  <FieldError k="notes" />
                </div>
              </fieldset>

              <p className="text-xs text-muted"><span className="text-[#b91c1c]">*</span> Required field</p>

              {/* Submit Buttons */}
              <div className="pt-5 border-t border-line flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                <button type="button" onClick={onClose} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting || !live} aria-busy={submitting}>
                  {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ShieldCheck className="text-teal-400" aria-hidden="true" />}
                  {submitting ? 'Submitting…' : 'Submit Formal Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
