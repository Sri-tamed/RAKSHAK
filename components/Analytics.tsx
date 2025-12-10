import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, BarChart, Bar 
} from 'recharts';
import { 
  ArrowLeft, Calendar, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, ChevronRight, Activity, Battery, FileText 
} from 'lucide-react';
import { MissionLog, PayloadType } from '../types';

// --- MOCK DATA GENERATION ---
const generateTelemetry = (durationMinutes: number, stability: 'stable' | 'unstable') => {
  const points = [];
  let alt = 0;
  let bat = 100;
  const steps = durationMinutes * 6; // every 10 seconds
  for (let i = 0; i <= steps; i++) {
    const time = i * 10;
    // Simulate flight phases: Takeoff -> Cruise -> Landing
    if (i < steps * 0.1) alt += 2; // Takeoff
    else if (i > steps * 0.9) alt = Math.max(0, alt - 2); // Landing
    else alt += (Math.random() - 0.5) * (stability === 'unstable' ? 5 : 1); // Cruise
    
    bat -= 0.05 + (Math.random() * 0.02);
    
    points.push({
      timeOffset: time,
      altitude: Math.max(0, parseFloat(alt.toFixed(1))),
      battery: Math.max(0, parseFloat(bat.toFixed(1))),
      speed: alt > 0 ? (10 + (Math.random() * 2)) : 0
    });
  }
  return points;
};

const MOCK_MISSIONS: MissionLog[] = [
  {
    id: 'MSN-2024-001',
    date: '2024-03-10',
    location: 'Uttarkashi Tunnel Site',
    status: 'SUCCESS',
    duration: '14m 20s',
    payload: PayloadType.MEDICINE_KIT,
    telemetrySnapshots: generateTelemetry(14, 'stable'),
    alerts: [
      { timestamp: '00:45', type: 'INFO', message: 'Takeoff sequence initiated' },
      { timestamp: '04:12', type: 'WARNING', message: 'High wind shear detected (15m/s)' },
      { timestamp: '08:30', type: 'INFO', message: 'Payload drop coordinates locked' },
      { timestamp: '14:20', type: 'INFO', message: 'Mission complete. Returned to base.' }
    ]
  },
  {
    id: 'MSN-2024-002',
    date: '2024-03-12',
    location: 'Flood Zone A - Sector 4',
    status: 'ABORTED',
    duration: '05m 12s',
    payload: PayloadType.BLOOD_UNIT,
    telemetrySnapshots: generateTelemetry(5, 'unstable'),
    alerts: [
        { timestamp: '00:30', type: 'INFO', message: 'Takeoff sequence initiated' },
        { timestamp: '03:15', type: 'CRITICAL', message: 'Sudden GPS signal loss' },
        { timestamp: '03:20', type: 'CRITICAL', message: 'Obstacle detected: Power lines' },
        { timestamp: '05:00', type: 'WARNING', message: 'Emergency Recall triggered' },
        { timestamp: '05:12', type: 'INFO', message: 'Manual landing executed' }
    ]
  },
  {
    id: 'MSN-2024-003',
    date: '2024-03-14',
    location: 'Mountain Pass Base Camp',
    status: 'SUCCESS',
    duration: '22m 05s',
    payload: PayloadType.SALINE,
    telemetrySnapshots: generateTelemetry(22, 'stable'),
    alerts: [
        { timestamp: '00:15', type: 'INFO', message: 'Auto-pilot engaged' },
        { timestamp: '10:00', type: 'INFO', message: 'Mid-point reached' },
        { timestamp: '22:05', type: 'INFO', message: 'Perfect landing detected' }
    ]
  }
];

const OVERALL_STATS_DATA = [
    { name: 'Mon', success: 85, accuracy: 92 },
    { name: 'Tue', success: 88, accuracy: 89 },
    { name: 'Wed', success: 95, accuracy: 96 },
    { name: 'Thu', success: 90, accuracy: 91 },
    { name: 'Fri', success: 98, accuracy: 99 },
];

const Analytics: React.FC = () => {
  const [selectedMission, setSelectedMission] = useState<MissionLog | null>(null);

  // --- DETAIL VIEW ---
  if (selectedMission) {
    return (
      <div className="space-y-4 animate-fade-in pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 bg-ui-panel p-4 rounded-xl border border-gray-700 sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
          <button 
            onClick={() => setSelectedMission(null)}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-300" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {selectedMission.id}
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                selectedMission.status === 'SUCCESS' ? 'bg-green-900/30 border-green-500 text-green-400' : 
                selectedMission.status === 'ABORTED' ? 'bg-orange-900/30 border-orange-500 text-orange-400' : 
                'bg-red-900/30 border-red-500 text-red-400'
              }`}>
                {selectedMission.status}
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
               <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedMission.location}</span>
               <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedMission.duration}</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-ui-panel p-4 rounded-xl border border-gray-700 h-64">
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" /> Flight Profile (Altitude/Speed)
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedMission.telemetrySnapshots}>
                        <defs>
                            <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="timeOffset" hide />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }}
                            labelFormatter={(label) => `${label}s`}
                        />
                        <Area type="monotone" dataKey="altitude" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAlt)" name="Altitude (m)" />
                        <Line type="monotone" dataKey="speed" stroke="#138808" dot={false} strokeWidth={2} name="Speed (m/s)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-ui-panel p-4 rounded-xl border border-gray-700 h-64">
                <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                    <Battery className="w-4 h-4 text-green-400" /> Battery Consumption
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedMission.telemetrySnapshots}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="timeOffset" hide />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                        <Line type="monotone" dataKey="battery" stroke="#10b981" strokeWidth={2} dot={false} name="Battery %" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Alerts Log */}
        <div className="bg-ui-panel p-4 rounded-xl border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-india-saffron" /> Mission Events Log
            </h3>
            <div className="space-y-4 relative pl-2">
                {/* Timeline Line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-700"></div>

                {selectedMission.alerts.map((alert, idx) => (
                    <div key={idx} className="relative pl-8">
                        {/* Dot */}
                        <div className={`absolute left-2.5 -translate-x-1/2 mt-1.5 w-3 h-3 rounded-full border-2 border-gray-800 ${
                            alert.type === 'CRITICAL' ? 'bg-red-500' : 
                            alert.type === 'WARNING' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}></div>
                        
                        <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50">
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                     alert.type === 'CRITICAL' ? 'bg-red-900/30 text-red-400' : 
                                     alert.type === 'WARNING' ? 'bg-orange-900/30 text-orange-400' : 'bg-blue-900/30 text-blue-400'
                                }`}>{alert.type}</span>
                                <span className="text-xs text-gray-500 font-mono">{alert.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-300">{alert.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6 pb-20">
      {/* Top Level Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-ui-panel p-4 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">TOTAL MISSIONS</h3>
            <div className="text-3xl font-bold text-white">124</div>
            <div className="text-xs text-green-400">+12% this week</div>
        </div>
        <div className="bg-ui-panel p-4 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">LIVES IMPACTED</h3>
            <div className="text-3xl font-bold text-white">450+</div>
            <div className="text-xs text-india-saffron">Critical supplies delivered</div>
        </div>
        <div className="bg-ui-panel p-4 rounded-lg border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-2">AVG RESPONSE TIME</h3>
            <div className="text-3xl font-bold text-white">8m 42s</div>
            <div className="text-xs text-blue-400">-30s improvement</div>
        </div>
      </div>

      {/* Main Graph */}
      <div className="bg-ui-panel p-4 rounded-lg border border-gray-700 h-64">
        <h3 className="text-white font-medium mb-4">Mission Success & Accuracy Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={OVERALL_STATS_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
            <Line type="monotone" dataKey="success" stroke="#138808" strokeWidth={2} name="Success Rate" />
            <Line type="monotone" dataKey="accuracy" stroke="#FF9933" strokeWidth={2} name="Drop Accuracy" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mission List */}
      <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" /> Recent Flight Logs
          </h3>
          <div className="space-y-3">
              {MOCK_MISSIONS.map((mission) => (
                  <div 
                    key={mission.id} 
                    onClick={() => setSelectedMission(mission)}
                    className="bg-ui-panel p-4 rounded-lg border border-gray-700 hover:border-gray-500 cursor-pointer transition-all active:scale-[0.99] group"
                  >
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-white group-hover:text-india-saffron transition-colors">{mission.id}</span>
                                  <span className={`text-[10px] px-2 rounded-full border ${
                                      mission.status === 'SUCCESS' ? 'bg-green-900/20 border-green-800 text-green-400' : 
                                      mission.status === 'ABORTED' ? 'bg-orange-900/20 border-orange-800 text-orange-400' : 
                                      'bg-red-900/20 border-red-800 text-red-400'
                                  }`}>
                                      {mission.status}
                                  </span>
                              </div>
                              <div className="text-xs text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {mission.date}</span>
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {mission.location}</span>
                              </div>
                          </div>
                          <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default Analytics;