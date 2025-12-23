'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import InputForm from '@/components/InputForm';
import SummaryCards from '@/components/SummaryCards';
import ChartView from '@/components/ChartView';
import DataTable from '@/components/DataTable';
import { Inputs, ModelResult } from '@/lib/types';
import { runModel, getDefaultInputs } from '@/lib/calculator';
import { serializeInputsToParams, deserializeParamsToInputs } from '@/lib/urlParams';

function CalculatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [inputs, setInputs] = useState<Inputs>(() => {
    // Initialize from URL params if available, otherwise use defaults
    if (searchParams.toString()) {
      try {
        return deserializeParamsToInputs(searchParams);
      } catch (error) {
        console.error('Error parsing URL params:', error);
        return getDefaultInputs();
      }
    }
    return getDefaultInputs();
  });
  const [result, setResult] = useState<ModelResult | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const isUpdatingFromUrl = useRef(false);

  // Sync URL params to state when URL changes (e.g., browser back/forward)
  // Only runs when searchParams changes, not when inputs change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only sync if URL params actually changed and we didn't just update them
    if (isUpdatingFromUrl.current) {
      isUpdatingFromUrl.current = false;
      return;
    }

    if (searchParams.toString()) {
      try {
        const urlInputs = deserializeParamsToInputs(searchParams);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing with URL params (external state)
        setInputs(urlInputs);
      } catch (error) {
        console.error('Error parsing URL params:', error);
      }
    }
  }, [searchParams]);

  // Update URL params when inputs change (debounced)
  useEffect(() => {
    // Skip on initial mount to avoid overwriting URL params
    if (isInitialMount.current) {
      return;
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to update URL after 500ms of no changes
    debounceTimerRef.current = setTimeout(() => {
      const params = serializeInputsToParams(inputs);
      const currentUrl = searchParams.toString();
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      
      // Only update if URL actually changed
      if (currentUrl !== params.toString()) {
        isUpdatingFromUrl.current = true;
        router.replace(newUrl, { scroll: false });
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputs, router, searchParams]);

  useEffect(() => {
    // Auto-recalculate when inputs change
    const modelResult = runModel(inputs);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Computing derived state
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

        {/* Input Parameters - Top Row */}
        <div className="mb-8">
          <InputForm inputs={inputs} onChange={setInputs} />
        </div>

        {/* Results Section - Middle */}
        {result && (
          <div className="mb-8 space-y-6">
            <SummaryCards summary={result.summary} />
            <ChartView monthly={result.monthly} />
          </div>
        )}

        {/* Tables - Bottom, Full Width */}
        {result && (
          <div className="w-full">
            <DataTable monthly={result.monthly} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading calculator...</div>
      </div>
    }>
      <CalculatorContent />
    </Suspense>
  );
}
