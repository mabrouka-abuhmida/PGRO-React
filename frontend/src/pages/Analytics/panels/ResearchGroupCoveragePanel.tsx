/**
 * ResearchGroupCoveragePanel - Research group coverage visualization
 */
import React from 'react';
import { Card } from '@/components';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './panels.css';

interface ResearchGroupCoveragePanelProps {
  statistics: {
    research_group_coverage: Array<{ research_group: string; applicant_count: number }>;
  } | null;
}

export const ResearchGroupCoveragePanel: React.FC<ResearchGroupCoveragePanelProps> = ({ statistics }) => {
  const researchGroupData = statistics?.research_group_coverage
    .map(item => ({
      name: item.research_group,
      count: item.applicant_count
    }))
    .sort((a, b) => b.count - a.count) || [];

  const groupsWithNoApplications = statistics?.research_group_coverage
    .filter(item => item.applicant_count === 0)
    .map(item => item.research_group) || [];

  return (
    <div className="analytics-panel">
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Research Group Coverage</h2>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart 
            data={researchGroupData}
            margin={{ top: 20, right: 30, bottom: 120, left: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={150}
              tick={{ fontSize: 11 }}
              interval={0}
              tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
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

      {groupsWithNoApplications.length > 0 && (
        <Card variant="elevated" className="chart-card">
          <h2 className="chart-title">Research Groups with No Applications</h2>
          <div className="topic-tags">
            {groupsWithNoApplications.map((group) => (
              <span key={group} className="topic-tag warning">
                {group}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

