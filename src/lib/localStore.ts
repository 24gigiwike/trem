import type {
  AgencyTeamMember,
  EnquiryRecord,
  KycDocument,
  NotificationItem,
  PaymentOrder,
  PromotionRecord,
  PropertyCategory,
  PropertyListing,
  PropertyPurpose,
  PropertyStatus,
  SubscriptionRecord,
  UserAccount,
  VendorProfile,
} from '../shared/types';
import {
  calculatePromotionQuote,
  calculateSubscriptionQuote,
  PROMOTION_PACKAGES,
} from '../shared/commercial';

export type PublicAccountRole = 'seeker' | 'vendor' | 'agency';

const SESSION_KEY = 'trem_local_session_v1';
const PROFILES_KEY = 'trem_local_profiles_v1';
const WORKSPACE_KEY = 'trem_local_workspace_v1';

interface LocalWorkspaceState {
  vendors: VendorProfile[];
  teamMembers: AgencyTeamMember[];
  properties: PropertyListing[];
  savedByKey: Record<string, string[]>;
  enquiries: EnquiryRecord[];
  subscriptions: SubscriptionRecord[];
  promotions: PromotionRecord[];
  orders: PaymentOrder[];
  kycDocs: KycDocument[];
  notifications: NotificationItem[];
  newsletterEmails: string[];
}

export interface AgencySummary {
  id: string;
  entityType: string;
  businessName: string;
  slug: string;
  city: string;
  state: string;
  rcNumber: string;
  verificationStatus: string;
  logoUrl: string;
  rating: number;
  reviewCount: number;
  activeListings: number;
}

export interface AgencyDetail {
  id: string;
  entityType: string;
  businessName: string;
  slug: string;
  representativeName: string;
  representativeRole: string;
  rcNumber: string;
  scumlNumber: string;
  redanNumber: string;
  lasreraLicense: string;
  address: string;
  abujaAddress: string;
  city: string;
  state: string;
  bio: string;
  logoUrl: string;
  verificationStatus: string;
  avgResponseTime: string;
  memberSince: string;
  rating: number;
  reviewCount: number;
  phone: string;
  email: string;
}

const SEED_TIME = '2026-01-15T09:00:00.000Z';
const SEED_EXPIRY = '2027-01-15T09:00:00.000Z';

function createInitialWorkspace(): LocalWorkspaceState {
  const vendors: VendorProfile[] = [
    {
      id: 'vnd_apex',
      userId: 'usr_agency_1',
      entityType: 'agency',
      businessName: 'Apex Prime Properties Ltd',
      slug: 'apex-prime-properties',
      representativeName: 'Chief Emeka Okonye',
      representativeRole: 'Principal Broker / Managing Director',
      rcNumber: 'RC 1498203',
      tinNumber: 'TIN-2940294-0001',
      scumlNumber: 'SCUML/RN-0428',
      redanNumber: 'RED-2021-884',
      lasreraLicense: 'LAS-RE-4920',
      address: '14 Admiralty Way, Lekki Phase 1, Lagos State',
      abujaAddress: 'Plot 402 Constitution Avenue, CBD, Abuja FCT',
      city: 'Lekki Phase 1',
      state: 'Lagos',
      bio: 'Founded in 2018 and headquartered in Lekki Phase 1, Lagos, Apex Prime Properties Ltd is an institutional-grade property acquisition firm specializing in mitigating title risks and accelerating liquidity in Nigeria’s highest-performing corridors across Ikoyi, Lekki Phase 1, Victoria Island, and Maitama.',
      logoUrl: '/src/assets/images/avatar_chief_emeka_1795687719662.jpg',
      verificationStatus: 'verified',
      verificationNotes: 'CAC, SCUML, and LASRERA credentials cross-checked and active.',
      avgResponseTime: '< 1 hr',
      memberSince: '2021',
      rating: 4.9,
      reviewCount: 140,
      createdAt: SEED_TIME,
    },
    {
      id: 'vnd_solovendor',
      userId: 'usr_vendor_1',
      entityType: 'vendor',
      businessName: 'Adeleke Private Holdings',
      slug: 'adeleke-private-holdings',
      representativeName: 'Babatunde Adeleke',
      representativeRole: 'Sole Proprietor & Title Holder',
      rcNumber: 'BN 3019482',
      tinNumber: 'TIN-1088442-0002',
      scumlNumber: 'SCUML/IND-1190',
      redanNumber: '',
      lasreraLicense: 'LAS-IND-883',
      address: 'Suite 14, Plot 108 Wetheral Road, Commercial Axis',
      abujaAddress: '',
      city: 'New Owerri',
      state: 'Imo',
      bio: 'Independent private title holder and land consultant specializing in dry serviced residential plots and perimeter-fenced buy-and-build estates across Imo and Lagos corridors.',
      logoUrl: '/src/assets/images/avatar_barr_chidinma_1795687721136.jpg',
      verificationStatus: 'verified',
      verificationNotes: 'NIN and survey credentials verified.',
      avgResponseTime: '< 2 hrs',
      memberSince: '2023',
      rating: 4.8,
      reviewCount: 24,
      createdAt: SEED_TIME,
    },
  ];

  const teamMembers: AgencyTeamMember[] = [
    {
      id: 'tm_1',
      vendorId: 'vnd_apex',
      fullName: 'Chief Emeka Okonye',
      title: 'Managing Principal & Broker',
      credentials: '14+ Years Practice · ₦28B+ Closed',
      bio: 'Specializes in high-yield commercial hubs, Victoria Island development sites, and off-market institutional transactions.',
      avatarUrl: '/src/assets/images/avatar_chief_emeka_1795687719662.jpg',
      phone: '+2348030008736',
      email: 'e.okonye@apexprime.ng',
    },
    {
      id: 'tm_2',
      vendorId: 'vnd_apex',
      fullName: 'Barr. Chidinma Eze',
      title: 'Legal & Title Verification Officer',
      credentials: 'NBA Member · SCUML Lead',
      bio: 'Oversees Lagos & Abuja land searches, Governor’s Consent verifications, probate clearing, and gazette rectifications.',
      avatarUrl: '/src/assets/images/avatar_barr_chidinma_1795687721136.jpg',
      phone: '+2348030008737',
      email: 'c.eze@apexprime.ng',
    },
  ];

  const properties: PropertyListing[] = [
    {
      id: 'prop_1',
      refCode: 'TRM-LOS-7842',
      vendorId: 'vnd_apex',
      vendorName: 'Apex Prime Properties Ltd',
      vendorSlug: 'apex-prime-properties',
      vendorVerified: true,
      vendorRating: 4.9,
      vendorPhone: '+2348030008736',
      title: '5-Bedroom Contemporary Detached Smart Villa with Infinity Pool & BQ',
      slug: '5-bedroom-contemporary-detached-smart-villa-lekki',
      purpose: 'buy',
      category: 'residential',
      subcategory: 'Detached Smart Villa',
      description:
        'Strategically positioned on a tranquil residential cul-de-sac off the prestigious Admiralty Way corridor, this 2023-constructed contemporary masterpiece delivers uncompromising modern luxury, institutional construction integrity, and future-proofed autonomous infrastructure with a 15kVA Solar Hybrid array and LiFePO4 battery storage.',
      priceNgn: 380000000,
      priceUnit: 'Outright',
      address: 'Admiralty Way Axis, Lekki Phase 1, Lagos State',
      corridor: 'Lekki Phase 1',
      lga: 'Eti-Osa',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.4474,
      longitude: 3.4731,
      beaconRef: 'SC/LA/2024/LK-8891',
      bedrooms: 5,
      bathrooms: 6,
      areaSqm: 680,
      garageBays: 4,
      yearBuilt: 2023,
      smartIot: true,
      titleDocType: 'Certificate of Occupancy (C of O)',
      surveyPlanNo: 'OG/SURV/0912/2020',
      bureauFileNo: 'LND/2018/LK-40912',
      scumlCleared: true,
      walkScore: 88,
      amenities: [
        '15kVA Lithium Hybrid Solar System',
        'Private 8-Seat Acoustic Cinema Lounge',
        'Industrial Multi-Stage Water Filtration Plant',
        '24/7 Manned Estate Security & Smart Biometrics',
        '2-Room En-Suite Staff Quarters (BQ)',
        'Control4 Automated Lighting & Sound',
      ],
      images: [
        '/src/assets/images/prop_lekki_villa_1795687716839.jpg',
        '/src/assets/images/prop_interior_living_1795687721080.jpg',
        '/src/assets/images/prop_interior_kitchen_1795687720007.jpg',
        '/src/assets/images/prop_ikoyi_penthouse_1795687717853.jpg',
      ],
      videoUrl: 'https://vimeo.com/trem-pan-africa/lekki-contemporary-villa',
      healthScore: 96,
      status: 'published',
      moderationNote: '',
      isFeatured: true,
      isPromoted: true,
      promotionTier: 'promo_2w',
      viewsCount: 3420,
      inquiriesCount: 1,
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'prop_2',
      refCode: 'TRM-LOS-4011',
      vendorId: 'vnd_apex',
      vendorName: 'Apex Prime Properties Ltd',
      vendorSlug: 'apex-prime-properties',
      vendorVerified: true,
      vendorRating: 4.9,
      vendorPhone: '+2348030008736',
      title: 'Prime 12-Unit Commercial Plaza & Executive Suites',
      slug: 'prime-12-unit-commercial-plaza-victoria-island',
      purpose: 'buy',
      category: 'commercial',
      subcategory: 'Corporate Plaza',
      description:
        'Institutional-grade 6-storey Grade-A commercial complex situated along Ahmadu Bello Way, Victoria Island. 100% tenanted by blue-chip fintech and energy firms yielding 8.4% net annual return with dedicated underground and forecourt parking.',
      priceNgn: 1200000000,
      priceUnit: 'Outright (8.4% Cap Rate)',
      address: 'Ahmadu Bello Way, Victoria Island, Lagos',
      corridor: 'Victoria Island',
      lga: 'Eti-Osa',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.4281,
      longitude: 3.4219,
      beaconRef: 'SC/LA/2021/VI-1042',
      bedrooms: 12,
      bathrooms: 14,
      areaSqm: 2400,
      garageBays: 45,
      yearBuilt: 2022,
      smartIot: true,
      titleDocType: "Governor's Consent",
      surveyPlanNo: 'LA/SURV/0419/2019',
      bureauFileNo: 'LND/2019/VI-99301',
      scumlCleared: true,
      walkScore: 92,
      amenities: [
        '100% Tenanted Blue-Chip Leases',
        'Twin 250kVA Standby Generators',
        'Dual Schindler Elevators',
        '45 Dedicated Parking Bays',
      ],
      images: [
        '/src/assets/images/prop_vi_plaza_1795687717957.jpg',
        '/src/assets/images/prop_interior_living_1795687721080.jpg',
      ],
      videoUrl: '',
      healthScore: 94,
      status: 'published',
      moderationNote: '',
      isFeatured: true,
      isPromoted: true,
      promotionTier: 'promo_1m',
      viewsCount: 8910,
      inquiriesCount: 1,
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'prop_3',
      refCode: 'TRM-ABJ-8820',
      vendorId: 'vnd_apex',
      vendorName: 'Apex Prime Properties Ltd',
      vendorSlug: 'apex-prime-properties',
      vendorVerified: true,
      vendorRating: 4.9,
      vendorPhone: '+2348030008736',
      title: 'Maitama Diplomatic Residence & Private Oasis',
      slug: 'maitama-diplomatic-residence-abuja',
      purpose: 'buy',
      category: 'residential',
      subcategory: 'Ambassadorial Mansion',
      description:
        'Grand ambassadorial estate situated in the secure Maitama Diplomatic Zone, Abuja FCT. Built with imported travertine stone cladding, bullet-resistant glazing, formal reception portico, and landscaped oasis.',
      priceNgn: 480000000,
      priceUnit: 'Outright',
      address: 'Diplomatic Enclave, Maitama, Abuja FCT',
      corridor: 'Maitama',
      lga: 'AMAC',
      city: 'Abuja',
      state: 'FCT Abuja',
      latitude: 9.0882,
      longitude: 7.4934,
      beaconRef: 'FCDA/SURV/2020/MT-309',
      bedrooms: 6,
      bathrooms: 7,
      areaSqm: 850,
      garageBays: 6,
      yearBuilt: 2024,
      smartIot: true,
      titleDocType: 'FCDA Certificate of Occupancy',
      surveyPlanNo: 'FCDA/2020/882',
      bureauFileNo: 'AGIS/MT/2020/4412',
      scumlCleared: true,
      walkScore: 89,
      amenities: [
        'Diplomatic Zone Security',
        'Marble Portico & Water Feature',
        'Swimming Pool & Gazebo',
        '20kVA Solar Backup',
      ],
      images: [
        '/src/assets/images/prop_maitama_residence_1795687719224.jpg',
        '/src/assets/images/prop_interior_living_1795687721080.jpg',
      ],
      videoUrl: '',
      healthScore: 95,
      status: 'published',
      moderationNote: '',
      isFeatured: true,
      isPromoted: false,
      promotionTier: null,
      viewsCount: 2150,
      inquiriesCount: 0,
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'prop_4',
      refCode: 'TRM-LOS-6190',
      vendorId: 'vnd_apex',
      vendorName: 'Apex Prime Properties Ltd',
      vendorSlug: 'apex-prime-properties',
      vendorVerified: true,
      vendorRating: 4.9,
      vendorPhone: '+2348030008736',
      title: '4-Bed Waterfront Sky Penthouse with Private Helipad Access',
      slug: '4-bed-waterfront-sky-penthouse-ikoyi',
      purpose: 'buy',
      category: 'residential',
      subcategory: 'Waterfront Penthouse',
      description:
        'Panoramic Lagos Lagoon views from Bourdillon Road, Old Ikoyi. Full-floor residence featuring private elevator lobby, expansive sunset wrap-around timber deck, outdoor chef lounge, and marina jetty berth.',
      priceNgn: 320000000,
      priceUnit: 'Outright',
      address: 'Bourdillon Road, Old Ikoyi, Lagos',
      corridor: 'Old Ikoyi',
      lga: 'Eti-Osa',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.4549,
      longitude: 3.4346,
      beaconRef: 'SC/LA/2022/IK-5510',
      bedrooms: 4,
      bathrooms: 5,
      areaSqm: 420,
      garageBays: 3,
      yearBuilt: 2023,
      smartIot: true,
      titleDocType: 'Certificate of Occupancy (C of O)',
      surveyPlanNo: 'LA/SURV/0772/2021',
      bureauFileNo: 'LND/2021/IK-77412',
      scumlCleared: true,
      walkScore: 91,
      amenities: [
        'Private Lagoon Deck',
        'Marina Jetty Access',
        'Concierge & Helipad Privileges',
        'Floor-to-Ceiling Acoustic Glazing',
      ],
      images: [
        '/src/assets/images/prop_ikoyi_penthouse_1795687717853.jpg',
        '/src/assets/images/prop_interior_kitchen_1795687720007.jpg',
      ],
      videoUrl: '',
      healthScore: 92,
      status: 'published',
      moderationNote: '',
      isFeatured: false,
      isPromoted: false,
      promotionTier: null,
      viewsCount: 1940,
      inquiriesCount: 0,
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'prop_5',
      refCode: 'TRM-EPE-4910',
      vendorId: 'vnd_apex',
      vendorName: 'Apex Prime Properties Ltd',
      vendorSlug: 'apex-prime-properties',
      vendorVerified: true,
      vendorRating: 4.9,
      vendorPhone: '+2348030008736',
      title: 'Prime Agro-Commercial Logistics Acreage (50 Hectares)',
      slug: 'prime-agro-commercial-logistics-acreage-epe',
      purpose: 'land_banking',
      category: 'land_banking',
      subcategory: 'Strategic Land Parcel',
      description:
        'High-yield industrial and agro-commercial land banking corridor positioned along the Lekki-Epe Expressway expansion zone near the Deep Sea Port and International Airport site. 100% dry upland topography with registered survey.',
      priceNgn: 18000000,
      priceUnit: 'Per Acre (Min 5 Acres)',
      address: 'Alaro City / Epe Expressway Corridor, Lagos',
      corridor: 'Epe Corridor',
      lga: 'Epe',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.5841,
      longitude: 3.9834,
      beaconRef: 'SC/LA/2024/EP-1190',
      bedrooms: 0,
      bathrooms: 0,
      areaSqm: 4047,
      garageBays: 0,
      yearBuilt: 2024,
      smartIot: false,
      titleDocType: 'Government Gazette & Reg. Survey',
      surveyPlanNo: 'LA/EPE/2023/9901',
      bureauFileNo: 'LND/GAZ/EPE-491',
      scumlCleared: true,
      walkScore: 62,
      amenities: [
        '100% Dry Upland Topography',
        'Expressway Frontage',
        'Perimeter Beacons Installed',
        '35% Projected 3-Yr ROI',
      ],
      images: ['/src/assets/images/prop_epe_landbank_1795687718861.jpg'],
      videoUrl: '',
      healthScore: 88,
      status: 'published',
      moderationNote: '',
      isFeatured: true,
      isPromoted: false,
      promotionTier: null,
      viewsCount: 1840,
      inquiriesCount: 0,
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'prop_6',
      refCode: 'TRM-IMO-2090',
      vendorId: 'vnd_solovendor',
      vendorName: 'Adeleke Private Holdings',
      vendorSlug: 'adeleke-private-holdings',
      vendorVerified: true,
      vendorRating: 4.8,
      vendorPhone: '+2348149904421',
      title: '600 SQM Serviced Corner-Piece Residential Plot',
      slug: '600-sqm-serviced-corner-piece-plot-owerri',
      purpose: 'buy_build',
      category: 'buy_build',
      subcategory: 'Serviced Residential Plot',
      description:
        'Immediate-allocation dry residential corner-piece plot inside Centenary Heights Estate, New Owerri. Complete with interlocked paved roadways, concrete storm drainage, perimeter fencing, and solar street lighting.',
      priceNgn: 45000000,
      priceUnit: 'Outright',
      address: 'Centenary Heights, New Owerri, Imo State',
      corridor: 'New Owerri',
      lga: 'Owerri West',
      city: 'Owerri',
      state: 'Imo',
      latitude: 5.4891,
      longitude: 7.0176,
      beaconRef: 'IM/SURV/2024/NW-209',
      bedrooms: 0,
      bathrooms: 0,
      areaSqm: 600,
      garageBays: 0,
      yearBuilt: 2024,
      smartIot: false,
      titleDocType: 'Certificate of Occupancy (C of O)',
      surveyPlanNo: 'IM/SURV/2024/209',
      bureauFileNo: 'IMO/LND/2024/209',
      scumlCleared: true,
      walkScore: 78,
      amenities: [
        'Instant Physical Allocation',
        'Interlocked Paved Roads',
        'Solar Street Lighting',
        '24/7 Gatehouse Security',
      ],
      images: ['/src/assets/images/prop_owerri_buybuild_1795687718799.jpg'],
      videoUrl: '',
      healthScore: 86,
      status: 'published',
      moderationNote: '',
      isFeatured: false,
      isPromoted: false,
      promotionTier: null,
      viewsCount: 980,
      inquiriesCount: 0,
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'prop_7',
      refCode: 'TRM-PHC-0520',
      vendorId: 'vnd_apex',
      vendorName: 'Apex Prime Properties Ltd',
      vendorSlug: 'apex-prime-properties',
      vendorVerified: true,
      vendorRating: 4.9,
      vendorPhone: '+2348030008736',
      title: '3-Storey Corporate Industrial Hub (Pending Title Audit)',
      slug: '3-storey-corporate-industrial-hub-port-harcourt',
      purpose: 'buy',
      category: 'commercial',
      subcategory: 'Industrial & Office Hub',
      description:
        'Purpose-built corporate regional headquarters and logistics facility in Trans-Amadi Industrial Layout with 500kVA dedicated transformer and loading bays.',
      priceNgn: 650000000,
      priceUnit: 'Outright',
      address: 'Trans-Amadi Industrial Layout, Port Harcourt, Rivers',
      corridor: 'Trans-Amadi',
      lga: 'PHALGA',
      city: 'Port Harcourt',
      state: 'Rivers',
      latitude: 4.8156,
      longitude: 7.0498,
      beaconRef: 'RV/PH/2024/TA-052',
      bedrooms: 8,
      bathrooms: 10,
      areaSqm: 3400,
      garageBays: 18,
      yearBuilt: 2023,
      smartIot: true,
      titleDocType: 'Federal Gazette & Deed',
      surveyPlanNo: 'RV/SURV/2023/552',
      bureauFileNo: 'RIV/IND/2023/052',
      scumlCleared: true,
      walkScore: 80,
      amenities: ['500kVA Dedicated Substation', '12 Loading Bays', '24/7 Perimeter Security'],
      images: ['/src/assets/images/prop_vi_plaza_1795687717957.jpg'],
      videoUrl: '',
      healthScore: 79,
      status: 'pending_review',
      moderationNote: '',
      isFeatured: false,
      isPromoted: false,
      promotionTier: null,
      viewsCount: 0,
      inquiriesCount: 0,
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
    {
      id: 'prop_8',
      refCode: 'TRM-LOS-9014',
      vendorId: 'vnd_solovendor',
      vendorName: 'Adeleke Private Holdings',
      vendorSlug: 'adeleke-private-holdings',
      vendorVerified: true,
      vendorRating: 4.8,
      vendorPhone: '+2348149904421',
      title: '4-Bedroom Semi-Detached Smart Terrace (Draft)',
      slug: '4-bedroom-semi-detached-smart-terrace-lekki',
      purpose: 'buy',
      category: 'residential',
      subcategory: 'Smart Terrace',
      description:
        'Contemporary 4-bedroom semi-detached residence with fitted marble kitchen and solar hybrid inverter setup.',
      priceNgn: 210000000,
      priceUnit: 'Outright',
      address: 'Freedom Way Extension, Lekki Phase 1, Lagos',
      corridor: 'Lekki Phase 1',
      lga: 'Eti-Osa',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.4412,
      longitude: 3.4809,
      beaconRef: 'SC/LA/2024/FW-901',
      bedrooms: 4,
      bathrooms: 5,
      areaSqm: 450,
      garageBays: 2,
      yearBuilt: 2024,
      smartIot: true,
      titleDocType: "Governor's Consent",
      surveyPlanNo: 'LA/SURV/2024/901',
      bureauFileNo: 'LND/2024/FW-901',
      scumlCleared: true,
      walkScore: 84,
      amenities: ['Fitted Kitchen', 'Solar Inverter Ready', 'Gated Estate'],
      images: [
        '/src/assets/images/prop_interior_kitchen_1795687720007.jpg',
        '/src/assets/images/prop_interior_living_1795687721080.jpg',
      ],
      videoUrl: '',
      healthScore: 65,
      status: 'draft',
      moderationNote: '',
      isFeatured: false,
      isPromoted: false,
      promotionTier: null,
      viewsCount: 0,
      inquiriesCount: 0,
      createdAt: SEED_TIME,
      updatedAt: SEED_TIME,
    },
  ];

  const enquiries: EnquiryRecord[] = [
    {
      id: 'enq_1',
      propertyId: 'prop_1',
      propertyTitle: '5-Bedroom Contemporary Detached Smart Villa with Infinity Pool & BQ',
      propertyRef: 'TRM-LOS-7842',
      vendorId: 'vnd_apex',
      vendorName: 'Apex Prime Properties Ltd',
      seekerId: 'usr_seeker_1',
      fullName: 'Dr. Tunde Oladipo',
      email: 'seeker@trem.ng',
      phone: '+2348091234567',
      enquiryType: 'inspection',
      inspectionDate: '2026-12-03',
      inspectionSession: '10:00 AM (Morning)',
      tourPreference: 'Live Video Walkthrough',
      purpose: 'Purchase / Acquire',
      message:
        'Requesting live WhatsApp video walkthrough and verified C of O registry copy prior to on-site legal search in Lagos.',
      budgetNote: '₦380M - ₦420M NGN',
      status: 'new',
      createdAt: SEED_TIME,
    },
    {
      id: 'enq_2',
      propertyId: 'prop_2',
      propertyTitle: 'Prime 12-Unit Commercial Plaza & Executive Suites',
      propertyRef: 'TRM-LOS-4011',
      vendorId: 'vnd_apex',
      vendorName: 'Apex Prime Properties Ltd',
      seekerId: null,
      fullName: 'Chinedu Nwosu',
      email: 'c.nwosu@meridianholdings.ng',
      phone: '+2348034419200',
      enquiryType: 'formal',
      inspectionDate: '',
      inspectionSession: '',
      tourPreference: 'In-Person Walk',
      purpose: 'Commercial Acquisition',
      message:
        'Interested in reviewing tenancy schedule and cap rate audit for the 12-unit Victoria Island plaza.',
      budgetNote: '₦1.2B NGN',
      status: 'responded',
      createdAt: SEED_TIME,
    },
  ];

  const subscriptions: SubscriptionRecord[] = [
    {
      id: 'sub_apex_1',
      vendorId: 'vnd_apex',
      planCode: 'premium',
      billingMonths: 12,
      status: 'active',
      startsAt: SEED_TIME,
      expiresAt: SEED_EXPIRY,
      autoRenew: true,
      createdAt: SEED_TIME,
    },
    {
      id: 'sub_solo_1',
      vendorId: 'vnd_solovendor',
      planCode: 'standard',
      billingMonths: 3,
      status: 'active',
      startsAt: SEED_TIME,
      expiresAt: SEED_EXPIRY,
      autoRenew: true,
      createdAt: SEED_TIME,
    },
  ];

  const promotions: PromotionRecord[] = [
    {
      id: 'pmo_1',
      propertyId: 'prop_1',
      propertyTitle: '5-Bedroom Contemporary Detached Smart Villa with Infinity Pool & BQ',
      propertyRef: 'TRM-LOS-7842',
      vendorId: 'vnd_apex',
      packageCode: 'promo_2w',
      status: 'active',
      startsAt: SEED_TIME,
      expiresAt: SEED_EXPIRY,
      viewsGenerated: 8420,
      leadsGenerated: 48,
      createdAt: SEED_TIME,
    },
    {
      id: 'pmo_2',
      propertyId: 'prop_2',
      propertyTitle: 'Prime 12-Unit Commercial Plaza & Executive Suites',
      propertyRef: 'TRM-LOS-4011',
      vendorId: 'vnd_apex',
      packageCode: 'promo_1m',
      status: 'active',
      startsAt: SEED_TIME,
      expiresAt: SEED_EXPIRY,
      viewsGenerated: 5190,
      leadsGenerated: 31,
      createdAt: SEED_TIME,
    },
  ];

  const kycDocs: KycDocument[] = [
    {
      id: 'kyc_1',
      vendorId: 'vnd_apex',
      docType: 'cac_cert',
      docLabel: 'Certificate of Incorporation (CAC)',
      fileName: 'CAC_Cert_ApexPrime.pdf',
      fileUrl: '/uploads/sample_cac.pdf',
      status: 'approved',
      reviewerNote: 'Verified against CAC & SCUML registries',
      createdAt: SEED_TIME,
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif_1',
      userId: 'usr_agency_1',
      title: 'New Inspection Request · TRM-LOS-7842',
      body: 'Dr. Tunde Oladipo requested a Live Video Walkthrough for 5-Bedroom Contemporary Detached Smart Villa.',
      link: '/vendor/leads',
      isRead: false,
      createdAt: SEED_TIME,
    },
    {
      id: 'notif_2',
      userId: 'usr_vendor_1',
      title: 'Standard Workspace Active',
      body: 'Your Independent Vendor workspace is active for listings and direct buyer enquiries.',
      link: '/vendor/properties',
      isRead: false,
      createdAt: SEED_TIME,
    },
  ];

  return {
    vendors,
    teamMembers,
    properties,
    savedByKey: {
      guest: ['prop_1'],
      'seeker@trem.ng': ['prop_1', 'prop_4'],
    },
    enquiries,
    subscriptions,
    promotions,
    orders: [],
    kycDocs,
    notifications,
    newsletterEmails: [],
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues gracefully
  }
}

function getWorkspace(): LocalWorkspaceState {
  const existing = readJson<LocalWorkspaceState | null>(WORKSPACE_KEY, null);
  if (existing && Array.isArray(existing.properties) && Array.isArray(existing.vendors)) {
    return existing;
  }
  const initial = createInitialWorkspace();
  writeJson(WORKSPACE_KEY, initial);
  return initial;
}

function saveWorkspace(ws: LocalWorkspaceState): void {
  writeJson(WORKSPACE_KEY, ws);
}

function getProfilesMap(): Record<string, UserAccount> {
  return readJson<Record<string, UserAccount>>(PROFILES_KEY, {});
}

function saveProfileRecord(user: UserAccount): void {
  const map = getProfilesMap();
  map[user.email.toLowerCase()] = sanitizeUser(user);
  writeJson(PROFILES_KEY, map);
}

// Defensive strip so no password field can ever be persisted
function sanitizeUser(user: UserAccount): UserAccount {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    status: user.status || 'active',
    emailVerified: true,
    createdAt: user.createdAt || new Date().toISOString(),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleFromEmail(email: string): { firstName: string; lastName: string } {
  const localPart = email.split('@')[0] || 'Member';
  const pieces = localPart
    .split(/[._-]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (pieces.length >= 2) {
    return { firstName: cap(pieces[0]), lastName: cap(pieces[1]) };
  }
  return { firstName: cap(pieces[0] || 'TREM'), lastName: 'User' };
}

function ensureVendorForUser(
  ws: LocalWorkspaceState,
  user: UserAccount,
  options?: { businessName?: string; representativeRole?: string }
): VendorProfile {
  const targetEntityType: 'vendor' | 'agency' = user.role === 'agency' ? 'agency' : 'vendor';
  let vendor = ws.vendors.find((v) => v.userId === user.id);

  if (!vendor) {
    // Attach well-known seeded profiles if matching email
    const lowerEmail = user.email.toLowerCase();
    if (lowerEmail === 'apex@trem.ng') {
      const apex = ws.vendors.find((v) => v.id === 'vnd_apex');
      if (apex) return apex;
    }
    if (lowerEmail === 'vendor@trem.ng') {
      const solo = ws.vendors.find((v) => v.id === 'vnd_solovendor');
      if (solo) return solo;
    }

    const baseName =
      options?.businessName?.trim() ||
      (targetEntityType === 'agency'
        ? `${user.firstName} ${user.lastName} Realty Ltd`
        : `${user.firstName} ${user.lastName} Holdings`);
    const id = `vnd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const baseSlug = slugify(baseName) || `partner-${Date.now().toString(36)}`;
    const slug = ws.vendors.some((v) => v.slug === baseSlug) ? `${baseSlug}-${id.slice(-4)}` : baseSlug;
    const now = new Date().toISOString();

    vendor = {
      id,
      userId: user.id,
      entityType: targetEntityType,
      businessName: baseName,
      slug,
      representativeName: `${user.firstName} ${user.lastName}`.trim(),
      representativeRole:
        options?.representativeRole ||
        (targetEntityType === 'agency' ? 'Principal Broker / Managing Director' : 'Independent Property Owner'),
      rcNumber: targetEntityType === 'agency' ? 'RC Pending' : '',
      tinNumber: '',
      scumlNumber: '',
      redanNumber: '',
      lasreraLicense: '',
      address: 'Lekki Phase 1, Lagos',
      abujaAddress: '',
      city: 'Lagos',
      state: 'Lagos',
      bio:
        targetEntityType === 'agency'
          ? `${baseName} is a real estate brokerage workspace registered on TREM for multi-property portfolio management and verified buyer enquiries.`
          : `${baseName} is an independent property owner & vendor workspace on TREM.`,
      logoUrl: '/src/assets/images/avatar_chief_emeka_1795687719662.jpg',
      verificationStatus: 'verified',
      verificationNotes: 'Local workspace profile active.',
      avgResponseTime: '< 1 hr',
      memberSince: String(new Date().getFullYear()),
      rating: 4.9,
      reviewCount: 0,
      createdAt: now,
    };
    ws.vendors.push(vendor);

    // Initialize local subscription matching account category
    const subId = `sub_${Date.now().toString(36)}`;
    ws.subscriptions.push({
      id: subId,
      vendorId: vendor.id,
      planCode: targetEntityType === 'agency' ? 'premium' : 'standard',
      billingMonths: 12,
      status: 'active',
      startsAt: now,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      createdAt: now,
    });

    ws.notifications.unshift({
      id: `notif_${Date.now().toString(36)}`,
      userId: user.id,
      title: `${targetEntityType === 'agency' ? 'Agency' : 'Vendor'} Workspace Ready`,
      body: `Welcome ${user.firstName}. Your local ${targetEntityType} workspace is active for listings and leads.`,
      link: '/vendor/add',
      isRead: false,
      createdAt: now,
    });
  } else if (vendor.entityType !== targetEntityType) {
    vendor.entityType = targetEntityType;
    if (options?.businessName?.trim()) {
      vendor.businessName = options.businessName.trim();
    }
  }

  return vendor;
}

export function getActiveSessionUser(): UserAccount | null {
  const user = readJson<UserAccount | null>(SESSION_KEY, null);
  if (!user || !user.email || !user.role) return null;
  return sanitizeUser(user);
}

export function getContextForUser(user: UserAccount | null): {
  user: UserAccount | null;
  vendorProfile: VendorProfile | null;
  subscription: SubscriptionRecord | null;
  unreadNotifications: number;
  savedIds: string[];
} {
  const ws = getWorkspace();
  if (!user) {
    return {
      user: null,
      vendorProfile: null,
      subscription: null,
      unreadNotifications: 0,
      savedIds: ws.savedByKey.guest || [],
    };
  }

  let vendorProfile: VendorProfile | null = null;
  let subscription: SubscriptionRecord | null = null;

  if (user.role === 'vendor' || user.role === 'agency') {
    vendorProfile = ensureVendorForUser(ws, user);
    saveWorkspace(ws);
    subscription =
      ws.subscriptions
        .filter((s) => s.vendorId === vendorProfile!.id && s.status === 'active')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
  }

  const unreadNotifications = ws.notifications.filter(
    (n) => (n.userId === user.id || n.userId === 'usr_agency_1') && !n.isRead
  ).length;

  const savedKey = user.email.toLowerCase();
  const savedIds = ws.savedByKey[savedKey] || ws.savedByKey.guest || [];

  return {
    user,
    vendorProfile,
    subscription,
    unreadNotifications,
    savedIds,
  };
}

export function signInLocal(input: {
  email: string;
  role: PublicAccountRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  businessName?: string;
}): UserAccount {
  const cleanEmail = input.email.trim().toLowerCase();
  const profiles = getProfilesMap();
  const existing = profiles[cleanEmail];
  const derived = titleFromEmail(cleanEmail);
  const now = new Date().toISOString();

  // Reuse seeded IDs when matching known seeded emails
  let presetId = existing?.id;
  let presetFirst = existing?.firstName;
  let presetLast = existing?.lastName;
  let presetPhone = existing?.phone;

  if (!existing) {
    if (cleanEmail === 'apex@trem.ng') {
      presetId = 'usr_agency_1';
      presetFirst = 'Emeka';
      presetLast = 'Okonye';
      presetPhone = '+2348030008736';
    } else if (cleanEmail === 'vendor@trem.ng') {
      presetId = 'usr_vendor_1';
      presetFirst = 'Babatunde';
      presetLast = 'Adeleke';
      presetPhone = '+2348149904421';
    } else if (cleanEmail === 'seeker@trem.ng') {
      presetId = 'usr_seeker_1';
      presetFirst = 'Tunde';
      presetLast = 'Oladipo';
      presetPhone = '+2348091234567';
    }
  }

  const nextUser: UserAccount = sanitizeUser({
    id: presetId || `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    email: cleanEmail,
    firstName: input.firstName?.trim() || presetFirst || derived.firstName,
    lastName: input.lastName?.trim() || presetLast || derived.lastName,
    phone: input.phone?.trim() || presetPhone || '+234 800 000 0000',
    role: input.role,
    status: 'active',
    emailVerified: true,
    createdAt: existing?.createdAt || now,
  });

  saveProfileRecord(nextUser);
  writeJson(SESSION_KEY, nextUser);

  if (nextUser.role === 'vendor' || nextUser.role === 'agency') {
    const ws = getWorkspace();
    ensureVendorForUser(ws, nextUser, { businessName: input.businessName });
    saveWorkspace(ws);
  }

  return nextUser;
}

export function registerLocal(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: PublicAccountRole;
  businessName?: string;
  representativeRole?: string;
}): UserAccount {
  const cleanEmail = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const existing = getProfilesMap()[cleanEmail];

  const user: UserAccount = sanitizeUser({
    id: existing?.id || `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    email: cleanEmail,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone.trim(),
    role: input.role,
    status: 'active',
    emailVerified: true,
    createdAt: existing?.createdAt || now,
  });

  saveProfileRecord(user);
  writeJson(SESSION_KEY, user);

  if (user.role === 'vendor' || user.role === 'agency') {
    const ws = getWorkspace();
    ensureVendorForUser(ws, user, {
      businessName: input.businessName,
      representativeRole: input.representativeRole,
    });
    saveWorkspace(ws);
  }

  return user;
}

export function ensureOpenWorkspaceUser(targetRole: PublicAccountRole): UserAccount {
  const current = getActiveSessionUser();
  if (targetRole === 'seeker') {
    if (current) return current;
    return signInLocal({
      email: 'seeker@trem.ng',
      role: 'seeker',
      firstName: 'Tunde',
      lastName: 'Oladipo',
      phone: '+2348091234567',
    });
  }

  if (current && (current.role === 'vendor' || current.role === 'agency')) {
    return current;
  }

  return signInLocal({
    email: targetRole === 'agency' ? 'apex@trem.ng' : 'vendor@trem.ng',
    role: targetRole,
  });
}

export function logoutLocal(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage removal errors
  }
}

export function updateProfileLocal(patch: {
  firstName: string;
  lastName: string;
  phone: string;
}): UserAccount | null {
  const current = getActiveSessionUser();
  if (!current) return null;
  const updated = sanitizeUser({
    ...current,
    firstName: patch.firstName.trim() || current.firstName,
    lastName: patch.lastName.trim() || current.lastName,
    phone: patch.phone.trim() || current.phone,
  });
  saveProfileRecord(updated);
  writeJson(SESSION_KEY, updated);
  return updated;
}

export function toggleSavedLocal(propertyId: string, user: UserAccount | null): string[] {
  const ws = getWorkspace();
  const key = user?.email ? user.email.toLowerCase() : 'guest';
  const current = ws.savedByKey[key] || ws.savedByKey.guest || [];
  const exists = current.includes(propertyId);
  const next = exists ? current.filter((id) => id !== propertyId) : Array.from(new Set([...current, propertyId]));
  ws.savedByKey[key] = next;
  if (!user) ws.savedByKey.guest = next;
  saveWorkspace(ws);
  return next;
}

export function getSavedPropertiesLocal(user: UserAccount | null): PropertyListing[] {
  const ws = getWorkspace();
  const key = user?.email ? user.email.toLowerCase() : 'guest';
  const ids = ws.savedByKey[key] || ws.savedByKey.guest || [];
  return ws.properties.filter((p) => ids.includes(p.id));
}

export function getSeekerEnquiriesLocal(user: UserAccount | null): EnquiryRecord[] {
  const ws = getWorkspace();
  if (!user) return ws.enquiries;
  const lowerEmail = user.email.toLowerCase();
  return ws.enquiries.filter(
    (e) => e.seekerId === user.id || e.email.toLowerCase() === lowerEmail
  );
}

// Public catalogue query + offline/404 fallback
export function queryLocalProperties(params: {
  q?: string;
  category?: string;
  purpose?: string;
  titleDoc?: string;
  beds?: number;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const ws = getWorkspace();
  const published = ws.properties
    .filter((p) => p.status === 'published')
    .map((p) => {
      const v = ws.vendors.find((vnd) => vnd.id === p.vendorId);
      return {
        ...p,
        vendorName: v?.businessName || p.vendorName || 'Verified Partner',
        vendorSlug: v?.slug || p.vendorSlug || '',
        vendorVerified: v ? v.verificationStatus === 'verified' : Boolean(p.vendorVerified),
        vendorRating: v?.rating ?? p.vendorRating ?? 4.8,
        vendorPhone: p.vendorPhone || '+2348030008736',
      };
    });

  const categoryCounts: Record<string, number> = {
    residential: 0,
    commercial: 0,
    land_banking: 0,
    buy_build: 0,
  };
  for (const p of published) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  let filtered = published.filter((p) => {
    if (params.q) {
      const q = params.q.toLowerCase();
      const hay = `${p.title} ${p.address} ${p.corridor} ${p.city} ${p.state} ${p.refCode} ${p.titleDocType}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (params.category && params.category !== 'all' && p.category !== params.category) return false;
    if (params.purpose && params.purpose !== 'all' && p.purpose !== params.purpose) return false;
    if (params.titleDoc && params.titleDoc !== 'all') {
      if (!p.titleDocType.toLowerCase().includes(params.titleDoc.toLowerCase())) return false;
    }
    if (params.beds && params.beds > 0 && p.bedrooms < params.beds) return false;
    if (params.minPrice && p.priceNgn < params.minPrice) return false;
    if (params.maxPrice && p.priceNgn > params.maxPrice) return false;
    if (params.verifiedOnly && !p.vendorVerified) return false;
    return true;
  });

  if (params.sort === 'price_asc') {
    filtered = [...filtered].sort((a, b) => a.priceNgn - b.priceNgn);
  } else if (params.sort === 'price_desc') {
    filtered = [...filtered].sort((a, b) => b.priceNgn - a.priceNgn);
  } else if (params.sort === 'newest') {
    filtered = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    filtered = [...filtered].sort(
      (a, b) =>
        Number(b.isPromoted) - Number(a.isPromoted) ||
        Number(b.isFeatured) - Number(a.isFeatured) ||
        b.viewsCount - a.viewsCount
    );
  }

  const limit = params.limit || 12;
  const page = Math.max(1, params.page || 1);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return { items, total, page, totalPages, categoryCounts };
}

export function getLocalPropertyDetail(idOrRef: string) {
  const ws = getWorkspace();
  const prop = ws.properties.find(
    (p) => p.id === idOrRef || p.refCode.toLowerCase() === idOrRef.toLowerCase()
  );
  if (!prop) return null;

  const v = ws.vendors.find((vnd) => vnd.id === prop.vendorId) || ws.vendors[0];
  const activeListings = ws.properties.filter(
    (p) => p.vendorId === v.id && p.status === 'published'
  ).length;

  const vendorMeta = {
    id: v.id,
    businessName: v.businessName,
    slug: v.slug,
    verified: v.verificationStatus === 'verified',
    rcNumber: v.rcNumber,
    memberSince: v.memberSince,
    avgResponseTime: v.avgResponseTime,
    logoUrl: v.logoUrl,
    phone: prop.vendorPhone || '+2348030008736',
    activeListings,
  };

  const similar = ws.properties
    .filter((p) => p.status === 'published' && p.id !== prop.id && p.category === prop.category)
    .slice(0, 3)
    .map((p) => {
      const pv = ws.vendors.find((vnd) => vnd.id === p.vendorId);
      return {
        ...p,
        vendorName: pv?.businessName || p.vendorName,
        vendorSlug: pv?.slug || p.vendorSlug,
        vendorVerified: pv ? pv.verificationStatus === 'verified' : Boolean(p.vendorVerified),
      };
    });

  return {
    property: {
      ...prop,
      vendorName: v.businessName,
      vendorSlug: v.slug,
      vendorVerified: v.verificationStatus === 'verified',
    },
    vendor: vendorMeta,
    similar,
  };
}

export function getLocalAgencies(): AgencySummary[] {
  const ws = getWorkspace();
  return ws.vendors.map((v) => ({
    id: v.id,
    entityType: v.entityType,
    businessName: v.businessName,
    slug: v.slug,
    city: v.city || 'Lagos',
    state: v.state || 'Lagos',
    rcNumber: v.rcNumber,
    verificationStatus: v.verificationStatus,
    logoUrl: v.logoUrl,
    rating: v.rating,
    reviewCount: v.reviewCount,
    activeListings: ws.properties.filter((p) => p.vendorId === v.id && p.status === 'published').length,
  }));
}

export function getLocalAgencyDetail(slug: string): {
  agency: AgencyDetail;
  team: AgencyTeamMember[];
  properties: PropertyListing[];
} | null {
  const ws = getWorkspace();
  const v = ws.vendors.find((vnd) => vnd.slug === slug);
  if (!v) return null;

  const team = ws.teamMembers.filter((m) => m.vendorId === v.id);
  const properties = ws.properties
    .filter((p) => p.vendorId === v.id && p.status === 'published')
    .map((p) => ({
      ...p,
      vendorName: v.businessName,
      vendorSlug: v.slug,
      vendorVerified: v.verificationStatus === 'verified',
    }));

  const agency: AgencyDetail = {
    id: v.id,
    entityType: v.entityType,
    businessName: v.businessName,
    slug: v.slug,
    representativeName: v.representativeName,
    representativeRole: v.representativeRole,
    rcNumber: v.rcNumber,
    scumlNumber: v.scumlNumber,
    redanNumber: v.redanNumber,
    lasreraLicense: v.lasreraLicense,
    address: v.address,
    abujaAddress: v.abujaAddress,
    city: v.city,
    state: v.state,
    bio: v.bio,
    logoUrl: v.logoUrl,
    verificationStatus: v.verificationStatus,
    avgResponseTime: v.avgResponseTime,
    memberSince: v.memberSince,
    rating: v.rating,
    reviewCount: v.reviewCount,
    phone: v.id === 'vnd_solovendor' ? '+2348149904421' : '+2348030008736',
    email: v.id === 'vnd_solovendor' ? 'vendor@trem.ng' : 'apex@trem.ng',
  };

  return { agency, team, properties };
}

export function createEnquiryLocal(input: {
  propertyId?: string | null;
  vendorId: string;
  seekerId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  enquiryType?: 'formal' | 'inspection' | 'whatsapp_intent';
  inspectionDate?: string;
  inspectionSession?: string;
  tourPreference?: string;
  purpose?: string;
  message?: string;
}): EnquiryRecord {
  const ws = getWorkspace();
  const prop = input.propertyId ? ws.properties.find((p) => p.id === input.propertyId) : undefined;
  const vendor = ws.vendors.find((v) => v.id === input.vendorId) || ws.vendors[0];
  const now = new Date().toISOString();

  const record: EnquiryRecord = {
    id: `enq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    propertyId: prop?.id || null,
    propertyTitle: prop?.title || 'General Agency Portfolio Inquiry',
    propertyRef: prop?.refCode || '',
    vendorId: vendor.id,
    vendorName: vendor.businessName,
    seekerId: input.seekerId || null,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    enquiryType: input.enquiryType || 'formal',
    inspectionDate: input.inspectionDate || '',
    inspectionSession: input.inspectionSession || '',
    tourPreference: input.tourPreference || 'In-Person Walk',
    purpose: input.purpose || 'Purchase / Acquire',
    message: input.message || '',
    budgetNote: '',
    status: 'new',
    createdAt: now,
  };

  ws.enquiries.unshift(record);
  if (prop) {
    prop.inquiriesCount = (prop.inquiriesCount || 0) + 1;
  }

  ws.notifications.unshift({
    id: `notif_${Date.now().toString(36)}`,
    userId: vendor.userId,
    title: `New ${record.enquiryType === 'inspection' ? 'Inspection Booking' : 'Buyer Inquiry'}`,
    body: `${record.fullName} enquired about ${record.propertyRef || vendor.businessName}.`,
    link: '/vendor/leads',
    isRead: false,
    createdAt: now,
  });

  saveWorkspace(ws);
  return record;
}

export function subscribeNewsletterLocal(email: string): void {
  const ws = getWorkspace();
  const clean = email.trim().toLowerCase();
  if (!ws.newsletterEmails.includes(clean)) {
    ws.newsletterEmails.push(clean);
    saveWorkspace(ws);
  }
}

// Vendor / Agency Workspace Local Operations
export function getVendorOverviewLocal(vendorId: string) {
  const ws = getWorkspace();
  const vendor = ws.vendors.find((v) => v.id === vendorId) || ws.vendors[0];
  const props = ws.properties.filter((p) => p.vendorId === vendor.id);
  const sub =
    ws.subscriptions
      .filter((s) => s.vendorId === vendor.id && s.status === 'active')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
  const leads = ws.enquiries.filter((e) => e.vendorId === vendor.id);

  const publishedProps = props.filter((p) => p.status === 'published');
  const pendingProps = props.filter((p) => p.status === 'pending_review');
  const draftProps = props.filter((p) => p.status === 'draft');

  return {
    vendor,
    subscription: sub,
    stats: {
      totalInventory: props.length,
      publishedCount: publishedProps.length,
      pendingCount: pendingProps.length,
      draftCount: draftProps.length,
      totalPortfolioNgn: publishedProps.reduce((sum, p) => sum + p.priceNgn, 0),
      totalViews: props.reduce((sum, p) => sum + p.viewsCount, 0),
      totalLeads: leads.length,
      promotedCount: publishedProps.filter((p) => p.isPromoted).length,
    },
    attentionProperties: props.filter((p) => p.status !== 'published' && p.status !== 'sold').slice(0, 4),
    topProperties: publishedProps.slice(0, 4),
    recentLeads: leads.slice(0, 5),
  };
}

export function getVendorPropertiesLocal(vendorId: string): PropertyListing[] {
  const ws = getWorkspace();
  return ws.properties
    .filter((p) => p.vendorId === vendorId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getVendorPropertyByIdLocal(id: string): PropertyListing | null {
  const ws = getWorkspace();
  return ws.properties.find((p) => p.id === id || p.refCode === id) || null;
}

export function saveVendorPropertyLocal(
  vendor: VendorProfile,
  user: UserAccount,
  payload: {
    id?: string;
    title: string;
    purpose: PropertyPurpose;
    category: PropertyCategory;
    subcategory: string;
    description: string;
    priceNgn: number;
    priceUnit: string;
    address: string;
    corridor: string;
    lga: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    beaconRef: string;
    bedrooms: number;
    bathrooms: number;
    areaSqm: number;
    garageBays: number;
    yearBuilt: number;
    smartIot: boolean;
    titleDocType: string;
    surveyPlanNo: string;
    bureauFileNo: string;
    amenities: string[];
    images: string[];
    videoUrl: string;
    submitForReview: boolean;
  }
): PropertyListing {
  const ws = getWorkspace();
  const now = new Date().toISOString();

  let score = 20;
  if (payload.title.trim().length >= 10) score += 10;
  if (payload.address.trim().length >= 6 && payload.state.trim()) score += 15;
  if (payload.priceNgn > 0) score += 15;
  if (payload.description.trim().length >= 30) score += 10;
  if (payload.titleDocType && (payload.surveyPlanNo.trim() || payload.bureauFileNo.trim())) score += 15;
  if (payload.images.length >= 1) score += 10;
  if (payload.images.length >= 3) score += 5;

  const targetStatus: PropertyStatus = payload.submitForReview ? 'published' : 'draft';

  if (payload.id) {
    const idx = ws.properties.findIndex((p) => p.id === payload.id);
    if (idx !== -1) {
      const updated: PropertyListing = {
        ...ws.properties[idx],
        ...payload,
        slug: slugify(payload.title) || ws.properties[idx].slug,
        healthScore: Math.min(100, score),
        status: payload.submitForReview ? 'published' : ws.properties[idx].status === 'published' ? 'published' : 'draft',
        updatedAt: now,
      };
      ws.properties[idx] = updated;
      saveWorkspace(ws);
      return updated;
    }
  }

  const statePrefix = (payload.state || 'NGA').slice(0, 3).toUpperCase();
  const refNum = Math.floor(1000 + Math.random() * 9000);
  const created: PropertyListing = {
    id: `prop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
    refCode: `TRM-${statePrefix}-${refNum}`,
    vendorId: vendor.id,
    vendorName: vendor.businessName,
    vendorSlug: vendor.slug,
    vendorVerified: vendor.verificationStatus === 'verified',
    vendorRating: vendor.rating,
    vendorPhone: user.phone || '+2348030008736',
    title: payload.title,
    slug: slugify(payload.title) || `asset-${refNum}`,
    purpose: payload.purpose,
    category: payload.category,
    subcategory: payload.subcategory,
    description: payload.description,
    priceNgn: payload.priceNgn,
    priceUnit: payload.priceUnit,
    address: payload.address,
    corridor: payload.corridor,
    lga: payload.lga,
    city: payload.city,
    state: payload.state,
    latitude: payload.latitude,
    longitude: payload.longitude,
    beaconRef: payload.beaconRef,
    bedrooms: payload.bedrooms,
    bathrooms: payload.bathrooms,
    areaSqm: payload.areaSqm,
    garageBays: payload.garageBays,
    yearBuilt: payload.yearBuilt,
    smartIot: payload.smartIot,
    titleDocType: payload.titleDocType,
    surveyPlanNo: payload.surveyPlanNo,
    bureauFileNo: payload.bureauFileNo,
    scumlCleared: true,
    walkScore: 85,
    amenities: payload.amenities,
    images: payload.images.length > 0 ? payload.images : ['/src/assets/images/prop_lekki_villa_1795687716839.jpg'],
    videoUrl: payload.videoUrl,
    healthScore: Math.min(100, score),
    status: targetStatus,
    moderationNote: '',
    isFeatured: false,
    isPromoted: false,
    promotionTier: null,
    viewsCount: 0,
    inquiriesCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  ws.properties.unshift(created);
  saveWorkspace(ws);
  return created;
}

export function bulkUpdateVendorPropertiesLocal(
  vendorId: string,
  propertyIds: string[],
  action: 'mark_sold' | 'move_to_draft'
): void {
  const ws = getWorkspace();
  const nextStatus: PropertyStatus = action === 'mark_sold' ? 'sold' : 'draft';
  const now = new Date().toISOString();
  ws.properties = ws.properties.map((p) =>
    p.vendorId === vendorId && propertyIds.includes(p.id)
      ? { ...p, status: nextStatus, updatedAt: now }
      : p
  );
  saveWorkspace(ws);
}

export function deleteVendorPropertyLocal(vendorId: string, propertyId: string): void {
  const ws = getWorkspace();
  ws.properties = ws.properties.filter((p) => !(p.vendorId === vendorId && p.id === propertyId));
  saveWorkspace(ws);
}

export function getVendorEnquiriesLocal(vendorId: string): EnquiryRecord[] {
  const ws = getWorkspace();
  return ws.enquiries.filter((e) => e.vendorId === vendorId);
}

export function updateVendorEnquiryStatusLocal(
  vendorId: string,
  enquiryId: string,
  status: EnquiryRecord['status']
): void {
  const ws = getWorkspace();
  ws.enquiries = ws.enquiries.map((e) =>
    e.vendorId === vendorId && e.id === enquiryId ? { ...e, status } : e
  );
  saveWorkspace(ws);
}

export function updateVendorProfileLocal(
  vendorId: string,
  patch: Partial<Pick<VendorProfile, 'businessName' | 'representativeName' | 'address' | 'abujaAddress' | 'city' | 'state' | 'bio' | 'entityType'>>
): VendorProfile | null {
  const ws = getWorkspace();
  const idx = ws.vendors.findIndex((v) => v.id === vendorId);
  if (idx === -1) return null;
  const updated: VendorProfile = {
    ...ws.vendors[idx],
    ...patch,
  };
  ws.vendors[idx] = updated;
  ws.properties = ws.properties.map((p) =>
    p.vendorId === vendorId ? { ...p, vendorName: updated.businessName } : p
  );
  saveWorkspace(ws);
  return updated;
}

export function getVendorTeamLocal(vendorId: string): AgencyTeamMember[] {
  const ws = getWorkspace();
  return ws.teamMembers.filter((m) => m.vendorId === vendorId);
}

export function addVendorTeamLocal(
  vendorId: string,
  member: { fullName: string; title: string; credentials: string; phone: string }
): AgencyTeamMember {
  const ws = getWorkspace();
  const item: AgencyTeamMember = {
    id: `tm_${Date.now().toString(36)}`,
    vendorId,
    fullName: member.fullName.trim(),
    title: member.title.trim(),
    credentials: member.credentials.trim(),
    bio: '',
    avatarUrl: '/src/assets/images/avatar_barr_chidinma_1795687721136.jpg',
    phone: member.phone.trim(),
    email: '',
  };
  ws.teamMembers.push(item);
  saveWorkspace(ws);
  return item;
}

export function deleteVendorTeamLocal(vendorId: string, memberId: string): void {
  const ws = getWorkspace();
  ws.teamMembers = ws.teamMembers.filter((m) => !(m.vendorId === vendorId && m.id === memberId));
  saveWorkspace(ws);
}

export function getVendorKycLocal(vendorId: string) {
  const ws = getWorkspace();
  const vendor = ws.vendors.find((v) => v.id === vendorId) || ws.vendors[0];
  const documents = ws.kycDocs.filter((d) => d.vendorId === vendor.id);
  return {
    verificationStatus: vendor.verificationStatus,
    verificationNotes: vendor.verificationNotes,
    rcNumber: vendor.rcNumber,
    tinNumber: vendor.tinNumber,
    scumlNumber: vendor.scumlNumber,
    documents,
  };
}

export function submitVendorKycLocal(
  vendorId: string,
  payload: {
    rcNumber: string;
    tinNumber: string;
    scumlNumber: string;
    documents: Array<{
      docType: KycDocument['docType'];
      docLabel: string;
      fileName: string;
      fileUrl: string;
    }>;
  }
): void {
  const ws = getWorkspace();
  const now = new Date().toISOString();
  ws.vendors = ws.vendors.map((v) =>
    v.id === vendorId
      ? {
          ...v,
          rcNumber: payload.rcNumber,
          tinNumber: payload.tinNumber,
          scumlNumber: payload.scumlNumber,
          verificationStatus: 'verified',
          verificationNotes: 'Documents recorded in local vendor workspace.',
        }
      : v
  );
  for (const doc of payload.documents) {
    ws.kycDocs.unshift({
      id: `kyc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      vendorId,
      docType: doc.docType,
      docLabel: doc.docLabel,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      status: 'approved',
      reviewerNote: 'Recorded locally',
      createdAt: now,
    });
  }
  saveWorkspace(ws);
}

export function getBillingOverviewLocal(vendorId: string) {
  const ws = getWorkspace();
  const subscription =
    ws.subscriptions
      .filter((s) => s.vendorId === vendorId && s.status === 'active')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] || null;
  const orders = ws.orders.filter((o) => o.vendorId === vendorId);
  const promotions = ws.promotions.filter((p) => p.vendorId === vendorId);
  return { subscription, orders, promotions };
}

export function activateSubscriptionLocal(
  userId: string,
  vendorId: string,
  planCode: 'standard' | 'premium',
  billingMonths: 1 | 3 | 6 | 12,
  paymentMethod: 'card' | 'bank_transfer'
): { reference: string; subscription: SubscriptionRecord } {
  const ws = getWorkspace();
  const quote = calculateSubscriptionQuote(planCode, billingMonths);
  const now = new Date();
  const expires = new Date(now.getTime() + billingMonths * 30 * 24 * 60 * 60 * 1000);
  const reference = `TRM-SUB-${Date.now().toString().slice(-6)}`;

  ws.subscriptions = ws.subscriptions.map((s) =>
    s.vendorId === vendorId && s.status === 'active' ? { ...s, status: 'cancelled' } : s
  );

  const subscription: SubscriptionRecord = {
    id: `sub_${Date.now().toString(36)}`,
    vendorId,
    planCode,
    billingMonths,
    status: 'active',
    startsAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    autoRenew: true,
    createdAt: now.toISOString(),
  };
  ws.subscriptions.unshift(subscription);

  ws.orders.unshift({
    id: `ord_${Date.now().toString(36)}`,
    reference,
    userId,
    vendorId,
    orderType: 'subscription',
    targetId: subscription.id,
    paymentMethod,
    subtotalNgn: quote.grossNgn,
    discountNgn: quote.discountNgn,
    vatNgn: quote.vatNgn,
    totalNgn: quote.totalNgn,
    status: 'verified',
    createdAt: now.toISOString(),
    verifiedAt: now.toISOString(),
  });

  saveWorkspace(ws);
  return { reference, subscription };
}

export function activatePromotionLocal(
  userId: string,
  vendorId: string,
  propertyId: string,
  packageCode: 'promo_1w' | 'promo_2w' | 'promo_1m',
  paymentMethod: 'card' | 'bank_transfer'
): { reference: string; promotion: PromotionRecord } {
  const ws = getWorkspace();
  const prop = ws.properties.find((p) => p.id === propertyId);
  const pkg = PROMOTION_PACKAGES[packageCode];
  const quote = calculatePromotionQuote(packageCode);
  const now = new Date();
  const expires = new Date(now.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
  const reference = `TRM-PRM-${Date.now().toString().slice(-6)}`;

  const promotion: PromotionRecord = {
    id: `pmo_${Date.now().toString(36)}`,
    propertyId,
    propertyTitle: prop?.title || 'Promoted Listing',
    propertyRef: prop?.refCode || '',
    vendorId,
    packageCode,
    status: 'active',
    startsAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    viewsGenerated: 0,
    leadsGenerated: 0,
    createdAt: now.toISOString(),
  };

  ws.promotions.unshift(promotion);
  ws.properties = ws.properties.map((p) =>
    p.id === propertyId
      ? { ...p, isPromoted: true, isFeatured: true, promotionTier: packageCode, updatedAt: now.toISOString() }
      : p
  );

  ws.orders.unshift({
    id: `ord_${Date.now().toString(36)}`,
    reference,
    userId,
    vendorId,
    orderType: 'promotion',
    targetId: promotion.id,
    paymentMethod,
    subtotalNgn: quote.netNgn,
    discountNgn: 0,
    vatNgn: quote.vatNgn,
    totalNgn: quote.totalNgn,
    status: 'verified',
    createdAt: now.toISOString(),
    verifiedAt: now.toISOString(),
  });

  saveWorkspace(ws);
  return { reference, promotion };
}

export function getNotificationsLocal(userId: string): NotificationItem[] {
  const ws = getWorkspace();
  return ws.notifications.filter((n) => n.userId === userId || n.userId === 'usr_agency_1');
}

export function markAllNotificationsReadLocal(userId: string): void {
  const ws = getWorkspace();
  ws.notifications = ws.notifications.map((n) =>
    n.userId === userId || n.userId === 'usr_agency_1' ? { ...n, isRead: true } : n
  );
  saveWorkspace(ws);
}
