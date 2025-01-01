import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Utensils } from "lucide-react";

interface GenerateMenuButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export const GenerateMenuButton = ({ onClick, isLoading }: GenerateMenuButtonProps) => {
  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="w-full max-w-md mx-auto">
          <Progress value={100} className="h-2 animate-progress" />
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