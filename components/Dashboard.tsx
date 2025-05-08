import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { API_BASE_URL } from '../app/api/stock-service';
import { MetricsCard } from "@/components/metrics-card";

export default function Dashboard() {
  const [savedStocks, setSavedStocks] = useState<string[]>([]);
  const [stockData, setStockData] = useState<{[key: string]: any}>({});

  useEffect(() => {
    const loadSavedStocks = () => {
      const stocks = JSON.parse(localStorage.getItem('savedStocks') || '[]');
      setSavedStocks(stocks);
    };

    loadSavedStocks();
    // Listen for storage changes
    window.addEventListener('storage', loadSavedStocks);
    return () => window.removeEventListener('storage', loadSavedStocks);
  }, []);

  useEffect(() => {
    const fetchStockData = async () => {
      const newStockData: {[key: string]: any} = {};
      
      for (const stock of savedStocks) {
        try {
          const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ 
              symbols: stock,
              force_refresh: false 
            }),
          });

          if (response.ok) {
            const data = await response.json();
            newStockData[stock] = data.results[stock]?.result;
          }
        } catch (error) {
          console.error(`Error fetching data for ${stock}:`, error);
        }
      }
      
      setStockData(newStockData);
    };

    if (savedStocks.length > 0) {
      fetchStockData();
    }
  }, [savedStocks]);

  const removeStock = (stockToRemove: string) => {
    const newSavedStocks = savedStocks.filter(stock => stock !== stockToRemove);
    localStorage.setItem('savedStocks', JSON.stringify(newSavedStocks));
    setSavedStocks(newSavedStocks);
  };

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
                change={{ value: '', percentage: '', isPositive: score >= 50 }}
                chart={null}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
} 