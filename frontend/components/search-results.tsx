"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Film, Star, Clock, Calendar, MapPin, ChevronDown, ChevronUp } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import type { Movie, MovieSearchResult } from "@/lib/api/movie"

interface Show {
  show_id: number
  show_time: string
  end_time: string
  base_price: number
  show_type: string
  available_seats: number
  screen_name: string
  theater_name: string
  theater_city: string
}

interface SearchResultsProps {
  movies: (Movie | MovieSearchResult)[]
  shows?: Show[]
  loading: boolean
}

export function SearchResults({ movies, shows, loading }: SearchResultsProps) {
  const [expandedMovie, setExpandedMovie] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState("title")
  const searchParams = useSearchParams()
  const router = useRouter()

  const handleViewShowtimes = (movieId: number) => {
    const showtimeParams = new URLSearchParams(searchParams.toString())
    showtimeParams.set('movieId', movieId.toString())
    router.push(`/showtimes?${showtimeParams.toString()}`)
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', newSortBy)
    router.push(`/results?${params.toString()}`)
  }

  const toggleExpanded = (movieId: number) => {
    setExpandedMovie(expandedMovie === movieId ? null : movieId)
  }

  const sortedMovies = [...movies].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'rating':
        return (parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))
      case 'duration':
        const aDuration = 'duration' in a ? a.duration : 0
        const bDuration = 'duration' in b ? b.duration : 0
        return aDuration - bDuration
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-muted rounded w-40 animate-pulse"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">No movies found</h3>
        <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="border border-border rounded-md px-3 py-1 text-sm bg-background"
          >
            <option value="title">Title</option>
            <option value="rating">Rating</option>
            <option value="duration">Duration</option>
          </select>
        </div>
      </div>

      {sortedMovies.map((movie) => (
        <Card key={movie.movie_id} className="overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Movie Poster */}
              <div className="flex-shrink-0">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full md:w-32 h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full md:w-32 h-48 bg-muted rounded-lg flex items-center justify-center">
                    <Film className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Movie Details */}
              <div className="flex-grow space-y-3">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{movie.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{movie.genre}</Badge>
                        <Badge variant="outline">{movie.language}</Badge>
                        {'duration' in movie && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {movie.duration} min
                          </span>
                        )}
                        {movie.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {movie.rating}/10
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {'description' in movie && movie.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {movie.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="default"
                    onClick={() => handleViewShowtimes(movie.movie_id)}
                    className="w-full md:w-auto"
                  >
                    View Showtimes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
