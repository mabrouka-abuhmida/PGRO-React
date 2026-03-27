/**
 * ResearchThemesPanel - Research themes overview with bar chart
 */
import React from 'react';
import { Card } from '@/components';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import './panels.css';

// Extended color palette for different themes
const THEME_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
  '#82ca9d', '#ffc658', '#ff7300', '#9c27b0', '#e91e63',
  '#00bcd4', '#4caf50', '#ff9800', '#f44336', '#2196f3',
  '#795548', '#607d8b', '#3f51b5', '#009688', '#cddc39'
];

interface ResearchThemesPanelProps {
  topicsByTheme: {
    primary_themes: Array<{
      theme: string;
      type: string;
      topics: Array<{ topic: string; count: number }>;
      total_applications: number;
    }>;
    secondary_themes: Array<{
      theme: string;
      type: string;
      topics: Array<{ topic: string; count: number }>;
      total_applications: number;
    }>;
  } | null;
}

export const ResearchThemesPanel: React.FC<ResearchThemesPanelProps> = ({ topicsByTheme }) => {
  const primaryThemesData = topicsByTheme?.primary_themes
    .map((theme, index) => ({
      name: theme.theme,
      applications: theme.total_applications,
      topics: theme.topics.length,
      color: THEME_COLORS[index % THEME_COLORS.length]
    }))
    .sort((a, b) => b.applications - a.applications) || [];

  return (
    <div className="analytics-panel">
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Primary Research Themes</h2>
        <ResponsiveContainer width="100%" height={600}>
          <BarChart 
            data={primaryThemesData}
            margin={{ top: 20, right: 30, bottom: 120, left: 80 }}
            barSize={40}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={150}
              tick={{ fontSize: 12 }}
              interval={0}
              tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              width={70}
              label={{ value: 'Number of Applications', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} applications`, 'Applications']}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="applications" radius={[4, 4, 0, 0]}>
              {primaryThemesData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Theme Details</h2>
        <div className="themes-list">
          {topicsByTheme?.primary_themes.slice(0, 10).map((theme) => (
            <div key={theme.theme} className="theme-item">
              <h3>{theme.theme}</h3>
              <p className="theme-meta">{theme.total_applications} applications</p>
              <div className="topic-tags">
                {theme.topics.slice(0, 5).map((topic) => (
                  <span key={topic.topic} className="topic-tag">
                    {topic.topic} ({topic.count})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

