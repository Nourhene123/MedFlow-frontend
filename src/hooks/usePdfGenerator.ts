// hooks/usePdfGenerator.ts
import { useRef, RefObject } from 'react';

// Déclaration TypeScript pour html2pdf
declare const html2pdf: {
  (): {
    set: (options: any) => any;
    from: (element: HTMLElement) => any;
    save: () => Promise<void>;
    outputPdf: (type: string) => Promise<Blob>;
  };
};

interface PdfOptions {
  filename?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UsePdfGeneratorReturn {
  contentRef: RefObject<HTMLDivElement | null>;
  downloadPdf: (options?: PdfOptions) => void;
  previewPdf: (options?: PdfOptions) => void;
}

export function usePdfGenerator(): UsePdfGeneratorReturn {
  const contentRef = useRef<HTMLDivElement>(null);

  const pdfOptions = {
    margin: 10,
    image: { 
      type: 'jpeg' as const,
      quality: 0.98 
    },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: 'a4' as const, 
      orientation: 'portrait' as const 
    }
  };

  const downloadPdf = (options: PdfOptions = {}): void => {
    const element = contentRef.current;
    if (!element) {
      options.onError?.(new Error('Élément non trouvé pour la génération PDF'));
      return;
    }

    const { filename = 'facture', onSuccess, onError } = options;

    try {
      html2pdf()
        .set({
          ...pdfOptions,
          filename: `${filename}.pdf`
        })
        .from(element)
        .save()
        .then(() => {
          onSuccess?.();
        })
        .catch((error: Error) => {
          console.error('Erreur génération PDF:', error);
          onError?.(error);
        });
    } catch (error) {
      console.error('Erreur initialisation html2pdf:', error);
      onError?.(error as Error);
    }
  };

  const previewPdf = (options: PdfOptions = {}): void => {
    const element = contentRef.current;
    if (!element) {
      options.onError?.(new Error('Élément non trouvé pour la prévisualisation PDF'));
      return;
    }

    const { filename = 'facture', onSuccess, onError } = options;

    try {
      html2pdf()
        .set({
          ...pdfOptions,
          filename: `${filename}.pdf`
        })
        .from(element)
        .outputPdf('blob')
        .then((blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank');
          
          if (!newWindow) {
            // Fallback pour les bloqueurs de popup
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.download = `${filename}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
          
          onSuccess?.();

          // Nettoyage après 30 secondes
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 30000);
        })
        .catch((error: Error) => {
          console.error('Erreur prévisualisation PDF:', error);
          onError?.(error);
        });
    } catch (error) {
      console.error('Erreur initialisation html2pdf:', error);
      onError?.(error as Error);
    }
  };

  return { 
    contentRef, 
    downloadPdf, 
    previewPdf 
  };
}