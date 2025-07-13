import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description: string;
  iconBgColor?: string;
  periodType?: string;
}

export function MetricsCard({
  title,
  value,
  change,
  icon,
  description,
  iconBgColor = "bg-blue-100",
  periodType = "week",
}: MetricsCardProps) {
  const changeColor = change && change >= 0 ? "text-green-600" : "text-red-600";
  const changeSign = change && change >= 0 ? "+" : "";

  // Get the correct comparison label based on period type
  const getComparisonLabel = (period: string) => {
    switch (period) {
      case 'week':
        return 'vs última semana';
      case 'month':
        return 'vs último mês';
      case 'quarter':
        return 'vs último trimestre';
      case 'custom':
      case 'all':
      default:
        return 'vs período anterior';
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBgColor)}>
            {icon}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {change !== undefined && (
              <div className={cn("text-xs font-medium", changeColor)}>
                {changeSign}{change}% {getComparisonLabel(periodType)}
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
