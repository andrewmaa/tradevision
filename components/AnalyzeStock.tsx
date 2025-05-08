import React, { useState, useEffect } from "react";
import StockChart from "./StockChart";
import { API_BASE_URL } from '../app/api/stock-service';
import { Button } from "@/components/ui/button";
import StockHeaderCard from './StockHeaderCard';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface AnalyzeStockProps {
  searchValue: string;
}

interface PipelineStep {
  step: string;
  status: "running" | "completed" | "error";
  message?: string;
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
  pipeline_steps?: PipelineStep[];
}

interface StockResult {
  result: StockData;
  status: string;
  error?: string;
  pipeline_steps?: PipelineStep[];
}

interface ApiResponse {
  message: string;
  results: {
    [key: string]: StockResult;
  };
}

function PipelineSteps({ steps }: { steps: PipelineStep[] }) {
  return (
    <div className="space-y-2 mt-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${
            step.status === "completed" ? "bg-green-500" :
            step.status === "running" ? "bg-blue-500 animate-pulse" :
            "bg-red-500"
          }`} />
          <div className="flex-1">
            <div className="text-sm font-medium">{step.step}</div>
            {step.message && (
              <div className="text-xs text-gray-500">{step.message}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyzeStock({ searchValue }: AnalyzeStockProps) {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async (forceRefresh = false) => {
    if (!searchValue.trim()) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      console.log('Making request to:', `${API_BASE_URL}/analyze`); // Debug log
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        mode: 'cors',  // Explicitly set CORS mode
        credentials: 'omit',  // Don't send credentials
        body: JSON.stringify({ 
          symbols: searchValue,
          force_refresh: forceRefresh 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log("DEBUG: Received data from API:", data);
      
      // Ensure the result is properly structured
      const stockResult = data.results[searchValue.toUpperCase()];
      if (stockResult?.result) {
        // Ensure last_run is set
        if (!stockResult.result.last_run) {
          stockResult.result.last_run = new Date().toISOString();
        }
        // Ensure pipeline_steps is set
        if (!stockResult.result.pipeline_steps) {
          stockResult.result.pipeline_steps = [];
        }
      }
      
      setResult(data);
    } catch (err) {
      console.error("DEBUG: Error in handleAnalyze:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Check if data needs to be refreshed based on last_run timestamp
  const checkAndRefreshData = async () => {
    if (!searchValue.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ 
          symbols: searchValue,
          force_refresh: false 
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const stockData = data.results[searchValue.toUpperCase()]?.result;
      
      if (stockData?.last_run) {
        const lastRun = new Date(stockData.last_run);
        const now = new Date();
        const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
        
        // If data is older than 1 hour, refresh it
        if (hoursSinceLastRun >= 1) {
          console.log("Data is older than 1 hour, refreshing...");
          handleAnalyze(true);
        } else {
          console.log("Using cached data, last updated:", lastRun);
          // Ensure the result is properly structured
          if (stockData) {
            stockData.last_run = lastRun.toISOString();
            if (!stockData.pipeline_steps) {
              stockData.pipeline_steps = [];
            }
          }
          setResult(data);
        }
      } else {
        // If no last_run timestamp, treat as new data
        console.log("No last_run timestamp, treating as new data");
        handleAnalyze(true);
      }
    } catch (err) {
      console.error("Error checking data freshness:", err);
      // If there's an error checking, just try to get fresh data
      handleAnalyze(true);
    }
  };

  // Call checkAndRefreshData on mount and when searchValue changes
  React.useEffect(() => {
    if (searchValue.trim()) {
      checkAndRefreshData();
    }
  }, [searchValue]); // Add searchValue as a dependency

  // Debug log before rendering
  if (result) {
    const stockData = result.results[searchValue.toUpperCase()]?.result;
    console.log("DEBUG: Rendering StockChart with data:", stockData);
    console.log("DEBUG: Financial data structure:", stockData?.financial_data);
    console.log("DEBUG: Historical data structure:", stockData?.financial_data?.historical_data);
  }

  // Refresh handler
  const handleRefresh = () => {
    handleAnalyze(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="min-h-[400px]">
        {loading && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            {result?.results[searchValue.toUpperCase()]?.result?.pipeline_steps && (
              <PipelineSteps steps={result.results[searchValue.toUpperCase()].result.pipeline_steps || []} />
            )}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {result && !loading && (
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
                const companyInfo = stockData.company_info || { name: searchValue.toUpperCase() };
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
                  />
                );
              })()}
              <StockChart 
                data={result.results[searchValue.toUpperCase()]?.result} 
                companyInfo={result.results[searchValue.toUpperCase()]?.result?.company_info}
                onRefresh={handleRefresh}
                loading={loading}
                status={result.results[searchValue.toUpperCase()]?.status}
                pipelineSteps={result.results[searchValue.toUpperCase()]?.result?.pipeline_steps}
              />
              
              <Accordion type="single" collapsible className="bg-white rounded-lg shadow">
                <AccordionItem value="raw-data" className="border-none">
                  <AccordionTrigger className="text-xl font-semibold px-6 py-4 hover:no-underline">
                    Raw Data
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="overflow-auto max-h-96 max-w-[700px]">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
