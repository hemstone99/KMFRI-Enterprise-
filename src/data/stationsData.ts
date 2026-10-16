import { ResearchStation } from '../types';

export const KMFRI_STATIONS: ResearchStation[] = [
  {
    id: 'station-mombasa',
    name: 'Mombasa Headquarters & Marine Centre',
    code: 'KMFRI-MBA',
    location: 'English Point, Mkomani, Mombasa',
    county: 'Mombasa County',
    description: 'The National Headquarters overseeing all marine science, oceanography, blue economy advisory, and flagship research vessels including RV Mtafiti.',
    primaryFocus: ['Oceanography & Hydrography', 'Marine Fisheries', 'Chemical & Environmental Laboratory', 'KeNODC Data Centre', 'Marine Museum & Public Aquarium'],
    servicesOffered: [
      'Laboratory Analytical Services',
      'Research Vessel Hire Services',
      'Technical Consultancy Services',
      'Scientific Data & Information Services',
      'Conference & Meeting Facilities',
      'Educational Visits'
    ],
    contactEmail: 'director@kmfri.go.ke',
    phone: '+254 (0) 41 475151/4',
    headOfStation: 'Prof. James Njiru, PhD (Director General)',
    coordinates: { lat: -4.0531, lng: 39.6806 }
  },
  {
    id: 'station-kisumu',
    name: 'Kisumu Centre (Freshwater Systems)',
    code: 'KMFRI-KSM',
    location: 'Off Airport Road, Kisumu City',
    county: 'Kisumu County',
    description: 'Premier scientific hub for Lake Victoria research, post-harvest fish processing, water quality monitoring, and freshwater fisheries management.',
    primaryFocus: ['Lake Victoria Limnology', 'Fish Biology & Stock Assessment', 'Post-Harvest Value Addition Lab', 'Freshwater Aquaculture'],
    servicesOffered: [
      'Laboratory Analytical Services',
      'Fish Products & Value-Addition Services',
      'Fish & Aquaculture Services',
      'Scientific Data & Information Services',
      'Conference & Meeting Facilities'
    ],
    contactEmail: 'kisumu@kmfri.go.ke',
    phone: '+254 57 2021461',
    headOfStation: 'Dr. Christopher Aura, PhD (Centre Director)',
    coordinates: { lat: -0.1022, lng: 34.7617 }
  },
  {
    id: 'station-naivasha',
    name: 'Naivasha Centre (Rift Valley Lakes)',
    code: 'KMFRI-NVS',
    location: 'South Lake Road, Naivasha',
    county: 'Nakuru County',
    description: 'Conducts research on Lake Naivasha, Lake Nakuru, and Rift Valley water bodies focusing on ecology, pesticide impacts, and warm water fish hatcheries.',
    primaryFocus: ['Rift Valley Ecology', 'Wetland Conservation', 'Pesticide & Effluent Analytics', 'Aquaculture Demonstrations'],
    servicesOffered: [
      'Laboratory Analytical Services',
      'Fish & Aquaculture Services',
      'Technical Consultancy Services',
      'Educational Visits'
    ],
    contactEmail: 'naivasha@kmfri.go.ke',
    phone: '+254 50 2020277',
    headOfStation: 'Dr. Edna Waithaka (Centre Director)',
    coordinates: { lat: -0.7172, lng: 36.4310 }
  },
  {
    id: 'station-shimoni',
    name: 'Shimoni Mariculture Centre',
    code: 'KMFRI-SHM',
    location: 'Shimoni Peninsula, Kwale',
    county: 'Kwale County',
    description: 'Kenya’s flagship marine aquaculture and mariculture facility dedicated to crab seed multiplication, milkfish farming, seaweed development, and sea cucumber culture.',
    primaryFocus: ['Mud Crab Hatchery', 'Milkfish Fingerlings', 'Commercial Seaweed Farming', 'Coral Reef Restoration'],
    servicesOffered: [
      'Fish & Aquaculture Services',
      'Technical Consultancy Services',
      'Educational Visits'
    ],
    contactEmail: 'shimoni@kmfri.go.ke',
    phone: '+254 722 123456',
    headOfStation: 'Dr. David Mirera, PhD (Mariculture Coordinator)',
    coordinates: { lat: -4.6478, lng: 39.3822 }
  },
  {
    id: 'station-kegati',
    name: 'Kegati Aquaculture Centre',
    code: 'KMFRI-KGT',
    location: 'Kegati, Kisii County',
    county: 'Kisii County',
    description: 'Specialized national broodstock multiplication and training station for high-growth Nile Tilapia and African Catfish fingerlings serving Western Kenya.',
    primaryFocus: ['Selective Broodstock Breeding', 'Fingerling Hatchery Distribution', 'Farmer Capacity Building'],
    servicesOffered: [
      'Fish & Aquaculture Services',
      'Technical Consultancy Services',
      'Student Attachment & Internship Services'
    ],
    contactEmail: 'kegati@kmfri.go.ke',
    phone: '+254 58 30123',
    headOfStation: 'Paul Orina, PhD (Senior Aquaculture Scientist)',
    coordinates: { lat: -0.6817, lng: 34.7891 }
  },
  {
    id: 'station-sangoro',
    name: 'Sangoro Aquaculture Research Station',
    code: 'KMFRI-SNG',
    location: 'Pap-Onditi, Nyakach',
    county: 'Kisumu County',
    description: 'Research facility focusing on indigenous riverine fish breeding (Labeo victorianus, Schilbe mystus) and river catchment water monitoring.',
    primaryFocus: ['Indigenous Riverine Species Conservation', 'Fish Genetics', 'Hatchery Technology'],
    servicesOffered: [
      'Fish & Aquaculture Services',
      'Student Attachment & Internship Services'
    ],
    contactEmail: 'sangoro@kmfri.go.ke',
    phone: '+254 57 2023900',
    headOfStation: 'Kevin Obiero, PhD (Station Head)',
    coordinates: { lat: -0.3475, lng: 34.9312 }
  },
  {
    id: 'station-baringo',
    name: 'Baringo Station (Arid & Semi-Arid Lakes)',
    code: 'KMFRI-BRG',
    location: 'Kampi ya Samaki, Lake Baringo',
    county: 'Baringo County',
    description: 'Monitors Lake Baringo and Lake Bogoria aquatic dynamics, siltation patterns, biodiversity, and post-harvest preservation in ASAL environments.',
    primaryFocus: ['Arid Lakes Limnology', 'Siltation & Water Balance', 'Fish Value Addition in ASALs'],
    servicesOffered: [
      'Laboratory Analytical Services',
      'Fish Products & Value-Addition Services',
      'Technical Consultancy Services'
    ],
    contactEmail: 'baringo@kmfri.go.ke',
    phone: '+254 53 2031122',
    headOfStation: 'Cyrus Kilonzi (Station Coordinator)',
    coordinates: { lat: 0.6225, lng: 36.0125 }
  },
  {
    id: 'station-turkana',
    name: 'Turkana Station (Desert Lake Fisheries)',
    code: 'KMFRI-TRK',
    location: 'Kalokol, Lake Turkana',
    county: 'Turkana County',
    description: 'Dedicated to studying the unique ecology and potential of the world’s largest permanent desert lake, supporting local indigenous fisherfolk.',
    primaryFocus: ['Lake Turkana Fisheries Dynamics', 'Acoustic Biomass Surveys', 'Solar Fish Drying Protocols'],
    servicesOffered: [
      'Scientific Data & Information Services',
      'Fish Products & Value-Addition Services',
      'Technical Consultancy Services'
    ],
    contactEmail: 'turkana@kmfri.go.ke',
    phone: '+254 54 21233',
    headOfStation: 'James Last Keyombe (Station Head)',
    coordinates: { lat: 3.5292, lng: 35.8450 }
  }
];
