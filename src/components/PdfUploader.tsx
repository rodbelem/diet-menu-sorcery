import { useState } from "react";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

interface PdfUploaderProps {
  onContentExtracted: (content: string) => void;
}

export const PdfUploader = ({ onContentExtracted }: PdfUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from all pages while preserving layout
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Sort items by their vertical position to maintain layout
        const sortedItems = textContent.items.sort((a: any, b: any) => {
          if (Math.abs(a.transform[5] - b.transform[5]) < 5) {
            // If y positions are similar, sort by x position
            return a.transform[4] - b.transform[4];
          }
          // Sort by y position (reversed because PDF coordinates start from bottom)
          return b.transform[5] - a.transform[5];
        });

        let currentY = 0;
        let currentLine = '';

        // Process items while maintaining layout
        sortedItems.forEach((item: any) => {
          const y = Math.round(item.transform[5]);
          
          // If we're on a new line
          if (currentY !== y && currentY !== 0) {
            fullText += currentLine.trim() + '\n';
            currentLine = '';
          }
          
          currentY = y;
          currentLine += item.str + ' ';
        });

        // Add the last line of the page
        if (currentLine) {
          fullText += currentLine.trim() + '\n';
        }

        // Add page separator
        fullText += '\n--- Page ' + i + ' ---\n\n';
      }
      
      console.log('Extracted text with layout preservation:', fullText);
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Não foi possível extrair o texto do PDF');
    }
  };

  const processPdfWithOpenAI = async (pdfText: string): Promise<string> => {
    try {
      console.log('Sending text for processing with layout information...');
      
      const { data, error } = await supabase.functions.invoke('process-pdf', {
        body: { 
          pdfContent: pdfText,
          preserveLayout: true // Signal that layout is preserved
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Erro ao processar o PDF');
      }

      return data.content;
    } catch (error) {
      console.error('Detailed error processing PDF:', error);
      throw new Error('Não foi possível processar o conteúdo do PDF');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setIsLoading(true);
      setSelectedFile(file);
      
      try {
        console.log('Processing file:', file.name);
        const pdfText = await extractTextFromPdf(file);
        console.log('Text extracted successfully with layout preservation');
        
        const processedText = await processPdfWithOpenAI(pdfText);
        console.log('Text processed successfully');
        
        onContentExtracted(processedText);
        toast({
          title: "PDF processado com sucesso",
          description: "O conteúdo do PDF foi extraído e está pronto para processamento.",
        });
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          title: "Erro ao processar PDF",
          description: "Não foi possível extrair o conteúdo do PDF. Tente novamente.",
          variant: "destructive",
        });
        setSelectedFile(null);
      } finally {
        setIsLoading(false);
      }
    } else if (file) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 text-center">
        Upload do Plano Nutricional
      </h2>
      <div className="flex flex-col items-center gap-4">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload"
          disabled={isLoading}
        />
        <label
          htmlFor="pdf-upload"
          className="w-full sm:w-auto cursor-pointer"
        >
          <div
            className={`flex items-center justify-center w-full sm:w-auto rounded-full px-6 py-6 text-lg border-2 border-dashed border-primary/30 hover:border-primary hover:bg-nutri-green/10 transition-all duration-300 group ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : 'group-hover:scale-110'} transition-transform duration-300`} />
            <span>{isLoading ? 'Processando...' : 'Selecionar PDF'}</span>
          </div>
        </label>
        {selectedFile && !isLoading && (
          <span className="text-sm text-gray-600 bg-white/70 px-4 py-2 rounded-full">
            {selectedFile.name}
          </span>
        )}
      </div>
    </div>
  );
};