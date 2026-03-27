/**
 * DegreeDistributionPanel - Degree type distribution (PhD vs MRes)
 */
import React from 'react';
import { Card } from '@/components';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import './panels.css';

const COLORS = ['#0088FE', '#00C49F'];

interface DegreeDistributionPanelProps {
  statistics: {
    degree_breakdown: Record<string, number>;
  } | null;
}

export const DegreeDistributionPanel: React.FC<DegreeDistributionPanelProps> = ({ statistics }) => {
  const degreeData = statistics ? Object.entries(statistics.degree_breakdown)
    .map(([degree, count]) => ({
      name: degree,
      value: count
    })) : [];

  const total = degreeData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="analytics-panel">
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Degree Type Distribution</h2>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={degreeData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              labelLine={true}
              label={({ name, percent }: { name: string; percent: number }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
              fill="#8884d8"
              dataKey="value"
              minAngle={5}
            >
              {degreeData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Degree Table */}
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Degree Breakdown</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Degree Type</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {degreeData.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.value}</td>
                <td>{total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

