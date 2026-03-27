/**
 * Analytics Dashboard - Redesigned with sidebar layout and panel system
 */
import React, { useState } from "react";
import {
  AnalyticsLayout,
  type AnalyticsPanel,
} from "@/layouts/AnalyticsLayout";
import { SkeletonCard } from "@/components";
import {
  useTopicsByTheme,
  useApplicationStatistics,
  useAcceleratorResearchThemeCorrelation,
} from "@/hooks";
import {
  OverviewPanel,
  StatusDistributionPanel,
  DegreeDistributionPanel,
  IntakeTrendsPanel,
  ApplicationPipelinePanel,
  ResearchThemesPanel,
  TopicKeywordsPanel,
  AcceleratorCorrelationPanel,
  StaffCapacityPanel,
  ResearchGroupCoveragePanel,
  AcceptanceRatesPanel,
  StaffPerformanceRatesPanel,
} from "./panels";
import "./Analytics.css";

export const Analytics: React.FC = () => {
  const [currentPanel, setCurrentPanel] = useState<AnalyticsPanel>("overview");

  // Fetch analytics data in parallel
  const { data: topicsByTheme, isLoading: loadingTopicsByTheme } =
    useTopicsByTheme();
  const { data: statistics, isLoading: loadingStatistics } =
    useApplicationStatistics();
  const { data: correlation = [], isLoading: loadingCorrelation } =
    useAcceleratorResearchThemeCorrelation();

  const loading =
    loadingTopicsByTheme || loadingStatistics || loadingCorrelation;

  const handlePrint = async () => {
    // Wait a bit to ensure charts are fully rendered
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Force browser to include background graphics and SVG elements
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        svg, .recharts-wrapper, .recharts-surface {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      }
    `;
    document.head.appendChild(style);

    window.print();

    // Clean up after print
    setTimeout(() => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    }, 1000);
  };

  const renderPanel = () => {
    if (loading) {
      return <SkeletonCard />;
    }

    switch (currentPanel) {
      case "overview":
        return <OverviewPanel statistics={statistics ?? null} />;
      case "status-distribution":
        return <StatusDistributionPanel statistics={statistics ?? null} />;
      case "degree-distribution":
        return <DegreeDistributionPanel statistics={statistics ?? null} />;
      case "intake-trends":
        return <IntakeTrendsPanel statistics={statistics ?? null} />;
      case "application-pipeline":
        return <ApplicationPipelinePanel statistics={statistics ?? null} />;
      case "research-themes":
        return <ResearchThemesPanel topicsByTheme={topicsByTheme ?? null} />;
      case "topic-keywords":
        return <TopicKeywordsPanel topicsByTheme={topicsByTheme ?? null} />;
      case "accelerator-correlation":
        return <AcceleratorCorrelationPanel correlation={correlation} />;
      case "staff-capacity":
        return <StaffCapacityPanel />;
      case "research-group-coverage":
        return <ResearchGroupCoveragePanel statistics={statistics ?? null} />;
      case "acceptance-rates":
        return <AcceptanceRatesPanel />;
      case "staff-performance-rates":
        return <StaffPerformanceRatesPanel />;
      default:
        return <OverviewPanel statistics={statistics ?? null} />;
    }
  };

  return (
    <AnalyticsLayout
      currentPanel={currentPanel}
      onPanelChange={setCurrentPanel}
      onPrint={handlePrint}
    >
      {renderPanel()}
    </AnalyticsLayout>
  );
};
