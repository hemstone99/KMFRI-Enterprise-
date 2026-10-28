/** Service portfolios explicitly represented in the citizen-facing section of the KMFRI services list. */
export const EXTERNAL_SERVICE_SLUGS = [
  'laboratory-analytical-services',
  'fish-and-aquaculture-services',
  'scientific-data-and-information-services',
  'research-vessel-hire-services',
  'educational-visits',
  'conference-and-meeting-facilities',
  'student-attachment-and-internship-services',
] as const;

export const isExternalService = (slug: string) =>
  (EXTERNAL_SERVICE_SLUGS as readonly string[]).includes(slug);