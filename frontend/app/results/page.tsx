"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { SearchResults } from "@/components/search-results"
import { FilterSidebar } from "@/components/filter-sidebar"
import { SearchSummary } from "@/components/search-summary"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useBusSearch } from "@/lib/hooks"
import { BusSearchParams } from "@/lib/api"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const { buses, metadata, filters, loading, error, searchBuses } = useBusSearch()

  useEffect(() => {
    const source = searchParams.get('source')
    const destination = searchParams.get('destination')
    const departureDate = searchParams.get('departureDate')
    const passengers = searchParams.get('passengers')

    if (source && destination && departureDate && passengers) {
      const searchQuery: BusSearchParams = {
        source,
        destination,
        departureDate,
        passengers: parseInt(passengers),
        // Optional parameters
        returnDate: searchParams.get('returnDate') || undefined,
        sortBy: (searchParams.get('sortBy') as any) || 'price',
        sortOrder: 'asc',
        page: 1,
        limit: 20,
        // Filter parameters
        priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
        priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
        operators: searchParams.get('operators')?.split(',').filter(Boolean) || undefined,
        busTypes: searchParams.get('busTypes')?.split(',').filter(Boolean) || undefined,
        departureTimeStart: searchParams.get('departureTimeSlots')?.split(',')[0]?.split('-')[0] || undefined,
        departureTimeEnd: searchParams.get('departureTimeSlots')?.split(',').slice(-1)[0]?.split('-')[1] || undefined,
      }

      searchBuses(searchQuery)
    }
  }, [searchParams, searchBuses])

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-destructive mb-4">Search Error</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button
                onClick={() => window.history.back()}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
              >
                Go Back
              </button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <SearchSummary />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
            {/* Filter Sidebar */}
            <div className="lg:col-span-1">
              <FilterSidebar filters={filters} loading={loading} />
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <SearchResults buses={buses} loading={loading} />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
