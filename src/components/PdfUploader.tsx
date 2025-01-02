import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import { useToast } from "@/hooks/use-toast";

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('Erro ao extrair texto do PDF:', error);
      throw new Error('Não foi possível ler o conteúdo do PDF');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setIsLoading(true);
      setSelectedFile(file);
      
      try {
        const extractedText = await extractTextFromPdf(file);
        onContentExtracted(extractedText);
        toast({
          title: "PDF carregado com sucesso",
          description: "O conteúdo do PDF foi extraído e está pronto para processamento.",
        });
      } catch (error) {
        toast({
          title: "Erro ao ler PDF",
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