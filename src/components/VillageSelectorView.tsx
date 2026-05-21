import React from 'react';
import { Desa } from '../types';
import { Landmark, ArrowRight, Building } from 'lucide-react';

interface VillageSelectorViewProps {
  desaList: Desa[];
  onSelect: (desa: Desa) => void;
}

export default function VillageSelectorView({ desaList, onSelect }: VillageSelectorViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
        <Landmark className="w-12 h-12 text-indigo-600 mx-auto" />
        <h1 className="text-2xl font-black text-slate-900">Pilih Desa</h1>
        <p className="text-slate-500 text-sm font-semibold">Silakan pilih desa untuk memulai sesi aplikasi.</p>
        
        <div className="space-y-3">
          {desaList.map(desa => (
            <button
              key={desa.id}
              onClick={() => onSelect(desa)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600" />
                <span className="font-bold text-slate-800 group-hover:text-indigo-900">{desa.nama}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
