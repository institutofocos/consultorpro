
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialSummary as FinancialSummaryType } from '@/integrations/supabase/financial';

interface FinancialSummaryProps {
  summary: FinancialSummaryType | null;
  yearSummary: FinancialSummaryType | null;
  generalSummary: FinancialSummaryType | null;
  isLoading: boolean;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ 
  summary, 
  yearSummary, 
  generalSummary, 
  isLoading 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getTotalExpectedColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const SummaryCard = ({ 
    title, 
    period, 
    value, 
    colorClass, 
    loading 
  }: { 
    title: string; 
    period: string; 
    value: number; 
    colorClass?: string; 
    loading: boolean; 
  }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {title} <span className="text-xs text-muted-foreground">({period})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass || ''}`}>
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            formatCurrency(value)
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Mês Atual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard
          title="Total Previsto"
          period="Mês atual"
          value={summary?.total_expected || 0}
          colorClass={getTotalExpectedColor(summary?.total_expected || 0)}
          loading={isLoading}
        />
        
        <SummaryCard
          title="Total Recebido"
          period="Mês atual"
          value={summary?.total_received || 0}
          colorClass="text-green-600"
          loading={isLoading}
        />
        
        <SummaryCard
          title="Recebimento Pendente"
          period="Mês atual"
          value={summary?.total_pending || 0}
          colorClass="text-yellow-600"
          loading={isLoading}
        />
        
        <SummaryCard
          title="Pagamentos Realizados"
          period="Mês atual"
          value={summary?.consultant_payments_made || 0}
          colorClass="text-blue-600"
          loading={isLoading}
        />
        
        <SummaryCard
          title="Pagamentos Pendentes"
          period="Mês atual"
          value={summary?.consultant_payments_pending || 0}
          colorClass="text-orange-600"
          loading={isLoading}
        />
      </div>

      {/* Ano Atual e Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard
          title="Total Previsto"
          period="Ano atual"
          value={yearSummary?.total_expected || 0}
          colorClass={getTotalExpectedColor(yearSummary?.total_expected || 0)}
          loading={isLoading}
        />
        
        <SummaryCard
          title="Total Recebido"
          period="Ano atual"
          value={yearSummary?.total_received || 0}
          colorClass="text-green-600"
          loading={isLoading}
        />
        
        <SummaryCard
          title="Recebimento Pendente"
          period="Geral"
          value={generalSummary?.total_pending || 0}
          colorClass="text-yellow-600"
          loading={isLoading}
        />
        
        <SummaryCard
          title="Pagamentos Realizados"
          period="Ano atual"
          value={yearSummary?.consultant_payments_made || 0}
          colorClass="text-blue-600"
          loading={isLoading}
        />
        
        <SummaryCard
          title="Pagamentos Pendentes"
          period="Geral"
          value={generalSummary?.consultant_payments_pending || 0}
          colorClass="text-orange-600"
          loading={isLoading}
        />
      </div>
    </div>
  );
};

export default FinancialSummary;
