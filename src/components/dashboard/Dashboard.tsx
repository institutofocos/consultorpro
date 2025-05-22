
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { ArrowUpRight, Users, Briefcase, Target, Calendar } from "lucide-react";

const projectData = [
  { name: 'Project A', value: 85000 },
  { name: 'Project B', value: 63000 },
  { name: 'Project C', value: 42000 },
  { name: 'Project D', value: 79000 },
  { name: 'Project E', value: 56000 }
];

const kpiData = [
  { name: 'Jan', value: 65 },
  { name: 'Fev', value: 72 },
  { name: 'Mar', value: 68 },
  { name: 'Abr', value: 80 },
  { name: 'Mai', value: 85 },
  { name: 'Jun', value: 82 }
];

const pieData = [
  { name: 'Financeiro', value: 45 },
  { name: 'Qualidade', value: 30 },
  { name: 'Processos', value: 15 },
  { name: 'Pessoas', value: 10 }
];

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

const StatCard = ({ title, value, icon, color, change }: { 
  title: string, 
  value: string, 
  icon: React.ReactNode,
  color: string,
  change?: string
}) => (
  <Card className="shadow-card card-hover">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {change && (
            <div className="flex items-center mt-2 text-green-500">
              <ArrowUpRight size={16} />
              <span className="text-xs font-medium ml-1">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos projetos e indicadores</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Consultores" 
          value="12" 
          icon={<Users size={24} className="text-white" />} 
          color="bg-blue-500"
          change="2 novos este mês" 
        />
        <StatCard 
          title="Projetos Ativos" 
          value="24" 
          icon={<Briefcase size={24} className="text-white" />} 
          color="bg-purple-500"
          change="4 iniciados este mês" 
        />
        <StatCard 
          title="KPIs" 
          value="36" 
          icon={<Target size={24} className="text-white" />} 
          color="bg-green-500"
          change="82% na meta" 
        />
        <StatCard 
          title="Lançamentos" 
          value="128" 
          icon={<Calendar size={24} className="text-white" />} 
          color="bg-orange-500"
          change="12 hoje" 
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card card-hover">
          <CardHeader>
            <CardTitle>Valor dos Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  width={500}
                  height={300}
                  data={projectData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Valor']}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card card-hover">
          <CardHeader>
            <CardTitle>Evolução dos KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={kpiData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Desempenho']} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI por pilar */}
        <Card className="shadow-card card-hover">
          <CardHeader>
            <CardTitle>KPIs por Pilar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Top consultores */}
        <Card className="shadow-card card-hover col-span-2">
          <CardHeader>
            <CardTitle>Top Consultores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Ana Silva', value: 92, projects: 5 },
                { name: 'Carlos Mendes', value: 86, projects: 4 },
                { name: 'Patricia Lemos', value: 78, projects: 3 },
                { name: 'Roberto Gomes', value: 74, projects: 3 },
              ].map((consultant, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="font-medium">{consultant.name}</div>
                    <div className="text-muted-foreground">{consultant.projects} projetos</div>
                  </div>
                  <Progress value={consultant.value} className="h-2" />
                  <div className="flex justify-end text-xs text-muted-foreground">
                    <div>{consultant.value}% performance</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
