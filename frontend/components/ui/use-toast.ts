import { toast as sonnerToast } from "sonner"

export function useToast() {
  return {
    toast: ({ title, description, variant }: any) => {
      const message = `${title || ''} ${description || ''}`.trim();
      if (variant === 'destructive') {
        sonnerToast.error(message);
      } else {
        sonnerToast.success(message);
      }
    }
  }
}
