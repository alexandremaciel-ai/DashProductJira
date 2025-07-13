import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, ChartLine } from "lucide-react";

interface FooterProps {
  lastUpdate: string;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onGenerateReport: () => void;
}

export function Footer({ lastUpdate, onExportCSV, onExportPDF, onGenerateReport }: FooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Last updated: {lastUpdate}</span>
          <span>•</span>
          <span>Data from: Jira Cloud</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="text-gray-600 hover:text-gray-700"
          >
            <FileSpreadsheet className="mr-2" size={14} />
            Export CSV
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={onExportPDF}
            className="text-gray-600 hover:text-gray-700"
          >
            <FileText className="mr-2" size={14} />
            Export PDF
          </Button>
          <Button 
            size="sm"
            onClick={onGenerateReport}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <ChartLine className="mr-2" size={14} />
            Generate Report
          </Button>
        </div>
      </div>
    </footer>
  );
}
