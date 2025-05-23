
import { supabase } from "./client";
import { Indicator, KPI, OKR, KeyResult } from "@/components/indicators/types";
import { defaultKPIs, defaultOKRs } from "@/components/indicators/defaultIndicators";

// Function to fetch all indicators
export const fetchIndicators = async (): Promise<{kpis: KPI[], okrs: OKR[]}> => {
  try {
    // Try to fetch from API
    const { data: indicators, error } = await supabase
      .from('indicators')
      .select('*, key_results(*)')
      .order('created_at');

    if (error) {
      console.error('Error fetching indicators:', error);
      // If error, return default indicators for now
      return {
        kpis: defaultKPIs,
        okrs: defaultOKRs
      };
    }

    if (!indicators || indicators.length === 0) {
      // If no indicators in database, return defaults
      return {
        kpis: defaultKPIs,
        okrs: defaultOKRs
      };
    }

    // Map database results to our type
    const kpis: KPI[] = indicators
      .filter(ind => ind.type === 'kpi')
      .map(ind => ({
        id: ind.id,
        name: ind.name,
        description: ind.description,
        type: 'kpi' as const,
        category: ind.category,
        target: ind.target,
        current: ind.current,
        unit: ind.unit,
        period: ind.period,
        startDate: ind.start_date,
        endDate: ind.end_date,
        status: ind.status,
        dataSource: ind.data_source,
        formula: ind.formula,
        responsible: ind.responsible,
        createdAt: ind.created_at,
        updatedAt: ind.updated_at
      }));

    const okrs: OKR[] = indicators
      .filter(ind => ind.type === 'okr')
      .map(ind => ({
        id: ind.id,
        name: ind.name,
        description: ind.description,
        type: 'okr' as const,
        category: ind.category,
        target: ind.target,
        current: ind.current,
        unit: ind.unit,
        period: ind.period,
        startDate: ind.start_date,
        endDate: ind.end_date,
        status: ind.status,
        dataSource: ind.data_source,
        formula: ind.formula,
        responsible: ind.responsible,
        createdAt: ind.created_at,
        updatedAt: ind.updated_at,
        keyResults: ind.key_results?.map((kr: any) => ({
          id: kr.id,
          name: kr.name,
          description: kr.description,
          target: kr.target,
          current: kr.current,
          unit: kr.unit,
          status: kr.status
        })) || []
      }));

    return { kpis, okrs };
  } catch (error) {
    console.error('Error in fetchIndicators:', error);
    // Return defaults on error
    return {
      kpis: defaultKPIs,
      okrs: defaultOKRs
    };
  }
};

// Function to update indicator values based on database data
export const updateIndicatorValues = async (): Promise<void> => {
  try {
    // This function would normally query the database and update the indicators
    // For now, we're just simulating it with random data
    const { data: indicators, error } = await supabase
      .from('indicators')
      .select('id, data_source, formula');

    if (error) {
      console.error('Error fetching indicators for update:', error);
      return;
    }

    // For each indicator, calculate the current value
    for (const indicator of indicators || []) {
      let currentValue = 0;
      
      // In a real implementation, we would:
      // 1. Parse the formula
      // 2. Query the appropriate tables based on data_source
      // 3. Apply the formula to the results
      // 4. Update the indicator with the new value
      
      // For now, let's simulate with random data between 0 and target
      const randomValue = Math.floor(Math.random() * 100);
      
      const { error: updateError } = await supabase
        .from('indicators')
        .update({ current: randomValue, updated_at: new Date().toISOString() })
        .eq('id', indicator.id);
        
      if (updateError) {
        console.error(`Error updating indicator ${indicator.id}:`, updateError);
      }
    }
  } catch (error) {
    console.error('Error updating indicator values:', error);
  }
};

// Function to create a new indicator
export const createIndicator = async (indicator: Omit<Indicator, 'id' | 'createdAt' | 'updatedAt'>, keyResults?: Omit<KeyResult, 'id' | 'status'>[]): Promise<string | null> => {
  try {
    // Create the main indicator
    const { data, error } = await supabase
      .from('indicators')
      .insert({
        name: indicator.name,
        description: indicator.description,
        type: indicator.type,
        category: indicator.category,
        target: indicator.target,
        current: indicator.current || 0,
        unit: indicator.unit,
        period: indicator.period,
        start_date: indicator.startDate,
        end_date: indicator.endDate,
        status: indicator.status || 'not_started',
        data_source: indicator.dataSource,
        formula: indicator.formula || '',
        responsible: indicator.responsible || ''
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating indicator:', error);
      return null;
    }

    const indicatorId = data.id;

    // If this is an OKR, create key results
    if (indicator.type === 'okr' && keyResults && keyResults.length > 0) {
      const keyResultsToInsert = keyResults.map(kr => ({
        indicator_id: indicatorId,
        name: kr.name,
        description: kr.description || '',
        target: kr.target,
        current: kr.current || 0,
        unit: kr.unit,
        status: 'not_started'
      }));

      const { error: krError } = await supabase
        .from('key_results')
        .insert(keyResultsToInsert);

      if (krError) {
        console.error('Error creating key results:', krError);
      }
    }

    return indicatorId;
  } catch (error) {
    console.error('Error in createIndicator:', error);
    return null;
  }
};

// Function to update an indicator
export const updateIndicator = async (indicator: Indicator, keyResults?: KeyResult[]): Promise<boolean> => {
  try {
    // Update the main indicator
    const { error } = await supabase
      .from('indicators')
      .update({
        name: indicator.name,
        description: indicator.description,
        category: indicator.category,
        target: indicator.target,
        current: indicator.current,
        unit: indicator.unit,
        period: indicator.period,
        start_date: indicator.startDate,
        end_date: indicator.endDate,
        status: indicator.status,
        data_source: indicator.dataSource,
        formula: indicator.formula || '',
        responsible: indicator.responsible || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', indicator.id);

    if (error) {
      console.error('Error updating indicator:', error);
      return false;
    }

    // For OKRs, update key results
    if (indicator.type === 'okr' && keyResults && keyResults.length > 0) {
      // First, remove any deleted key results
      const keyResultIds = keyResults.map(kr => kr.id);
      if (keyResultIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('key_results')
          .delete()
          .eq('indicator_id', indicator.id)
          .not('id', 'in', `(${keyResultIds.join(',')})`);

        if (deleteError) {
          console.error('Error deleting key results:', deleteError);
        }
      }

      // Then, update existing key results or create new ones
      for (const kr of keyResults) {
        if (kr.id && kr.id.startsWith('new-')) {
          // This is a new key result
          const { error: insertError } = await supabase
            .from('key_results')
            .insert({
              indicator_id: indicator.id,
              name: kr.name,
              description: kr.description || '',
              target: kr.target,
              current: kr.current,
              unit: kr.unit,
              status: kr.status
            });

          if (insertError) {
            console.error('Error creating key result:', insertError);
          }
        } else {
          // This is an existing key result
          const { error: updateError } = await supabase
            .from('key_results')
            .update({
              name: kr.name,
              description: kr.description || '',
              target: kr.target,
              current: kr.current,
              unit: kr.unit,
              status: kr.status
            })
            .eq('id', kr.id);

          if (updateError) {
            console.error(`Error updating key result ${kr.id}:`, updateError);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error in updateIndicator:', error);
    return false;
  }
};

// Function to delete an indicator
export const deleteIndicator = async (id: string): Promise<boolean> => {
  try {
    // Delete key results first if it's an OKR
    const { error: krError } = await supabase
      .from('key_results')
      .delete()
      .eq('indicator_id', id);

    if (krError) {
      console.error('Error deleting key results:', krError);
    }

    // Then delete the indicator
    const { error } = await supabase
      .from('indicators')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting indicator:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteIndicator:', error);
    return false;
  }
};

// Function to calculate KPIs automatically from database
export const calculateKPIValues = async (): Promise<void> => {
  try {
    // For demonstration, we'll calculate a few real KPIs from the database

    // 1. Total Projects Count
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('count', { count: 'exact' });
    
    if (!projectsError) {
      const projectsCount = projectsData?.[0]?.count || 0;
      
      // Update corresponding KPI
      await supabase
        .from('indicators')
        .update({ current: projectsCount, updated_at: new Date().toISOString() })
        .eq('name', 'Número de Projetos')
        .eq('type', 'kpi');
    }

    // 2. Active Projects Count
    const { data: activeProjectsData, error: activeProjectsError } = await supabase
      .from('projects')
      .select('count', { count: 'exact' })
      .eq('status', 'active');
    
    if (!activeProjectsError) {
      const activeProjectsCount = activeProjectsData?.[0]?.count || 0;
      
      // Update corresponding KPI
      await supabase
        .from('indicators')
        .update({ current: activeProjectsCount, updated_at: new Date().toISOString() })
        .eq('name', 'Projetos Ativos')
        .eq('type', 'kpi');
    }

    // 3. Total Revenue (from all projects)
    const { data: revenueData, error: revenueError } = await supabase
      .from('projects')
      .select('total_value');
    
    if (!revenueError && revenueData) {
      const totalRevenue = revenueData.reduce((sum, project) => sum + (project.total_value || 0), 0);
      
      // Update corresponding KPI
      await supabase
        .from('indicators')
        .update({ current: totalRevenue, updated_at: new Date().toISOString() })
        .eq('name', 'Receita Total')
        .eq('type', 'kpi');
    }

    // For more complex formulas, we would need to parse the formula string and execute the corresponding database queries
  } catch (error) {
    console.error('Error calculating KPI values:', error);
  }
};
