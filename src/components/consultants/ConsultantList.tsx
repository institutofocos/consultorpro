
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConsultantForm } from './ConsultantForm';

// Mock data
const mockConsultants = [
  { id: 1, name: 'Ana Silva', email: 'ana.silva@gmail.com', hoursPerMonth: 160, activeProjects: 3, performance: 92 },
  { id: 2, name: 'Carlos Mendes', email: 'carlos.mendes@gmail.com', hoursPerMonth: 120, activeProjects: 2, performance: 86 },
  { id: 3, name: 'Patricia Lemos', email: 'patricia.lemos@gmail.com', hoursPerMonth: 160, activeProjects: 3, performance: 78 },
  { id: 4, name: 'Roberto Gomes', email: 'roberto.gomes@gmail.com', hoursPerMonth: 80, activeProjects: 1, performance: 74 },
  { id: 5, name: 'Juliana Alves', email: 'juliana.alves@gmail.com', hoursPerMonth: 160, activeProjects: 2, performance: 89 },
];

export const ConsultantList: React.FC = () => {
  const [consultants, setConsultants] = useState(mockConsultants);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<any | null>(null);
  
  const filteredConsultants = consultants.filter(consultant => 
    consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddConsultant = (consultant: any) => {
    if (editingConsultant) {
      setConsultants(consultants.map(c => 
        c.id === editingConsultant.id ? { ...consultant, id: c.id } : c
      ));
      setEditingConsultant(null);
    } else {
      setConsultants([...consultants, { ...consultant, id: consultants.length + 1, activeProjects: 0, performance: 0 }]);
    }
    setShowForm(false);
  };
  
  const handleEditConsultant = (consultant: any) => {
    setEditingConsultant(consultant);
    setShowForm(true);
  };
  
  const handleDeleteConsultant = (id: number) => {
    setConsultants(consultants.filter(c => c.id !== id));
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Consultores</h1>
        <p className="text-muted-foreground">Gerenciamento de consultores</p>
      </div>
      
      {showForm ? (
        <ConsultantForm 
          consultant={editingConsultant} 
          onSave={handleAddConsultant} 
          onCancel={() => {
            setShowForm(false);
            setEditingConsultant(null);
          }} 
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar consultores..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Consultor
            </Button>
          </div>
          
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle>Lista de Consultores</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Horas/Mês</TableHead>
                    <TableHead>Projetos</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConsultants.length > 0 ? (
                    filteredConsultants.map((consultant) => (
                      <TableRow key={consultant.id}>
                        <TableCell className="font-medium">{consultant.name}</TableCell>
                        <TableCell>{consultant.email}</TableCell>
                        <TableCell>{consultant.hoursPerMonth}h</TableCell>
                        <TableCell>{consultant.activeProjects}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={`text-sm mr-2 ${
                              consultant.performance >= 80 ? 'text-green-500' : 
                              consultant.performance >= 60 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {consultant.performance}%
                            </span>
                            <div className="bg-muted h-2 w-16 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  consultant.performance >= 80 ? 'bg-green-500' : 
                                  consultant.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${consultant.performance}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditConsultant(consultant)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteConsultant(consultant.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum consultor encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ConsultantList;
