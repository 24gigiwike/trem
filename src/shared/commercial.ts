export interface SubscriptionPlanConfig {
  code: 'standard' | 'premium';
  name: string;
  audience: string;
  tagline: string;
  monthlyPriceNgn: number;
  maxListings: number | null; // null = unlimited
  popular?: boolean;
  features: string[];
}

export interface BillingDurationConfig {
  months: 1 | 3 | 6 | 12;
  label: string;
  discountRate: number;
  badge?: string;
}

export interface PromotionPackageConfig {
  code: 'promo_1w' | 'promo_2w' | 'promo_1m';
  tierLabel: string;
  name: string;
  durationDays: number;
  durationLabel: string;
  priceNgn: number;
  popular?: boolean;
  features: string[];
}

export const TREM_LOGO_URL = 'https://ik.imagekit.io/019999great/logotrem.png';

export const COMMERCIAL_CONFIG = {
  vatRate: 0.075, // 7.5% Federal VAT
  currencyCode: 'NGN' as const,
};

export const SUBSCRIPTION_PLANS: Record<'standard' | 'premium', SubscriptionPlanConfig> = {
  standard: {
    code: 'standard',
    name: 'Standard Package',
    audience: 'Individual & Private Landlord',
    tagline: 'List up to 5 verified properties concurrently with direct buyer inquiries.',
    monthlyPriceNgn: 5000,
    maxListings: 5,
    features: [
      'Display up to 5 properties concurrently',
      'Standard TREM listing showcase & mobile profile',
      'Direct WhatsApp & verified mobile inquiries',
      'Standard search directory placement',
    ],
  },
  premium: {
    code: 'premium',
    name: 'Premium Package',
    audience: 'Agencies & High-Volume Developers',
    tagline: 'Unlimited property syndication with priority homepage and search visibility.',
    monthlyPriceNgn: 9500,
    maxListings: null,
    popular: true,
    features: [
      'Unlimited property listings monthly',
      'Priority homepage & category showcase placement',
      'Verified agency accreditation & SCUML badge',
      'Multi-agent lead routing & live video inspection booking',
    ],
  },
};

export const BILLING_DURATIONS: BillingDurationConfig[] = [
  { months: 1, label: '1 Month', discountRate: 0 },
  { months: 3, label: '3 Months', discountRate: 0.05, badge: 'Save 5%' },
  { months: 6, label: '6 Months', discountRate: 0.1, badge: 'Save 10%' },
  { months: 12, label: '1 Year (Annual)', discountRate: 0.2, badge: 'Save 20%' },
];

export const PROMOTION_PACKAGES: Record<'promo_1w' | 'promo_2w' | 'promo_1m', PromotionPackageConfig> = {
  promo_1w: {
    code: 'promo_1w',
    tierLabel: 'BASIC PACKAGE',
    name: '1 Week Exposure',
    durationDays: 7,
    durationLabel: 'One Week (7 Days)',
    priceNgn: 10500,
    features: [
      'Category search top placement',
      '2x algorithmic search priority',
      'Promoted listing badge across search results',
    ],
  },
  promo_2w: {
    code: 'promo_2w',
    tierLabel: 'GROWTH ACCELERATION',
    name: '2 Weeks Dominance',
    durationDays: 14,
    durationLabel: 'Two Weeks (14 Days)',
    priceNgn: 16500,
    popular: true,
    features: [
      'Top 5 ranking in city & state search results',
      'Instant high-intent WhatsApp inquiry highlight',
      'Bi-weekly Nigerian property digest feature',
      'Targeted exposure across Lagos, Abuja & PH hubs',
    ],
  },
  promo_1m: {
    code: 'promo_1m',
    tierLabel: 'INSTITUTIONAL TIER',
    name: '1 Month Spotlight',
    durationDays: 30,
    durationLabel: 'One Month (30 Days)',
    priceNgn: 22500,
    features: [
      'Homepage curated showcase placement',
      'Dedicated alert to verified property seekers',
      'Monthly property showcase newsletter spotlight',
      'Priority account & listing review support',
    ],
  },
};

export function calculateSubscriptionQuote(planCode: 'standard' | 'premium', months: 1 | 3 | 6 | 12) {
  const plan = SUBSCRIPTION_PLANS[planCode];
  const duration = BILLING_DURATIONS.find((d) => d.months === months) ?? BILLING_DURATIONS[0];
  const grossNgn = plan.monthlyPriceNgn * months;
  const discountNgn = Math.round(grossNgn * duration.discountRate);
  const netNgn = grossNgn - discountNgn;
  const vatNgn = Math.round(netNgn * COMMERCIAL_CONFIG.vatRate);
  const totalNgn = netNgn + vatNgn;
  return {
    plan,
    duration,
    grossNgn,
    discountNgn,
    netNgn,
    vatNgn,
    totalNgn,
  };
}

export function calculatePromotionQuote(packageCode: 'promo_1w' | 'promo_2w' | 'promo_1m') {
  const pkg = PROMOTION_PACKAGES[packageCode];
  const netNgn = pkg.priceNgn;
  const vatNgn = Math.round(netNgn * COMMERCIAL_CONFIG.vatRate);
  const totalNgn = netNgn + vatNgn;
  return {
    pkg,
    netNgn,
    vatNgn,
    totalNgn,
  };
}

export function formatMoney(amountNgn: number): string {
  return `₦${Math.round(amountNgn).toLocaleString('en-NG')}`;
}
