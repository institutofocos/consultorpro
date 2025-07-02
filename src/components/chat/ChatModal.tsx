
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DemandChat from './DemandChat';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandId: string;
  demandTitle: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ 
  isOpen, 
  onClose, 
  demandId, 
  demandTitle 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Chat - {demandTitle}</DialogTitle>
        </DialogHeader>
        <DemandChat demandId={demandId} />
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
