import { Bookmark, BedDouble, Bath, Maximize2, MapPin, ShieldCheck, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PropertyListing } from '../shared/types';
import { formatMoney } from '../shared/commercial';
import { useApp } from '../context/AppContext';
import { SafeImage } from './SafeImage';

export function PropertyCard({ property, compact = false }: { property: PropertyListing; compact?: boolean }) {
  const { savedIds, toggleSaved } = useApp();
  const isSaved = savedIds.includes(property.id);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleSaved(property.id);
  };

  const categoryLabel =
    property.category === 'residential'
      ? 'Residential'
      : property.category === 'commercial'
      ? 'Commercial'
      : property.category === 'land_banking'
      ? 'Land Banking'
      : 'Buy & Build';

  return (
    <article className="group bg-white rounded-lg border border-[#DCE3F0] overflow-hidden flex flex-col transition-colors duration-200 hover:border-[#0B1B48]/50">
      <Link to={`/properties/${property.refCode}`} className="relative block aspect-[16/10] overflow-hidden bg-[#0B1B48]">
        <SafeImage
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0B1B48] text-white whitespace-nowrap">
              {property.purpose === 'rent'
                ? 'For Rent'
                : property.category === 'land_banking'
                ? 'Land Banking'
                : property.category === 'buy_build'
                ? 'Buy & Build'
                : 'For Sale'}
            </span>
            {property.isPromoted && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E8C547] text-[#0B1B48] whitespace-nowrap">
                Featured
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            aria-label={isSaved ? 'Remove from saved properties' : 'Save property'}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors shrink-0 border ${
              isSaved
                ? 'bg-[#E8C547] border-[#E8C547] text-[#0B1B48]'
                : 'bg-white/95 border-white/40 text-[#0B1B48] hover:bg-white'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-white">
          <span className="flex items-center gap-1 text-xs font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-[#E8C547] shrink-0" />
            <span className="truncate">{property.corridor || property.city}, {property.state}</span>
          </span>
          <span className="text-[11px] font-mono bg-[#071336]/80 px-2 py-0.5 rounded whitespace-nowrap shrink-0 tabular-nums">
            {property.images.length} Photos
          </span>
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#5A6782] uppercase tracking-wider mb-1.5">
            <span className="truncate">{categoryLabel} · {property.subcategory || property.titleDocType}</span>
            <span className="font-mono text-[#0B1B48] shrink-0">{property.refCode}</span>
          </div>

          <Link to={`/properties/${property.refCode}`} className="block">
            <h3 className="font-display font-bold text-base text-[#0B1B48] leading-snug line-clamp-2 group-hover:text-[#1B3688]">
              {property.title}
            </h3>
          </Link>

          <p className="text-xs text-[#5A6782] mt-1 truncate">{property.address}</p>

          {!compact && (
            <div className="grid grid-cols-3 gap-2 mt-3.5 py-2.5 border-y border-[#DCE3F0] text-xs">
              {property.bedrooms > 0 ? (
                <>
                  <div className="flex items-center gap-1.5 text-[#0B1B48] font-medium">
                    <BedDouble className="w-3.5 h-3.5 text-[#1B3688] shrink-0" />
                    <span className="tabular-nums">{property.bedrooms} Beds</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#0B1B48] font-medium">
                    <Bath className="w-3.5 h-3.5 text-[#1B3688] shrink-0" />
                    <span className="tabular-nums">{property.bathrooms} Baths</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#0B1B48] font-medium">
                    <Maximize2 className="w-3.5 h-3.5 text-[#1B3688] shrink-0" />
                    <span className="tabular-nums">{property.areaSqm.toLocaleString()} m²</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[#0B1B48] font-medium truncate">
                    <span className="block text-[10px] uppercase tracking-wider text-[#5A6782]">Area</span>
                    <span className="tabular-nums">{property.areaSqm.toLocaleString()} m²</span>
                  </div>
                  <div className="text-[#0B1B48] font-medium truncate">
                    <span className="block text-[10px] uppercase tracking-wider text-[#5A6782]">Topography</span>
                    <span>100% Dry</span>
                  </div>
                  <div className="text-[#0B1B48] font-medium truncate">
                    <span className="block text-[10px] uppercase tracking-wider text-[#5A6782]">Allocation</span>
                    <span>Instant</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className={compact ? 'pt-2 border-t border-[#DCE3F0]' : ''}>
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <div className="font-display font-extrabold text-lg text-[#0B1B48] tabular-nums">
              {formatMoney(property.priceNgn)}
              {property.priceUnit && property.priceUnit !== 'Outright' && (
                <span className="text-xs font-normal text-[#5A6782] ml-1">/ {property.priceUnit}</span>
              )}
            </div>
            {property.vendorVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5" />
                Title Vetted
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#DCE3F0]/60">
            {property.vendorSlug ? (
              <Link
                to={`/agencies/${property.vendorSlug}`}
                className="text-xs font-semibold text-[#1B3688] hover:underline truncate"
              >
                {property.vendorName}
              </Link>
            ) : (
              <span className="text-xs text-[#5A6782] truncate">{property.vendorName}</span>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                to={`/properties/${property.refCode}?action=enquire`}
                title="Direct Inquiry"
                className="p-2 rounded-md border border-[#DCE3F0] text-[#0B1B48] hover:bg-[#F4F6FA] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#16A34A]" />
              </Link>
              <Link
                to={`/properties/${property.refCode}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#0B1B48] text-white text-xs font-semibold hover:bg-[#1B3688] transition-colors whitespace-nowrap"
              >
                View Asset
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
