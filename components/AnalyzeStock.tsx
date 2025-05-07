import React, { useState } from "react";
import StockChart from "./StockChart";

interface AnalyzeStockProps {
  searchValue: string;
}

interface PipelineStep {
  step: string;
  status: "running" | "completed" | "error";
  message?: string;
}

interface StockResult {
  result: {
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
      sector?: string;
      industry?: string;
      marketCap?: number;
      description?: string;
    };
    pipeline_steps?: PipelineStep[];
  };
  error?: string;
  status?: string;
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
      const response = await fetch("http://localhost:5001/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ 
          symbols: searchValue,
          force_refresh: forceRefresh 
        }),
      });

      if (!response.ok) {
        throw new Error("API error: " + response.statusText);
      }

      const data = await response.json();
      console.log("DEBUG: Received data from API:", data);
      console.log("DEBUG: Stock result:", data.results[searchValue.toUpperCase()]?.result);
      console.log("DEBUG: Financial data:", data.results[searchValue.toUpperCase()]?.result?.financial_data);
      console.log("DEBUG: Historical data:", data.results[searchValue.toUpperCase()]?.result?.financial_data?.historical_data);
      setResult(data);
    } catch (err) {
      console.error("DEBUG: Error in handleAnalyze:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Call handleAnalyze only on mount (not on every searchValue change)
  React.useEffect(() => {
    if (searchValue.trim()) {
      handleAnalyze(false);
    }
    // eslint-disable-next-line
  }, []); // Only run once per mount

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
      {loading && (
        <div className="flex flex-col items-center justify-center p-8">
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
      
      {result && (
        <>
          {(() => {
            console.log("DEBUG: AnalyzeStock result:", result);
            console.log("DEBUG: Stock result for symbol:", result.results[searchValue.toUpperCase()]);
            return null;
          })()}
          <div className="space-y-8">
            <StockChart 
              data={result.results[searchValue.toUpperCase()]?.result} 
              companyInfo={result.results[searchValue.toUpperCase()]?.result?.company_info}
              onRefresh={handleRefresh}
              loading={loading}
              status={result.results[searchValue.toUpperCase()]?.status}
              pipelineSteps={result.results[searchValue.toUpperCase()]?.result?.pipeline_steps}
            />
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Raw Data</h2>
              <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
