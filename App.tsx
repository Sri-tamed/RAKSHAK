import React, { useState, useEffect, useCallback } from 'react';
import { Map, Navigation, BarChart3, Radio, PackageOpen, Crosshair, Target, Power, Signal } from 'lucide-react';
import Header from './components/Header';
import Drone3D from './components/Drone3D';
import TelemetryPanel from './components/TelemetryPanel';
import AILanding from './components/AILanding';
import Analytics from './components/Analytics';
import { TelemetryData, FlightMode, PayloadType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FLY' | 'MAP' | 'ANALYTICS'>('FLY');
  const [flightMode, setFlightMode] = useState<FlightMode>(FlightMode.MANUAL);
  const [selectedPayload, setSelectedPayload] = useState<PayloadType>(PayloadType.NONE);
  const [tilt, setTilt] = useState({ x: 0, z: 0 }); // Joystick simulation
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    battery: 92,
    altitude: 0,
    speed: 0,
    signalStrength: 0,
    temperature: 32,
    latitude: 28.6139,
    longitude: 77.2090
  });

  // Handle Drone Connection
  const toggleConnection = () => {
    if (connectionStatus === 'CONNECTED') {
      setConnectionStatus('DISCONNECTED');
      setTelemetry(prev => ({...prev, signalStrength: 0, speed: 0, altitude: 0}));
      return;
    }

    setConnectionStatus('CONNECTING');
    
    // Simulate Network Handshake (Bluetooth/5G)
    setTimeout(() => {
      setConnectionStatus('CONNECTED');
      setTelemetry(prev => ({...prev, signalStrength: 100}));
    }, 2000);
  };

  // Simulate Telemetry Updates
  useEffect(() => {
    if (connectionStatus !== 'CONNECTED') return;

    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        battery: Math.max(0, prev.battery - 0.05),
        altitude: flightMode !== FlightMode.MANUAL ? prev.altitude + (Math.random() - 0.5) : prev.altitude,
        speed: flightMode === FlightMode.AUTONOMOUS ? 15 + Math.random() : prev.speed,
        temperature: 32 + Math.random() * 2,
        signalStrength: Math.max(80, Math.min(100, prev.signalStrength + (Math.random() * 10 - 5)))
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [flightMode, connectionStatus]);

  // Simple Joystick Handler (Simulated)
  const handleJoystick = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'STOP') => {
    if (flightMode !== FlightMode.MANUAL || connectionStatus !== 'CONNECTED') return;
    
    const newTilt = { ...tilt };
    if (direction === 'UP') newTilt.x = -0.5;
    if (direction === 'DOWN') newTilt.x = 0.5;
    if (direction === 'LEFT') newTilt.z = 0.5;
    if (direction === 'RIGHT') newTilt.z = -0.5;
    if (direction === 'STOP') { newTilt.x = 0; newTilt.z = 0; }
    
    setTilt(newTilt);

    // Update Speed/Alt based on input
    if (direction === 'UP') setTelemetry(t => ({...t, speed: Math.min(20, t.speed + 2), altitude: t.altitude + 1}));
    if (direction === 'DOWN') setTelemetry(t => ({...t, speed: Math.max(0, t.speed - 2), altitude: Math.max(0, t.altitude - 1)}));
  };

  return (
    <div className="min-h-screen bg-ui-dark text-white font-sans flex flex-col pb-20 md:pb-0">
      <Header connected={connectionStatus === 'CONNECTED'} battery={Math.floor(telemetry.battery)} />

      <main className="flex-1 p-4 max-w-7xl mx-auto w-full space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex bg-ui-panel p-1 rounded-lg border border-gray-700 md:w-fit mb-4">
          {(['FLY', 'MAP', 'ANALYTICS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-india-saffron text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'FLY' && <Navigation className="w-4 h-4 inline mr-2" />}
              {tab === 'MAP' && <Map className="w-4 h-4 inline mr-2" />}
              {tab === 'ANALYTICS' && <BarChart3 className="w-4 h-4 inline mr-2" />}
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'FLY' && (
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Column: Visuals & Telemetry */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                 <Drone3D tiltX={tilt.x} tiltZ={tilt.z} />
                 {connectionStatus !== 'CONNECTED' && (
                   <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-xl">
                      <Signal className="w-12 h-12 text-gray-500 mb-2" />
                      <div className="text-xl font-bold text-gray-400 tracking-widest">SIGNAL LOST</div>
                      <div className="text-sm text-gray-600">Drone offline. Connect to view feed.</div>
                   </div>
                 )}
              </div>
              <TelemetryPanel data={telemetry} />
              <AILanding />
            </div>

            {/* Right Column: Controls */}
            <div className="space-y-4">
              
              {/* Connection & Mode Selector */}
              <div className="bg-ui-panel p-4 rounded-xl border border-gray-700">
                <h3 className="text-gray-400 text-xs font-mono uppercase mb-3">System Link</h3>
                
                <button 
                  onClick={toggleConnection}
                  disabled={connectionStatus === 'CONNECTING'}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 mb-4 transition-all ${
                    connectionStatus === 'CONNECTED' 
                      ? 'bg-red-900/30 text-red-400 border border-red-900 hover:bg-red-900/50' 
                      : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50'
                  }`}
                >
                  <Power className={`w-5 h-5 ${connectionStatus === 'CONNECTING' ? 'animate-spin' : ''}`} />
                  {connectionStatus === 'CONNECTED' ? 'TERMINATE UPLINK' : connectionStatus === 'CONNECTING' ? 'ESTABLISHING HANDSHAKE...' : 'INITIATE UPLINK'}
                </button>

                <div className={`transition-opacity duration-300 ${connectionStatus === 'CONNECTED' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <h3 className="text-gray-400 text-xs font-mono uppercase mb-3 mt-4">Flight Mode</h3>
                    <div className="flex flex-col gap-2">
                    {[FlightMode.MANUAL, FlightMode.ASSISTED, FlightMode.AUTONOMOUS].map((m) => (
                        <button
                        key={m}
                        onClick={() => setFlightMode(m)}
                        className={`flex items-center justify-between p-3 rounded border transition-all ${
                            flightMode === m 
                            ? 'bg-blue-900/40 border-blue-500 text-blue-200' 
                            : 'bg-gray-800 border-gray-700 text-gray-400'
                        }`}
                        >
                        <span className="font-bold">{m}</span>
                        {flightMode === m && <Radio className="w-4 h-4 animate-pulse text-blue-400" />}
                        </button>
                    ))}
                    </div>
                </div>
              </div>

              {/* Manual Joystick Pad (Visual Only for Web) */}
              <div className={`bg-ui-panel p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-4 transition-opacity duration-300 ${flightMode !== FlightMode.MANUAL || connectionStatus !== 'CONNECTED' ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div className="text-xs text-gray-500 uppercase tracking-widest">Manual Override</div>
                 <div className="relative w-40 h-40 bg-gray-800 rounded-full border-2 border-gray-600 shadow-inner flex items-center justify-center">
                    <div className="absolute top-2 cursor-pointer hover:text-white text-gray-500" onMouseDown={() => handleJoystick('UP')} onMouseUp={() => handleJoystick('STOP')}>
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-500">▲</div>
                    </div>
                    <div className="absolute bottom-2 cursor-pointer hover:text-white text-gray-500" onMouseDown={() => handleJoystick('DOWN')} onMouseUp={() => handleJoystick('STOP')}>
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-500">▼</div>
                    </div>
                    <div className="absolute left-2 cursor-pointer hover:text-white text-gray-500" onMouseDown={() => handleJoystick('LEFT')} onMouseUp={() => handleJoystick('STOP')}>
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-500">◀</div>
                    </div>
                    <div className="absolute right-2 cursor-pointer hover:text-white text-gray-500" onMouseDown={() => handleJoystick('RIGHT')} onMouseUp={() => handleJoystick('STOP')}>
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center border border-gray-500">▶</div>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-gray-500 flex items-center justify-center">
                        <Crosshair className="text-gray-400 w-6 h-6" />
                    </div>
                 </div>
              </div>

              {/* Payload Control */}
              <div className={`bg-ui-panel p-4 rounded-xl border border-gray-700 transition-opacity duration-300 ${connectionStatus === 'CONNECTED' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <h3 className="text-gray-400 text-xs font-mono uppercase mb-3">Payload Manager</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {[PayloadType.SALINE, PayloadType.BLOOD_UNIT, PayloadType.MEDICINE_KIT].map((p) => (
                        <button 
                            key={p}
                            onClick={() => setSelectedPayload(p)}
                            className={`p-2 text-xs rounded border ${selectedPayload === p ? 'bg-india-saffron text-white border-orange-500' : 'bg-gray-800 text-gray-400 border-gray-600'}`}
                        >
                            {p.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <button 
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={selectedPayload === PayloadType.NONE}
                    onClick={() => {
                        alert(`DROPPING PAYLOAD: ${selectedPayload}`);
                        setSelectedPayload(PayloadType.NONE);
                    }}
                >
                    <PackageOpen className="w-5 h-5" /> RELEASE PAYLOAD
                </button>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'MAP' && (
          <div className="h-[70vh] w-full bg-gray-800 rounded-xl overflow-hidden relative border border-gray-700 animate-fade-in">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/77.2090,28.6139,12,0,0/800x600?access_token=Pk.mock')] bg-cover bg-center opacity-50 flex items-center justify-center">
                <span className="bg-black/80 p-4 rounded text-gray-400 backdrop-blur-sm border border-gray-600">
                    Map View Placeholder (Simulated Google Maps SDK)
                    <br/>
                    <span className="text-xs text-india-saffron mt-2 block text-center">Latitude: {telemetry.latitude.toFixed(4)} | Longitude: {telemetry.longitude.toFixed(4)}</span>
                </span>
             </div>
             {/* Simulated UI Overlay on Map */}
             <div className="absolute top-4 right-4 bg-black/80 p-3 rounded backdrop-blur-md border-l-4 border-india-green">
                <div className="text-xs text-gray-400 uppercase">Target Zone</div>
                <div className="font-bold text-white flex items-center gap-2"><Target className="w-4 h-4 text-red-500" /> Sector 4, Relief Camp</div>
                <div className="text-sm text-green-400 mt-1">ETA: 4m 30s</div>
             </div>
          </div>
        )}

        {activeTab === 'ANALYTICS' && (
           <Analytics />
        )}

      </main>
    </div>
  );
};

export default App;