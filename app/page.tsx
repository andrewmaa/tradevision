'use client'

import { Button } from '@/components/ui/button';
import Spline from '@splinetool/react-spline';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Suspense } from 'react';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Suspense fallback={<div className="w-full h-full bg-black" />}>
          <Spline
            scene="https://prod.spline.design/UKCa9sgV5cesK2cU/scene.splinecode"
            style={{ width: '100%', height: '100%' }}
          />
        </Suspense>
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 pointer-events-none"
            >
              <div className="text-center">
                <div className="flex flex-col items-center">
                  <motion.img 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    src="/logo.svg" 
                    alt="Logo" 
                    className="h-12 w-12 mb-2" 
                  />
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-4xl font-bold tracking-tight text-black sm:text-6xl" 
                    style={{fontSize: '60px'}}
                  >
                    TradeVision
                  </motion.h1>
                </div>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mt-4 text-lg leading-8 text-black"
                >
                  Visualize your trading strategies with<br />interactive 3D models and real-time data analytics.
                </motion.p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <div className="flex justify-center px-4 py-4 gap-2 max-w-md">
                    <Link href="/analyze">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          className="w-full text-md px-8 pointer-events-auto" 
                          style={{ backgroundColor: 'black', color: 'white' }}
                        >
                          Try it out
                        </Button>
                      </motion.div>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
