import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Utensils } from "lucide-react";

interface GenerateMenuButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const loadingMessages = [
  "Analisando seu planejamento alimentar...",
  "Pensando nas melhores opções de pratos...",
  "Calculando valores nutricionais...",
  "Organizando seu cardápio personalizado...",
  "Finalizando as recomendações..."
];

export const GenerateMenuButton = ({ onClick, isLoading }: GenerateMenuButtonProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((current) => 
        current < loadingMessages.length - 1 ? current + 1 : current
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="w-full max-w-md mx-auto space-y-2">
          <Progress value={100} className="h-2 animate-progress" />
          <p className="text-center text-gray-600 animate-fade-in">
            {loadingMessages[currentMessageIndex]}
          </p>
        </div>
      )}
      <Button
        onClick={onClick}
        disabled={isLoading}
        className="w-full md:w-auto text-lg py-6 px-8 rounded-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-all duration-300"
      >
        <Utensils className="w-5 h-5 mr-2" />
        {isLoading ? "Gerando..." : "Gerar Cardápio"}
      </Button>
    </div>
  );
};