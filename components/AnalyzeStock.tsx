import React, { useState, useEffect, useRef } from "react";
import StockChart from "./StockChart";
import { API_BASE_URL } from '../app/api/stock-service';
import { Button } from "@/components/ui/button";
import StockHeaderCard from './StockHeaderCard';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "sonner";
import SocialFeed from "./SocialFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { motion, useInView } from "framer-motion";
import { useSettings } from "@/contexts/settings-context";

interface PipelineStep {
  step: string;
  status: 'started' | 'success' | 'error' | 'info';
  message?: string;
}

interface AnalyzeStockProps {
  searchValue: string;
  onLoadingChange?: (loading: boolean) => void;
  onSearchValueChange?: (value: string) => void;
}

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
  company_info?: {
    name: string;
    ticker: string;
    description?: string;
    sector?: string;
    industry?: string;
    website?: string;
  };
  last_run?: string;
  news_data?: {
    articles: Array<{
      title: string;
      url: string;
      published_at: string;
      source: string;
      sentiment: {
        compound: number;
      };
    }>;
  };
  social_data?: {
    posts: Array<{
      platform: string;
      text: string;
      created_at: string;
      username: string;
      url: string;
      subreddit?: string;
      sentiment_score: number;
      engagement: number;
    }>;
  };
}

interface StockResult {
  result: StockData;
  status: string;
  error?: string;
}

interface ApiResponse {
  message: string;
  results: {
    [key: string]: StockResult;
  };
}

// Add this new component before ScoreBreakdown
const AnimatedProgress = ({ value, className }: { value: number; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className}`}>
      <motion.div
        className="absolute left-0 top-0 h-full bg-primary"
        initial={{ width: 0 }}
        animate={isInView ? { width: `${value}%` } : { width: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
};

function ScoreBreakdown({ scores }: { scores: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const scoreItems = [
    {
      name: "Financial Momentum",
      value: scores.financial_momentum,
      description: "Measures recent price and volume trends relative to historical performance"
    },
    {
      name: "News Sentiment",
      value: scores.news_sentiment,
      description: "Overall sentiment from news articles and financial reports"
    },
    {
      name: "Social Buzz",
      value: scores.social_buzz,
      description: "Social media engagement and sentiment analysis"
    },
    {
      name: "Sentiment-Price Divergence",
      value: scores.sentiment_price_divergence,
      description: "Difference between market sentiment and price movement"
    },
    {
      name: "Hype Index",
      value: scores.hype_index,
      description: "Combined score of all metrics weighted by importance"
    }
  ];

  return (
    <Card className="w-full" ref={ref}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Score Breakdown
          <HoverCard openDelay={0} closeDelay={0}>
            <HoverCardTrigger>
              <Info className="h-4 w-4 text-gray-400" />
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <p className="text-sm">
                Each score is calculated on a scale of 0-100, with higher values indicating stronger positive signals.
                The Hype Index combines all metrics to give an overall assessment.
              </p>
            </HoverCardContent>
          </HoverCard>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {scoreItems.map((item, index) => (
          <motion.div
            key={item.name}
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                <HoverCard openDelay={0} closeDelay={0}>
                  <HoverCardTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">{item.description}</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <motion.span 
                className="text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              >
                {item.value.toFixed(1)}
              </motion.span>
            </div>
            <AnimatedProgress value={item.value} />
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AnalyzeStock({ searchValue, onLoadingChange, onSearchValueChange }: AnalyzeStockProps) {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showRawData } = useSettings();

  // Add effect to handle URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tickerFromUrl = params.get('ticker');
    
    if (tickerFromUrl && tickerFromUrl !== searchValue) {
      onSearchValueChange?.(tickerFromUrl);
    }
  }, [window.location.search]); // This will run when URL changes

  // Add initial data fetch when component mounts or searchValue changes
  React.useEffect(() => {
    if (searchValue.trim()) {
      const checkAndRefreshData = () => {
        const stockData = result?.results[searchValue.toUpperCase()]?.result;
        const lastRun = stockData?.last_run;

        // If we have no data or no last_run, we should fetch
        if (!stockData || !lastRun) {
          console.log("No data or last_run timestamp, fetching fresh data...");
          handleAnalyze(false);  // Don't force refresh for initial fetch
          return;
        }

        try {
          const lastRunDate = new Date(lastRun);
          const now = new Date();
          
          // Check if the date is valid
          if (isNaN(lastRunDate.getTime())) {
            console.log("Invalid last_run date, fetching fresh data...");
            handleAnalyze(false);  // Don't force refresh for invalid date
            return;
          }

          const hoursSinceLastRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastRun >= 1) {
            console.log(`Data is ${hoursSinceLastRun.toFixed(1)} hours old, refreshing...`);
            handleAnalyze(false);  // Don't force refresh for expired data
          } else {
            console.log(`Data is fresh (${hoursSinceLastRun.toFixed(1)} hours old)`);
            // Don't call handleAnalyze at all for fresh data
          }
        } catch (error) {
          console.error("Error checking last_run:", error);
          // If there's any error parsing the date, fetch fresh data
          handleAnalyze(false);  // Don't force refresh for errors
        }
      };

      checkAndRefreshData();
    }
  }, [searchValue]);

  // Notify parent component of loading state changes
  React.useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const handleAnalyze = async (forceRefresh = false) => {
    if (!searchValue.trim()) return;
    
    // Update URL with the ticker
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('ticker', searchValue.toUpperCase());
    window.history.pushState({}, '', newUrl.toString());
    
    setLoading(true);
    setError("");
    setResult(null);
    setPipelineSteps([]);

    // Show initial toast
    toast.info(`Starting analysis for ${searchValue}...`);

    try {
      // Create a POST request with the parameters in the body
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({
          symbol: searchValue,
          force_refresh: forceRefresh
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `HTTP error! status: ${response.status}`);
        setLoading(false);
        return;
      }

      if (!response.body) {
        setError('No response body available');
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Process any remaining data in the buffer
            if (buffer.trim()) {
              const lines = buffer.split('\n\n');
              for (const line of lines) {
                if (line.trim()) {
                  const [eventLine, dataLine] = line.split('\n');
                  const data = JSON.parse(dataLine.replace('data: ', ''));
                  handleSSEMessage(data);
                }
              }
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              const [eventLine, dataLine] = line.split('\n');
              const data = JSON.parse(dataLine.replace('data: ', ''));
              handleSSEMessage(data);
            }
          }
        }
      } catch (error) {
        console.error('Error reading stream:', error);
        setError('Error reading response stream');
        setLoading(false);
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      console.error("Error in handleAnalyze:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  const handleSSEMessage = (data: any) => {
    console.log("Received SSE message:", data);
    
    if (data.step === 'complete') {
      if (data.status === 'success' && data.data) {
        setResult({
          message: "Analysis complete",
          results: {
            [searchValue.toUpperCase()]: {
              result: data.data,
              status: "completed"
            }
          }
        });
        toast.success("Analysis complete!");
      } else if (data.status === 'error') {
        setError(data.message || "An error occurred during analysis");
        // Only show toast for non-HTTP and non-financial data errors
        if (!data.message?.includes('HTTP error') && !data.message?.includes('Error retrieving financial data')) {
          toast.error(data.message || "An error occurred during analysis");
        }
      }
      setLoading(false);
    } else {
      // Update pipeline steps
      setPipelineSteps(prev => {
        const existingStepIndex = prev.findIndex(step => step.step === data.step);
        if (existingStepIndex >= 0) {
          const newSteps = [...prev];
          newSteps[existingStepIndex] = {
            step: data.step,
            status: data.status,
            message: data.message
          };
          return newSteps;
        } else {
          return [...prev, {
            step: data.step,
            status: data.status,
            message: data.message
          }];
        }
      });

      // Show toast for step update
      if (data.status === 'started') {
        toast.info(data.message);
      } else if (data.status === 'success') {
        toast.success(data.message);
      } else if (data.status === 'error') {
        // Only show toast for non-HTTP and non-financial data errors
        if (!data.message?.includes('HTTP error') && !data.message?.includes('Error retrieving financial data')) {
          toast.error(data.message);
        }
      }
    }
  };

  // Debug log before rendering
  if (result) {
    const stockData = result.results[searchValue.toUpperCase()]?.result;
    console.log("DEBUG: Rendering StockChart with data:", stockData);
    console.log("DEBUG: Financial data structure:", stockData?.financial_data);
    console.log("DEBUG: Historical data structure:", stockData?.financial_data?.historical_data);
  }

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await handleAnalyze(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="min-h-[400px]">
        {(loading || isRefreshing) && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="p-4 bg-card/50 backdrop-blur-sm rounded-lg border flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground text-center">
                {pipelineSteps.length > 0 
                  ? `${pipelineSteps[pipelineSteps.length - 1].message}...`
                  : `Analyzing ${searchValue}...`}
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {result && !loading && !isRefreshing && (
          <>
            {(() => {
              console.log("DEBUG: AnalyzeStock result:", result);
              console.log("DEBUG: Stock result for symbol:", result.results[searchValue.toUpperCase()]);
              return null;
            })()}
            <div className="space-y-8">
              {/* Stock Header Card */}
              {(() => {
                const stockData = result.results[searchValue.toUpperCase()]?.result;
                if (!stockData) return null;
                const financialData = stockData.financial_data as any;
                const price = typeof financialData?.current_price === 'number' ? financialData.current_price : 0;
                const change = typeof financialData?.price_change === 'number'
                  ? financialData.price_change
                  : (typeof financialData?.change === 'number' ? financialData.change : 0);
                const companyInfo = {
                  ...stockData.company_info || { name: searchValue.toUpperCase() },
                  description: financialData?.description
                };
                const ticker = (companyInfo as any).ticker || searchValue.toUpperCase();
                const hypeIndex = stockData.scores?.hype_index;
                return (
                  <StockHeaderCard
                    ticker={ticker}
                    currentPrice={price}
                    change={change}
                    companyInfo={companyInfo}
                    hypeIndex={hypeIndex}
                    lastRun={stockData.last_run}
                    onRefresh={handleRefresh}
                  />
                );
              })()}
              <StockChart 
                data={result.results[searchValue.toUpperCase()]?.result} 
                companyInfo={result.results[searchValue.toUpperCase()]?.result?.company_info}
                onRefresh={handleRefresh}
                loading={loading}
                status={result.results[searchValue.toUpperCase()]?.status}
                pipelineSteps={pipelineSteps}
              />
              
              {/* Add ScoreBreakdown component */}
              {result.results[searchValue.toUpperCase()]?.result?.scores && (
                <ScoreBreakdown scores={result.results[searchValue.toUpperCase()].result.scores} />
              )}
              
              {/* Social Feed */}
              {(() => {
                const stockData = result.results[searchValue.toUpperCase()]?.result;
                console.log("DEBUG: Full stock data:", stockData);
                console.log("DEBUG: News data type:", typeof stockData?.news_data);
                console.log("DEBUG: News data value:", stockData?.news_data);
                console.log("DEBUG: Articles array:", stockData?.news_data?.articles);
                console.log("DEBUG: Articles array type:", typeof stockData?.news_data?.articles);
                console.log("DEBUG: Articles array length:", stockData?.news_data?.articles?.length);
                
                // Add social data debugging
                console.log("DEBUG: Social data type:", typeof stockData?.social_data);
                console.log("DEBUG: Social data value:", stockData?.social_data);
                console.log("DEBUG: Posts array:", stockData?.social_data?.posts);
                console.log("DEBUG: Posts array type:", typeof stockData?.social_data?.posts);
                console.log("DEBUG: Posts array length:", stockData?.social_data?.posts?.length);
                
                // Log Reddit posts specifically
                let redditPosts = [];
                if (stockData?.social_data?.posts) {
                  // Ensure posts is an array before filtering
                  const posts = Array.isArray(stockData.social_data.posts) 
                    ? stockData.social_data.posts 
                    : typeof stockData.social_data.posts === 'string'
                      ? JSON.parse(stockData.social_data.posts)
                      : [];
                  
                  redditPosts = posts.filter((post: { platform: string }) => post.platform === 'Reddit');
                }
                console.log("DEBUG: Reddit posts:", redditPosts);
                console.log("DEBUG: Reddit posts count:", redditPosts.length);
                
                if (!stockData?.news_data || !stockData?.social_data) {
                  console.log("DEBUG: Missing news or social data:", {
                    newsData: stockData?.news_data,
                    socialData: stockData?.social_data
                  });
                  return null;
                }

                // Ensure news_data.articles is an array
                if (!Array.isArray(stockData.news_data.articles)) {
                  console.log("DEBUG: news_data.articles is not an array, attempting to parse");
                  try {
                    if (typeof stockData.news_data.articles === 'string') {
                      stockData.news_data.articles = JSON.parse(stockData.news_data.articles);
                    } else {
                      console.log("DEBUG: news_data.articles is not a string, cannot parse");
                      return null;
                    }
                  } catch (e) {
                    console.error("DEBUG: Error parsing news_data.articles:", e);
                    return null;
                  }
                }

                // Ensure social_data.posts is an array
                if (!Array.isArray(stockData.social_data.posts)) {
                  console.log("DEBUG: social_data.posts is not an array, attempting to parse");
                  try {
                    if (typeof stockData.social_data.posts === 'string') {
                      stockData.social_data.posts = JSON.parse(stockData.social_data.posts);
                    } else {
                      console.log("DEBUG: social_data.posts is not a string, cannot parse");
                      stockData.social_data.posts = []; // Initialize as empty array if parsing fails
                    }
                  } catch (e) {
                    console.error("DEBUG: Error parsing social_data.posts:", e);
                    stockData.social_data.posts = []; // Initialize as empty array if parsing fails
                  }
                }

                console.log("DEBUG: Processed news data structure:", stockData.news_data);
                console.log("DEBUG: Processed social data structure:", stockData.social_data);
                return (
                  <SocialFeed
                    newsData={stockData.news_data}
                    socialData={stockData.social_data}
                  />
                );
              })()}
              
              {showRawData && (
                <Accordion type="single" collapsible className="bg-card rounded-lg shadow">
                  <AccordionItem value="raw-data" className="border-none">
                    <AccordionTrigger className="text-xl font-semibold px-6 py-4 hover:no-underline">
                      Raw Data
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="overflow-auto max-h-96 max-w-[700px] text-foreground">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
