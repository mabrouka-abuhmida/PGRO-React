/**
 * IntakeTrendsPanel - Application trends over time by intake
 */
import React from 'react';
import { Card } from '@/components';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './panels.css';

interface IntakeTrendsPanelProps {
  statistics: {
    intake_trends: Array<{ year: number; term: string; count: number }>;
  } | null;
}

export const IntakeTrendsPanel: React.FC<IntakeTrendsPanelProps> = ({ statistics }) => {
  const intakeTrendData = statistics?.intake_trends.map(item => ({
    name: `${item.term} ${item.year}`,
    count: item.count,
    year: item.year,
    term: item.term
  })) || [];

  return (
    <div className="analytics-panel">
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Application Trends by Intake</h2>
        <ResponsiveContainer width="100%" height={450}>
          <LineChart 
            data={intakeTrendData}
            margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Application Count by Intake (Bar Chart)</h2>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart 
            data={intakeTrendData}
            margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip />
            <Bar dataKey="count" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

