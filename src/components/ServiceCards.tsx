/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shirt, Layers, Grid, Check } from 'lucide-react';

export interface ServiceItem {
  id: string;
  name: string;
  rate: number;
  icon: typeof Shirt;
}

interface ServiceCardsProps {
  services: ServiceItem[];
  selectedServiceId: string;
  onSelectService: (service: ServiceItem) => void;
}

export const ServiceCards: React.FC<ServiceCardsProps> = ({
  services,
  selectedServiceId,
  onSelectService,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {services.map((service) => {
        const Icon = service.icon;
        const isSelected = selectedServiceId === service.id;

        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelectService(service)}
            className={`min-h-[90px] sm:min-h-[110px] rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center transition-all relative border active:scale-98 cursor-pointer ${
              isSelected
                ? 'bg-sky-600 border-sky-600 text-white shadow-sm shadow-sky-600/15'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
            }`}
          >
            {isSelected && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}

            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1.5 sm:mb-2 transition-colors ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-sky-50 text-sky-700'
              }`}
            >
              <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>

            <span className="font-bold text-xs sm:text-sm leading-tight block truncate max-w-full">
              {service.name}
            </span>

            <span
              className={`text-[11px] sm:text-xs font-mono mt-0.5 block ${
                isSelected ? 'text-sky-100 font-medium' : 'text-slate-500'
              }`}
            >
              Rp {service.rate.toLocaleString('id-ID')} / kg
            </span>
          </button>
        );
      })}
    </div>
  );
};

