import React from 'react';
import { Activity, Wind, Navigation, Thermometer, ArrowUpCircle } from 'lucide-react';
import { TelemetryData } from '../types';

interface TelemetryPanelProps {
  data: TelemetryData;
}

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      <div className="bg-ui-panel p-2 md:p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
          <ArrowUpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] md:text-xs font-mono uppercase">Altitude</span>
        </div>
        <div className="text-xl md:text-2xl font-bold font-sans text-white">{data.altitude.toFixed(1)} <span className="text-xs md:text-sm text-gray-500">m</span></div>
      </div>

      <div className="bg-ui-panel p-2 md:p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
          <Activity className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[10px] md:text-xs font-mono uppercase">Speed</span>
        </div>
        <div className="text-xl md:text-2xl font-bold font-sans text-white">{data.speed.toFixed(1)} <span className="text-xs md:text-sm text-gray-500">m/s</span></div>
      </div>

      <div className="bg-ui-panel p-2 md:p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
          <Wind className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-[10px] md:text-xs font-mono uppercase">Wind</span>
        </div>
        <div className="text-xl md:text-2xl font-bold font-sans text-white">12 <span className="text-xs md:text-sm text-gray-500">km/h</span></div>
      </div>

      <div className="bg-ui-panel p-2 md:p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-1.5 text-gray-400 mb-1">
          <Thermometer className="w-3.5 h-3.5 text-red-400" />
          <span className="text-[10px] md:text-xs font-mono uppercase">Temp</span>
        </div>
        <div className="text-xl md:text-2xl font-bold font-sans text-white">{data.temperature.toFixed(0)}° <span className="text-xs md:text-sm text-gray-500">C</span></div>
      </div>
    </div>
  );
};

export default TelemetryPanel;
