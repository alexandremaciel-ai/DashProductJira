import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, X } from "lucide-react";
import type { CardStatusConfig } from "@/types/card-config";
import type { JiraIssue } from "@/types/jira";

interface ConfigurableMetricsCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
  description: string;
  iconBgColor: string;
  periodType: string;
  cardConfig: CardStatusConfig;
  allIssues: JiraIssue[];
  onConfigChange: (config: CardStatusConfig) => void;
  isFlipped?: boolean;
  onFlip?: () => void;
}

export function ConfigurableMetricsCard({
  title,
  value,
  change,
  icon,
  description,
  iconBgColor,
  periodType,
  cardConfig,
  allIssues,
  onConfigChange,
  isFlipped = false,
  onFlip
}: ConfigurableMetricsCardProps) {
  const [tempConfig, setTempConfig] = useState<CardStatusConfig>(cardConfig);

  // Get unique status names and categories from issues
  const availableStatuses = Array.from(new Set(allIssues.map(issue => issue.fields.status.name)));
  const availableStatusCategories = Array.from(new Set(allIssues.map(issue => issue.fields.status.statusCategory.name)));

  const handleFlip = () => {
    if (onFlip) {
      onFlip();
    }
    setTempConfig(cardConfig); // Reset temp config when opening
  };

  const handleSave = () => {
    onConfigChange(tempConfig);
    if (onFlip) {
      onFlip(); // Close the card
    }
  };

  const handleCancel = () => {
    setTempConfig(cardConfig);
    if (onFlip) {
      onFlip(); // Close the card
    }
  };

  const handleStatusNameChange = (statusName: string, checked: boolean) => {
    const newStatusNames = checked
      ? [...tempConfig.statusNames, statusName]
      : tempConfig.statusNames.filter(name => name !== statusName);
    
    setTempConfig({
      ...tempConfig,
      statusNames: newStatusNames
    });
  };

  const handleStatusCategoryChange = (statusCategory: string, checked: boolean) => {
    const newStatusCategories = checked
      ? [...tempConfig.statusCategories, statusCategory]
      : tempConfig.statusCategories.filter(cat => cat !== statusCategory);
    
    setTempConfig({
      ...tempConfig,
      statusCategories: newStatusCategories
    });
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getChangeSign = (change: number) => {
    if (change > 0) return "+";
    if (change < 0) return "";
    return "";
  };

  return (
    <div className={`relative w-full transition-all duration-700 perspective-1000 ${
      isFlipped ? 'h-auto min-h-[400px]' : 'h-48'
    }`}>
      <div
        className={`relative w-full transition-transform duration-700 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ height: isFlipped ? 'auto' : '192px' }}
      >
        {/* Front of card */}
        <Card 
          className={`w-full backface-hidden cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 ${
            isFlipped ? 'absolute' : 'relative'
          }`}
          onClick={handleFlip}
          style={{ height: isFlipped ? '192px' : 'auto' }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                {icon}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                <div className={`text-sm ${getChangeColor(change)}`}>
                  {getChangeSign(change)}{change}% vs última semana
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            <div className="absolute bottom-2 right-2">
              <Settings className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Back of card */}
        <Card className={`w-full backface-hidden rotate-y-180 border border-gray-200 ${
          isFlipped ? 'relative' : 'absolute'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Configurar {title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="p-1 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {/* Status Categories */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Categorias de Status</h4>
                <div className="space-y-2">
                  {availableStatusCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${category}`}
                        checked={tempConfig.statusCategories.includes(category)}
                        onCheckedChange={(checked) => 
                          handleStatusCategoryChange(category, checked as boolean)
                        }
                      />
                      <label htmlFor={`cat-${category}`} className="text-sm text-gray-600">
                        <Badge variant="secondary">{category}</Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Names */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status Específicos</h4>
                <div className="grid grid-cols-1 gap-2">
                  {availableStatuses.slice(0, 6).map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={tempConfig.statusNames.some(name => 
                          status.toLowerCase().includes(name.toLowerCase()) ||
                          name.toLowerCase().includes(status.toLowerCase())
                        )}
                        onCheckedChange={(checked) => 
                          handleStatusNameChange(status.toLowerCase(), checked as boolean)
                        }
                      />
                      <label htmlFor={`status-${status}`} className="text-xs text-gray-600 truncate">
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-blue-600 text-white hover:bg-blue-700 text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}