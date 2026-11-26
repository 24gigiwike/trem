export type UserRole = 'seeker' | 'vendor' | 'agency' | 'admin';

export type PropertyCategory = 'residential' | 'commercial' | 'land_banking' | 'buy_build';
export type PropertyPurpose = 'buy' | 'rent' | 'lease' | 'land_banking' | 'buy_build' | 'jv';
export type PropertyStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'suspended' | 'sold';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface UserAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  createdAt: string;
}

export interface VendorProfile {
  id: string;
  userId: string;
  entityType: 'vendor' | 'agency';
  businessName: string;
  slug: string;
  representativeName: string;
  representativeRole: string;
  rcNumber: string;
  tinNumber: string;
  scumlNumber: string;
  redanNumber: string;
  lasreraLicense: string;
  address: string;
  abujaAddress: string;
  city: string;
  state: string;
  bio: string;
  logoUrl: string;
  verificationStatus: VerificationStatus;
  verificationNotes: string;
  avgResponseTime: string;
  memberSince: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface AgencyTeamMember {
  id: string;
  vendorId: string;
  fullName: string;
  title: string;
  credentials: string;
  bio: string;
  avatarUrl: string;
  phone: string;
  email: string;
}

export interface KycDocument {
  id: string;
  vendorId: string;
  docType: 'representative_id' | 'cac_cert' | 'cac_form_1_1' | 'scuml_cert' | 'other';
  docLabel: string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerNote: string;
  createdAt: string;
}

export interface PropertyListing {
  id: string;
  refCode: string;
  vendorId: string;
  vendorName?: string;
  vendorSlug?: string;
  vendorVerified?: boolean;
  vendorRating?: number;
  vendorPhone?: string;
  title: string;
  slug: string;
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
  scumlCleared: boolean;
  walkScore: number;
  amenities: string[];
  images: string[];
  videoUrl: string;
  healthScore: number;
  status: PropertyStatus;
  moderationNote: string;
  isFeatured: boolean;
  isPromoted: boolean;
  promotionTier?: string | null;
  viewsCount: number;
  inquiriesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryRecord {
  id: string;
  propertyId: string | null;
  propertyTitle?: string;
  propertyRef?: string;
  vendorId: string;
  vendorName?: string;
  seekerId: string | null;
  fullName: string;
  email: string;
  phone: string;
  enquiryType: 'formal' | 'inspection' | 'whatsapp_intent';
  inspectionDate: string;
  inspectionSession: string;
  tourPreference: string;
  purpose: string;
  message: string;
  budgetNote: string;
  status: 'new' | 'responded' | 'scheduled' | 'closed';
  createdAt: string;
}

export interface SubscriptionRecord {
  id: string;
  vendorId: string;
  planCode: 'standard' | 'premium';
  billingMonths: 1 | 3 | 6 | 12;
  status: 'active' | 'pending_payment' | 'expired' | 'cancelled';
  startsAt: string;
  expiresAt: string;
  autoRenew: boolean;
  createdAt: string;
}

export interface PromotionRecord {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  propertyRef?: string;
  vendorId: string;
  packageCode: 'promo_1w' | 'promo_2w' | 'promo_1m';
  status: 'active' | 'pending_payment' | 'expired';
  startsAt: string;
  expiresAt: string;
  viewsGenerated: number;
  leadsGenerated: number;
  createdAt: string;
}

export interface PaymentOrder {
  id: string;
  reference: string;
  userId: string;
  vendorId: string;
  orderType: 'subscription' | 'promotion';
  targetId: string;
  paymentMethod: 'card' | 'bank_transfer';
  subtotalNgn: number;
  discountNgn: number;
  vatNgn: number;
  totalNgn: number;
  status: 'pending' | 'verified' | 'failed';
  createdAt: string;
  verifiedAt: string | null;
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}
