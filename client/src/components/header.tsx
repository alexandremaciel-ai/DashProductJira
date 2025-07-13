import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChartLine, ArrowLeftRight, LogOut } from "lucide-react";

interface HeaderProps {
  projectName?: string;
  onSwitchProject: () => void;
  onLogout: () => void;
  aiEnabled: boolean;
  onAIToggle: (enabled: boolean) => void;
}

export function Header({ 
  projectName, 
  onSwitchProject, 
  onLogout, 
  aiEnabled, 
  onAIToggle 
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ChartLine className="text-white text-sm" size={16} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Dashboard de Produtividade</h1>
              <p className="text-xs text-gray-600">{projectName}</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4 pl-6 border-l border-gray-200">
            <Button 
              variant="outline"
              size="sm"
              onClick={onSwitchProject}
              className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
            >
              <ArrowLeftRight className="mr-2" size={14} />
              Trocar Projeto
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Análise IA</label>
            <Switch
              checked={aiEnabled}
              onCheckedChange={onAIToggle}
            />
          </div>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={onLogout}
            className="text-gray-600 hover:text-gray-700"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
}
