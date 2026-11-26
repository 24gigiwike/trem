import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './security.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'trem.db');
export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('seeker', 'vendor', 'agency', 'admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
      email_verified INTEGER NOT NULL DEFAULT 0,
      otp_code_hash TEXT DEFAULT '',
      otp_expires_at TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vendor_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('vendor', 'agency')),
      business_name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      representative_name TEXT NOT NULL,
      representative_role TEXT NOT NULL DEFAULT 'Principal Broker',
      rc_number TEXT DEFAULT '',
      tin_number TEXT DEFAULT '',
      scuml_number TEXT DEFAULT '',
      redan_number TEXT DEFAULT '',
      lasrera_license TEXT DEFAULT '',
      address TEXT DEFAULT '',
      abuja_address TEXT DEFAULT '',
      city TEXT DEFAULT '',
      state TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
      verification_notes TEXT DEFAULT '',
      avg_response_time TEXT DEFAULT '< 1 hr',
      member_since TEXT DEFAULT '2025',
      rating REAL NOT NULL DEFAULT 4.8,
      review_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agency_team_members (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      title TEXT NOT NULL,
      credentials TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS kyc_documents (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      doc_label TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      reviewer_note TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      vendor_id TEXT NOT NULL,
      plan_code TEXT NOT NULL CHECK (plan_code IN ('standard', 'premium')),
      billing_months INTEGER NOT NULL CHECK (billing_months IN (1, 3, 6, 12)),
      status TEXT NOT NULL CHECK (status IN ('active', 'pending_payment', 'expired', 'cancelled')),
      starts_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      auto_renew INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      ref_code TEXT UNIQUE NOT NULL,
      vendor_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'buy',
      category TEXT NOT NULL CHECK (category IN ('residential', 'commercial', 'land_banking', 'buy_build')),
      subcategory TEXT DEFAULT '',
      description TEXT DEFAULT '',
      price_ngn INTEGER NOT NULL DEFAULT 0,
      price_usd INTEGER NOT NULL DEFAULT 0,
      price_unit TEXT DEFAULT '',
      address TEXT DEFAULT '',
      corridor TEXT DEFAULT '',
      lga TEXT DEFAULT '',
      city TEXT DEFAULT '',
      state TEXT DEFAULT '',
      latitude REAL NOT NULL DEFAULT 6.4474,
      longitude REAL NOT NULL DEFAULT 3.4731,
      beacon_ref TEXT DEFAULT '',
      bedrooms INTEGER NOT NULL DEFAULT 0,
      bathrooms INTEGER NOT NULL DEFAULT 0,
      area_sqm INTEGER NOT NULL DEFAULT 0,
      garage_bays INTEGER NOT NULL DEFAULT 0,
      year_built INTEGER NOT NULL DEFAULT 2024,
      smart_iot INTEGER NOT NULL DEFAULT 0,
      title_doc_type TEXT DEFAULT 'Certificate of Occupancy (C of O)',
      survey_plan_no TEXT DEFAULT '',
      bureau_file_no TEXT DEFAULT '',
      scuml_cleared INTEGER NOT NULL DEFAULT 1,
      escrow_locked INTEGER NOT NULL DEFAULT 0,
      walk_score INTEGER NOT NULL DEFAULT 85,
      amenities_json TEXT NOT NULL DEFAULT '[]',
      images_json TEXT NOT NULL DEFAULT '[]',
      video_url TEXT DEFAULT '',
      health_score INTEGER NOT NULL DEFAULT 80,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'suspended', 'sold')),
      moderation_note TEXT DEFAULT '',
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_promoted INTEGER NOT NULL DEFAULT 0,
      promotion_tier TEXT DEFAULT NULL,
      views_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS property_promotions (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      package_code TEXT NOT NULL CHECK (package_code IN ('promo_1w', 'promo_2w', 'promo_1m')),
      status TEXT NOT NULL CHECK (status IN ('active', 'pending_payment', 'expired')),
      starts_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      views_generated INTEGER NOT NULL DEFAULT 0,
      leads_generated INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_properties (
      user_id TEXT NOT NULL,
      property_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, property_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      property_id TEXT,
      vendor_id TEXT NOT NULL,
      seeker_id TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      enquiry_type TEXT NOT NULL CHECK (enquiry_type IN ('formal', 'inspection', 'whatsapp_intent')),
      inspection_date TEXT DEFAULT '',
      inspection_session TEXT DEFAULT '',
      tour_preference TEXT DEFAULT '',
      purpose TEXT DEFAULT '',
      message TEXT DEFAULT '',
      budget_note TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'responded', 'scheduled', 'closed')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
      FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payment_orders (
      id TEXT PRIMARY KEY,
      reference TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      vendor_id TEXT NOT NULL,
      order_type TEXT NOT NULL CHECK (order_type IN ('subscription', 'promotion')),
      target_id TEXT NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'bank_transfer')),
      subtotal_ngn INTEGER NOT NULL,
      discount_ngn INTEGER NOT NULL DEFAULT 0,
      vat_ngn INTEGER NOT NULL,
      total_ngn INTEGER NOT NULL,
      total_usd REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
      idempotency_key TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      verified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      order_reference TEXT NOT NULL,
      event_id TEXT UNIQUE NOT NULL,
      event_type TEXT NOT NULL,
      signature_valid INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT NOT NULL,
      processed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT DEFAULT '/',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_bootstrap (
      id TEXT PRIMARY KEY,
      passcode_hash TEXT NOT NULL,
      claimed_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  seedMarketplaceData();
}

function seedMarketplaceData(): void {
  const existingProps = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };
  if (existingProps.count > 0) return;

  db.exec('BEGIN');
  try {
  const now = new Date().toISOString();
  const nextYear = new Date(Date.now() + 284 * 24 * 60 * 60 * 1000).toISOString();
  const demoPass = hashPassword('TremDemo2026!');

  // Seed sample seeker, agency, and independent vendor (never seed admin passwords)
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, email_verified, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1, ?)
  `);

  insertUser.run('usr_seeker_1', 'seeker@trem.ng', demoPass, 'Tunde', 'Oladipo', '+2348091234567', 'seeker', now);
  insertUser.run('usr_agency_1', 'apex@trem.ng', demoPass, 'Emeka', 'Okonye', '+2348030008736', 'agency', now);
  insertUser.run('usr_vendor_1', 'vendor@trem.ng', demoPass, 'Babatunde', 'Adeleke', '+2348149904421', 'vendor', now);

  const insertVendor = db.prepare(`
    INSERT INTO vendor_profiles (
      id, user_id, entity_type, business_name, slug, representative_name, representative_role,
      rc_number, tin_number, scuml_number, redan_number, lasrera_license,
      address, abuja_address, city, state, bio, logo_url, verification_status, verification_notes,
      avg_response_time, member_since, rating, review_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVendor.run(
    'vnd_apex',
    'usr_agency_1',
    'agency',
    'Apex Prime Properties Ltd',
    'apex-prime-properties',
    'Chief Emeka Okonye',
    'Principal Broker / Managing Director',
    'RC 1498203',
    'TIN-2940294-0001',
    'SCUML/RN-0428',
    'RED-2021-884',
    'LAS-RE-4920',
    '14 Admiralty Way, Lekki Phase 1, Lagos State',
    'Plot 402 Constitution Avenue, CBD, Abuja FCT',
    'Lekki Phase 1',
    'Lagos',
    'Founded in 2018 and headquartered in Lekki Phase 1, Lagos, Apex Prime Properties Ltd is an institutional-grade property acquisition firm specializing in mitigating title risks and accelerating liquidity in Nigeria’s highest-performing corridors across Ikoyi, Lekki Phase 1, Victoria Island, and Maitama.',
    '/src/assets/images/avatar_chief_emeka_1795687719662.jpg',
    'verified',
    'CAC, SCUML, and LASRERA credentials cross-checked and active.',
    '< 1 hr',
    '2021',
    4.9,
    140,
    now
  );

  insertVendor.run(
    'vnd_solovendor',
    'usr_vendor_1',
    'vendor',
    'Adeleke Private Holdings',
    'adeleke-private-holdings',
    'Babatunde Adeleke',
    'Sole Proprietor & Title Holder',
    'BN 3019482',
    'TIN-1088442-0002',
    'SCUML/IND-1190',
    '',
    'LAS-IND-883',
    'Suite 14, Plot 108 Wetheral Road, Commercial Axis',
    '',
    'New Owerri',
    'Imo',
    'Independent private title holder and land consultant specializing in dry serviced residential plots and perimeter-fenced buy-and-build estates across Imo and Lagos corridors.',
    '/src/assets/images/avatar_barr_chidinma_1795687721136.jpg',
    'verified',
    'NIN and survey credentials verified.',
    '< 2 hrs',
    '2023',
    4.8,
    24,
    now
  );

  const insertTeam = db.prepare(`
    INSERT INTO agency_team_members (id, vendor_id, full_name, title, credentials, bio, avatar_url, phone, email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTeam.run(
    'tm_1',
    'vnd_apex',
    'Chief Emeka Okonye',
    'Managing Principal & Broker',
    '14+ Years Practice · ₦28B+ Closed',
    'Specializes in high-yield commercial hubs, Victoria Island development sites, and off-market institutional transactions.',
    '/src/assets/images/avatar_chief_emeka_1795687719662.jpg',
    '+2348030008736',
    'e.okonye@apexprime.ng'
  );
  insertTeam.run(
    'tm_2',
    'vnd_apex',
    'Barr. Chidinma Eze',
    'Legal & Title Verification Officer',
    'NBA Member · SCUML Lead',
    'Oversees Lagos & Abuja land searches, Governor’s Consent verifications, probate clearing, and gazette rectifications.',
    '/src/assets/images/avatar_barr_chidinma_1795687721136.jpg',
    '+2348030008737',
    'c.eze@apexprime.ng'
  );

  const insertSub = db.prepare(`
    INSERT INTO subscriptions (id, vendor_id, plan_code, billing_months, status, starts_at, expires_at, auto_renew, created_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?, 1, ?)
  `);
  insertSub.run('sub_apex_1', 'vnd_apex', 'premium', 12, now, nextYear, now);
  insertSub.run('sub_solo_1', 'vnd_solovendor', 'standard', 3, now, nextYear, now);

  const insertProp = db.prepare(`
    INSERT INTO properties (
      id, ref_code, vendor_id, title, slug, purpose, category, subcategory, description,
      price_ngn, price_usd, price_unit, address, corridor, lga, city, state,
      latitude, longitude, beacon_ref, bedrooms, bathrooms, area_sqm, garage_bays, year_built,
      smart_iot, title_doc_type, survey_plan_no, bureau_file_no, scuml_cleared, escrow_locked,
      walk_score, amenities_json, images_json, video_url, health_score, status,
      is_featured, is_promoted, promotion_tier, views_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const villaGallery = JSON.stringify([
    '/src/assets/images/prop_lekki_villa_1795687716839.jpg',
    '/src/assets/images/prop_interior_living_1795687721080.jpg',
    '/src/assets/images/prop_interior_kitchen_1795687720007.jpg',
    '/src/assets/images/prop_ikoyi_penthouse_1795687717853.jpg',
  ]);

  insertProp.run(
    'prop_1',
    'TRM-LOS-7842',
    'vnd_apex',
    '5-Bedroom Contemporary Detached Smart Villa with Infinity Pool & BQ',
    '5-bedroom-contemporary-detached-smart-villa-lekki',
    'buy',
    'residential',
    'Detached Smart Villa',
    'Strategically positioned on a tranquil residential cul-de-sac off the prestigious Admiralty Way corridor, this 2023-constructed contemporary masterpiece delivers uncompromising modern luxury, institutional construction integrity, and future-proofed autonomous infrastructure with a 15kVA Solar Hybrid array and LiFePO4 battery storage.',
    380000000,
    245000,
    'Outright',
    'Admiralty Way Axis, Lekki Phase 1, Lagos State',
    'Lekki Phase 1',
    'Eti-Osa',
    'Lagos',
    'Lagos',
    6.4474,
    3.4731,
    'SC/LA/2024/LK-8891',
    5,
    6,
    680,
    4,
    2023,
    1,
    'Certificate of Occupancy (C of O)',
    'OG/SURV/0912/2020',
    'LND/2018/LK-40912',
    1,
    1,
    88,
    JSON.stringify([
      '15kVA Lithium Hybrid Solar System',
      'Private 8-Seat Acoustic Cinema Lounge',
      'Industrial Multi-Stage Water Filtration Plant',
      '24/7 Manned Estate Security & Smart Biometrics',
      '2-Room En-Suite Staff Quarters (BQ)',
      'Control4 Automated Lighting & Sound',
    ]),
    villaGallery,
    'https://vimeo.com/trem-pan-africa/lekki-contemporary-villa',
    96,
    'published',
    1,
    1,
    'promo_2w',
    3420,
    now,
    now
  );

  insertProp.run(
    'prop_2',
    'TRM-LOS-4011',
    'vnd_apex',
    'Prime 12-Unit Commercial Plaza & Executive Suites',
    'prime-12-unit-commercial-plaza-victoria-island',
    'buy',
    'commercial',
    'Corporate Plaza',
    'Institutional-grade 6-storey Grade-A commercial complex situated along Ahmadu Bello Way, Victoria Island. 100% tenanted by blue-chip fintech and energy firms yielding 8.4% net annual return with dedicated underground and forecourt parking.',
    1200000000,
    775000,
    'Outright (8.4% Cap Rate)',
    'Ahmadu Bello Way, Victoria Island, Lagos',
    'Victoria Island',
    'Eti-Osa',
    'Lagos',
    'Lagos',
    6.4281,
    3.4219,
    'SC/LA/2021/VI-1042',
    12,
    14,
    2400,
    45,
    2022,
    1,
    "Governor's Consent",
    'LA/SURV/0419/2019',
    'LND/2019/VI-99301',
    1,
    1,
    92,
    JSON.stringify(['100% Tenanted Blue-Chip Leases', 'Twin 250kVA Standby Generators', 'Dual Schindler Elevators', '45 Dedicated Parking Bays']),
    JSON.stringify(['/src/assets/images/prop_vi_plaza_1795687717957.jpg', '/src/assets/images/prop_interior_living_1795687721080.jpg']),
    '',
    94,
    'published',
    1,
    1,
    'promo_1m',
    8910,
    now,
    now
  );

  insertProp.run(
    'prop_3',
    'TRM-ABJ-8820',
    'vnd_apex',
    'Maitama Diplomatic Residence & Private Oasis',
    'maitama-diplomatic-residence-abuja',
    'buy',
    'residential',
    'Ambassadorial Mansion',
    'Grand ambassadorial estate situated in the secure Maitama Diplomatic Zone, Abuja FCT. Built with imported travertine stone cladding, bullet-resistant glazing, formal reception portico, and landscaped oasis.',
    480000000,
    310000,
    'Outright',
    'Diplomatic Enclave, Maitama, Abuja FCT',
    'Maitama',
    'AMAC',
    'Abuja',
    'FCT Abuja',
    9.0882,
    7.4934,
    'FCDA/SURV/2020/MT-309',
    6,
    7,
    850,
    6,
    2024,
    1,
    'FCDA Certificate of Occupancy',
    'FCDA/2020/882',
    'AGIS/MT/2020/4412',
    1,
    1,
    89,
    JSON.stringify(['Diplomatic Zone Security', 'Marble Portico & Water Feature', 'Swimming Pool & Gazebo', '20kVA Solar Backup']),
    JSON.stringify(['/src/assets/images/prop_maitama_residence_1795687719224.jpg', '/src/assets/images/prop_interior_living_1795687721080.jpg']),
    '',
    95,
    'published',
    1,
    0,
    null,
    2150,
    now,
    now
  );

  insertProp.run(
    'prop_4',
    'TRM-LOS-6190',
    'vnd_apex',
    '4-Bed Waterfront Sky Penthouse with Private Helipad Access',
    '4-bed-waterfront-sky-penthouse-ikoyi',
    'buy',
    'residential',
    'Waterfront Penthouse',
    'Panoramic Lagos Lagoon views from Bourdillon Road, Old Ikoyi. Full-floor residence featuring private elevator lobby, expansive sunset wrap-around timber deck, outdoor chef lounge, and marina jetty berth.',
    320000000,
    206000,
    'Outright',
    'Bourdillon Road, Old Ikoyi, Lagos',
    'Old Ikoyi',
    'Eti-Osa',
    'Lagos',
    'Lagos',
    6.4549,
    3.4346,
    'SC/LA/2022/IK-5510',
    4,
    5,
    420,
    3,
    2023,
    1,
    'Certificate of Occupancy (C of O)',
    'LA/SURV/0772/2021',
    'LND/2021/IK-77412',
    1,
    1,
    91,
    JSON.stringify(['Private Lagoon Deck', 'Marina Jetty Access', 'Concierge & Helipad Privileges', 'Floor-to-Ceiling Acoustic Glazing']),
    JSON.stringify(['/src/assets/images/prop_ikoyi_penthouse_1795687717853.jpg', '/src/assets/images/prop_interior_kitchen_1795687720007.jpg']),
    '',
    92,
    'published',
    0,
    0,
    null,
    1940,
    now,
    now
  );

  insertProp.run(
    'prop_5',
    'TRM-EPE-4910',
    'vnd_apex',
    'Prime Agro-Commercial Logistics Acreage (50 Hectares)',
    'prime-agro-commercial-logistics-acreage-epe',
    'land_banking',
    'land_banking',
    'Strategic Land Parcel',
    'High-yield industrial and agro-commercial land banking corridor positioned along the Lekki-Epe Expressway expansion zone near the Deep Sea Port and International Airport site. 100% dry upland topography with registered survey.',
    18000000,
    11600,
    'Per Acre (Min 5 Acres)',
    'Alaro City / Epe Expressway Corridor, Lagos',
    'Epe Corridor',
    'Epe',
    'Lagos',
    'Lagos',
    6.5841,
    3.9834,
    'SC/LA/2024/EP-1190',
    0,
    0,
    4047,
    0,
    2024,
    0,
    'Government Gazette & Reg. Survey',
    'LA/EPE/2023/9901',
    'LND/GAZ/EPE-491',
    1,
    1,
    62,
    JSON.stringify(['100% Dry Upland Topography', 'Expressway Frontage', 'Perimeter Beacons Installed', '35% Projected 3-Yr ROI']),
    JSON.stringify(['/src/assets/images/prop_epe_landbank_1795687718861.jpg']),
    '',
    88,
    'published',
    1,
    0,
    null,
    1840,
    now,
    now
  );

  insertProp.run(
    'prop_6',
    'TRM-IMO-2090',
    'vnd_solovendor',
    '600 SQM Serviced Corner-Piece Residential Plot',
    '600-sqm-serviced-corner-piece-plot-owerri',
    'buy_build',
    'buy_build',
    'Serviced Residential Plot',
    'Immediate-allocation dry residential corner-piece plot inside Centenary Heights Estate, New Owerri. Complete with interlocked paved roadways, concrete storm drainage, perimeter fencing, and solar street lighting.',
    45000000,
    29000,
    'Outright',
    'Centenary Heights, New Owerri, Imo State',
    'New Owerri',
    'Owerri West',
    'Owerri',
    'Imo',
    5.4891,
    7.0176,
    'IM/SURV/2024/NW-209',
    0,
    0,
    600,
    0,
    2024,
    0,
    'Certificate of Occupancy (C of O)',
    'IM/SURV/2024/209',
    'IMO/LND/2024/209',
    1,
    1,
    78,
    JSON.stringify(['Instant Physical Allocation', 'Interlocked Paved Roads', 'Solar Street Lighting', '24/7 Gatehouse Security']),
    JSON.stringify(['/src/assets/images/prop_owerri_buybuild_1795687718799.jpg']),
    '',
    86,
    'published',
    0,
    0,
    null,
    980,
    now,
    now
  );

  insertProp.run(
    'prop_7',
    'TRM-PHC-0520',
    'vnd_apex',
    '3-Storey Corporate Industrial Hub (Pending Title Audit)',
    '3-storey-corporate-industrial-hub-port-harcourt',
    'buy',
    'commercial',
    'Industrial & Office Hub',
    'Purpose-built corporate regional headquarters and logistics facility in Trans-Amadi Industrial Layout with 500kVA dedicated transformer and loading bays.',
    650000000,
    419000,
    'Outright',
    'Trans-Amadi Industrial Layout, Port Harcourt, Rivers',
    'Trans-Amadi',
    'PHALGA',
    'Port Harcourt',
    'Rivers',
    4.8156,
    7.0498,
    'RV/PH/2024/TA-052',
    8,
    10,
    3400,
    18,
    2023,
    1,
    'Federal Gazette & Deed',
    'RV/SURV/2023/552',
    'RIV/IND/2023/052',
    1,
    1,
    80,
    JSON.stringify(['500kVA Dedicated Substation', '12 Loading Bays', '24/7 Perimeter Security']),
    JSON.stringify(['/src/assets/images/prop_vi_plaza_1795687717957.jpg']),
    '',
    79,
    'pending_review',
    0,
    0,
    null,
    0,
    now,
    now
  );

  insertProp.run(
    'prop_8',
    'TRM-LOS-9014',
    'vnd_solovendor',
    '4-Bedroom Semi-Detached Smart Terrace (Draft)',
    '4-bedroom-semi-detached-smart-terrace-lekki',
    'buy',
    'residential',
    'Smart Terrace',
    'Contemporary 4-bedroom semi-detached residence with fitted marble kitchen and solar hybrid inverter setup.',
    210000000,
    135500,
    'Outright',
    'Freedom Way Extension, Lekki Phase 1, Lagos',
    'Lekki Phase 1',
    'Eti-Osa',
    'Lagos',
    'Lagos',
    6.4412,
    3.4809,
    'SC/LA/2024/FW-901',
    4,
    5,
    450,
    2,
    2024,
    1,
    "Governor's Consent",
    'LA/SURV/2024/901',
    'LND/2024/FW-901',
    1,
    1,
    84,
    JSON.stringify(['Fitted Kitchen', 'Solar Inverter Ready', 'Gated Estate']),
    JSON.stringify(['/src/assets/images/prop_interior_kitchen_1795687720007.jpg', '/src/assets/images/prop_interior_living_1795687721080.jpg']),
    '',
    65,
    'draft',
    0,
    0,
    null,
    0,
    now,
    now
  );

  // Saved property for demo seeker
  db.prepare('INSERT INTO saved_properties (user_id, property_id, created_at) VALUES (?, ?, ?)').run('usr_seeker_1', 'prop_1', now);
  db.prepare('INSERT INTO saved_properties (user_id, property_id, created_at) VALUES (?, ?, ?)').run('usr_seeker_1', 'prop_4', now);

  // Sample enquiries
  const insertEnquiry = db.prepare(`
    INSERT INTO enquiries (
      id, property_id, vendor_id, seeker_id, full_name, email, phone,
      enquiry_type, inspection_date, inspection_session, tour_preference, purpose, message, budget_note, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertEnquiry.run(
    'enq_1',
    'prop_1',
    'vnd_apex',
    'usr_seeker_1',
    'Dr. Tunde Oladipo',
    'seeker@trem.ng',
    '+2348091234567',
    'inspection',
    '2026-12-03',
    '10:00 AM (Morning)',
    'Live Video Walkthrough',
    'Purchase / Acquire',
    'Requesting live WhatsApp video walkthrough and verified C of O registry copy prior to on-site legal search in Lagos.',
    '₦380M - ₦420M NGN',
    'new',
    now
  );
  insertEnquiry.run(
    'enq_2',
    'prop_2',
    'vnd_apex',
    null,
    'Chinedu Nwosu',
    'c.nwosu@meridianholdings.ng',
    '+2348034419200',
    'formal',
    '',
    '',
    'In-Person Walk',
    'Commercial Acquisition',
    'Interested in reviewing tenancy schedule and cap rate audit for the 12-unit Victoria Island plaza.',
    '₦1.2B NGN',
    'responded',
    now
  );

  // Seed KYC document for Apex Prime
  db.prepare(`
    INSERT INTO kyc_documents (id, vendor_id, doc_type, doc_label, file_name, file_url, status, reviewer_note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'approved', 'Verified against CAC & SCUML registries', ?)
  `).run('kyc_1', 'vnd_apex', 'cac_cert', 'Certificate of Incorporation (CAC)', 'CAC_Cert_ApexPrime.pdf', '/uploads/sample_cac.pdf', now);

  // Seed Promotion campaign record
  const promoExp = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO property_promotions (id, property_id, vendor_id, package_code, status, starts_at, expires_at, views_generated, leads_generated, created_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?, 8420, 48, ?)
  `).run('pmo_1', 'prop_1', 'vnd_apex', 'promo_2w', now, promoExp, now);
  db.prepare(`
    INSERT INTO property_promotions (id, property_id, vendor_id, package_code, status, starts_at, expires_at, views_generated, leads_generated, created_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?, 5190, 31, ?)
  `).run('pmo_2', 'prop_2', 'vnd_apex', 'promo_1m', now, nextYear, now);
  db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
