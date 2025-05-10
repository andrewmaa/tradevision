import { Button } from '@/components/ui/button';
import Spline from '@splinetool/react-spline/next';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <div className="absolute inset-0">
        <Spline
          scene="https://prod.spline.design/UKCa9sgV5cesK2cU/scene.splinecode" 
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 pointer-events-none">
              <div className="text-center">
                <div className="flex flex-col items-center">
                  <img src="/logo.svg" alt="Logo" className="h-12 w-12 mb-4" />
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl" style={{fontSize: '60px'}}>
                    TradeVision
                  </h1>
                </div>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Visualize your trading strategies with interactive 3D models and real-time data analytics.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <div className="flex justify-center px-4 py-4 gap-2 max-w-md">
                    <Link href="/analyze">
                      <Button variant="default" className="w-full text-md px-8 pointer-events-auto">
                        Try it out
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
