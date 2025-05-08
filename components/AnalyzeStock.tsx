import React, { useState, useEffect, useRef } from "react";
import StockChart from "./StockChart";
import { API_BASE_URL } from '../app/api/stock-service';
import { Button } from "@/components/ui/button";
import StockHeaderCard from './StockHeaderCard';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { toast } from "sonner";

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

function PipelineSteps({ steps }: { steps: PipelineStep[] | undefined }) {
  if (!steps || !Array.isArray(steps)) {
    console.log("PipelineSteps: steps is not an array:", steps);
    return null;
  }

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
  const [processedSteps, setProcessedSteps] = useState<Set<string>>(new Set());
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const processedStepsRef = useRef<Set<string>>(new Set());

  // Function to check pipeline status
  const checkPipelineStatus = async (symbol: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const steps = data.pipeline_steps || [];
      
      if (Array.isArray(steps)) {
        steps.forEach((step: PipelineStep) => {
          const stepKey = `${step.step}-${step.status}`;
          if (!processedStepsRef.current.has(stepKey)) {
            console.log("New pipeline step:", step);
            processedStepsRef.current.add(stepKey);
            if (step.status === "completed") {
              console.log("Showing completed toast for:", step.step);
              toast.success(`${step.step}${step.message ? `: ${step.message}` : ''}`, {
                duration: 8000
              });
            } else if (step.status === "error") {
              console.log("Showing error toast for:", step.step);
              toast.error(`${step.step}: ${step.message || "An error occurred"}`, {
                duration: 12000
              });
            } else if (step.status === "running") {
              console.log("Showing running toast for:", step.step);
              toast.loading(step.step, {
                duration: 5000
              });
            }
            setProcessedSteps(prev => new Set([...prev, stepKey]));
          }
        });
      }

      return data;
    } catch (err) {
      console.error("Error checking pipeline status:", err);
      return null;
    }
  };

  const handleAnalyze = async (forceRefresh = false) => {
    if (!searchValue.trim()) return;
    
    setLoading(true);
    setError("");
    setResult(null);
    setProcessedSteps(new Set());
    processedStepsRef.current.clear();

    try {
      console.log('Starting analysis for:', searchValue);
      
      // First, try to establish SSE connection
      const sseUrl = `${API_BASE_URL}/analyze/stream/${searchValue}`;
      console.log("DEBUG: API_BASE_URL:", API_BASE_URL);
      console.log("DEBUG: Full SSE URL:", sseUrl);
      
      // Close any existing connection
      if (eventSource) {
        console.log("DEBUG: Closing existing SSE connection");
        eventSource.close();
        setEventSource(null);
      }

      // Create new EventSource without credentials
      console.log("DEBUG: Creating new EventSource");
      const newEventSource = new EventSource(sseUrl, { withCredentials: false });
      setEventSource(newEventSource);
      
      // Wait for connection to be established
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log("DEBUG: SSE connection timeout");
          newEventSource.close();
          setEventSource(null);
          reject(new Error("SSE connection timeout"));
        }, 5000); // Reduced timeout to 5 seconds

        // Check if connection is already open
        if (newEventSource.readyState === EventSource.OPEN) {
          console.log("DEBUG: SSE connection already open");
          clearTimeout(timeout);
          resolve(true);
          toast.success("Pipeline connection established", {
            duration: 5000
          });
          return;
        }

        newEventSource.onopen = () => {
          console.log("DEBUG: SSE connection opened successfully");
          console.log("DEBUG: SSE readyState:", newEventSource.readyState);
          clearTimeout(timeout);
          resolve(true);
          toast.success("Pipeline connection established", {
            duration: 5000
          });
        };
        
        newEventSource.onerror = (error) => {
          console.error("DEBUG: SSE Error:", error);
          console.log("DEBUG: SSE readyState:", newEventSource.readyState);
          console.log("DEBUG: SSE URL:", sseUrl);
          
          // Only reject if the connection is actually closed
          if (newEventSource.readyState === EventSource.CLOSED) {
            clearTimeout(timeout);
            reject(error);
            newEventSource.close();
            setEventSource(null);
            toast.error("Lost connection to pipeline updates", {
              duration: 8000
            });
          }
        };
      });

      // Add message handler
      newEventSource.addEventListener('message', (event) => {
        try {
          console.log("DEBUG: Raw SSE message received:", event.data);
          const data = JSON.parse(event.data);
          console.log("DEBUG: Parsed SSE update:", data);
          
          if (data.status === "connected") {
            console.log("DEBUG: Received connected confirmation");
            return;
          }
          
          if (data.error) {
            console.error("DEBUG: SSE error:", data.error);
            toast.error(data.error, {
              duration: 12000
            });
            return;
          }

          // Log all incoming data for debugging
          console.log("DEBUG: Processing SSE data:", {
            step: data.step,
            status: data.status,
            message: data.message,
            timestamp: data.timestamp
          });

          if (data.step && data.status) {
            const stepKey = `${data.step}-${data.status}-${data.message}`;
            console.log("DEBUG: Generated stepKey:", stepKey);
            console.log("DEBUG: Current processed steps:", Array.from(processedStepsRef.current));
            
            if (!processedStepsRef.current.has(stepKey)) {
              console.log("DEBUG: New step detected, adding to processed steps");
              processedStepsRef.current.add(stepKey);
              
              // Only show toast for completed steps, not for running ones
              if (data.status === "completed") {
                console.log("DEBUG: Showing completed toast for step:", data.step);
                // Skip showing toast for "Analyzing social media" step since it's shown in the final result
                if (data.step !== "Analyzing social media") {
                  toast.success(data.message || "Step completed successfully", {
                    duration: 8000
                  });
                }
              } else if (data.status === "error") {
                console.log("DEBUG: Showing error toast for step:", data.step);
                toast.error(`Error in ${data.step}: ${data.message || "An error occurred"}`, {
                  duration: 12000
                });
              }
              
              setProcessedSteps(prev => {
                const newSet = new Set([...prev, stepKey]);
                console.log("DEBUG: Updated processed steps:", Array.from(newSet));
                return newSet;
              });
            } else {
              console.log("DEBUG: Step already processed:", stepKey);
            }
          } else {
            console.log("DEBUG: Invalid step data:", data);
          }
        } catch (error) {
          console.error("DEBUG: Error processing SSE message:", error);
          toast.error("Failed to process pipeline update", {
            duration: 12000
          });
        }
      });

      // Then make the analyze request
      console.log('Making analyze request...');
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
          force_refresh: forceRefresh 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log("DEBUG: Received data from API:", data);

      // Update the result when the pipeline completes
      setResult(data);
      setLoading(false);

    } catch (err) {
      console.error("DEBUG: Error in handleAnalyze:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error(err instanceof Error ? err.message : "Unknown error", {
        duration: 12000
      });
      setLoading(false);
      
      // Clean up EventSource on error
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    }
  };

  // Check if data needs to be refreshed based on last_run timestamp
  const checkAndRefreshData = async () => {
    if (!searchValue.trim()) return;

    try {
      // Force refresh to ensure we get new data and establish SSE
      console.log("DEBUG: Forcing refresh to establish SSE connection");
      handleAnalyze(true);
    } catch (err) {
      console.error("Error checking data freshness:", err);
      // If there's an error checking, just try to get fresh data
      handleAnalyze(true);
    }
  };

  // Call checkAndRefreshData on mount and when searchValue changes
  React.useEffect(() => {
    let isSubscribed = true;
    
    // Only clean up event source on unmount
    return () => {
      isSubscribed = false;
      if (eventSource) {
        console.log("DEBUG: Cleaning up SSE connection");
        eventSource.close();
        setEventSource(null);
      }
    };
  }, []); // Remove searchValue dependency

  // Reset processed steps when search value changes
  useEffect(() => {
    processedStepsRef.current.clear();
    setProcessedSteps(new Set());
  }, [searchValue]);

  // Trigger initial analysis when component mounts
  useEffect(() => {
    if (searchValue.trim()) {
      console.log("DEBUG: Initial analysis triggered for:", searchValue);
      handleAnalyze();
    }
  }, [searchValue]); // Only run when searchValue changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        console.log("DEBUG: Cleaning up SSE connection on unmount");
        eventSource.close();
        setEventSource(null);
      }
      processedStepsRef.current.clear();
      setProcessedSteps(new Set());
    };
  }, []);

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
