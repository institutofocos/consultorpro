import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialSummary as FinancialSummaryType } from '@/integrations/supabase/financial';

interface FinancialSummaryProps {
  summary: FinancialSummaryType | null;
  isLoading: boolean;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ summary, isLoading }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Previsto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              formatCurrency(summary?.total_expected || 0)
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              formatCurrency(summary?.total_received || 0)
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pendente de Recebimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              formatCurrency(summary?.total_pending || 0)
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pagamentos Realizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              formatCurrency(summary?.consultant_payments_made || 0)
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              formatCurrency(summary?.consultant_payments_pending || 0)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummary;
