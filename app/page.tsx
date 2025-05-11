import { Button } from '@/components/ui/button';
import Spline from '@splinetool/react-spline/next';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen relative" style={{ backgroundColor: 'white' }}>
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <Spline
          scene="https://prod.spline.design/UKCa9sgV5cesK2cU/scene.splinecode" 
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
        <div className="px-6 lg:px-8 pointer-events-none">
          <div className="mx-auto max-w-2xl pointer-events-none">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 pointer-events-none">
              <div className="text-center pointer-events-none">
                <div className="flex flex-col items-center pointer-events-none">
                  <img src="/logo.svg" alt="Logo" className="h-12 w-12 mb-2" />
                  <h1 className="text-4xl font-bold tracking-tight sm:text-6xl" style={{fontSize: '60px', color: 'black'}}>
                    TradeVision
                  </h1>
                </div>
                <p className="mt-4 text-lg leading-8" style={{ color: 'black' }}>
                  Visualize your trading strategies with<br />interactive 3D models and real-time data analytics.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6 pointer-events-auto">
                  <div className="flex justify-center px-4 py-4 gap-2 max-w-md">
                    <Link href="/analyze">
                      <Button 
                        className="w-full text-md px-8 transition-all duration-200 hover:bg-gray-800 hover:scale-105" 
                        style={{ backgroundColor: 'black', color: 'white' }}
                      >
                        Try it out
                        <ArrowRight className="w-4 h-4" /> 
                      </Button>
                      
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
