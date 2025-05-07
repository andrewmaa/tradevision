import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { AlertCircle } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
  Line,
} from "recharts";
import { useState } from "react";
import React from "react";

interface StockData {
  financial_data: {
    historical_data: {
      [date: string]: {
        Open: number;
        High: number;
        Low: number;
        Close: number;
        Volume: number;
      };
    };
  };
  scores: {
    financial_momentum: number;
    news_sentiment: number;
    social_buzz: number;
    hype_index: number;
    sentiment_price_divergence: number;
  };
}

interface CompanyInfo {
  name: string;
  ticker: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  description?: string;
  ipo?: string;
  url?: string;
  exchange?: string;
  error?: string;
}

interface StockChartProps {
  data: StockData | undefined;
  companyInfo?: CompanyInfo;
  onRefresh?: () => void;
  loading?: boolean;
  status?: string;
  pipelineSteps?: Array<{ step: string; status: string; message?: string }>;
}

// ScoreCircle component
function ScoreCircle({ score }: { score: number }) {
  const radius = 36;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const target = Math.max(0, Math.min(score, 100));

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 50) return "#22c55e"; // green
    if (score >= 30) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  // Get tooltip message based on score
  const getTooltipMessage = (score: number) => {
    if (score >= 50) {
      return "This score indicates a strong positive sentiment with high market confidence, suggesting favorable conditions for investment.";
    }
    if (score >= 30) {
      return "This score shows moderate market sentiment with mixed signals, suggesting cautious consideration before investment.";
    }
    return "This score indicates concerning market sentiment with potential risks, suggesting careful evaluation before investment.";
  };

  // Animation state
  const [animatedScore, setAnimatedScore] = React.useState(0);

  React.useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 900; // ms
    const initial = animatedScore;
    const diff = target - initial;

    function animate(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedScore(initial + diff * progress);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setAnimatedScore(target);
      }
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line
  }, [target]);

  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const scoreColor = getScoreColor(animatedScore);

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div className="cursor-help group">
          <svg 
            height={radius * 2 + 4} 
            width={radius * 2 + 4} 
            viewBox={`0 0 ${radius * 2 + 4} ${radius * 2 + 4}`}
            className="translate-x-[-2px] translate-y-[-2px]"
          >
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius + 2}
              cy={radius + 2}
              className="transition-all duration-200 group-hover:stroke-[10px]"
            />
            <circle
              stroke={scoreColor}
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference + ' ' + circumference}
              style={{ 
                strokeDashoffset, 
                transition: 'stroke-dashoffset 0.5s, stroke 0.5s, stroke-width 0.2s',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center'
              }}
              r={normalizedRadius}
              cx={radius + 2}
              cy={radius + 2}
              className="transition-all duration-200 group-hover:stroke-[10px]"
            />
            <text
              x={radius + 2}
              y={radius + 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="1.5rem"
              fontWeight="bold"
              fill="#222"
            >
              {Math.round(animatedScore)}
            </text>
          </svg>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Hype Index Score: {Math.round(animatedScore)}</h4>
          <p className="text-sm text-muted-foreground">
            {getTooltipMessage(animatedScore)}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export default function StockChart({ data, companyInfo, onRefresh, loading, status, pipelineSteps }: StockChartProps) {
  console.log("DEBUG: StockChart props:", { status, pipelineSteps });
  console.log("DEBUG: Company info:", companyInfo);
  console.log("DEBUG: Data:", data);

  // Error Callout - only show the error callout, no card
  if (status === "error") {
    return (
      <div className="space-y-8">
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div className="text-red-700">
              {pipelineSteps?.find(step => step.status === "error")?.message || `An error occurred${companyInfo?.ticker ? ` for ${companyInfo.ticker}` : ''}.`}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [selectedSeries, setSelectedSeries] = useState<{
    Open: boolean;
    High: boolean;
    Low: boolean;
    Close: boolean;
    Volume: boolean;
  }>({
    Open: true,
    High: true,
    Low: true,
    Close: true,
    Volume: true,
  });

  console.log("DEBUG: StockChart received data:", data);
  console.log("DEBUG: StockChart received companyInfo:", companyInfo);
  
  if (!data) {
    console.log("DEBUG: StockChart received no data");
    return null;
  }

  if (!data.financial_data?.historical_data) {
    console.log("DEBUG: StockChart missing historical data");
    return null;
  }

  console.log("DEBUG: StockChart financial_data:", data.financial_data);
  console.log("DEBUG: StockChart historical_data:", data.financial_data.historical_data);

  // Convert historical data to array format for charting
  const historicalData = Object.entries(data.financial_data.historical_data)
    .map(([date, values]) => ({
      date,
      ...values
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  console.log("DEBUG: StockChart processed historical data:", historicalData);

  if (historicalData.length === 0) {
    console.log("DEBUG: StockChart no data points after processing");
    return null;
  }

  // Get the most recent day's data
  const currentDayData = historicalData[historicalData.length - 1];

  const toggleSeries = (series: keyof typeof selectedSeries) => {
    setSelectedSeries(prev => {
      // If trying to deselect the last active series, prevent it
      if (prev[series] && Object.values(prev).filter(Boolean).length <= 1) {
        return prev;
      }
      
      return {
        ...prev,
        [series]: !prev[series]
      };
    });
  };

  const getSeriesStyle = (series: keyof typeof selectedSeries) => {
    return {
      cursor: 'pointer',
      opacity: selectedSeries[series] ? 1 : 0.3,
      transition: 'opacity 0.2s ease-in-out',
    };
  };

  // Calculate hype index (social_buzz only)
  const hypeIndex = data && data.scores ? data.scores.hype_index : 0;

  return (
    <div className="space-y-8">
      {/* Company Information */}
      {companyInfo && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                {companyInfo.name} ({companyInfo.ticker})
              </CardTitle>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="ml-2 p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center group"
                  title="Refresh"
                  disabled={loading}
                  style={{ lineHeight: 0 }}
                >
                  <svg
                    className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {companyInfo.error ? (
              <div className="text-red-500 text-center py-4">
                {companyInfo.error}
              </div>
            ) : (
              <div className="flex items-start justify-between">
                {/* Company Details */}
                <div className="flex-1">
                  <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                    <div className="space-y-4">
                      {companyInfo.sector && (
                        <div>
                          <p className="text-sm text-muted-foreground">Sector</p>
                          <p className="text-base">{companyInfo.sector}</p>
                        </div>
                      )}
                      {companyInfo.industry && (
                        <div>
                          <p className="text-sm text-muted-foreground">Industry</p>
                          <p className="text-base">{companyInfo.industry}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {companyInfo.marketCap && (
                        <div>
                          <p className="text-sm text-muted-foreground">Market Cap</p>
                          <p className="text-base">
                            {companyInfo.marketCap > 0 
                              ? companyInfo.marketCap >= 1000000 
                                ? `$${(companyInfo.marketCap / 1000000).toFixed(2)}T`
                                : `$${(companyInfo.marketCap / 1000).toFixed(2)}B`
                              : "N/A"}
                          </p>
                        </div>
                      )}
                      {companyInfo.exchange && (
                        <div>
                          <p className="text-sm text-muted-foreground">Exchange</p>
                          <p className="text-base">{companyInfo.exchange}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {companyInfo.ipo && (
                        <div>
                          <p className="text-sm text-muted-foreground">IPO Date</p>
                          <p className="text-base">
                            {new Date(companyInfo.ipo).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {companyInfo.url && (
                        <div>
                          <p className="text-sm text-muted-foreground">Website</p>
                          <a 
                            href={companyInfo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-base text-blue-600 hover:underline"
                          >
                            {companyInfo.url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  {companyInfo.description && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-base line-clamp-3">{companyInfo.description}</p>
                    </div>
                  )}
                </div>
                {/* Hype Index Score Circle */}
                <div className="flex flex-col items-center justify-start ml-16 -mt-2">
                  <ScoreCircle score={hypeIndex} />
                  <div className="mt-2 text-sm text-muted-foreground text-center">Hype Index<br /><span className="text-xs">(combined score)</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Price Range & Volume with Current Day Data */}
      <Card>
        <CardHeader>
          <CardTitle>Price Range & Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Graph */}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs text-muted-foreground"
                    tickFormatter={(value) => {
                      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                        const date = new Date(value + 'T00:00:00Z');
                        return date instanceof Date && !isNaN(date.getTime()) ? date.toLocaleDateString() : value.toString();
                      }
                      const date = new Date(value as string);
                      return date instanceof Date && !isNaN(date.getTime()) ? date.toLocaleDateString() : value.toString();
                    }}
                  />
                  <YAxis
                    yAxisId="left"
                    className="text-xs text-muted-foreground"
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    className="text-xs text-muted-foreground"
                    tickFormatter={(value) => value.toLocaleString()}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const formattedValue = name === 'Volume' 
                        ? value.toLocaleString()
                        : `$${value.toFixed(2)}`;
                      return [formattedValue, name.replace(/\s+/g, '')];
                    }}
                  />
                  {selectedSeries.Volume && (
                    <Bar
                      yAxisId="right"
                      dataKey="Volume"
                      fill="#c4c4c4"
                      barSize={10}
                      name="Volume"
                    />
                  )}
                  {selectedSeries.High && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="High"
                      stroke="#22c55e"
                      fillOpacity={0.2}
                      fill="#22c55e"
                      name="High"
                    />
                  )}
                  {selectedSeries.Low && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="Low"
                      stroke="#ef4444"
                      fillOpacity={0.2}
                      fill="#ef4444"
                      name="Low"
                    />
                  )}
                  {selectedSeries.Open && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="Open"
                      stroke="#f59e42"
                      fill="#f59e42"
                      fillOpacity={0.2}
                      dot={false}
                      name="Open"
                    />
                  )}
                  {selectedSeries.Close && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="Close"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.2}
                      dot={false}
                      name="Close"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Current Day Data */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-5 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-lg font-medium">{new Date(currentDayData.date).toLocaleDateString()}</p>
                </div>
                <div 
                  className="space-y-1 cursor-pointer" 
                  onClick={() => toggleSeries('Open')}
                  style={getSeriesStyle('Open')}
                >
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-lg font-medium">${currentDayData.Open.toFixed(2)}</p>
                </div>
                <div 
                  className="space-y-1 cursor-pointer"
                  onClick={() => toggleSeries('High')}
                  style={getSeriesStyle('High')}
                >
                  <p className="text-sm text-muted-foreground">High</p>
                  <p className="text-lg font-medium">${currentDayData.High.toFixed(2)}</p>
                </div>
                <div 
                  className="space-y-1 cursor-pointer"
                  onClick={() => toggleSeries('Low')}
                  style={getSeriesStyle('Low')}
                >
                  <p className="text-sm text-muted-foreground">Low</p>
                  <p className="text-lg font-medium">${currentDayData.Low.toFixed(2)}</p>
                </div>
                <div 
                  className="space-y-1 cursor-pointer"
                  onClick={() => toggleSeries('Close')}
                  style={getSeriesStyle('Close')}
                >
                  <p className="text-sm text-muted-foreground">Close</p>
                  <p className="text-lg font-medium">${currentDayData.Close.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-4">
                <div 
                  className="space-y-1 cursor-pointer"
                  onClick={() => toggleSeries('Volume')}
                  style={getSeriesStyle('Volume')}
                >
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="text-lg font-medium">{currentDayData.Volume.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 