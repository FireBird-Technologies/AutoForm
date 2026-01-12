import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: Array<{ date: string; views: number; submissions: number }>;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 360 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart 
        data={data} 
        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          stroke="#6b7280"
          style={{
            fontSize: '13px',
            fontWeight: '500'
          }}
        />
        <YAxis 
          stroke="#6b7280"
          style={{
            fontSize: '13px',
            fontWeight: '500'
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            color: '#111827',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          labelStyle={{ 
            color: '#6b7280',
            fontWeight: '600',
            marginBottom: '4px'
          }}
          cursor={{ fill: 'rgba(147, 51, 234, 0.05)' }}
        />
        <Legend 
          wrapperStyle={{ 
            color: '#6b7280',
            fontSize: '13px',
            fontWeight: '500',
            paddingTop: '16px'
          }}
          iconType="circle"
        />
        <Bar 
          dataKey="submissions" 
          fill="#a855f7" 
          name="Submissions" 
          radius={[8, 8, 0, 0]}
          maxBarSize={60}
        />
        <Bar 
          dataKey="views" 
          fill="#9ca3af" 
          name="Views" 
          radius={[8, 8, 0, 0]}
          maxBarSize={60}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
