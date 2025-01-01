import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface PdfUploaderProps {
  onContentExtracted: (content: string) => void;
}

export const PdfUploader = ({ onContentExtracted }: PdfUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      const fakeContent = `Conteúdo simulado do PDF: ${file.name}`;
      onContentExtracted(fakeContent);
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
        />
        <label
          htmlFor="pdf-upload"
          className="w-full sm:w-auto cursor-pointer"
        >
          <div
            className="flex items-center justify-center w-full sm:w-auto rounded-full px-6 py-6 text-lg border-2 border-dashed border-primary/30 hover:border-primary hover:bg-nutri-green/10 transition-all duration-300 group"
          >
            <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
            <span>Selecionar PDF</span>
          </div>
        </label>
        {selectedFile && (
          <span className="text-sm text-gray-600 bg-white/70 px-4 py-2 rounded-full">
            {selectedFile.name}
          </span>
        )}
      </div>
    </div>
  );
};