
import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { Calendar, KanbanSquare, ChartGantt } from 'lucide-react';
import { Card } from "@/components/ui/card";

export default function ReportsLayout() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-6">
        <NavLink 
          to="/reports/calendar"
          className={({ isActive }) => 
            `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'hover:bg-gray-100'
            }`
          }
        >
          <Calendar className="w-5 h-5" />
          <span>Agenda</span>
        </NavLink>
        
        <NavLink 
          to="/reports/kanban"
          className={({ isActive }) => 
            `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'hover:bg-gray-100'
            }`
          }
        >
          <KanbanSquare className="w-5 h-5" />
          <span>Kanban</span>
        </NavLink>
        
        <NavLink 
          to="/reports/gantt"
          className={({ isActive }) => 
            `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'hover:bg-gray-100'
            }`
          }
        >
          <ChartGantt className="w-5 h-5" />
          <span>Gantt</span>
        </NavLink>
      </div>
      
      <Outlet />
    </div>
  );
}
