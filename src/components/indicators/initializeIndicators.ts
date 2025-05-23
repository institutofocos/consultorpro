
import { seedIndicators } from "./seedDatabase";
import { updateIndicatorValues } from "@/integrations/supabase/indicators";

export const initializeIndicators = async (): Promise<void> => {
  try {
    // Seed the database with default indicators if needed
    await seedIndicators();
    
    // Update indicator values
    await updateIndicatorValues();
    
    console.log('Indicators initialized successfully');
  } catch (error) {
    console.error('Error initializing indicators:', error);
  }
};
