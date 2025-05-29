
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, BarChart3 } from 'lucide-react';

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
          to="/reports/gantt"
          className={({ isActive }) => 
            `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'hover:bg-gray-100'
            }`
          }
        >
          <BarChart3 className="w-5 h-5" />
          <span>Gantt</span>
        </NavLink>
      </div>
      
      <Outlet />
    </div>
  );
}
