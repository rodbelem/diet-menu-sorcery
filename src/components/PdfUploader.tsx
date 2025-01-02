import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PdfUploaderProps {
  onContentExtracted: (content: string) => void;
}

export const PdfUploader = ({ onContentExtracted }: PdfUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const processPdfWithOpenAI = async (file: File): Promise<string> => {
    try {
      console.log('Iniciando processamento do PDF com OpenAI...');
      
      // Converter o arquivo para base64 usando FileReader
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Remove o prefixo data:application/pdf;base64,
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          } else {
            reject(new Error('Falha ao converter PDF para base64'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      
      console.log('PDF convertido para base64, chamando função do Supabase...');
      
      const { data, error } = await supabase.functions.invoke('process-pdf', {
        body: { pdfBase64: base64 }
      });

      if (error) {
        console.error('Erro na função do Supabase:', error);
        throw new Error('Erro ao processar o PDF');
      }

      console.log('PDF processado com sucesso pela OpenAI');
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
        console.log('Arquivo selecionado:', file.name, file.size, 'bytes');
        const extractedText = await processPdfWithOpenAI(file);
        onContentExtracted(extractedText);
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