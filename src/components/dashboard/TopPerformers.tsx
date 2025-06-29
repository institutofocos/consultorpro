
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ConsultantStats {
  name: string;
  projects: number;
  totalHours: number;
  totalValue: number;
}

interface ServiceStats {
  name: string;
  projects: number;
  totalRevenue: number;
}

interface TopPerformersProps {
  topConsultants: ConsultantStats[];
  topServices: ServiceStats[];
  formatCurrency: (value: number) => string;
}

export const TopPerformers: React.FC<TopPerformersProps> = ({
  topConsultants,
  topServices,
  formatCurrency
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Top Consultores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topConsultants.map((consultant, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <div className="font-medium">{consultant.name}</div>
                  <div className="text-muted-foreground">
                    {consultant.projects} projetos | {consultant.totalHours}h
                  </div>
                </div>
                <Progress value={(consultant.projects / 10) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div>{formatCurrency(consultant.totalValue)}</div>
                  <div>{consultant.projects} projetos</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Top 5 Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServices}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Receita']}
                />
                <Bar dataKey="totalRevenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
