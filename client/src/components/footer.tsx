import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, ChartLine, Loader2 } from "lucide-react";

interface FooterProps {
  lastUpdate: string;
  onExportCSV: () => void;
  onExportPDF: () => Promise<void>;
  onGenerateReport: () => Promise<void>;
}

export function Footer({ lastUpdate, onExportCSV, onExportPDF, onGenerateReport }: FooterProps) {
  const [loadingStates, setLoadingStates] = useState({
    csv: false,
    pdf: false,
    report: false
  });

  const handleExportCSV = async () => {
    setLoadingStates(prev => ({ ...prev, csv: true }));
    try {
      await onExportCSV();
    } finally {
      setLoadingStates(prev => ({ ...prev, csv: false }));
    }
  };

  const handleExportPDF = async () => {
    setLoadingStates(prev => ({ ...prev, pdf: true }));
    try {
      await onExportPDF();
    } finally {
      setLoadingStates(prev => ({ ...prev, pdf: false }));
    }
  };

  const handleGenerateReport = async () => {
    setLoadingStates(prev => ({ ...prev, report: true }));
    try {
      await onGenerateReport();
    } finally {
      setLoadingStates(prev => ({ ...prev, report: false }));
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Última atualização: {lastUpdate}</span>
          <span>•</span>
          <span>Dados de: Jira Cloud</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={loadingStates.csv}
            className="text-gray-600 hover:text-gray-700 disabled:opacity-50"
          >
            {loadingStates.csv ? (
              <Loader2 className="mr-2 animate-spin" size={14} />
            ) : (
              <FileSpreadsheet className="mr-2" size={14} />
            )}
            {loadingStates.csv ? 'Exportando...' : 'Exportar CSV'}
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={loadingStates.pdf}
            className="text-gray-600 hover:text-gray-700 disabled:opacity-50"
          >
            {loadingStates.pdf ? (
              <Loader2 className="mr-2 animate-spin" size={14} />
            ) : (
              <FileText className="mr-2" size={14} />
            )}
            {loadingStates.pdf ? 'Gerando PDF...' : 'Exportar PDF'}
          </Button>
          <Button 
            size="sm"
            onClick={handleGenerateReport}
            disabled={loadingStates.report}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingStates.report ? (
              <Loader2 className="mr-2 animate-spin" size={14} />
            ) : (
              <ChartLine className="mr-2" size={14} />
            )}
            {loadingStates.report ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </div>
      </div>
    </footer>
  );
}