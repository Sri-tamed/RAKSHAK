import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Navigation, BarChart3, Radio, PackageOpen, Crosshair, Target, Power, Signal, Locate, MapPin } from 'lucide-react';
import L from 'leaflet';
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
  const [destination, setDestination] = useState<{lat: number, lng: number} | null>(null);
  
  const mapRef = useRef<L.Map | null>(null);
  const droneMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
    }, 1000);
  };

  // Simulate Telemetry and Drone Movement
  useEffect(() => {
    if (connectionStatus !== 'CONNECTED') return;

    const interval = setInterval(() => {
      setTelemetry(prev => {
        let newLat = prev.latitude;
        let newLng = prev.longitude;

        // Simulate flight movement
        if (flightMode !== FlightMode.MANUAL || (tilt.x !== 0 || tilt.z !== 0)) {
           const moveScale = 0.00005;
           newLat += (Math.random() - 0.5) * moveScale;
           newLng += (Math.random() - 0.5) * moveScale;
        }

        return {
          ...prev,
          battery: Math.max(0, prev.battery - 0.02),
          altitude: flightMode !== FlightMode.MANUAL ? prev.altitude + (Math.random() - 0.5) * 0.5 : prev.altitude,
          speed: flightMode === FlightMode.AUTONOMOUS ? 12 + Math.random() : prev.speed,
          temperature: 32 + Math.random() * 0.5,
          signalStrength: Math.max(80, Math.min(100, prev.signalStrength + (Math.random() * 2 - 1))),
          latitude: newLat,
          longitude: newLng
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [flightMode, connectionStatus, tilt]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (activeTab === 'MAP' && mapContainerRef.current && !mapRef.current) {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [telemetry.latitude, telemetry.longitude],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      // Add dark themed tile layer (CartoDB Dark Matter is OSM based and looks great)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Drone Marker Icon
      const droneIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 flex items-center justify-center bg-india-saffron/20 border-2 border-india-saffron rounded-full shadow-[0_0_15px_rgba(255,153,51,0.6)] animate-pulse-fast">
                <div class="w-2 h-2 bg-india-saffron rounded-full"></div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([telemetry.latitude, telemetry.longitude], { icon: droneIcon }).addTo(map);
      droneMarkerRef.current = marker;
      mapRef.current = map;

      // Click event for setting destination
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setDestination({ lat, lng });
      });

      L.control.zoom({ position: 'bottomleft' }).addTo(map);
    }

    return () => {
      if (activeTab !== 'MAP' && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        droneMarkerRef.current = null;
        destMarkerRef.current = null;
      }
    };
  }, [activeTab]);

  // Update markers when telemetry or destination changes
  useEffect(() => {
    if (mapRef.current && droneMarkerRef.current) {
      droneMarkerRef.current.setLatLng([telemetry.latitude, telemetry.longitude]);
    }

    if (mapRef.current) {
      if (destination) {
        const destIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="flex flex-col items-center">
                  <div class="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div class="bg-red-600 text-[10px] text-white px-1.5 py-0.5 rounded font-bold shadow-lg -mt-1 uppercase tracking-tighter">Target</div>
                 </div>`,
          iconSize: [40, 50],
          iconAnchor: [20, 50]
        });

        if (destMarkerRef.current) {
          destMarkerRef.current.setLatLng([destination.lat, destination.lng]);
        } else {
          destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(mapRef.current);
        }
      } else if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
    }
  }, [telemetry.latitude, telemetry.longitude, destination]);

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([telemetry.latitude, telemetry.longitude], 16, { duration: 1.5 });
    }
  };

  const handleJoystick = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'STOP') => {
    if (flightMode !== FlightMode.MANUAL || connectionStatus !== 'CONNECTED') return;
    
    const newTilt = { ...tilt };
    if (direction === 'UP') newTilt.x = -0.5;
    if (direction === 'DOWN') newTilt.x = 0.5;
    if (direction === 'LEFT') newTilt.z = 0.5;
    if (direction === 'RIGHT') newTilt.z = -0.5;
    if (direction === 'STOP') { newTilt.x = 0; newTilt.z = 0; }
    
    setTilt(newTilt);

    if (direction === 'UP') setTelemetry(t => ({...t, speed: Math.min(20, t.speed + 1.5), altitude: t.altitude + 0.8}));
    if (direction === 'DOWN') setTelemetry(t => ({...t, speed: Math.max(0, t.speed - 1.5), altitude: Math.max(0, t.altitude - 0.8)}));
  };

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

      <main className="flex-1 p-3 md:p-6 max-w-7xl mx-auto w-full space-y-4 pb-28 md:pb-6">
        
        {activeTab === 'FLY' && (
          <div className="grid lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
            <div className="lg:col-span-2 space-y-4">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                 <Drone3D tiltX={tilt.x} tiltZ={tilt.z} />
                 {connectionStatus !== 'CONNECTED' && (
                   <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-4">
                      <Signal className="w-12 h-12 text-gray-500 mb-2" />
                      <div className="text-xl font-bold text-gray-400 tracking-widest text-shadow-glow">SIGNAL LOST</div>
                      <div className="text-sm text-gray-600">Drone offline. Connect to view feed.</div>
                   </div>
                 )}
              </div>
              <TelemetryPanel data={telemetry} />
              <AILanding />
            </div>

            <div className="space-y-4">
              <div className="bg-ui-panel p-4 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-gray-400 text-xs font-mono uppercase">System Link</h3>
                    {connectionStatus === 'CONNECTED' && <div className="text-xs text-green-500 animate-pulse">● LIVE</div>}
                </div>
                
                <button 
                  onClick={toggleConnection}
                  disabled={connectionStatus === 'CONNECTING'}
                  className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 mb-4 transition-all touch-manipulation shadow-lg ${
                    connectionStatus === 'CONNECTED' 
                      ? 'bg-red-900/30 text-red-400 border border-red-900 hover:bg-red-900/50' 
                      : 'bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white shadow-green-900/40'
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
                            ? 'bg-blue-900/40 border-blue-500 text-blue-200 shadow-[inset_0_0_10px_rgba(59,130,246,0.3)]' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 active:bg-gray-700'
                        }`}
                        >
                        <span className="font-bold text-sm tracking-wide">{m}</span>
                        {flightMode === m && <Radio className="w-4 h-4 animate-pulse text-blue-400" />}
                        </button>
                    ))}
                    </div>
                </div>
              </div>

              <div className={`bg-ui-panel p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-4 transition-opacity duration-300 ${flightMode !== FlightMode.MANUAL || connectionStatus !== 'CONNECTED' ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div className="text-xs text-gray-500 uppercase tracking-widest">Manual Override</div>
                 <div className="relative w-48 h-48 bg-gray-900 rounded-full border-4 border-gray-800 shadow-[inset_0_4px_10px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden">
                    <div {...joystickProps('UP')} className="absolute top-2 left-1/2 -translate-x-1/2 p-4 z-10">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-lg active:bg-gray-700">▲</div>
                    </div>
                    <div {...joystickProps('DOWN')} className="absolute bottom-2 left-1/2 -translate-x-1/2 p-4 z-10">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-lg active:bg-gray-700">▼</div>
                    </div>
                    <div {...joystickProps('LEFT')} className="absolute left-2 top-1/2 -translate-y-1/2 p-4 z-10">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-lg active:bg-gray-700">◀</div>
                    </div>
                    <div {...joystickProps('RIGHT')} className="absolute right-2 top-1/2 -translate-y-1/2 p-4 z-10">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-lg active:bg-gray-700">▶</div>
                    </div>
                    
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-950 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.8)] border border-gray-600 flex items-center justify-center relative z-20">
                        <Crosshair className="text-gray-500 w-8 h-8 opacity-40" />
                        <div className="absolute inset-2 rounded-full border border-gray-500/10 pointer-events-none"></div>
                    </div>
                 </div>
              </div>

              <div className={`bg-ui-panel p-4 rounded-xl border border-gray-700 transition-opacity duration-300 ${connectionStatus === 'CONNECTED' ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <h3 className="text-gray-400 text-xs font-mono uppercase mb-3">Payload Manager</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[PayloadType.SALINE, PayloadType.BLOOD_UNIT, PayloadType.MEDICINE_KIT].map((p) => (
                        <button 
                            key={p}
                            onClick={() => setSelectedPayload(p)}
                            className={`p-2 text-[10px] md:text-xs font-bold rounded border h-12 flex items-center justify-center text-center leading-tight touch-manipulation transition-all ${selectedPayload === p ? 'bg-india-saffron text-white border-orange-500 shadow-lg transform scale-105' : 'bg-gray-800 text-gray-400 border-gray-700'}`}
                        >
                            {p.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <button 
                    className="w-full py-4 bg-red-600 active:bg-red-700 hover:md:bg-red-700 text-white font-bold rounded shadow-xl shadow-red-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
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
          <div className="h-[75vh] md:h-[calc(100vh-8rem)] w-full relative group animate-fade-in">
             <div 
               ref={mapContainerRef} 
               className="w-full h-full rounded-xl overflow-hidden border border-gray-700 shadow-2xl z-0"
             ></div>
             
             <div className="absolute top-4 left-4 right-4 md:left-auto md:w-80 bg-ui-dark/90 p-4 rounded-xl backdrop-blur-md border border-gray-700 shadow-2xl z-[1000] pointer-events-none">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
                        <Target className={`w-5 h-5 ${destination ? 'text-red-500 animate-pulse' : 'text-india-saffron'}`} />
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-mono">Mission Target</div>
                            <div className="font-bold text-gray-100 text-sm">
                                {destination ? 'CUSTOM DROP ZONE' : 'STATIONARY - READY'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/40 p-2 rounded border border-gray-800">
                             <div className="text-[9px] text-gray-500 uppercase font-mono">LAT</div>
                             <div className="text-xs font-mono text-india-saffron">{telemetry.latitude.toFixed(5)}</div>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-gray-800">
                             <div className="text-[9px] text-gray-500 uppercase font-mono">LNG</div>
                             <div className="text-xs font-mono text-india-saffron">{telemetry.longitude.toFixed(5)}</div>
                        </div>
                    </div>

                    {destination && (
                        <div className="bg-red-900/20 p-2 rounded border border-red-900/40 animate-fade-in">
                            <div className="text-[10px] text-red-400 uppercase font-mono mb-1">Target Coordinates</div>
                            <div className="text-xs font-mono text-red-300">
                                {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                            </div>
                        </div>
                    )}

                    <div className="text-[10px] text-gray-500 italic">
                        Tap map to set new delivery destination.
                    </div>
                </div>
             </div>

             <div className="absolute bottom-6 right-6 z-[1000]">
                <button 
                  onClick={handleRecenter}
                  className="bg-ui-panel p-4 rounded-full shadow-2xl border border-gray-600 text-white hover:border-india-saffron active:scale-95 transition-all duration-300 group bg-opacity-95 backdrop-blur-sm"
                  aria-label="Recenter Map"
                >
                   <Locate className="w-6 h-6 text-india-saffron" />
                </button>
             </div>
          </div>
        )}

        {activeTab === 'ANALYTICS' && (
           <Analytics />
        )}

      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-ui-dark/95 backdrop-blur-md border-t border-gray-800 flex justify-around items-center px-2 py-2 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.8)] md:hidden">
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
              {tab === 'MAP' && <MapIcon className={`w-6 h-6 mb-1 ${activeTab === tab ? 'fill-current' : ''}`} />}
              {tab === 'ANALYTICS' && <BarChart3 className={`w-6 h-6 mb-1 ${activeTab === tab ? 'fill-current' : ''}`} />}
              <span className="text-[10px] font-bold tracking-wider">{tab}</span>
            </button>
          ))}
      </nav>

      <div className="hidden md:flex fixed top-24 left-1/2 -translate-x-1/2 bg-ui-panel p-1 rounded-full border border-gray-700 shadow-2xl z-40 bg-opacity-90 backdrop-blur-md">
          {(['FLY', 'MAP', 'ANALYTICS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-india-saffron text-white shadow-lg shadow-orange-900/40' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab === 'FLY' && <Navigation className="w-4 h-4" />}
                {tab === 'MAP' && <MapIcon className="w-4 h-4" />}
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
