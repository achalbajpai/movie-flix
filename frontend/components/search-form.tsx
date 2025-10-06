"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Calendar, Search, ChevronDown, Film } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCities, useNowShowing } from "@/lib/hooks"
import type { Movie } from "@/lib/api/movie"

interface CityDropdownProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function CityDropdown({ label, value, onChange, placeholder }: CityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value)
  const { cities, searchCities, loading } = useCities()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchCities(searchQuery, 10)
    }
  }, [searchQuery, searchCities])

  useEffect(() => {
    setSearchQuery(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCitySelect = (cityName: string) => {
    onChange(cityName)
    setSearchQuery(cityName)
    setIsOpen(false)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10 h-12 text-base"
          />
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">Searching cities...</div>
            ) : cities.length > 0 ? (
              cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city.name)}
                  className="w-full text-left p-3 hover:bg-accent hover:text-accent-foreground text-sm border-b border-border last:border-b-0"
                >
                  <div className="font-medium">{city.name}</div>
                  <div className="text-xs text-muted-foreground">{city.state}</div>
                </button>
              ))
            ) : searchQuery.length >= 2 ? (
              <div className="p-3 text-sm text-muted-foreground">No cities found</div>
            ) : (
              <div className="p-3 text-sm text-muted-foreground">Type to search cities</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface MovieDropdownProps {
  label: string
  value: string
  onChange: (value: string, movieId?: number) => void
  placeholder: string
}

function MovieDropdown({ label, value, onChange, placeholder }: MovieDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(value)
  const { movies, fetchNowShowing, loading } = useNowShowing()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch movies when component mounts or when dropdown opens
    if (isOpen && movies.length === 0) {
      fetchNowShowing()
    }
  }, [isOpen, fetchNowShowing, movies.length])

  useEffect(() => {
    setSearchQuery(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMovieSelect = (movie: Movie) => {
    onChange(movie.title, movie.movie_id)
    setSearchQuery(movie.title)
    setIsOpen(false)
  }

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Film className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onChange(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10 h-12 text-base"
          />
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">Loading movies...</div>
            ) : filteredMovies.length > 0 ? (
              filteredMovies.map((movie) => (
                <button
                  key={movie.movie_id}
                  onClick={() => handleMovieSelect(movie)}
                  className="w-full text-left p-3 hover:bg-accent hover:text-accent-foreground text-sm border-b border-border last:border-b-0"
                >
                  <div className="font-medium">{movie.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {movie.genre} • {movie.language}
                  </div>
                </button>
              ))
            ) : movies.length > 0 && searchQuery ? (
              <div className="p-3 text-sm text-muted-foreground">No movies match your search</div>
            ) : (
              <div className="p-3 text-sm text-muted-foreground">Click to see available movies</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function SearchForm() {
  const router = useRouter()
  const [searchData, setSearchData] = useState({
    city: "",
    date: "",
    movieTitle: "",
    movieId: undefined as number | undefined,
  })

  const handleSearch = () => {
    const params = new URLSearchParams()

    if (searchData.city) params.append('city', searchData.city)
    if (searchData.date) params.append('date', searchData.date)
    if (searchData.movieTitle) params.append('movie', searchData.movieTitle)
    if (searchData.movieId) params.append('movieId', searchData.movieId.toString())

    router.push(`/results?${params.toString()}`)
  }

  return (
    <Card className="p-8 shadow-lg border-0 bg-card">
      <div className="space-y-6">
        {/* Movie Title (Optional) */}
        <MovieDropdown
          label="Movie (Optional)"
          value={searchData.movieTitle}
          onChange={(title, movieId) => setSearchData((prev) => ({ ...prev, movieTitle: title, movieId }))}
          placeholder="Search for a movie..."
        />

        {/* City and Date Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* City */}
          <CityDropdown
            label="City"
            value={searchData.city}
            onChange={(value) => setSearchData((prev) => ({ ...prev, city: value }))}
            placeholder="Select your city"
          />

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-foreground">
              Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={searchData.date}
                onChange={(e) => setSearchData((prev) => ({ ...prev, date: e.target.value }))}
                className="pl-10 h-12 text-base"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div className="mt-8">
        <Button
          onClick={handleSearch}
          className="w-full h-14 text-lg font-semibold"
          disabled={!searchData.city && !searchData.movieTitle}
        >
          <Search className="h-5 w-5 mr-2" />
          Search Movies
        </Button>
      </div>
    </Card>
  )
}
