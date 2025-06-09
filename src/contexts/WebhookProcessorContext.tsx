
import React, { createContext, useContext, ReactNode } from 'react';
import { useWebhookProcessor } from '@/hooks/useWebhookProcessor';

interface WebhookProcessorContextType {
  config: {
    interval_seconds: number;
    enabled: boolean;
  };
  setConfig: (config: { interval_seconds: number; enabled: boolean }) => void;
  isProcessing: boolean;
  processImmediately: () => Promise<void>;
  processForced: () => Promise<void>;
  processForProjectCreation: () => Promise<void>;
}

const WebhookProcessorContext = createContext<WebhookProcessorContextType | undefined>(undefined);

interface WebhookProcessorProviderProps {
  children: ReactNode;
}

export const WebhookProcessorProvider: React.FC<WebhookProcessorProviderProps> = ({ children }) => {
  const webhookProcessor = useWebhookProcessor();

  return (
    <WebhookProcessorContext.Provider value={webhookProcessor}>
      {children}
    </WebhookProcessorContext.Provider>
  );
};

export const useWebhookProcessorContext = () => {
  const context = useContext(WebhookProcessorContext);
  if (context === undefined) {
    throw new Error('useWebhookProcessorContext must be used within a WebhookProcessorProvider');
  }
  return context;
};
