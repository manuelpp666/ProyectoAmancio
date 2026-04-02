"use client";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";

interface BarrasProps {
  data: { label: string; val: number }[];
}

export default function BarrasRendimiento({ data }: BarrasProps) {
  return (
    <ResponsiveContainer width="100%" aspect={2}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
        <Bar dataKey="val" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.val >= 11 ? "#22c55e" : "#ef4444"} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}