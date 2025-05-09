import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { API_BASE_URL } from '../app/api/stock-service';
import { MetricsCard } from "@/components/metrics-card";

export default function Dashboard() {
  const [savedStocks, setSavedStocks] = useState<string[]>([]);
  const [stockData, setStockData] = useState<{[key: string]: any}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved stocks from localStorage
  useEffect(() => {
    const loadSavedStocks = () => {
      console.log('Loading saved stocks from localStorage');
      const stocks = JSON.parse(localStorage.getItem('savedStocks') || '[]');
      console.log('Loaded stocks:', stocks);
      setSavedStocks(stocks);
    };

    loadSavedStocks();
    // Listen for storage changes
    window.addEventListener('storage', loadSavedStocks);
    return () => window.removeEventListener('storage', loadSavedStocks);
  }, []);

  // Fetch data for each stock sequentially
  useEffect(() => {
    const fetchStockData = async () => {
      if (!isInitialized || savedStocks.length === 0) {
        console.log('Not initialized or no saved stocks');
        setIsLoading(false);
        return;
      }

      console.log('Starting to fetch data for stocks:', savedStocks);
      setIsLoading(true);
      const newStockData: {[key: string]: any} = {};
      
      for (const stock of savedStocks) {
        console.log(`Fetching data for ${stock}...`);
        try {
          const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "text/event-stream"
            },
            body: JSON.stringify({ 
              symbol: stock,
              force_refresh: false 
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          if (!response.body) {
            throw new Error('No response body available');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                console.log(`Stream complete for ${stock}`);
                // Process any remaining data in the buffer
                if (buffer.trim()) {
                  const lines = buffer.split('\n\n');
                  for (const line of lines) {
                    if (line.trim()) {
                      console.log(`Processing final buffer for ${stock}:`, line);
                      const [eventLine, dataLine] = line.split('\n');
                      if (dataLine) {
                        const data = JSON.parse(dataLine.replace('data: ', ''));
                        console.log(`Final data for ${stock}:`, data);
                        if (data.step === 'complete' && data.status === 'success' && data.data) {
                          newStockData[stock] = data.data;
                          setStockData(prev => ({
                            ...prev,
                            [stock]: data.data
                          }));
                        }
                      }
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
                  console.log(`Processing line for ${stock}:`, line);
                  const [eventLine, dataLine] = line.split('\n');
                  if (dataLine) {
                    const data = JSON.parse(dataLine.replace('data: ', ''));
                    console.log(`Received data for ${stock}:`, data);
                    if (data.step === 'complete' && data.status === 'success' && data.data) {
                      console.log(`Updating stock data for ${stock}`);
                      newStockData[stock] = data.data;
                      setStockData(prev => ({
                        ...prev,
                        [stock]: data.data
                      }));
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error reading stream for ${stock}:`, error);
          } finally {
            reader.releaseLock();
          }
        } catch (error) {
          console.error(`Error fetching data for ${stock}:`, error);
        }
      }
      
      console.log('Finished fetching all stock data');
      setIsLoading(false);
    };

    fetchStockData();
  }, [savedStocks, isInitialized]);

  // Set initialized after component mounts
  useEffect(() => {
    console.log('Setting initialized state');
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 1000); // Wait 1 second after mount before loading data

    return () => clearTimeout(timer);
  }, []);

  const removeStock = (stockToRemove: string) => {
    const newSavedStocks = savedStocks.filter(stock => stock !== stockToRemove);
    localStorage.setItem('savedStocks', JSON.stringify(newSavedStocks));
    setSavedStocks(newSavedStocks);
    // Remove the stock data from state
    setStockData(prev => {
      const newData = { ...prev };
      delete newData[stockToRemove];
      return newData;
    });
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-500">Updating stock data...</p>
      </div>
    );
  }

  if (savedStocks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <p className="text-lg">No saved stocks yet</p>
        <p className="text-sm">Search for stocks and save them to your dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4">
      <div className="grid grid-cols-2 gap-4">
        {savedStocks.map((stock) => {
          const data = stockData[stock];
          const score = data?.scores?.hype_index ?? 0;
          const price = data?.financial_data?.current_price ?? 0;
          const priceChange = data?.financial_data?.price_change ?? 0;
          return (
            <div key={stock} className="relative group">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeStock(stock)}
                className="h-6 w-6 p-0 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="h-4 w-4" />
              </Button>
              <MetricsCard
                title={stock}
                value={score.toString()}
                companyName={data?.company_info?.name ?? stock}
                change={{
                  value: price.toFixed(2),
                  percentage: `${priceChange.toFixed(2)}%`,
                  isPositive: priceChange >= 0
                }}
                chart={null}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
} 