
// Define types for Service data
export interface ServiceStage {
  id: number;
  name: string;
  hours: number;
  value: number;
  days: number;
}

export interface ServiceTag {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  totalHours: number;
  hourlyRate: number;
  totalValue: number;
  taxRate: number;
  extraCosts: number;
  netValue: number;
  stages: ServiceStage[];
  tags: ServiceTag[];
  created_at?: string;
}

export interface ServiceData {
  name: string;
  description: string;
  totalHours: number;
  hourlyRate: number;
  totalValue: number;
  taxRate: number;
  extraCosts: number;
  netValue: number;
  stages: string; // JSON string for storage
}
