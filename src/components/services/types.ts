
export interface ServiceStage {
  id: number;
  name: string;
  hours: number;
  days: number;
  value: number;
}

export interface ServiceTag {
  id: string;
  name: string;
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Service {
  id: string;
  name: string;
  description?: string;
  totalHours: number;
  hourlyRate?: number;
  totalValue: number;
  taxRate: number;
  extraCosts?: number;
  netValue?: number;
  stages?: ServiceStage[];
  tags?: ServiceTag[];
}

export interface BasicService {
  id: string;
  name: string;
  total_value: number;
  totalValue?: number;
  tax_rate: number;
  stages?: any;
}

export interface BasicClient {
  id: string;
  name: string;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
}

export interface ServiceData {
  id: string;
  name: string;
  description?: string;
  total_hours: number;
  hourly_rate?: number;
  total_value: number;
  tax_rate: number;
  stages?: Json;
}
