export enum FlightMode {
  MANUAL = 'MANUAL',
  ASSISTED = 'AI-ASSISTED',
  AUTONOMOUS = 'AUTONOMOUS'
}

export enum PayloadType {
  SALINE = 'SALINE',
  BLOOD_UNIT = 'BLOOD_UNIT',
  MEDICINE_KIT = 'MEDICINE_KIT',
  NONE = 'NONE'
}

export interface TelemetryData {
  battery: number;
  altitude: number;
  speed: number;
  signalStrength: number;
  temperature: number;
  latitude: number;
  longitude: number;
}

export interface LandingAnalysis {
  safe: boolean;
  score: number;
  hazards: string[];
  recommendation: string;
  slope: string;
}

export interface MissionLog {
  id: string;
  date: string;
  location: string;
  status: 'SUCCESS' | 'FAILED' | 'ABORTED';
  duration: string;
  payload: PayloadType;
}
