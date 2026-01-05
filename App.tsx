import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Navigation, BarChart3, Radio, PackageOpen, Crosshair, Target, Power, Signal, Locate, MapPin, CheckCircle, XCircle, Loader2, Cpu } from 'lucide-react';
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
  const [tilt, setTilt] = useState({ x: 0, z: 0 }); 
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [destination, setDestination] = useState<{lat: number, lng: number} | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // Drone Communication State
  const [droneIp, setDroneIp] = useState('192.168.1.10');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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

  const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);

  /**
   * Networking logic for drone communication with enhanced error handling
   */
  const sendDroneCommand = async (lat: number, lon: number, alt: number = 15) => {
    setIsSending(true);
    setStatusMessage(null);
    const controller = new AbortController();
    
    // Set a specific reason for the abort to avoid "without reason" errors
    const timeoutId = setTimeout(() => controller.abort("Timeout"), 5000);

    try {
      const url = `http://${droneIp}:5000/fly?lat=${lat}&lon=${lon}&alt=${alt}`;
      
      const response = await fetch(url, { 
        method: 'GET',
        mode: 'no-cors', // Many drone APIs don't handle CORS headers; 'no-cors' allows simple GET
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);

      // Note: With 'no-cors', response.ok is always false and status is 0. 
      // We assume success if the fetch doesn't throw.
      setIsConfirmed(true);
      setStatusMessage('COMMAND SENT');
      
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Drone transmission failed:', err);

      if (err.name === 'AbortError' || err === 'Timeout' || controller.signal.aborted) {
        setStatusMessage('UPLINK TIMEOUT');
      } else if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
        setStatusMessage('CONNECTION REFUSED');
      } else {
        setStatusMessage('UPLINK FAILED');
      }
    } finally {
      setIsSending(false);
    }
  };

  const toggleConnection = () => {
    if (connectionStatus === 'CONNECTED') {
      setConnectionStatus('DISCONNECTED');
      setTelemetry(prev => ({...prev, signalStrength: 0, speed: 0, altitude: 0}));
      return;
    }
    setConnectionStatus('CONNECTING');
    setTimeout(() => {
      setConnectionStatus('CONNECTED');
      setTelemetry(prev => ({...prev, signalStrength: 100}));
    }, 1000);
  };

  useEffect(() => {
    if (connectionStatus !== 'CONNECTED') return;
    const interval = setInterval(() => {
      setTelemetry(prev => {
        let newLat = prev.latitude;
        let newLng = prev.longitude;
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

  useEffect(() => {
    if (activeTab === 'MAP' && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [telemetry.latitude, telemetry.longitude],
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

      const droneIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 flex items-center justify-center bg-india-saffron/20 border-2 border-india-saffron rounded-full shadow-[0_0_15px_rgba(255,153,51,0.6)] animate-pulse-fast">
                <div class="w-2 h-2 bg-india-saffron rounded-full"></div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      droneMarkerRef.current = L.marker([telemetry.latitude, telemetry.longitude], { icon: droneIcon }).addTo(map);
      mapRef.current = map;

      map.on('click', (e) => {
        setDestination({ lat: e.latlng.lat, lng: e.latlng.lng });
        setIsConfirmed(false);
        setStatusMessage(null);
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
  }, [activeTab, telemetry.latitude, telemetry.longitude]);

  useEffect(() => {
    if (mapRef.current && droneMarkerRef.current) {
      droneMarkerRef.current.setLatLng([telemetry.latitude, telemetry.longitude]);
    }

    if (destination) {
      const droneLatLng = L.latLng(telemetry.latitude, telemetry.longitude);
      const targetLatLng = L.latLng(destination.lat, destination.lng);
      setDistanceToTarget(droneLatLng.distanceTo(targetLatLng));

      if (mapRef.current) {
        const markerColor = isConfirmed ? 'text-green-500' : 'text-india-saffron';
        const labelText = isConfirmed ? 'Locked' : 'Pending';
        const labelBg = isConfirmed ? 'bg-green-600' : 'bg-india-saffron';
        
        const destIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="flex flex-col items-center">
                  <div class="${markerColor} drop-shadow-[0_0_8px_currentColor] ${isConfirmed ? '' : 'animate-bounce'}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div class="${labelBg} text-[10px] text-white px-1.5 py-0.5 rounded font-bold shadow-lg -mt-1 uppercase tracking-tighter">${labelText}</div>
                 </div>`,
          iconSize: [40, 50],
          iconAnchor: [20, 50]
        });

        if (destMarkerRef.current) {
          destMarkerRef.current.setLatLng([destination.lat, destination.lng]);
          destMarkerRef.current.setIcon(destIcon);
        } else {
          destMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(mapRef.current);
        }
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
      setDistanceToTarget(null);
    }
  }, [telemetry.latitude, telemetry.longitude, destination, isConfirmed]);

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
                <button onClick={toggleConnection} disabled={connectionStatus === 'CONNECTING'} className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 mb-4 transition-all touch-manipulation shadow-lg ${connectionStatus === 'CONNECTED' ? 'bg-red-900/30 text-red-400 border border-red-900 hover:bg-red-900/50' : 'bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white shadow-green-900/40'}`}>
                  <Power className={`w-5 h-5 ${connectionStatus === 'CONNECTING' ? 'animate-spin' : ''}`} />
                  {connectionStatus === 'CONNECTED' ? 'TERMINATE UPLINK' : connectionStatus === 'CONNECTING' ? 'ESTABLISHING...' : 'INITIATE UPLINK'}
                </button>
                <div className={`transition-opacity duration-300 ${connectionStatus === 'CONNECTED' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <h3 className="text-gray-400 text-xs font-mono uppercase mb-2 mt-4">Flight Mode</h3>
                    <div className="grid grid-cols-1 gap-2">
                    {[FlightMode.MANUAL, FlightMode.ASSISTED, FlightMode.AUTONOMOUS].map((m) => (
                        <button key={m} onClick={() => setFlightMode(m)} className={`flex items-center justify-between p-3 rounded border transition-all touch-manipulation ${flightMode === m ? 'bg-blue-900/40 border-blue-500 text-blue-200 shadow-[inset_0_0_10px_rgba(59,130,246,0.3)]' : 'bg-gray-800 border-gray-700 text-gray-400 active:bg-gray-700'}`}>
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
                    <div {...joystickProps('UP')} className="absolute top-2 left-1/2 -translate-x-1/2 p-4 z-10"><div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-lg active:bg-gray-700">▲</div></div>
                    <div {...joystickProps('DOWN')} className="absolute bottom-2 left-1/2 -translate-x-1/2 p-4 z-10"><div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-lg active:bg-gray-700">▼</div></div>
                    <div {...joystickProps('LEFT')} className="absolute left-2 top-1/2 -translate-y-1/2 p-4 z-10"><div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-lg active:bg-gray-700">◀</div></div>
                    <div {...joystickProps('RIGHT')} className="absolute right-2 top-1/2 -translate-y-1/2 p-4 z-10"><div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-lg active:bg-gray-700">▶</div></div>
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-950 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.8)] border border-gray-600 flex items-center justify-center relative z-20"><Crosshair className="text-gray-500 w-8 h-8 opacity-40" /></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'MAP' && (
          <div className="h-[75vh] md:h-[calc(100vh-8rem)] w-full relative group animate-fade-in">
             <div ref={mapContainerRef} className="w-full h-full rounded-xl overflow-hidden border border-gray-700 shadow-2xl z-0"></div>
             
             <div className="absolute top-4 left-4 right-4 md:left-auto md:w-80 bg-ui-dark/95 p-4 rounded-xl backdrop-blur-md border border-gray-700 shadow-2xl z-[1000]">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
                        <Target className={`w-5 h-5 ${destination ? (isConfirmed ? 'text-green-500' : 'text-india-saffron animate-pulse') : 'text-gray-500'}`} />
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Mission Target</div>
                            <div className="font-bold text-gray-100 text-sm">
                                {isConfirmed ? 'MISSION LOCKED' : destination ? 'SELECTION PENDING' : 'STANDBY - READY'}
                            </div>
                        </div>
                    </div>
                    
                    {destination && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="bg-black/40 p-2 rounded border border-gray-800 flex items-center gap-2">
                                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                                <input 
                                    type="text" 
                                    value={droneIp}
                                    onChange={(e) => setDroneIp(e.target.value)}
                                    placeholder="Drone IP (e.g. 192.168.1.10)"
                                    className="bg-transparent border-none text-xs font-mono text-gray-200 outline-none w-full"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-black/40 p-2 rounded border border-gray-800">
                                    <div className="text-[9px] text-gray-500 uppercase font-mono">LAT</div>
                                    <div className="text-xs font-mono text-india-saffron">{destination.lat.toFixed(6)}</div>
                                </div>
                                <div className="bg-black/40 p-2 rounded border border-gray-800">
                                    <div className="text-[9px] text-gray-500 uppercase font-mono">LNG</div>
                                    <div className="text-xs font-mono text-india-saffron">{destination.lng.toFixed(6)}</div>
                                </div>
                            </div>
                            
                            {distanceToTarget !== null && (
                                <div className="bg-blue-900/20 p-2 rounded border border-blue-900/40 flex justify-between items-center">
                                    <span className="text-[10px] text-blue-400 uppercase font-mono">Distance to Target</span>
                                    <span className="text-xs font-bold text-blue-200">
                                        {distanceToTarget > 1000 ? `${(distanceToTarget / 1000).toFixed(2)} km` : `${distanceToTarget.toFixed(0)} m`}
                                    </span>
                                </div>
                            )}

                            {statusMessage && (
                                <div className={`text-[10px] font-bold text-center py-1 rounded border ${statusMessage.includes('FAILED') || statusMessage.includes('TIMEOUT') || statusMessage.includes('REFUSED') ? 'bg-red-900/20 border-red-800 text-red-500' : 'bg-green-900/20 border-green-800 text-green-500'}`}>
                                    {statusMessage}
                                </div>
                            )}

                            {!isConfirmed ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => sendDroneCommand(destination.lat, destination.lng)}
                                        disabled={isSending}
                                        className="flex items-center justify-center gap-1.5 py-2 bg-green-700 hover:bg-green-600 rounded text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                    >
                                        {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} 
                                        CONFIRM
                                    </button>
                                    <button 
                                        onClick={() => { setDestination(null); setIsConfirmed(false); setStatusMessage(null); }}
                                        disabled={isSending}
                                        className="flex items-center justify-center gap-1.5 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <XCircle className="w-3.5 h-3.5" /> DISCARD
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => { setDestination(null); setIsConfirmed(false); setStatusMessage(null); }}
                                    className="w-full py-2 bg-red-900/40 border border-red-700 text-red-400 hover:bg-red-900/60 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <XCircle className="w-4 h-4" /> ABORT MISSION
                                </button>
                            )}
                        </div>
                    )}

                    {!destination && (
                        <div className="bg-india-saffron/10 p-3 rounded border border-india-saffron/30">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-india-saffron shrink-0 mt-0.5" />
                                <div className="text-[11px] text-india-saffron leading-tight">
                                    Tap on the map to define a new delivery drop zone. Distance and coordinates will update automatically.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
             </div>

             <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
                <button 
                  onClick={handleRecenter}
                  className="bg-ui-panel p-4 rounded-full shadow-2xl border border-gray-600 text-white hover:border-india-saffron active:scale-95 transition-all duration-300 bg-opacity-95 backdrop-blur-sm"
                  aria-label="Recenter Map"
                >
                   <Locate className="w-6 h-6 text-india-saffron" />
                </button>
             </div>
          </div>
        )}

        {activeTab === 'ANALYTICS' && <Analytics />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-ui-dark/95 backdrop-blur-md border-t border-gray-800 flex justify-around items-center px-2 py-2 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.8)] md:hidden">
          {(['FLY', 'MAP', 'ANALYTICS'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-all active:scale-95 ${activeTab === tab ? 'text-india-saffron' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab === 'FLY' && <Navigation className={`w-6 h-6 mb-1 ${activeTab === tab ? 'fill-current' : ''}`} />}
              {tab === 'MAP' && <MapIcon className={`w-6 h-6 mb-1 ${activeTab === tab ? 'fill-current' : ''}`} />}
              {tab === 'ANALYTICS' && <BarChart3 className={`w-6 h-6 mb-1 ${activeTab === tab ? 'fill-current' : ''}`} />}
              <span className="text-[10px] font-bold tracking-wider">{tab}</span>
            </button>
          ))}
      </nav>

      <div className="hidden md:flex fixed top-24 left-1/2 -translate-x-1/2 bg-ui-panel p-1 rounded-full border border-gray-700 shadow-2xl z-40 bg-opacity-90 backdrop-blur-md">
          {(['FLY', 'MAP', 'ANALYTICS'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-india-saffron text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
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