import React, { useState, useRef } from 'react';
import { Camera, AlertTriangle, CheckCircle, Loader, Upload } from 'lucide-react';
import { analyzeLandingZone } from '../services/geminiService';
import { LandingAnalysis } from '../types';

const AILanding: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<LandingAnalysis | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        runAnalysis(base64.split(',')[1]); // Send just base64 data
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async (base64Data: string) => {
    setAnalyzing(true);
    const data = await analyzeLandingZone(base64Data);
    setResult(data);
    setAnalyzing(false);
  };

  return (
    <div className="bg-ui-panel rounded-xl border border-gray-700 overflow-hidden shadow-lg mt-4">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
            <h2 className="font-bold text-gray-100 flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-400" /> AI LANDING SCAN
            </h2>
        </div>
        <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-500/30">GEMINI VISION 2.0</span>
      </div>

      <div className="p-4 grid md:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
            <div className={`relative h-48 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
                ${imagePreview ? 'border-purple-500' : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'}`}
                onClick={() => fileInputRef.current?.click()}>
                
                {imagePreview ? (
                    <img src={imagePreview} alt="Landing Scan" className="h-full w-full object-cover rounded-md opacity-80" />
                ) : (
                    <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-400">Tap to upload Landing Zone view</span>
                    </>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                />
            </div>
            
            {analyzing && (
                <div className="flex items-center gap-2 text-purple-400 text-sm justify-center">
                    <Loader className="w-4 h-4 animate-spin" />
                    Analyzing terrain safety...
                </div>
            )}
        </div>

        {/* Right: Output */}
        <div className="space-y-3">
             {result ? (
                 <div className="h-full flex flex-col gap-3 animate-fade-in">
                     <div className={`p-3 rounded border-l-4 ${result.safe ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            {result.safe ? <CheckCircle className="text-green-500 w-5 h-5"/> : <AlertTriangle className="text-red-500 w-5 h-5"/>}
                            <span className={`font-bold text-lg ${result.safe ? 'text-green-400' : 'text-red-400'}`}>
                                {result.safe ? 'SAFE TO LAND' : 'HAZARD DETECTED'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-300">{result.recommendation}</div>
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/40 p-2 rounded">
                            <span className="text-xs text-gray-500 block">SAFETY SCORE</span>
                            <div className="text-xl font-mono text-white">{result.score}/100</div>
                        </div>
                        <div className="bg-black/40 p-2 rounded">
                            <span className="text-xs text-gray-500 block">SLOPE</span>
                            <div className="text-xl font-mono text-white">{result.slope}</div>
                        </div>
                     </div>
                     
                     {result.hazards.length > 0 && (
                         <div className="bg-black/40 p-2 rounded">
                             <span className="text-xs text-gray-500 block mb-1">DETECTED HAZARDS</span>
                             <div className="flex flex-wrap gap-1">
                                {result.hazards.map((h, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                                        {h}
                                    </span>
                                ))}
                             </div>
                         </div>
                     )}
                 </div>
             ) : (
                 <div className="h-full flex items-center justify-center text-center text-gray-500 text-sm p-4">
                     Waiting for drone camera feed to analyze topography...
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default AILanding;
