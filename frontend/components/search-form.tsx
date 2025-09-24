"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeftRight, MapPin, Calendar, Search, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCities } from "@/lib/hooks"

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

export function SearchForm() {
  const router = useRouter()
  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    date: "",
    returnDate: "",
    passengers: 1,
  })

  const handleSwapLocations = () => {
    setSearchData((prev) => ({
      ...prev,
      from: prev.to,
      to: prev.from,
    }))
  }

  const handleSearch = () => {
    // Navigate to results page with search parameters
    const params = new URLSearchParams({
      source: searchData.from,
      destination: searchData.to,
      departureDate: searchData.date,
      passengers: searchData.passengers.toString(),
      ...(searchData.returnDate && { returnDate: searchData.returnDate }),
    })
    router.push(`/results?${params.toString()}`)
  }

  return (
    <Card className="p-8 shadow-lg border-0 bg-card">
      {/* Main Search Fields */}
      <div className="space-y-6">
        {/* From/To Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <CityDropdown
              label="From"
              value={searchData.from}
              onChange={(value) => setSearchData((prev) => ({ ...prev, from: value }))}
              placeholder="Departure city"
            />
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwapLocations}
              className="h-12 w-12 rounded-full border-2 hover:bg-accent bg-transparent"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="md:col-span-2">
            <CityDropdown
              label="To"
              value={searchData.to}
              onChange={(value) => setSearchData((prev) => ({ ...prev, to: value }))}
              placeholder="Destination city"
            />
          </div>
        </div>

        {/* Date and Passengers Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Departure Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-foreground">
              Departure Date
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

          {/* Return Date */}
          <div className="space-y-2">
            <Label htmlFor="returnDate" className="text-sm font-medium text-foreground">
              Return Date (Optional)
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="returnDate"
                type="date"
                value={searchData.returnDate}
                onChange={(e) => setSearchData((prev) => ({ ...prev, returnDate: e.target.value }))}
                className="pl-10 h-12 text-base"
                min={searchData.date || new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="space-y-2">
            <Label htmlFor="passengers" className="text-sm font-medium text-foreground">
              Passengers
            </Label>
            <Input
              id="passengers"
              type="number"
              min="1"
              max="10"
              value={searchData.passengers}
              onChange={(e) => setSearchData((prev) => ({ ...prev, passengers: parseInt(e.target.value) || 1 }))}
              className="h-12 text-base"
            />
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div className="mt-8">
        <Button
          onClick={handleSearch}
          className="w-full h-14 text-lg font-semibold"
          disabled={!searchData.from || !searchData.to || !searchData.date}
        >
          <Search className="h-5 w-5 mr-2" />
          Search Buses
        </Button>
      </div>
    </Card>
  )
}
