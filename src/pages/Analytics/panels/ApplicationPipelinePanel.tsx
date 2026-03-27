/**
 * ApplicationPipelinePanel - Funnel/stacked bar showing application pipeline flow
 */
import React from 'react';
import { Card } from '@/components';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './panels.css';

interface ApplicationPipelinePanelProps {
  statistics: {
    status_breakdown: Record<string, number>;
  } | null;
}

export const ApplicationPipelinePanel: React.FC<ApplicationPipelinePanelProps> = ({ statistics }) => {
  // Define pipeline stages in order
  const pipelineStages = [
    { key: 'NEW', label: 'New', color: '#0088FE' },
    { key: 'UNDER_REVIEW', label: 'Under Review', color: '#FFBB28' },
    { key: 'SUPERVISOR_CONTACTED', label: 'Supervisor Contacted', color: '#FF8042' },
    { key: 'ACCEPTED', label: 'Accepted', color: '#00C49F' },
    { key: 'REJECTED', label: 'Rejected', color: '#FF6B6B' },
    { key: 'ON_HOLD', label: 'On Hold', color: '#8884d8' },
  ];

  const pipelineData = pipelineStages.map(stage => ({
    stage: stage.label,
    count: statistics?.status_breakdown[stage.key] || 0,
    color: stage.color
  })).filter(item => item.count > 0);

  return (
    <div className="analytics-panel">
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Application Pipeline</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={pipelineData} 
            layout="vertical"
            margin={{ top: 20, right: 30, bottom: 20, left: 150 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              dataKey="stage" 
              type="category" 
              width={140}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8">
              {pipelineData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Pipeline Table */}
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Pipeline Breakdown</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {pipelineData.map((item) => (
              <tr key={item.stage}>
                <td>{item.stage}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

