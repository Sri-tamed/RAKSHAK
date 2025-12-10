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

export interface MissionAlert {
  timestamp: string;
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  message: string;
}

export interface TelemetrySnapshot {
  timeOffset: number; // seconds from start
  altitude: number;
  battery: number;
  speed: number;
}

export interface MissionLog {
  id: string;
  date: string;
  location: string;
  status: 'SUCCESS' | 'FAILED' | 'ABORTED';
  duration: string;
  payload: PayloadType;
  telemetrySnapshots: TelemetrySnapshot[];
  alerts: MissionAlert[];
}