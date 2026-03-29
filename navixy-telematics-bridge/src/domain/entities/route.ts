export interface Route {
  id: string;
  tripId: string;
  points: RoutePoint[];
  fetchedAt: Date;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  recordedAt: string;
}
