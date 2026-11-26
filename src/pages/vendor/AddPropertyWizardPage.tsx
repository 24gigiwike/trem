import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, Save, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { PropertyCategory, PropertyListing, PropertyPurpose } from '../../shared/types';
import { PortalShell } from '../../components/PortalShell';
import { SafeImage } from '../../components/SafeImage';

const WIZARD_STEPS = [
  'Classification',
  'Location',
  'Specs',
  'Pricing',
  'Title & Features',
  'Media',
  'Contacts',
  'Preview',
  'Publish',
];

const CURATED_GALLERY_ASSETS = [
  '/src/assets/images/prop_lekki_villa_1795687716839.jpg',
  '/src/assets/images/prop_interior_living_1795687721080.jpg',
  '/src/assets/images/prop_interior_kitchen_1795687720007.jpg',
  '/src/assets/images/prop_vi_plaza_1795687717957.jpg',
  '/src/assets/images/prop_maitama_residence_1795687719224.jpg',
  '/src/assets/images/prop_ikoyi_penthouse_1795687717853.jpg',
  '/src/assets/images/prop_epe_landbank_1795687718861.jpg',
  '/src/assets/images/prop_owerri_buybuild_1795687718799.jpg',
];

const AMENITY_OPTIONS = [
  '15kVA Lithium Hybrid Solar System',
  '24/7 Manned Estate Security',
  'Industrial Water Filtration Plant',
  'Smart Biometric Access',
  'Swimming Pool & Sun Deck',
  'Interlocked Paved Roads',
  'Private Cinema Lounge',
  'Boys Quarters (BQ)',
];

export function AddPropertyWizardPage() {
  const { apiFetch, vendorProfile, subscription, user } = useApp();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Canonical 9-step form state
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState<PropertyPurpose>('buy');
  const [category, setCategory] = useState<PropertyCategory>('residential');
  const [subcategory, setSubcategory] = useState('Detached Smart Villa');
  const [description, setDescription] = useState('');

  const [address, setAddress] = useState('');
  const [corridor, setCorridor] = useState('');
  const [lga, setLga] = useState('Eti-Osa');
  const [city, setCity] = useState('Lagos');
  const [state, setState] = useState('Lagos');
  const [latitude, setLatitude] = useState(6.4474);
  const [longitude, setLongitude] = useState(3.4731);
  const [beaconRef, setBeaconRef] = useState('SC/LA/2026/LK-001');

  const [bedrooms, setBedrooms] = useState(4);
  const [bathrooms, setBathrooms] = useState(5);
  const [areaSqm, setAreaSqm] = useState(600);
  const [garageBays, setGarageBays] = useState(3);
  const [yearBuilt, setYearBuilt] = useState(2024);
  const [smartIot, setSmartIot] = useState(true);

  const [priceNgn, setPriceNgn] = useState(210000000);
  const [priceUnit, setPriceUnit] = useState('Outright');

  const [titleDocType, setTitleDocType] = useState('Certificate of Occupancy (C of O)');
  const [surveyPlanNo, setSurveyPlanNo] = useState('');
  const [bureauFileNo, setBureauFileNo] = useState('');
  const [amenities, setAmenities] = useState<string[]>(['24/7 Manned Estate Security', 'Interlocked Paved Roads']);

  const [images, setImages] = useState<string[]>([CURATED_GALLERY_ASSETS[0]]);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (!editId) return;
    apiFetch<{ property: PropertyListing }>(`/api/public/properties/${editId}`)
      .then((res) => {
        const p = res.property;
        setTitle(p.title);
        setPurpose(p.purpose);
        setCategory(p.category);
        setSubcategory(p.subcategory);
        setDescription(p.description);
        setAddress(p.address);
        setCorridor(p.corridor);
        setLga(p.lga);
        setCity(p.city);
        setState(p.state);
        setLatitude(p.latitude);
        setLongitude(p.longitude);
        setBeaconRef(p.beaconRef);
        setBedrooms(p.bedrooms);
        setBathrooms(p.bathrooms);
        setAreaSqm(p.areaSqm);
        setGarageBays(p.garageBays);
        setYearBuilt(p.yearBuilt);
        setSmartIot(p.smartIot);
        setPriceNgn(p.priceNgn);
        setPriceUnit(p.priceUnit);
        setTitleDocType(p.titleDocType);
        setSurveyPlanNo(p.surveyPlanNo);
        setBureauFileNo(p.bureauFileNo);
        setAmenities(p.amenities);
        setImages(p.images);
        setVideoUrl(p.videoUrl);
      })
      .catch(() => {});
  }, [editId, apiFetch]);

  const healthScore = useMemo(() => {
    let score = 20;
    if (title.trim().length >= 10) score += 10;
    if (address.trim().length >= 6 && state.trim()) score += 15;
    if (priceNgn > 0) score += 15;
    if (description.trim().length >= 30) score += 10;
    if (titleDocType && (surveyPlanNo.trim() || bureauFileNo.trim())) score += 15;
    if (images.length >= 1) score += 10;
    if (images.length >= 3) score += 5;
    return Math.min(100, score);
  }, [title, address, state, priceNgn, description, titleDocType, surveyPlanNo, bureauFileNo, images]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      const res = await apiFetch<{ fileUrl: string }>('/api/uploads', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataBase64: base64,
        }),
      });
      setImages((prev) => [...prev, res.fileUrl]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const toggleAmenity = (am: string) => {
    setAmenities((prev) => (prev.includes(am) ? prev.filter((x) => x !== am) : [...prev, am]));
  };

  const saveProperty = async (submitForReview: boolean) => {
    if (!title.trim() || title.trim().length < 5) {
      setError('Please provide a descriptive Property Title (at least 5 characters) in Step 1.');
      setStep(1);
      return;
    }
    setSaving(true);
    setError('');
    setSuccessMsg('');

    const payload = {
      title: title.trim(),
      purpose,
      category,
      subcategory,
      description,
      priceNgn: Number(priceNgn),
      priceUnit,
      address,
      corridor: corridor || city,
      lga,
      city,
      state,
      latitude: Number(latitude),
      longitude: Number(longitude),
      beaconRef,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      areaSqm: Number(areaSqm),
      garageBays: Number(garageBays),
      yearBuilt: Number(yearBuilt),
      smartIot,
      titleDocType,
      surveyPlanNo,
      bureauFileNo,
      amenities,
      images,
      videoUrl,
      submitForReview,
    };

    try {
      if (editId) {
        await apiFetch(`/api/vendor/properties/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/api/vendor/properties', { method: 'POST', body: JSON.stringify(payload) });
      }
      setSuccessMsg(
        submitForReview
          ? 'Property submitted to TREM Moderation Queue for publication.'
          : 'Property draft saved cleanly to your inventory.'
      );
      setTimeout(() => navigate('/vendor/properties'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save property.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalShell title="Add Property Wizard">
      <div className="space-y-6">
        {/* Header & 9-Step Progress */}
        <div className="bg-white rounded-lg border border-[#DCE3F0] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B3688]">
                Canonical 9-Step Property Listing Engine · Step {step} of 9
              </span>
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-[#0B1B48]">
                {editId ? 'Update Property Asset' : 'Add Residential / Commercial / Land Asset'}
              </h1>
            </div>
            <span className="px-3 py-1 rounded-md bg-[#FEF9C3] text-[#0B1B48] text-xs font-bold tabular-nums">
              Health Score: {healthScore}%
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
            {WIZARD_STEPS.map((label, idx) => {
              const sNum = idx + 1;
              const active = step === sNum;
              const done = step > sNum;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(sNum)}
                  className={`p-2 rounded-md text-left border transition-colors ${
                    active
                      ? 'bg-[#0B1B48] text-white border-[#0B1B48]'
                      : done
                      ? 'bg-[#DCFCE7] text-[#15803D] border-[#16A34A]/30'
                      : 'bg-[#F4F6FA] text-[#5A6782] border-[#DCE3F0]'
                  }`}
                >
                  <div className="text-[10px] font-bold tabular-nums">0{sNum}</div>
                  <div className="text-[11px] font-semibold truncate">{label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main 2-Column Workspace + Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-lg border border-[#DCE3F0] p-6 space-y-5">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-lg text-[#0B1B48]">Step 1: Asset Classification & Title</h2>
                <div>
                  <label className="block text-xs font-bold mb-1">Property Identity Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 5-Bedroom Contemporary Detached Smart Villa with Infinity Pool"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">Transaction Purpose</label>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value as PropertyPurpose)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                    >
                      <option value="buy">Buy Outright</option>
                      <option value="rent">Rent</option>
                      <option value="lease">Commercial Lease</option>
                      <option value="land_banking">Land Banking</option>
                      <option value="buy_build">Buy & Build</option>
                      <option value="jv">Joint Venture (JV)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Asset Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                    >
                      <option value="residential">Residential Luxury / Homes</option>
                      <option value="commercial">Commercial Plaza / Office</option>
                      <option value="land_banking">Land Banking Acreage</option>
                      <option value="buy_build">Buy & Build Serviced Plot</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Sub-Classification</label>
                  <input
                    type="text"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="e.g. Detached Smart Villa, Grade-A Office Plaza, Corner Residential Plot"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Executive Property Overview</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe architectural finish, neighborhood security, power infrastructure, and investment thesis..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-lg text-[#0B1B48]">Step 2: Location Corridor & Geodetic Beacons</h2>
                <div>
                  <label className="block text-xs font-bold mb-1">Street Address / Estate Axis *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Admiralty Way Axis, Lekki Phase 1, Lagos"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Corridor</label>
                    <input type="text" value={corridor} onChange={(e) => setCorridor(e.target.value)} placeholder="Lekki Phase 1" className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">LGA</label>
                    <input type="text" value={lga} onChange={(e) => setLga(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">State *</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Beacon Pillar Ref</label>
                    <input type="text" value={beaconRef} onChange={(e) => setBeaconRef(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Latitude</label>
                    <input type="number" step="0.0001" value={latitude} onChange={(e) => setLatitude(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Longitude</label>
                    <input type="number" step="0.0001" value={longitude} onChange={(e) => setLongitude(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm font-mono" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-lg text-[#0B1B48]">Step 3: Architectural & Plot Specifications</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">Bedrooms / Suites</label>
                    <input type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm tabular-nums" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Bathrooms</label>
                    <input type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm tabular-nums" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Area Size (m²)</label>
                    <input type="number" min={0} value={areaSqm} onChange={(e) => setAreaSqm(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm tabular-nums" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Garage / Parking Bays</label>
                    <input type="number" min={0} value={garageBays} onChange={(e) => setGarageBays(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm tabular-nums" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Year Commissioned</label>
                    <input type="number" value={yearBuilt} onChange={(e) => setYearBuilt(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm tabular-nums" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] w-full text-xs font-bold cursor-pointer">
                      <input type="checkbox" checked={smartIot} onChange={(e) => setSmartIot(e.target.checked)} className="accent-[#0B1B48]" />
                      <span>Full IoT Smart Automation</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-lg text-[#0B1B48]">Step 4: Nigerian Naira Valuation</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">Asking Price (₦ NGN)</label>
                    <input
                      type="number"
                      min={0}
                      value={priceNgn}
                      onChange={(e) => setPriceNgn(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-base font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Pricing Unit</label>
                    <select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} className="w-full px-3.5 py-2.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-sm">
                      <option value="Outright">Outright Sale</option>
                      <option value="Per Year">Per Year (Lease / Rent)</option>
                      <option value="Per Acre">Per Acre</option>
                      <option value="Per Plot">Per Plot</option>
                    </select>
                  </div>
                </div>
                <div className="p-3.5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] text-xs text-[#5A6782]">
                  All property valuations on TREM are displayed in Nigerian Naira (₦) across public search, microsites, and buyer enquiries.
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-lg text-[#0B1B48]">Step 5: Legal Title Deeds & Smart Amenities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Title Document Type</label>
                    <select value={titleDocType} onChange={(e) => setTitleDocType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-xs">
                      <option>Certificate of Occupancy (C of O)</option>
                      <option>Governor&apos;s Consent</option>
                      <option>Government Gazette & Reg. Survey</option>
                      <option>Registered Survey & Deed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Survey Plan Number</label>
                    <input type="text" value={surveyPlanNo} onChange={(e) => setSurveyPlanNo(e.target.value)} placeholder="OG/SURV/0912/2020" className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-xs font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Land Bureau File No</label>
                    <input type="text" value={bureauFileNo} onChange={(e) => setBureauFileNo(e.target.value)} placeholder="LND/2024/LK-40912" className="w-full px-3 py-2 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-xs font-mono" />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold mb-2">Integrated Infrastructure & Amenities</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AMENITY_OPTIONS.map((am) => (
                      <label key={am} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-xs cursor-pointer">
                        <input type="checkbox" checked={amenities.includes(am)} onChange={() => toggleAmenity(am)} className="accent-[#0B1B48]" />
                        <span>{am}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display font-bold text-lg text-[#0B1B48]">Step 6: Upload Property Photos & Video Walkthrough</h2>
                  <p className="text-xs text-[#5A6782] mt-1">Upload high-resolution photos from your device (PNG/JPG/WEBP up to 5MB) or select from verified architectural presets.</p>
                </div>

                <label className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed border-[#1B3688]/40 bg-[#F4F6FA] cursor-pointer hover:bg-[#EEF2FA]">
                  <UploadCloud className="w-8 h-8 text-[#1B3688] mb-2" />
                  <span className="font-display font-bold text-sm text-[#0B1B48]">
                    {uploading ? 'Uploading image securely...' : 'Click to Upload Property Photo'}
                  </span>
                  <span className="text-xs text-[#5A6782] mt-1">Supports PNG, JPG, WEBP up to 5MB</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} className="hidden" />
                </label>

                <div>
                  <span className="block text-xs font-bold text-[#0B1B48] mb-2">Uploaded Gallery ({images.length} Photos)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((img, i) => (
                      <div key={img + i} className="relative rounded-md overflow-hidden border border-[#DCE3F0] aspect-[16/10] group">
                        <SafeImage src={img} alt={`Property media ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#E8C547] text-[#0B1B48] text-[10px] font-bold">
                            Cover
                          </span>
                        )}
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          {i !== 0 && (
                            <button
                              type="button"
                              onClick={() => setImages([img, ...images.filter((_, idx) => idx !== i)])}
                              className="px-2 py-1 rounded bg-[#0B1B48] text-white text-[10px] font-bold"
                            >
                              Set Cover
                            </button>
                          )}
                          {images.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                              className="p-1 rounded bg-red-600 text-white"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-[#5A6782] mb-2">Or Add Verified TREM Sample Media</span>
                  <div className="flex flex-wrap gap-2">
                    {CURATED_GALLERY_ASSETS.map((asset, idx) => (
                      <button
                        key={asset}
                        type="button"
                        onClick={() => !images.includes(asset) && setImages([...images, asset])}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EEF2FA] text-[#1B3688] text-xs font-semibold hover:bg-[#DCE3F0]"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>Preset {idx + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">4K Walkthrough Video URL (YouTube / Vimeo / Matterport)</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://vimeo.com/..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#F4F6FA] border border-[#DCE3F0] text-sm"
                  />
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-lg text-[#0B1B48]">Step 7: Vendor Contact & Lead Routing</h2>
                <div className="p-4 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] space-y-2 text-xs">
                  <div className="font-bold text-[#0B1B48]">Assigned Representative: {vendorProfile?.representativeName || `${user?.firstName} ${user?.lastName}`}</div>
                  <div className="text-[#5A6782]">Business Entity: {vendorProfile?.businessName}</div>
                  <div className="text-[#5A6782]">WhatsApp & Inspection Phone: {user?.phone}</div>
                  <div className="text-[#5A6782]">Official Email: {user?.email}</div>
                </div>
                <p className="text-xs text-[#5A6782]">
                  All formal buyer inquiries and Live Video / In-Person inspection requests from this asset route directly to your Leads & Inquiries workspace.
                </p>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-lg text-[#0B1B48]">Step 8: Marketplace Preview & Readiness Audit</h2>
                <div className="p-5 rounded-md bg-[#F4F6FA] border border-[#DCE3F0] space-y-3">
                  <div className="text-xs font-bold text-[#1B3688] uppercase">{category.replace('_', ' ')} · {titleDocType}</div>
                  <div className="font-display font-extrabold text-xl text-[#0B1B48]">{title || 'Untitled Property Asset'}</div>
                  <div className="text-xs text-[#5A6782]">{address || 'Address pending'} · {city}, {state}</div>
                  <div className="font-display font-extrabold text-2xl text-[#0B1B48] tabular-nums">
                    ₦{priceNgn.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { ok: title.trim().length >= 5, label: 'Property Title & Classification' },
                    { ok: address.trim().length >= 5 && Boolean(state), label: 'Street Address & State Geo-Tag' },
                    { ok: priceNgn > 0, label: 'Nigerian Naira (₦) Listing Valuation' },
                    { ok: Boolean(surveyPlanNo || bureauFileNo), label: 'Cadastral Survey / Bureau File Reference' },
                    { ok: images.length >= 1, label: 'High-Definition Property Media Uploaded' },
                  ].map((chk) => (
                    <div key={chk.label} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${chk.ok ? 'text-[#16A34A]' : 'text-slate-300'}`} />
                      <span className={chk.ok ? 'text-[#0B1B48] font-semibold' : 'text-[#5A6782]'}>{chk.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 9 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-lg text-[#0B1B48]">Step 9: Publish & Submit for Moderation</h2>
                <div className="p-4 rounded-md bg-[#EEF2FA] border border-[#1B3688]/20 space-y-2 text-xs">
                  <div className="font-bold text-[#0B1B48] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#1B3688]" />
                    <span>Server-Side Entitlement & Verification Check</span>
                  </div>
                  <p className="text-[#334155]">
                    KYC Status: <strong className="uppercase">{vendorProfile?.verificationStatus || 'unverified'}</strong> ·
                    Subscription: <strong className="uppercase">{subscription ? subscription.planCode : 'none'}</strong>
                  </p>
                  {(!subscription || vendorProfile?.verificationStatus !== 'verified') && (
                    <p className="text-amber-700 font-semibold">
                      Note: Save as Draft now, then activate your subscription and complete KYC approval before submitting for public review.
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs font-bold text-red-700">{error}</div>}
            {successMsg && <div className="p-3 rounded-md bg-[#DCFCE7] text-xs font-bold text-[#15803D]">{successMsg}</div>}

            {/* Navigation Footer */}
            <div className="pt-5 border-t border-[#DCE3F0] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={step === 1}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-[#EEF2FA] text-[#0B1B48] text-xs font-bold disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveProperty(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-white border border-[#DCE3F0] text-[#0B1B48] text-xs font-bold hover:bg-[#F4F6FA]"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>

                {step < 9 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(9, s + 1))}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-[#E8C547] hover:bg-[#D9B330] text-[#0B1B48] text-xs font-bold"
                  >
                    <span>Continue to Step {step + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => saveProperty(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-[#0B1B48] hover:bg-[#1B3688] text-white text-xs font-bold"
                  >
                    <span>{saving ? 'Submitting...' : 'Submit for Moderation'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Live Preview Sidebar */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            <div className="bg-white rounded-lg border border-[#DCE3F0] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#DCE3F0] flex items-center justify-between text-xs font-bold">
                <span>LIVE MARKETPLACE PREVIEW</span>
                <span className="px-2 py-0.5 rounded bg-[#EEF2FA] text-[#1B3688]">Buyer View</span>
              </div>
              <div className="aspect-[16/10] bg-[#0B1B48]">
                <SafeImage src={images[0]} alt={title || 'Preview'} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[11px] font-bold uppercase text-[#1B3688]">
                  {category.replace('_', ' ')} · {city}, {state}
                </div>
                <div className="font-display font-bold text-sm text-[#0B1B48] line-clamp-2">
                  {title || 'Your Property Title Appears Here'}
                </div>
                <div className="font-display font-extrabold text-lg text-[#0B1B48] tabular-nums">
                  ₦{priceNgn.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#DCE3F0] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#0B1B48]">Listing Health Score</span>
                <span className="font-display font-extrabold text-lg text-[#16A34A] tabular-nums">{healthScore}%</span>
              </div>
              <div className="h-2 rounded-sm bg-[#EEF2FA] overflow-hidden">
                <div className="h-full bg-[#E8C547] transition-all" style={{ width: `${healthScore}%` }} />
              </div>
              <p className="text-xs text-[#5A6782]">
                Complete survey reference, 3+ photos, and full overview to achieve Tier-1 Institutional Grade.
              </p>
              <Link to="/vendor/properties" className="block text-xs font-bold text-[#1B3688] hover:underline">
                Return to Inventory →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </PortalShell>
  );
}
