import React from 'react';
import { Wifi, Battery, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  battery: number;
}

const Header: React.FC<HeaderProps> = ({ connected, battery }) => {
  return (
    <header className="relative z-50 bg-ui-dark border-b border-gray-800 shadow-lg">
      {/* Tricolor Top Border */}
      <div className="flex h-1 w-full">
        <div className="w-1/3 bg-india-saffron"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-india-green"></div>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-india-navy flex items-center justify-center bg-white overflow-hidden shadow-[0_0_10px_rgba(255,153,51,0.5)]">
               <ShieldCheck className="text-india-navy w-6 h-6" />
            </div>
            {connected && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse"></span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white leading-none">RAKSHAK</h1>
            <p className="text-xs text-india-saffron font-medium tracking-widest uppercase">Autonomous Response</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <div className={`flex items-center gap-1 ${connected ? 'text-green-400' : 'text-red-500'}`}>
            <Wifi className="w-4 h-4" />
            <span className="hidden sm:inline">{connected ? '5G LINK ACTIVE' : 'DISCONNECTED'}</span>
          </div>
          <div className="flex items-center gap-1 text-white">
            <Battery className={`w-4 h-4 ${battery < 20 ? 'text-red-500' : 'text-green-400'}`} />
            <span>{battery}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
