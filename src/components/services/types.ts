
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

// Novo tipo para serviços básicos (usado na lista de seleção)
export interface BasicService {
  id: string;
  name: string;
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

// Add a Json type alias to match Supabase's Json type
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
