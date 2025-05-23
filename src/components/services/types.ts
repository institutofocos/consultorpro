export interface ServiceStage {
  id: number;
  name: string;
  description?: string; // Added description field
  days?: number;
  hours: number;
  value: number;
  attachment?: string; // Added attachment field
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
