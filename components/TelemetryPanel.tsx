import React from 'react';
import { Activity, Wind, Navigation, Thermometer, ArrowUpCircle } from 'lucide-react';
import { TelemetryData } from '../types';

interface TelemetryPanelProps {
  data: TelemetryData;
}

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-ui-panel p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 text-gray-400 mb-1">
          <ArrowUpCircle className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono uppercase">Altitude</span>
        </div>
        <div className="text-2xl font-bold font-sans text-white">{data.altitude.toFixed(1)} <span className="text-sm text-gray-500">m</span></div>
      </div>

      <div className="bg-ui-panel p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 text-gray-400 mb-1">
          <Activity className="w-4 h-4 text-green-400" />
          <span className="text-xs font-mono uppercase">Speed</span>
        </div>
        <div className="text-2xl font-bold font-sans text-white">{data.speed.toFixed(1)} <span className="text-sm text-gray-500">m/s</span></div>
      </div>

      <div className="bg-ui-panel p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 text-gray-400 mb-1">
          <Wind className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-mono uppercase">Wind</span>
        </div>
        <div className="text-2xl font-bold font-sans text-white">12 <span className="text-sm text-gray-500">km/h NW</span></div>
      </div>

      <div className="bg-ui-panel p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 text-gray-400 mb-1">
          <Thermometer className="w-4 h-4 text-red-400" />
          <span className="text-xs font-mono uppercase">Motor Temp</span>
        </div>
        <div className="text-2xl font-bold font-sans text-white">{data.temperature}° <span className="text-sm text-gray-500">C</span></div>
      </div>
    </div>
  );
};

export default TelemetryPanel;
