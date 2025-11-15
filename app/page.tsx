'use client';

import { useState, useEffect } from 'react';
import InputForm from '@/components/InputForm';
import SummaryCards from '@/components/SummaryCards';
import ChartView from '@/components/ChartView';
import DataTable from '@/components/DataTable';
import { Inputs, ModelResult } from '@/lib/types';
import { runModel, getDefaultInputs } from '@/lib/calculator';

export default function Home() {
  const [inputs, setInputs] = useState<Inputs>(getDefaultInputs());
  const [result, setResult] = useState<ModelResult | null>(null);

  useEffect(() => {
    // Auto-recalculate when inputs change
    const modelResult = runModel(inputs);
    setResult(modelResult);
  }, [inputs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Buy vs Rent NPV Calculator
        </h1>
        <p className="text-gray-600 mb-8">
          Compare the net present value of buying vs renting a home over time
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form - Left Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <InputForm inputs={inputs} onChange={setInputs} />
            </div>
          </div>

          {/* Results - Right Side */}
          <div className="lg:col-span-2 space-y-6">
            {result && (
              <>
                <SummaryCards summary={result.summary} />
                <ChartView monthly={result.monthly} />
                <DataTable monthly={result.monthly} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
