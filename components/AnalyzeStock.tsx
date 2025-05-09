import React, { useState, useEffect } from "react";
import StockChart from "./StockChart";
import { API_BASE_URL } from '../app/api/stock-service';
import { Button } from "@/components/ui/button";
import StockHeaderCard from './StockHeaderCard';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface AnalyzeStockProps {
  searchValue: string;
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

export default function AnalyzeStock({ searchValue }: AnalyzeStockProps) {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add initial data fetch when component mounts or searchValue changes
  React.useEffect(() => {
    if (searchValue.trim()) {
      handleAnalyze(false);
    }
  }, [searchValue]);

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
          symbol: searchValue,
          force_refresh: forceRefresh 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log("DEBUG: Received data from API:", data);
      
      // Update to handle new response format
      if (data.result) {
        // Ensure last_run is set
        if (!data.result.last_run) {
          data.result.last_run = new Date().toISOString();
        }
      }
      
      setResult({
        message: data.message,
        results: {
          [searchValue.toUpperCase()]: {
            result: data.result,
            status: data.status
          }
        }
      });
    } catch (err) {
      console.error("DEBUG: Error in handleAnalyze:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Call checkAndRefreshData on mount and when searchValue changes
  React.useEffect(() => {
    // Remove automatic data check on mount
    // Only check if we have a result and need to refresh
    if (result && searchValue.trim()) {
      const stockData = result.results[searchValue.toUpperCase()]?.result;
      if (stockData?.last_run) {
        const lastRun = new Date(stockData.last_run);
        const now = new Date();
        const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastRun >= 1) {
          console.log("Data is older than 1 hour, refreshing...");
          handleAnalyze(true);
        }
      }
    }
  }, [result, searchValue]); // Add result as a dependency

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
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-500">Analyzing {searchValue}...</p>
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
