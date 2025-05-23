
import { supabase } from "@/integrations/supabase/client";
import { defaultKPIs, defaultOKRs } from "./defaultIndicators";
import { IndicatorCategory, IndicatorPeriod, IndicatorStatus } from "./types";

export const seedIndicators = async (): Promise<boolean> => {
  try {
    // Check if we already have indicators
    const { data: existingIndicators, error: checkError } = await supabase
      .from('indicators')
      .select('count');
    
    if (checkError) {
      console.error('Error checking existing indicators:', checkError);
      return false;
    }
    
    // If we already have indicators, don't seed
    if (existingIndicators && existingIndicators.length > 0) {
      console.log('Database already has indicators, skipping seed');
      return true;
    }

    // Insert KPIs
    for (const kpi of defaultKPIs) {
      const { data, error } = await supabase
        .from('indicators')
        .insert({
          name: kpi.name,
          description: kpi.description,
          type: 'kpi',
          category: kpi.category,
          target: kpi.target.toString(), // Convert to string for DB
          current: kpi.current.toString(), // Convert to string for DB
          unit: kpi.unit,
          period: kpi.period,
          start_date: kpi.startDate,
          end_date: kpi.endDate,
          status: kpi.status,
          data_source: kpi.dataSource,
          formula: kpi.formula || '',
          responsible: kpi.responsible || ''
        });
      
      if (error) {
        console.error(`Error seeding KPI ${kpi.name}:`, error);
      }
    }

    // Insert OKRs and their key results
    for (const okr of defaultOKRs) {
      const { data, error } = await supabase
        .from('indicators')
        .insert({
          name: okr.name,
          description: okr.description,
          type: 'okr',
          category: okr.category,
          target: okr.target.toString(), // Convert to string for DB
          current: okr.current.toString(), // Convert to string for DB
          unit: okr.unit,
          period: okr.period,
          start_date: okr.startDate,
          end_date: okr.endDate,
          status: okr.status,
          data_source: okr.dataSource,
          formula: okr.formula || '',
          responsible: okr.responsible || ''
        })
        .select('id')
        .single();
      
      if (error) {
        console.error(`Error seeding OKR ${okr.name}:`, error);
        continue;
      }
      
      // Insert key results for this OKR
      for (const kr of okr.keyResults) {
        const { error: krError } = await supabase
          .from('key_results')
          .insert({
            indicator_id: data?.id,
            name: kr.name,
            description: kr.description || '',
            target: kr.target.toString(), // Convert to string for DB
            current: kr.current.toString(), // Convert to string for DB
            unit: kr.unit,
            status: kr.status
          });
        
        if (krError) {
          console.error(`Error seeding key result ${kr.name}:`, krError);
        }
      }
    }

    console.log('Successfully seeded indicators database');
    return true;
  } catch (error) {
    console.error('Error seeding indicators:', error);
    return false;
  }
};
