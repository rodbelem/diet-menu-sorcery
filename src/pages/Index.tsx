import { useState } from "react";
import { PdfUploader } from "@/components/PdfUploader";
import { PeriodSelector } from "@/components/PeriodSelector";

const Index = () => {
  const [period, setPeriod] = useState<"weekly" | "biweekly">("weekly");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planejador de Cardápio
          </h1>
          <p className="text-lg text-gray-600">
            Monte seu cardápio personalizado baseado no seu plano nutricional
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-12">
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <PdfUploader />
          </section>

          <section className="bg-white p-8 rounded-lg shadow-sm">
            <PeriodSelector selected={period} onSelect={setPeriod} />
          </section>

          <section className="text-center">
            <button
              className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors"
              onClick={() => {
                // TODO: Implementar geração do cardápio
                console.log("Gerando cardápio...");
              }}
            >
              Gerar Cardápio
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Index;