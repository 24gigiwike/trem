import { useState } from 'react';
import { TREM_LOGO_URL } from '../shared/commercial';

export function TremLogo({ dark = false, subtitle }: { dark?: boolean; subtitle?: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="flex items-center gap-2.5 shrink-0">
      {!imgFailed ? (
        <img
          src={TREM_LOGO_URL}
          alt="TREM Logo"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-8 w-8 rounded-md object-contain bg-white p-0.5 border border-[#DCE3F0]"
        />
      ) : (
        <div
          className={`h-8 w-8 rounded-md flex items-center justify-center font-display font-extrabold text-sm ${
            dark ? 'bg-[#E8C547] text-[#0B1B48]' : 'bg-[#0B1B48] text-white'
          }`}
        >
          T
        </div>
      )}
      <div className="leading-none">
        <span className={`font-display font-extrabold text-lg tracking-tight whitespace-nowrap ${dark ? 'text-white' : 'text-[#0B1B48]'}`}>
          TREM
        </span>
        {subtitle && (
          <span className={`block text-[10px] font-semibold tracking-wider uppercase mt-0.5 whitespace-nowrap ${dark ? 'text-slate-300' : 'text-[#5A6782]'}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
