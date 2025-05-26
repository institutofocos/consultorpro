
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Note } from '@/integrations/supabase/notes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2, Calendar, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import NoteForm from './NoteForm';
import { cn } from '@/lib/utils';

interface NotesExpandedTableProps {
  notes: Note[];
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

const STATUS_COLORS = {
  'a_fazer': 'bg-blue-100 text-blue-800',
  'em_producao': 'bg-yellow-100 text-yellow-800',
  'finalizado': 'bg-green-100 text-green-800',
  'cancelado': 'bg-red-100 text-red-800',
  'iniciar_projeto': 'bg-blue-100 text-blue-800',
  'aguardando_assinatura': 'bg-orange-100 text-orange-800',
  'aguardando_aprovacao': 'bg-purple-100 text-purple-800',
  'aguardando_nota_fiscal': 'bg-pink-100 text-pink-800',
  'aguardando_pagamento': 'bg-red-100 text-red-800',
  'aguardando_repasse': 'bg-indigo-100 text-indigo-800',
  'finalizados': 'bg-green-100 text-green-800',
  'cancelados': 'bg-gray-100 text-gray-800',
  'pendente': 'bg-yellow-100 text-yellow-800',
  'concluido': 'bg-green-100 text-green-800',
};

const STATUS_LABELS = {
  'a_fazer': 'A fazer',
  'em_producao': 'Em produção',
  'finalizado': 'Finalizado',
  'cancelado': 'Cancelado',
  'iniciar_projeto': 'Iniciar Projeto',
  'aguardando_assinatura': 'Aguardando Assinatura',
  'aguardando_aprovacao': 'Aguardando Aprovação',
  'aguardando_nota_fiscal': 'Aguardando Nota Fiscal',
  'aguardando_pagamento': 'Aguardando Pagamento',
  'aguardando_repasse': 'Aguardando Repasse',
  'finalizados': 'Finalizados',
  'cancelados': 'Cancelados',
  'pendente': 'Pendente',
  'concluido': 'Concluído',
};

const NotesExpandedTable: React.FC<NotesExpandedTableProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Separar notas de projeto das demais
  const projectNotes = notes.filter(note => note.title.startsWith('Projeto:'));
  const regularNotes = notes.filter(note => !note.title.startsWith('Projeto:'));

  // Agrupar checklists por projeto
  const projectsWithStages = projectNotes.map(project => {
    return {
      ...project,
      stages: project.checklists || []
    };
  });

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status] || status;
  };

  const renderProjectRow = (project: Note) => {
    const isExpanded = expandedProjects.has(project.id);
    const completedStages = project.checklists?.filter(c => c.completed).length || 0;
    const totalStages = project.checklists?.length || 0;

    return (
      <React.Fragment key={project.id}>
        <TableRow className="bg-blue-50/50">
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleProjectExpansion(project.id)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              {project.color && (
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: project.color }}
                />
              )}
              <span className="font-semibold text-blue-700">{project.title}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge 
              variant="outline"
              className={cn("", getStatusColor(project.status))}
            >
              {getStatusLabel(project.status)}
            </Badge>
          </TableCell>
          <TableCell>{project.client_name || '-'}</TableCell>
          <TableCell>{project.service_name || '-'}</TableCell>
          <TableCell>
            {project.consultant_names && project.consultant_names.length > 0
              ? project.consultant_names.join(', ')
              : '-'}
          </TableCell>
          <TableCell>
            {project.due_date ? (
              <div className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                {format(new Date(project.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell>
            <div className="text-sm text-muted-foreground">
              {totalStages > 0 && (
                <div className="text-xs">
                  {completedStages}/{totalStages} etapas concluídas
                </div>
              )}
              {project.content && (
                <div className="mt-1">
                  {project.content.substring(0, 30) + (project.content.length > 30 ? '...' : '')}
                </div>
              )}
            </div>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <NoteForm
                initialData={project}
                onSave={onUpdateNote}
              >
                <Button variant="ghost" size="sm">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </NoteForm>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteNote(project.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        
        {isExpanded && project.stages.map((stage, index) => (
          <TableRow key={`${project.id}-stage-${index}`} className="bg-gray-50/50">
            <TableCell className="pl-12">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  stage.completed 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-gray-300'
                }`}>
                  {stage.completed && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <FileText className="h-3 w-3 text-gray-500" />
                <span className="text-sm">{stage.title}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge 
                variant="outline"
                className={stage.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
              >
                {stage.completed ? 'Concluído' : 'Pendente'}
              </Badge>
            </TableCell>
            <TableCell>-</TableCell>
            <TableCell>-</TableCell>
            <TableCell>
              {stage.responsible_consultant_id ? 'Consultor Responsável' : '-'}
            </TableCell>
            <TableCell>
              {stage.due_date ? (
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(stage.due_date), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>
              <div className="text-sm text-muted-foreground">
                {stage.description || '-'}
                {stage.completed_at && (
                  <div className="text-xs text-green-600 mt-1">
                    Concluído em {format(new Date(stage.completed_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  {stage.completed ? 'Desfazer' : 'Concluir'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </React.Fragment>
    );
  };

  const renderRegularNoteRow = (note: Note) => (
    <TableRow key={note.id}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {note.color && (
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: note.color }}
            />
          )}
          {note.title}
        </div>
      </TableCell>
      <TableCell>
        <Badge 
          variant="outline"
          className={cn("", getStatusColor(note.status))}
        >
          {getStatusLabel(note.status)}
        </Badge>
      </TableCell>
      <TableCell>{note.client_name || '-'}</TableCell>
      <TableCell>{note.service_name || '-'}</TableCell>
      <TableCell>
        {note.consultant_names && note.consultant_names.length > 0
          ? note.consultant_names.join(', ')
          : '-'}
      </TableCell>
      <TableCell>
        {note.due_date ? (
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="h-3 w-3" />
            {format(new Date(note.due_date), "dd/MM/yyyy", { locale: ptBR })}
          </div>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {note.content ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '') : '-'}
          {note.checklists && note.checklists.length > 0 && (
            <div className="text-xs mt-1">
              {note.checklists.filter(c => c.completed).length}/{note.checklists.length} concluídos
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <NoteForm
            initialData={note}
            onSave={onUpdateNote}
          >
            <Button variant="ghost" size="sm">
              <Edit3 className="h-4 w-4" />
            </Button>
          </NoteForm>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteNote(note.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título / Tarefa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Consultor / Responsável</TableHead>
            <TableHead>Data Vencimento</TableHead>
            <TableHead>Descrição / Progresso</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projectsWithStages.length > 0 || regularNotes.length > 0 ? (
            <>
              {projectsWithStages.map(renderProjectRow)}
              {regularNotes.map(renderRegularNoteRow)}
            </>
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                Nenhuma tarefa encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default NotesExpandedTable;
