"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { SearchResults } from "@/components/search-results"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useMovieSearch } from "@/lib/hooks"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const { movies, loading, error, searchMovies } = useMovieSearch()

  useEffect(() => {
    const city = searchParams.get('city')
    const date = searchParams.get('date')
    const movieTitle = searchParams.get('movie')

    if (city || movieTitle) {
      const searchQuery: any = {}

      if (city) searchQuery.city = city
      if (date) searchQuery.date = date
      if (movieTitle) searchQuery.movieTitle = movieTitle

      searchMovies(searchQuery)
    }
  }, [searchParams, searchMovies])

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Movie Search Results</h1>
            {searchParams.get('city') && (
              <p className="text-muted-foreground">
                Showing movies in {searchParams.get('city')}
                {searchParams.get('date') && ` on ${new Date(searchParams.get('date')!).toLocaleDateString()}`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Search Results */}
            <SearchResults movies={movies} loading={loading} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
