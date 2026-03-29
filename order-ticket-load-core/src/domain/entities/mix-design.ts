export interface MixDesign {
  id: string;
  code: string;
  name: string;
  description: string | null;
  strengthPsi: number | null;
  slumpInches: number | null;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
