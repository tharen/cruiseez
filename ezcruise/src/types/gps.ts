export interface GPSPoint {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  timestamp: number;
}

export interface AveragedResult {
  latitude: number;
  longitude: number;
  estimatedError: number;
  lastTimestamp: number;
}
