import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const PdfUploader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      const newFiles = Array.from(fileList).filter(
        (file) => file.type === "application/pdf"
      );
      
      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        toast({
          title: "PDF adicionado com sucesso!",
          description: `${newFiles.length} arquivo(s) carregado(s)`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao carregar arquivo",
          description: "Por favor, selecione apenas arquivos PDF.",
        });
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="flex flex-col items-center p-8 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
        <Upload className="w-12 h-12 text-primary mb-4" />
        <label htmlFor="pdf-upload" className="cursor-pointer">
          <Button variant="outline" className="relative">
            Selecionar PDFs
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
          </Button>
        </label>
        <p className="mt-2 text-sm text-gray-600">
          Arraste seus PDFs aqui ou clique para selecionar
        </p>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">PDFs carregados:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center p-2 bg-white rounded-md shadow-sm"
              >
                <span className="text-sm truncate">{file.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};