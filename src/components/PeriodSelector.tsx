import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

type Period = "weekly" | "biweekly";

interface PeriodSelectorProps {
  selected: Period;
  onSelect: (period: Period) => void;
}

export const PeriodSelector = ({ selected, onSelect }: PeriodSelectorProps) => {
  return (
    <div className="flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">
        Selecione o período do cardápio
      </h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant={selected === "weekly" ? "default" : "outline"}
          className={`rounded-full px-6 py-6 text-lg transition-all duration-300 ${
            selected === "weekly"
              ? "bg-gradient-to-r from-primary to-primary-dark text-white"
              : "hover:bg-nutri-green"
          }`}
          onClick={() => onSelect("weekly")}
        >
          <Calendar className="w-5 h-5 mr-2" />
          Semanal
        </Button>
        <Button
          variant={selected === "biweekly" ? "default" : "outline"}
          className={`rounded-full px-6 py-6 text-lg transition-all duration-300 ${
            selected === "biweekly"
              ? "bg-gradient-to-r from-primary to-primary-dark text-white"
              : "hover:bg-nutri-green"
          }`}
          onClick={() => onSelect("biweekly")}
        >
          <Calendar className="w-5 h-5 mr-2" />
          Quinzenal
        </Button>
      </div>
    </div>
  );
};