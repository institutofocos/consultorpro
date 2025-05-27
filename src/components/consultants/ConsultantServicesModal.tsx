
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ConsultantServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultantId: string;
  consultantName: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
}

export default function ConsultantServicesModal({ 
  isOpen, 
  onClose, 
  consultantId, 
  consultantName 
}: ConsultantServicesModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && consultantId) {
      fetchConsultantServices();
    }
  }, [isOpen, consultantId]);

  const fetchConsultantServices = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('consultant_services')
        .select(`
          service_id,
          services(id, name, description)
        `)
        .eq('consultant_id', consultantId);

      if (error) throw error;

      const authorizedServices = data?.map(item => ({
        id: item.services.id,
        name: item.services.name,
        description: item.services.description
      })) || [];

      setServices(authorizedServices);
    } catch (error) {
      console.error('Error fetching consultant services:', error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Serviços Habilitados - {consultantName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando serviços...</span>
            </div>
          ) : services.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Este consultor está autorizado a executar os seguintes serviços:
              </p>
              <div className="space-y-2">
                {services.map((service) => (
                  <div key={service.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{service.name}</Badge>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Este consultor não possui serviços habilitados.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
