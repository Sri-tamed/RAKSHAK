import React from 'react';
import { Wifi, Battery, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  battery: number;
}

const Header: React.FC<HeaderProps> = ({ connected, battery }) => {
  return (
    <header className="relative z-50 bg-ui-dark border-b border-gray-800 shadow-lg sticky top-0">
      {/* Tricolor Top Border */}
      <div className="flex h-1 w-full">
        <div className="w-1/3 bg-india-saffron"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-india-green"></div>
      </div>

      <div className="flex items-center justify-between px-3 md:px-4 py-3">
        {/* Branding */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-india-navy flex items-center justify-center bg-white overflow-hidden shadow-[0_0_10px_rgba(255,153,51,0.5)]">
               <ShieldCheck className="text-india-navy w-5 h-5 md:w-6 md:h-6" />
            </div>
            {connected && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white animate-pulse"></span>
            )}
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-wider text-white leading-none">RAKSHAK</h1>
            <p className="hidden xs:block text-[10px] md:text-xs text-india-saffron font-medium tracking-widest uppercase">Autonomous Response</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm font-medium">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${connected ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-500'}`}>
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{connected ? '5G LINK' : 'OFFLINE'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white bg-gray-800 px-2 py-1 rounded-full border border-gray-700">
            <Battery className={`w-3.5 h-3.5 ${battery < 20 ? 'text-red-500' : 'text-green-400'}`} />
            <span>{battery}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;