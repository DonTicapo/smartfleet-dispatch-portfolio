export interface NavixyTrackerRaw {
  id: number;
  label: string;
  source: { id: number; model: string; device_id: string };
  status: { connection_status: string; movement_status: string; last_update: string };
  group_id: number | null;
  last_update: string;
}

export interface NavixyTripRaw {
  id: number;
  tracker_id: number;
  start_date: string;
  end_date: string;
  start_address: string;
  end_address: string;
  length: number;
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
}

export interface NavixyRoutePointRaw {
  lat: number;
  lng: number;
  alt: number;
  speed: number;
  heading: number;
  get_time: string;
}

export interface NavixyGeofenceRaw {
  id: number;
  label: string;
  color: string;
  type: string;
  center: { lat: number; lng: number };
  radius: number;
}

export interface NavixyApiResponse<T> {
  success: boolean;
  list?: T[];
  value?: T;
  status?: { code: number; description: string };
}
