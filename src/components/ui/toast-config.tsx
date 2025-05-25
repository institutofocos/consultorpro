
import { Toaster as SonnerToaster } from "sonner";

export function ToastConfig() {
  return (
    <SonnerToaster 
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        style: {
          maxWidth: '350px',
          fontSize: '14px',
        },
        className: 'toast-compact',
        duration: 4000,
      }}
    />
  );
}
