import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface LineChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title: string;
}

export function TaskEvolutionChart({ data, title }: LineChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="name" 
            stroke="#525252"
            fontSize={12}
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
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#0f62fe" 
            strokeWidth={2}
            dot={{ fill: "#0f62fe", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#0f62fe", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
