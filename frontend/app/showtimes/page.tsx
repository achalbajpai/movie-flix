'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { showApi, movieApi } from '@/lib/api'
import type { ShowWithDetails } from '@/lib/api/show'
import type { Movie } from '@/lib/api/movie'
import { Clock, MapPin, Calendar, Film, ArrowLeft, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'

export default function ShowtimesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ShowtimesContent />
    </Suspense>
  )
}

function ShowtimesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [shows, setShows] = useState<ShowWithDetails[]>([])
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const movieId = searchParams.get('movieId')
  const city = searchParams.get('city')
  const date = searchParams.get('date')

  useEffect(() => {
    if (!movieId) {
      router.push('/results')
      return
    }

    fetchShowtimes()
  }, [movieId, city, date, router])

  const fetchShowtimes = async () => {
    if (!movieId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch movie details
      const movieResponse = await movieApi.getById(parseInt(movieId))
      if (movieResponse.success && movieResponse.data) {
        setMovie(movieResponse.data as Movie)
      }

      // Fetch shows for the movie
      const showsResponse = await showApi.getByMovie(
        parseInt(movieId),
        city || undefined,
        date || undefined
      )

      if (showsResponse.success && showsResponse.data) {
        setShows(showsResponse.data)
      } else {
        throw new Error(showsResponse.error?.message || 'Failed to load showtimes')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load showtimes'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleBookShow = (showId: number) => {
    const params = new URLSearchParams()
    params.set('showId', showId.toString())
    if (movieId) params.set('movieId', movieId)
    router.push(`/booking?${params.toString()}`)
  }

  const groupShowsByTheater = () => {
    const grouped: Record<string, ShowWithDetails[]> = {}

    shows.forEach(show => {
      const theaterKey = show.theater?.name || 'Unknown Theater'
      if (!grouped[theaterKey]) {
        grouped[theaterKey] = []
      }
      grouped[theaterKey].push(show)
    })

    return grouped
  }

  const formatShowTime = (showTime: string) => {
    return new Date(showTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatShowDate = (showTime: string) => {
    return new Date(showTime).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  if (loading) {
    return <LoadingState />
  }

  if (error || !movie) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
              <p className="text-muted-foreground mb-6">{error || 'Movie not found'}</p>
              <Button onClick={() => router.push('/results')}>
                Back to Search
              </Button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  const groupedShows = groupShowsByTheater()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>

          {/* Movie Information */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full md:w-40 h-60 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full md:w-40 h-60 bg-muted rounded-lg flex items-center justify-center">
                    <Film className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-grow">
                  <h1 className="text-3xl font-bold text-foreground mb-3">{movie.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="outline">{movie.genre}</Badge>
                    <Badge variant="outline">{movie.language}</Badge>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {movie.duration} min
                    </span>
                    {movie.rating && (
                      <Badge variant="secondary">{movie.rating}</Badge>
                    )}
                  </div>
                  {movie.description && (
                    <p className="text-muted-foreground">{movie.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Information */}
          {(city || date) && (
            <div className="mb-4 flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
              <span>Showing results for:</span>
              {city && (
                <Badge variant="secondary">
                  <MapPin className="h-3 w-3 mr-1" />
                  {city}
                </Badge>
              )}
              {date && (
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(date).toLocaleDateString()}
                </Badge>
              )}
            </div>
          )}

          {/* Showtimes */}
          {shows.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">No Showtimes Available</h3>
                <p className="text-muted-foreground mb-4">
                  There are no showtimes available for this movie with the selected filters.
                </p>
                <Button onClick={() => router.push('/results')}>
                  Search Other Movies
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                Available Showtimes ({shows.length})
              </h2>

              {Object.entries(groupedShows).map(([theaterName, theaterShows]) => (
                <Card key={theaterName}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {theaterName}
                    </CardTitle>
                    {theaterShows[0]?.theater && (
                      <p className="text-sm text-muted-foreground">
                        {theaterShows[0].theater.city}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {theaterShows.map((show) => (
                        <div key={show.show_id} className="border rounded-lg p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-base px-3 py-1">
                                  {formatShowTime(show.show_time)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatShowDate(show.show_time)}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                {show.screen && (
                                  <Badge variant="secondary">{show.screen.name}</Badge>
                                )}
                                <Badge variant="secondary">{show.show_type}</Badge>
                                <span className="text-muted-foreground">
                                  {show.available_seats} seats available
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Starting from</div>
                                <div className="text-xl font-bold flex items-center">
                                  <IndianRupee className="h-4 w-4" />
                                  {show.base_price}
                                </div>
                              </div>
                              <Button
                                onClick={() => handleBookShow(show.show_id)}
                                disabled={show.available_seats === 0}
                              >
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

function LoadingState() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-6 animate-pulse">
                  <div className="w-40 h-60 bg-muted rounded-lg"></div>
                  <div className="flex-grow space-y-4">
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-16 bg-muted rounded"></div>
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
