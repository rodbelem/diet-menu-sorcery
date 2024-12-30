import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PdfUploaderProps {
  onContentExtracted: (content: string) => void;
}

export const PdfUploader = ({ onContentExtracted }: PdfUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Simular extração do conteúdo do PDF
      // Em uma implementação real, você precisaria usar uma biblioteca como pdf.js
      const fakeContent = `Conteúdo simulado do PDF: ${file.name}`;
      onContentExtracted(fakeContent);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Upload do Plano Nutricional</h2>
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload">
          <Button variant="outline" asChild>
            <span>Selecionar PDF</span>
          </Button>
        </label>
        {selectedFile && (
          <span className="text-sm text-gray-600">{selectedFile.name}</span>
        )}
      </div>
    </div>
  );
};