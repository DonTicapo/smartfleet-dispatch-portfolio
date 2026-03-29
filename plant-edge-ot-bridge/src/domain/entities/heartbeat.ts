export interface Heartbeat {
  id: string;
  plantId: string;
  uptimeSeconds: number;
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
  pendingOutbound: number;
  lastCloudSyncAt: Date | null;
  reportedAt: Date;
}
