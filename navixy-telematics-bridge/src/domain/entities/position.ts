export interface Position {
  id: string;
  trackerAssetId: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  recordedAt: Date;
  receivedAt: Date;
}
