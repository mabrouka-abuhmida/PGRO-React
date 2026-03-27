/**
 * TopicKeywordsPanel - Top 20 topic keywords with counts
 */
import React from 'react';
import { Card } from '@/components';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './panels.css';

interface TopicKeywordsPanelProps {
  topicsByTheme: {
    primary_themes: Array<{
      topics: Array<{ topic: string; count: number }>;
    }>;
    secondary_themes: Array<{
      topics: Array<{ topic: string; count: number }>;
    }>;
  } | null;
}

export const TopicKeywordsPanel: React.FC<TopicKeywordsPanelProps> = ({ topicsByTheme }) => {
  // Aggregate all topics from both primary and secondary themes
  const topicMap = new Map<string, number>();
  
  topicsByTheme?.primary_themes.forEach(theme => {
    theme.topics.forEach(topic => {
      const current = topicMap.get(topic.topic) || 0;
      topicMap.set(topic.topic, current + topic.count);
    });
  });
  
  topicsByTheme?.secondary_themes.forEach(theme => {
    theme.topics.forEach(topic => {
      const current = topicMap.get(topic.topic) || 0;
      topicMap.set(topic.topic, current + topic.count);
    });
  });

  const topTopics = Array.from(topicMap.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return (
    <div className="analytics-panel">
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Top 20 Topic Keywords</h2>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart 
            data={topTopics} 
            layout="vertical"
            margin={{ top: 20, right: 30, bottom: 20, left: 200 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              dataKey="topic" 
              type="category" 
              width={190}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
            />
            <Tooltip />
            <Bar dataKey="count" fill="#00C49F" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Keyword List</h2>
        <div className="topic-tags">
          {topTopics.map((item) => (
            <span key={item.topic} className="topic-tag large">
              {item.topic} ({item.count})
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};

