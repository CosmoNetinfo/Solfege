"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface IncomeChartProps {
  data: { name: string; totale: number }[];
}

export function IncomeChart({ data }: IncomeChartProps) {
  return (
    <Card className="col-span-1 lg:col-span-4 border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Incassi Annuali</CardTitle>
        <CardDescription className="text-muted-foreground">Panoramica delle entrate per mese</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div style={{ width: '100%', height: 350, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4E0" />
              <XAxis 
                dataKey="name" 
                stroke="#7A736C" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#7A736C" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#F4F4F5' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E8E4E0', backgroundColor: '#FFFFFF' }}
              />
              <Bar 
                dataKey="totale" 
                fill="#E8621A" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
