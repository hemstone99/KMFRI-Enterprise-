import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CharterEntry, ResearchStation, ServiceItem } from '../types';
import { KMFRI_SERVICES } from './servicesData';
import { KMFRI_STATIONS } from './stationsData';

/**
 * Catalogue data for every view. Loaded from the API (kmfri_services_db);
 * the bundled catalogue is only shown if the API cannot be reached, and in
 * that state quotation requests are disabled (see `live`).
 */
interface HubData {
  services: ServiceItem[];
  stations: ResearchStation[];
  charter: CharterEntry[] | null;
  /** true once data has been loaded from the database */
  live: boolean;
  loading: boolean;
}

const HubDataContext = createContext<HubData>({
  services: KMFRI_SERVICES,
  stations: KMFRI_STATIONS,
  charter: null,
  live: false,
  loading: true,
});

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res.json() as Promise<T>;
}

export const HubDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<HubData>({
    services: KMFRI_SERVICES,
    stations: KMFRI_STATIONS,
    charter: null,
    live: false,
    loading: true,
  });

  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([
      getJson<ServiceItem[]>('/api/services', ctrl.signal),
      getJson<ResearchStation[]>('/api/stations', ctrl.signal),
      getJson<CharterEntry[]>('/api/charter', ctrl.signal),
    ])
      .then(([services, stations, charter]) => {
        if (!services.length || !stations.length) throw new Error('Empty catalogue returned');
        setData({ services, stations, charter, live: true, loading: false });
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        console.warn('[hub] Services API unavailable — showing bundled catalogue.', err);
        setData((d) => ({ ...d, loading: false }));
      });
    return () => ctrl.abort();
  }, []);

  return <HubDataContext.Provider value={data}>{children}</HubDataContext.Provider>;
};

export const useHubData = () => useContext(HubDataContext);

/* ------------------------------ Mutations ------------------------------ */
export interface InquiryPayload {
  serviceId: number;
  pricingTierId: number | null;
  stationId: number | null;
  clientType: string;
  fullName: string;
  organization: string;
  kraPin: string;
  email: string;
  phone: string;
  quantity: number;
  notes: string;
}

export interface InquiryReceipt {
  reference: string;
  estimatedCostKes: number;
  status: string;
  createdAt: string;
}

export class InquiryError extends Error {
  constructor(message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

export async function submitInquiry(payload: InquiryPayload): Promise<InquiryReceipt> {
  let res: Response;
  try {
    res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new InquiryError('We could not reach the KMFRI services server. Check your connection and try again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new InquiryError(body.error ?? 'Your request could not be submitted.', body.fields ?? {});
  return body as InquiryReceipt;
}
