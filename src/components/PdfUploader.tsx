import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
      
      // Extrair texto de todas as páginas
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      console.log('Texto extraído do PDF:', fullText);
      console.log('Tamanho do texto extraído:', fullText.length, 'caracteres');
      
      return fullText;
    } catch (error) {
      console.error('Erro ao extrair texto do PDF:', error);
      throw new Error('Não foi possível extrair o texto do PDF');
    }
  };

  const processPdfWithOpenAI = async (pdfText: string): Promise<string> => {
    try {
      console.log('Enviando texto para processamento...');
      console.log('Tamanho do texto:', pdfText.length, 'caracteres');
      
      const { data, error } = await supabase.functions.invoke('process-pdf', {
        body: { pdfContent: pdfText }
      });

      if (error) {
        console.error('Erro na função do Supabase:', error);
        throw new Error('Erro ao processar o PDF');
      }

      console.log('PDF processado com sucesso');
      return data.content;
    } catch (error) {
      console.error('Erro detalhado ao processar PDF:', error);
      throw new Error('Não foi possível processar o conteúdo do PDF');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setIsLoading(true);
      setSelectedFile(file);
      
      try {
        console.log('Arquivo selecionado:', file.name);
        console.log('Tamanho do arquivo:', file.size, 'bytes');
        
        // Extrair texto do PDF
        const pdfText = await extractTextFromPdf(file);
        console.log('Texto extraído com sucesso');
        
        // Processar o texto com OpenAI
        const processedText = await processPdfWithOpenAI(pdfText);
        console.log('Texto processado com sucesso');
        
        onContentExtracted(processedText);
        toast({
          title: "PDF processado com sucesso",
          description: "O conteúdo do PDF foi extraído e está pronto para processamento.",
        });
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
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