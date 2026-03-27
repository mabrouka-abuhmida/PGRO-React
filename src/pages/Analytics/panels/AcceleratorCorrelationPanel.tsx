/**
 * AcceleratorCorrelationPanel - Accelerator vs Research Theme correlation matrix
 */
import React from 'react';
import { Card } from '@/components';
import './panels.css';

interface AcceleratorCorrelationPanelProps {
  correlation: Array<{
    accelerator: string;
    research_themes: Record<string, number>;
    total_allocations: number;
  }>;
}

export const AcceleratorCorrelationPanel: React.FC<AcceleratorCorrelationPanelProps> = ({ correlation }) => {
  if (correlation.length === 0) {
    return (
      <div className="analytics-panel">
        <Card variant="elevated" className="chart-card">
          <p>No correlation data available.</p>
        </Card>
      </div>
    );
  }

  const themeNames = correlation.length > 0 
    ? Object.keys(correlation[0].research_themes)
    : [];

  return (
    <div className="analytics-panel">
      <Card variant="elevated" className="chart-card">
        <h2 className="chart-title">Accelerator ↔ Research Group Theme Correlation</h2>
        <div className="correlation-matrix">
          <table className="correlation-table">
            <thead>
              <tr>
                <th>Accelerator</th>
                {themeNames.map((theme) => (
                  <th key={theme}>{theme}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {correlation.map((item) => (
                <tr key={item.accelerator}>
                  <td className="accelerator-name">
                    {item.accelerator.replace(' Accelerator', '')}
                  </td>
                  {themeNames.map((theme) => {
                    const count = item.research_themes[theme] || 0;
                    const maxCount = Math.max(
                      ...correlation.map(c => c.research_themes[theme] || 0)
                    );
                    const intensity = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <td
                        key={theme}
                        className="correlation-cell"
                        style={{
                          backgroundColor: `rgba(0, 136, 254, ${intensity / 100})`,
                          color: intensity > 50 ? 'white' : 'black',
                        }}
                        title={`${count} allocations`}
                      >
                        {count}
                      </td>
                    );
                  })}
                  <td className="total-cell">{item.total_allocations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

