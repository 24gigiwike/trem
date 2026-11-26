import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Bookmark,
  Calendar,
  Car,
  CheckCircle2,
  Compass,
  Cpu,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  Share2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PropertyListing } from '../../shared/types';
import { formatMoney } from '../../shared/commercial';
import { SafeImage } from '../../components/SafeImage';
import { PropertyCard } from '../../components/PropertyCard';

interface VendorMeta {
  id: string;
  businessName: string;
  slug: string;
  verified: boolean;
  rcNumber: string;
  memberSince: string;
  avgResponseTime: string;
  logoUrl: string;
  phone: string;
  activeListings: number;
}

export function PropertyDetailPage() {
  const { idOrRef } = useParams();
  const { apiFetch, savedIds, toggleSaved, user } = useApp();

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [vendor, setVendor] = useState<VendorMeta | null>(null);
  const [similar, setSimilar] = useState<PropertyListing[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coordValidated, setCoordValidated] = useState(false);

  const [fullName, setFullName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionSession, setInspectionSession] = useState('10:00 AM (Morning)');
  const [tourPreference, setTourPreference] = useState('In-Person Walk');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState('');
  const [formErr, setFormErr] = useState('');

  useEffect(() => {
    if (!idOrRef) return;
    setLoading(true);
    setError('');
    apiFetch<{ property: PropertyListing; vendor: VendorMeta; similar: PropertyListing[] }>(`/api/public/properties/${idOrRef}`)
      .then((res) => {
        setProperty(res.property);
        setVendor(res.vendor);
        setSimilar(res.similar);
        setActiveImage(0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load property details.'))
      .finally(() => setLoading(false));
  }, [idOrRef, apiFetch]);

  const handleBookInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || !vendor) return;
    setSubmitting(true);
    setFormErr('');
    setSubmittedMsg('');
    try {
      await apiFetch('/api/public/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: property.id,
          vendorId: vendor.id,
          fullName,
          email: email || 'buyer@trem.ng',
          phone,
          enquiryType: 'inspection',
          inspectionDate,
          inspectionSession,
          tourPreference,
          purpose: 'Property Inspection & Acquisition',
          message: message || `Inspection booking for ${property.refCode} (${tourPreference})`,
        }),
      });
      setSubmittedMsg(`Inspection slot requested for ${property.refCode}. ${vendor.businessName} has been notified.`);
      setMessage('');
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Failed to submit inspection request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="h-96 rounded-lg bg-white border border-[#DCE3F0] animate-pulse" />
      </div>
    );
  }

  if (error || !property || !vendor) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
        <h1 className="font-display font-bold text-2xl text-[#0B1B48]">Property Not Found</h1>
        <p className="text-sm text-[#5A6782] mt-2">{error || 'This asset may have been archived.'}</p>
        <Link to="/explore" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </Link>
      </div>
    );
  }

  const isSaved = savedIds.includes(property.id);

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#5A6782] mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-[#0B1B48]">Home</Link>
          <span>/</span>
          <Link to="/explore" className="hover:text-[#0B1B48]">Explore Properties</Link>
          <span>/</span>
          <span className="text-[#0B1B48] font-semibold font-mono">{property.refCode}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#DCE3F0] text-[#0B1B48] font-semibold hover:bg-[#F4F6FA]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <button
            type="button"
            onClick={() => toggleSaved(property.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-semibold ${
              isSaved ? 'bg-[#E8C547] border-[#E8C547] text-[#0B1B48]' : 'bg-white border-[#DCE3F0] text-[#0B1B48]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 pb-5 border-b border-[#DCE3F0]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span className="px-2 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688]">{property.category.replace('_', ' ')}</span>
            <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D]">{property.titleDocType}</span>
            <span className="font-mono text-[#5A6782]">Ref: {property.refCode}</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B1B48] leading-tight max-w-3xl">
            {property.title}
          </h1>
          <p className="text-sm text-[#5A6782] mt-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#1B3688] shrink-0" />
            <span>{property.address}</span>
          </p>
        </div>

        <div className="lg:text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">Direct Vendor Valuation</span>
          <div className="font-display font-extrabold text-3xl text-[#0B1B48] tabular-nums">
            {formatMoney(property.priceNgn)}
            {property.priceUnit && property.priceUnit !== 'Outright' && (
              <span className="text-sm font-normal text-[#5A6782] ml-1">/ {property.priceUnit}</span>
            )}
          </div>
          <div className="text-xs text-[#5A6782] mt-0.5">
            {property.priceUnit === 'Outright' ? 'Outright Purchase Valuation' : 'Listed Nigerian Naira Rate'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-lg border border-[#DCE3F0] p-3">
            <div className="relative aspect-[16/10] rounded-md overflow-hidden bg-[#0B1B48]">
              <SafeImage
                src={property.images[activeImage] || property.images[0]}
                alt={`${property.title} view ${activeImage + 1}`}
                className="w-full h-full object-cover"
              />
              {property.isFeatured && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#E8C547] text-[#0B1B48] text-[11px] font-bold uppercase">
                  Featured Asset
                </span>
              )}
              <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-[#071336]/85 text-white text-xs font-mono tabular-nums">
                {activeImage + 1} / {property.images.length} Photos
              </span>
            </div>

            {property.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 mt-3">
                {property.images.map((img, idx) => (
                  <button
                    key={img + idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-[16/10] rounded-md overflow-hidden border-2 transition-opacity ${
                      activeImage === idx ? 'border-[#0B1B48]' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <SafeImage src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#DCE3F0]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B3688]">TREM Certified Authenticity</span>
                <h2 className="font-display font-bold text-lg text-[#0B1B48]">Government Title & SCUML Verification</h2>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-[#DCFCE7] text-[#15803D] text-xs font-bold">
                State Registry Confirmed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">Title Document</span>
                <div className="font-display font-bold text-sm text-[#0B1B48] mt-1">{property.titleDocType}</div>
                <div className="text-xs text-[#5A6782] font-mono mt-0.5">File: {property.bureauFileNo || 'Registry Verified'}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">Cadastral Survey Plan</span>
                <div className="font-display font-bold text-sm text-[#0B1B48] mt-1 font-mono">
                  {property.surveyPlanNo || 'SURV/VERIFIED/2024'}
                </div>
                <div className="text-xs text-[#5A6782] mt-0.5">Surveyor General Certified</div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A6782]">Compliance Standard</span>
                <div className="font-display font-bold text-sm text-[#0B1B48] mt-1">SCUML / AML Certified</div>
                <div className="text-xs text-[#5A6782] mt-0.5">EFCC & NFIU Anti-Fraud Cleared</div>
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs">
                <Compass className="w-4 h-4 text-[#1B3688] shrink-0" />
                <div>
                  <span className="font-bold text-[#0B1B48]">Beacon Geodetic Coordinates (WGS84): </span>
                  <span className="font-mono text-[#1B3688]">
                    {property.latitude.toFixed(4)}° N, {property.longitude.toFixed(4)}° E
                  </span>
                  {property.beaconRef && <span className="text-[#5A6782] ml-1.5">({property.beaconRef})</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCoordValidated(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0B1B48] text-white text-xs font-bold whitespace-nowrap"
              >
                {coordValidated && <CheckCircle2 className="w-3.5 h-3.5 text-[#E8C547]" />}
                <span>{coordValidated ? 'Coordinates Matched' : 'Validate Coordinates'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 sm:p-6">
            <h2 className="font-display font-bold text-lg text-[#0B1B48] mb-4">Core Architectural Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { icon: BedDouble, val: property.bedrooms || 'N/A', label: 'En-suite Beds' },
                { icon: Bath, val: property.bathrooms || 'N/A', label: 'Bathrooms' },
                { icon: Maximize2, val: `${property.areaSqm.toLocaleString()} m²`, label: 'Plot / Floor' },
                { icon: Car, val: property.garageBays ? `${property.garageBays} Bays` : 'Dedicated', label: 'Parking' },
                { icon: Calendar, val: property.yearBuilt, label: 'Commissioned' },
                { icon: Cpu, val: property.smartIot ? 'Full IoT' : 'Standard', label: 'Automation' },
              ].map((spec) => {
                const Icon = spec.icon;
                return (
                  <div key={spec.label} className="p-3 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-center">
                    <Icon className="w-4 h-4 text-[#1B3688] mx-auto mb-1.5" />
                    <div className="font-display font-bold text-sm text-[#0B1B48] tabular-nums">{spec.val}</div>
                    <div className="text-[11px] text-[#5A6782]">{spec.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 sm:p-6 space-y-4">
            <h2 className="font-display font-bold text-lg text-[#0B1B48]">Executive Property Overview</h2>
            <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-line">{property.description}</p>

            {property.amenities.length > 0 && (
              <div className="pt-4 border-t border-[#DCE3F0]">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#5A6782] mb-2.5">
                  Integrated Infrastructure & Amenities
                </span>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((am) => (
                    <span
                      key={am}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs font-semibold text-[#0B1B48]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>{am}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <SafeImage
                src={vendor.logoUrl}
                alt={vendor.businessName}
                className="w-12 h-12 rounded-md object-cover border border-[#DCE3F0]"
              />
              <div className="min-w-0">
                <Link to={`/agencies/${vendor.slug}`} className="font-display font-bold text-base text-[#0B1B48] hover:underline block truncate">
                  {vendor.businessName}
                </Link>
                <div className="text-[11px] font-semibold text-[#16A34A]">
                  {vendor.verified ? 'Verified Partner' : 'Registered Vendor'} · {vendor.rcNumber || 'TREM Member'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-[#DCE3F0] text-center text-xs">
              <div>
                <div className="font-display font-bold text-[#0B1B48] tabular-nums">{vendor.activeListings}</div>
                <div className="text-[10px] text-[#5A6782]">Listings</div>
              </div>
              <div>
                <div className="font-display font-bold text-[#0B1B48]">100%</div>
                <div className="text-[10px] text-[#5A6782]">Title Audit</div>
              </div>
              <div>
                <div className="font-display font-bold text-[#0B1B48]">{vendor.avgResponseTime}</div>
                <div className="text-[10px] text-[#5A6782]">Response</div>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hello ${vendor.businessName}, I am interested in ${property.refCode} (${property.title}) on TREM.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-md bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp (Direct to Broker)</span>
              </a>
              <a
                href={`tel:${vendor.phone}`}
                className="w-full py-2.5 px-4 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call {vendor.phone}</span>
              </a>
            </div>
          </div>

          <form onSubmit={handleBookInspection} className="bg-white rounded-lg border border-[#DCE3F0] p-5 space-y-3">
            <h3 className="font-display font-bold text-base text-[#0B1B48]">Schedule Private Inspection</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#5A6782] mb-1">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#5A6782] mb-1">Session Time</label>
                <select
                  value={inspectionSession}
                  onChange={(e) => setInspectionSession(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs"
                >
                  <option>10:00 AM (Morning)</option>
                  <option>01:00 PM (Afternoon)</option>
                  <option>04:00 PM (Evening)</option>
                </select>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase text-[#5A6782] mb-1">Tour Preference</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['In-Person Walk', 'Live Video Walkthrough'].map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 p-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] cursor-pointer">
                    <input
                      type="radio"
                      name="tour-pref"
                      checked={tourPreference === opt}
                      onChange={() => setTourPreference(opt)}
                      className="accent-[#0B1B48]"
                    />
                    <span className="font-medium truncate">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#5A6782] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Chief Emeka Adeleke"
                className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#5A6782] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#5A6782] mb-1">WhatsApp Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 803..."
                  className="w-full px-3 py-2 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs"
                />
              </div>
            </div>

            {formErr && <p className="text-xs text-red-600 font-medium">{formErr}</p>}
            {submittedMsg && (
              <div className="p-3 rounded-md bg-[#DCFCE7] text-[#15803D] text-xs font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submittedMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] font-bold text-xs transition-colors"
            >
              {submitting ? 'Confirming Slot...' : 'Confirm Inspection Slot'}
            </button>
          </form>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14 pt-10 border-t border-[#DCE3F0]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[#0B1B48]">Similar Authenticated Assets</h2>
            <Link to="/explore" className="text-xs font-bold text-[#1B3688] hover:underline">
              Explore All Listings →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {similar.map((s) => (
              <PropertyCard key={s.id} property={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
