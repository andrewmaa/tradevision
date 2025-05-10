import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { AlertCircle, HelpCircle } from "lucide-react";
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
import { useState, ReactElement } from "react";
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

// Add custom dot component
const CustomDot = (props: any) => {
  const { cx, cy, payload, selectedDate, dataKey, points, ...rest } = props;
  if (selectedDate && payload.date === selectedDate) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={props.stroke}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  }
  return null;
};

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

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  // Process historical data for charting
  const processHistoricalData = () => {
    if (!data?.financial_data?.historical_data) return [];

    // Convert historical data to array format for charting
    const chartData = Object.entries(data.financial_data.historical_data).map(([date, values]) => {
      // Parse the date and convert to local timezone
      const localDate = new Date(date + 'T00:00:00-04:00'); // EST timezone
      return {
        date: localDate.toISOString().split('T')[0], // Ensure consistent date format
        ...values
      };
    });

    // Sort by date
    chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log("DEBUG: Processed historical data:", chartData.slice(-5)); // Show last 5 data points
    console.log("DEBUG: Current time:", new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));

    return chartData;
  };

  const chartData = processHistoricalData();
  const currentDayData = selectedDate 
    ? chartData.find(d => d.date === selectedDate) || chartData[chartData.length - 1]
    : chartData[chartData.length - 1];
  const previousDayData = chartData[chartData.length - 2];

  console.log("DEBUG: Current day data:", currentDayData);
  console.log("DEBUG: Previous day data:", previousDayData);

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
      

      {/* Price Range & Volume with Current Day Data */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Price Range & Volume</CardTitle>
          <HoverCard openDelay={0} closeDelay={0}>
            <HoverCardTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-[280px] sm:w-80">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Understanding OHLC & Volume</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">OHLC (Open, High, Low, Close)</p>
                    <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                      <li><span className="text-[#f59e42]">Open</span>: The first trading price of the period</li>
                      <li><span className="text-[#22c55e]">High</span>: The highest trading price of the period</li>
                      <li><span className="text-[#ef4444]">Low</span>: The lowest trading price of the period</li>
                      <li><span className="text-[#6366f1]">Close</span>: The last trading price of the period</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Volume</p>
                    <p className="text-sm text-muted-foreground">
                      The total number of shares traded during the period. Higher volume often indicates stronger price movements and more significant market activity.
                    </p>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Graph */}
            <div className="h-[300px] sm:h-[400px] relative">
              <div className="absolute inset-0 overflow-x-auto overflow-y-hidden">
                <div className="min-w-[600px] h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={chartData}
                      onClick={(data) => {
                        if (data && data.activePayload && data.activePayload[0]) {
                          setSelectedDate(data.activePayload[0].payload.date);
                        }
                      }}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        className="text-xs sm:text-sm text-muted-foreground"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            ...(window.innerWidth >= 640 ? { year: '2-digit' } : {})
                          });
                        }}
                        tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                        interval="preserveStartEnd"
                        minTickGap={window.innerWidth < 640 ? 30 : 50}
                      />
                      <YAxis
                        yAxisId="left"
                        className="text-xs sm:text-sm text-muted-foreground"
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                        domain={['auto', 'auto']}
                        tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                        width={window.innerWidth < 640 ? 40 : 60}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        className="text-xs sm:text-sm text-muted-foreground"
                        tickFormatter={(value) => value.toLocaleString()}
                        domain={['auto', 'auto']}
                        tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
                        width={window.innerWidth < 640 ? 40 : 60}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg border text-xs sm:text-sm">
                                <p className="font-semibold">{new Date(label).toLocaleDateString()}</p>
                                {payload.map((entry: any, index: number) => (
                                  <p key={index} style={{ color: entry.color }}>
                                    {entry.name}: {entry.name === 'Volume' 
                                      ? entry.value.toLocaleString() 
                                      : `$${entry.value.toFixed(2)}`}
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {selectedSeries.Open && (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Open"
                          stroke="#f59e42"
                          strokeWidth={2}
                          dot={<CustomDot selectedDate={selectedDate} />}
                        />
                      )}
                      {selectedSeries.High && (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="High"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={<CustomDot selectedDate={selectedDate} />}
                        />
                      )}
                      {selectedSeries.Low && (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Low"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={<CustomDot selectedDate={selectedDate} />}
                        />
                      )}
                      {selectedSeries.Close && (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Close"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={<CustomDot selectedDate={selectedDate} />}
                        />
                      )}
                      {selectedSeries.Volume && (
                        <Bar
                          yAxisId="right"
                          dataKey="Volume"
                          fill="#94a3b8"
                          opacity={0.3}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Scroll indicator for mobile */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 sm:hidden">
                <div className="bg-black/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-muted-foreground">
                  ← Scroll to see more →
                </div>
              </div>
            </div>

            <div className="border-t pt-4 sm:pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Date</p>
                  <p className="text-sm sm:text-lg font-medium">
                    {new Date(currentDayData.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div 
                  className="space-y-1 cursor-pointer" 
                  onClick={() => toggleSeries('Open')}
                  style={getSeriesStyle('Open')}
                >
                  <p className="text-xs sm:text-sm text-muted-foreground">Open</p>
                  <p className="text-sm sm:text-lg font-medium">${currentDayData.Open.toFixed(2)}</p>
                </div>
                <div 
                  className="space-y-1 cursor-pointer"
                  onClick={() => toggleSeries('High')}
                  style={getSeriesStyle('High')}
                >
                  <p className="text-xs sm:text-sm text-muted-foreground">High</p>
                  <p className="text-sm sm:text-lg font-medium">${currentDayData.High.toFixed(2)}</p>
                </div>
                <div 
                  className="space-y-1 cursor-pointer"
                  onClick={() => toggleSeries('Low')}
                  style={getSeriesStyle('Low')}
                >
                  <p className="text-xs sm:text-sm text-muted-foreground">Low</p>
                  <p className="text-sm sm:text-lg font-medium">${currentDayData.Low.toFixed(2)}</p>
                </div>
                <div 
                  className="space-y-1 cursor-pointer"
                  onClick={() => toggleSeries('Close')}
                  style={getSeriesStyle('Close')}
                >
                  <p className="text-xs sm:text-sm text-muted-foreground">Close</p>
                  <p className="text-sm sm:text-lg font-medium">${currentDayData.Close.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 