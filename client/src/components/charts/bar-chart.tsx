import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BarChartProps {
  data: Array<{
    name: string;
    fullName?: string;
    issues: number;
    storyPoints?: number;
  }>;
  metric: "issues" | "storyPoints";
}

export function DeveloperProductivityChart({ data, metric }: BarChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="name" 
            stroke="#525252"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#525252"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
            }}
            formatter={(value: any, name: string, props: any) => {
              // Usar fullName se disponível, senão usar name
              const developerName = props.payload.fullName || props.payload.name;
              const metricLabel = metric === "issues" ? "issues" : "story points";
              return [value, metricLabel];
            }}
            labelFormatter={(label: string, payload: any) => {
              // Mostrar nome completo no label do tooltip
              if (payload && payload.length > 0) {
                return payload[0].payload.fullName || payload[0].payload.name;
              }
              return label;
            }}
          />
          <Bar 
            dataKey={metric} 
            fill="#0f62fe"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
