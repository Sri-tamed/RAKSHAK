import React, { useState, useEffect } from 'react';
import { Map, Navigation, BarChart3, Radio, PackageOpen, Crosshair, Target, Power, Signal, Locate } from 'lucide-react';
import Header from './components/Header';
import Drone3D from './components/Drone3D';
import TelemetryPanel from './components/TelemetryPanel';
import AILanding from './components/AILanding';
import Analytics from './components/Analytics';
import { TelemetryData, FlightMode, PayloadType } from './types';
import MapView from "./components/MapView";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FLY' | 'MAP' | 'ANALYTICS'>('FLY');
  const [flightMode, setFlightMode] = useState<FlightMode>(FlightMode.MANUAL);
  const [selectedPayload, setSelectedPayload] = useState<PayloadType>(PayloadType.NONE);
  const [tilt, setTilt] = useState({ x: 0, z: 0 }); // Joystick simulation
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [recenterMap, setRecenterMap] = useState(false);
  
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

  const handleRecenter = () => {
    setRecenterMap(true);
    setTimeout(() => setRecenterMap(false), 1000);
  };

  // Helper for joystick button attributes
  const joystickProps = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => ({
    onMouseDown: () => handleJoystick(dir),
    onMouseUp: () => handleJoystick('STOP'),
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); handleJoystick(dir); },
    onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); handleJoystick('STOP'); },
    className: "absolute cursor-pointer hover:text-white text-gray-500 active:text-india-saffron transition-colors"
  });

  return (
    <div className="min-h-screen bg-ui-dark text-white font-sans flex flex-col">
      <Header connected={connectionStatus === 'CONNECTED'} battery={Math.floor(telemetry.battery)} />

      {/* Main Content Area - padded bottom for nav bar */}
      <main className="flex-1 p-3 md:p-6 max-w-7xl mx-auto w-full space-y-4 pb-28 md:pb-6">
        
        {activeTab === 'FLY' && (
          <div className="grid lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
            {/* Left Column: Visuals & Telemetry */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                 <Drone3D tiltX={tilt.x} tiltZ={tilt.z} />
                 {connectionStatus !== 'CONNECTED' && (
                   <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4">
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
              <div className="bg-ui-panel p-4 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-gray-400 text-xs font-mono uppercase">System Link</h3>
                    {connectionStatus === 'CONNECTED' && <div className="text-xs text-green-500 animate-pulse">● LIVE</div>}
                </div>
                
                <button 
                  onClick={toggleConnection}
                  disabled={connectionStatus === 'CONNECTING'}
                  className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 mb-4 transition-all touch-manipulation ${
                    connectionStatus === 'CONNECTED' 
                      ? 'bg-red-900/30 text-red-400 border border-red-900 hover:bg-red-900/50' 
                      : 'bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white shadow-lg shadow-green-900/50'
                  }`}
                >
                  <Power className={`w-5 h-5 ${connectionStatus === 'CONNECTING' ? 'animate-spin' : ''}`} />
                  {connectionStatus === 'CONNECTED' ? 'TERMINATE UPLINK' : connectionStatus === 'CONNECTING' ? 'ESTABLISHING...' : 'INITIATE UPLINK'}
                </button>

                <div className={`transition-opacity duration-300 ${connectionStatus === 'CONNECTED' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <h3 className="text-gray-400 text-xs font-mono uppercase mb-2 mt-4">Flight Mode</h3>
                    <div className="grid grid-cols-1 gap-2">
                    {[FlightMode.MANUAL, FlightMode.ASSISTED, FlightMode.AUTONOMOUS].map((m) => (
                        <button
                        key={m}
                        onClick={() => setFlightMode(m)}
                        className={`flex items-center justify-between p-3 rounded border transition-all touch-manipulation ${
                            flightMode === m 
                            ? 'bg-blue-900/40 border-blue-500 text-blue-200' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 active:bg-gray-700'
                        }`}
                        >
                        <span className="font-bold text-sm">{m}</span>
                        {flightMode === m && <Radio className="w-4 h-4 animate-pulse text-blue-400" />}
                        </button>
                    ))}
                    </div>
                </div>
              </div>

              {/* Manual Joystick Pad */}
              <div className={`bg-ui-panel p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-4 transition-opacity duration-300 ${flightMode !== FlightMode.MANUAL || connectionStatus !== 'CONNECTED' ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div className="text-xs text-gray-500 uppercase tracking-widest">Manual Override</div>
                 <div className="relative w-48 h-48 bg-gray-800/80 rounded-full border-4 border-gray-700 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    {/* Up */}
                    <div {...joystickProps('UP')} className="absolute top-2 left-1/2 -translate-x-1/2 p-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600 shadow-md">▲</div>
                    </div>
                    {/* Down */}
                    <div {...joystickProps('DOWN')} className="absolute bottom-2 left-1/2 -translate-x-1/2 p-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600 shadow-md">▼</div>
                    </div>
                    {/* Left */}
                    <div {...joystickProps('LEFT')} className="absolute left-2 top-1/2 -translate-y-1/2 p-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600 shadow-md">◀</div>
                    </div>
                    {/* Right */}
                    <div {...joystickProps('RIGHT')} className="absolute right-2 top-1/2 -translate-y-1/2 p-4">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600 shadow-md">▶</div>
                    </div>
                    
                    {/* Center Decoration */}
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-gray-500 flex items-center justify-center">
                        <Crosshair className="text-gray-400 w-8 h-8" />
                    </div>
                 </div>
              </div>

              {/* Payload Control */}
              <div className={`bg-ui-panel p-4 rounded-xl border border-gray-700 transition-opacity duration-300 ${connectionStatus === 'CONNECTED' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <h3 className="text-gray-400 text-xs font-mono uppercase mb-3">Payload Manager</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[PayloadType.SALINE, PayloadType.BLOOD_UNIT, PayloadType.MEDICINE_KIT].map((p) => (
                        <button 
                            key={p}
                            onClick={() => setSelectedPayload(p)}
                            className={`p-2 text-[10px] md:text-xs font-bold rounded border h-12 flex items-center justify-center text-center leading-tight touch-manipulation transition-all ${selectedPayload === p ? 'bg-india-saffron text-white border-orange-500 shadow-md transform scale-105' : 'bg-gray-800 text-gray-400 border-gray-600'}`}
                        >
                            {p.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <button 
                    className="w-full py-4 bg-red-600 active:bg-red-700 hover:md:bg-red-700 text-white font-bold rounded shadow-lg shadow-red-900/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    disabled={selectedPayload === PayloadType.NONE}
                    onClick={() => {
                        alert(`DROPPING PAYLOAD: ${selectedPayload}`);
                        setSelectedPayload(PayloadType.NONE);
                    }}
                >
                    <PackageOpen className="w-5 h-5" /> RELEASE
                </button>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'MAP' && (
          <div className="h-[75vh] md:h-[calc(100vh-8rem)] w-full bg-gray-800 rounded-xl overflow-hidden relative border border-gray-700 animate-fade-in shadow-xl group">
             {/* Map Background with Simulated Movement */}
             <div className={`absolute top-0 left-0 w-full h-full bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/77.2090,28.6139,12,0,0/800x600?access_token=Pk.mock')] bg-cover bg-center transition-transform duration-1000 ${recenterMap ? 'scale-110' : 'scale-100'} opacity-60`}></div>
             
             {/* Center Content */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-black/80 p-6 rounded-xl text-gray-400 backdrop-blur-md border border-gray-600 text-center mx-4 max-w-[90%] md:max-w-md shadow-2xl">
                    <Map className="w-8 h-8 text-india-saffron mx-auto mb-2" />
                    <div className="font-bold text-gray-200">Map View Placeholder</div>
                    <div className="text-xs text-gray-500 mt-1">Google Maps SDK Integration Required</div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                        <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                             <span className="text-[10px] text-gray-500 block">LATITUDE</span>
                             <span className="text-xs font-mono text-india-saffron">{telemetry.latitude.toFixed(6)}</span>
                        </div>
                        <div className="bg-gray-900/50 p-2 rounded border border-gray-700">
                             <span className="text-[10px] text-gray-500 block">LONGITUDE</span>
                             <span className="text-xs font-mono text-india-saffron">{telemetry.longitude.toFixed(6)}</span>
                        </div>
                    </div>
                </span>
             </div>

             {/* UI Overlay on Map - Top */}
             <div className="absolute top-4 left-4 right-4 md:w-auto md:right-4 bg-ui-dark/90 p-3 rounded-lg backdrop-blur-md border-l-4 border-india-green shadow-lg z-10">
                <div className="flex justify-between items-start md:block md:space-y-2">
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Active Mission</div>
                        <div className="font-bold text-white flex items-center gap-2 text-sm md:text-base whitespace-nowrap"><Target className="w-4 h-4 text-red-500 animate-pulse" /> Sector 4, Relief Camp</div>
                    </div>
                    <div className="text-right md:text-left md:border-t md:border-gray-700 md:pt-2">
                         <div className="text-xs text-green-400 font-mono">ETA</div>
                         <div className="font-bold text-lg md:text-xl">04:30</div>
                    </div>
                </div>
             </div>

             {/* Recenter Button - Floating Bottom Right */}
             <div className="absolute bottom-4 right-4 z-20">
                <button 
                  onClick={handleRecenter}
                  className="bg-ui-panel p-3 md:p-4 rounded-full shadow-xl border border-gray-600 text-white hover:bg-india-navy hover:border-india-saffron active:scale-95 transition-all duration-300 group-hover:animate-bounce-slow"
                  aria-label="Recenter Map"
                >
                   <Locate className={`w-6 h-6 ${recenterMap ? 'animate-spin' : ''}`} />
                </button>
             </div>
          </div>
        )}

        {activeTab === 'ANALYTICS' && (
           <Analytics />
        )}

      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-ui-dark/95 backdrop-blur-md border-t border-gray-800 flex justify-around items-center px-2 py-2 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:hidden">
          {(['FLY', 'MAP', 'ANALYTICS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-all active:scale-95 ${
                activeTab === tab 
                  ? 'text-india-saffron' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'FLY' && <Navigation className={`w-6 h-6 mb-1 ${activeTab === tab ? 'fill-current' : ''}`} />}
              {tab === 'MAP' && <Map className={`w-6 h-6 mb-1 ${activeTab === tab ? 'fill-current' : ''}`} />}
              {tab === 'ANALYTICS' && <BarChart3 className={`w-6 h-6 mb-1 ${activeTab === tab ? 'fill-current' : ''}`} />}
              <span className="text-[10px] font-bold tracking-wider">{tab}</span>
            </button>
          ))}
      </nav>

      {/* Desktop Navigation (Hidden on mobile) */}
      <div className="hidden md:flex fixed top-24 left-1/2 -translate-x-1/2 bg-ui-panel p-1 rounded-full border border-gray-700 shadow-xl z-40">
          {(['FLY', 'MAP', 'ANALYTICS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-india-saffron text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab === 'FLY' && <Navigation className="w-4 h-4" />}
                {tab === 'MAP' && <Map className="w-4 h-4" />}
                {tab === 'ANALYTICS' && <BarChart3 className="w-4 h-4" />}
                {tab}
              </div>
            </button>
          ))}
      </div>

    </div>
  );
};

export default App;