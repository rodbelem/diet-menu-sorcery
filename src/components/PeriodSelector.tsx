import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

type Period = "weekly" | "biweekly";

interface PeriodSelectorProps {
  selected: Period;
  onSelect: (period: Period) => void;
}

export const PeriodSelector = ({ selected, onSelect }: PeriodSelectorProps) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">
        Selecione o período do cardápio
      </h2>
      <div className="flex gap-4">
        <Button
          variant={selected === "weekly" ? "default" : "outline"}
          className={`flex items-center gap-2 ${
            selected === "weekly" ? "bg-primary" : ""
          }`}
          onClick={() => onSelect("weekly")}
        >
          <Calendar className="w-4 h-4" />
          Semanal
        </Button>
        <Button
          variant={selected === "biweekly" ? "default" : "outline"}
          className={`flex items-center gap-2 ${
            selected === "biweekly" ? "bg-primary" : ""
          }`}
          onClick={() => onSelect("biweekly")}
        >
          <Calendar className="w-4 h-4" />
          Quinzenal
        </Button>
      </div>
    </div>
  );
};