"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeftRight, Calendar, MapPin, Edit, Search, X } from "lucide-react"
import { useCities } from "@/lib/hooks"

interface CityDropdownProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

function CityDropdown({ value, onChange, placeholder }: CityDropdownProps) {
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
    <div className="relative flex-1" ref={dropdownRef}>
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        className="h-10 text-sm"
      />
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-40 overflow-auto">
          {loading ? (
            <div className="p-2 text-xs text-muted-foreground">Searching...</div>
          ) : cities.length > 0 ? (
            cities.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city.name)}
                className="w-full text-left p-2 hover:bg-accent hover:text-accent-foreground text-xs border-b border-border last:border-b-0"
              >
                <div className="font-medium">{city.name}</div>
                <div className="text-xs text-muted-foreground">{city.state}</div>
              </button>
            ))
          ) : searchQuery.length >= 2 ? (
            <div className="p-2 text-xs text-muted-foreground">No cities found</div>
          ) : (
            <div className="p-2 text-xs text-muted-foreground">Type to search</div>
          )}
        </div>
      )}
    </div>
  )
}

export function SearchSummary() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState("")
  const [editData, setEditData] = useState({
    from: searchParams.get("source") || "",
    to: searchParams.get("destination") || "",
    date: searchParams.get("departureDate") || "",
    passengers: parseInt(searchParams.get("passengers") || "1")
  })

  const from = searchParams.get("source") || ""
  const to = searchParams.get("destination") || ""
  const date = searchParams.get("departureDate") || ""

  const formatDate = (dateString: string) => {
    if (!dateString) return "Select Date"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const handleModifySearch = () => {
    setError("") 
    setIsEditing(true)
  }

  const handleSaveSearch = () => {
    setError("")

    if (editData.from.toLowerCase().trim() === editData.to.toLowerCase().trim()) {
      setError("Source and destination cannot be the same")
      return
    }

    const params = new URLSearchParams({
      source: editData.from,
      destination: editData.to,
      departureDate: editData.date,
      passengers: editData.passengers.toString(),
    })
    router.push(`/results?${params.toString()}`)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditData({
      from: searchParams.get("source") || "",
      to: searchParams.get("destination") || "",
      date: searchParams.get("departureDate") || "",
      passengers: parseInt(searchParams.get("passengers") || "1")
    })
    setError("") // Clear any errors
    setIsEditing(false)
  }

  const handleSwapLocations = () => {
    setEditData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }))
  }

  return (
    <Card className="p-6 bg-card border-0 shadow-sm">
      {!isEditing ? (
        // Display Mode
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{from}</span>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-foreground">{to}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{formatDate(date)}</span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleModifySearch}>
            <Edit className="h-4 w-4 mr-2" />
            Modify Search
          </Button>
        </div>
      ) : (
        // Edit Mode
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Edit className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">Modify Search</span>
          </div>

          {/* Location Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            <div className="md:col-span-2">
              <CityDropdown
                value={editData.from}
                onChange={(value) => {
                  setEditData(prev => ({ ...prev, from: value }))
                  if (error) setError("") 
                }}
                placeholder="From city"
              />
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapLocations}
                className="h-8 w-8 rounded-full"
              >
                <ArrowLeftRight className="h-3 w-3" />
              </Button>
            </div>

            <div className="md:col-span-2">
              <CityDropdown
                value={editData.to}
                onChange={(value) => {
                  setEditData(prev => ({ ...prev, to: value }))
                  if (error) setError("") 
                }}
                placeholder="To city"
              />
            </div>
          </div>

          {/* Date and Passengers Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="date"
              value={editData.date}
              onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
              className="h-10 text-sm"
              min={new Date().toISOString().split("T")[0]}
            />

            <Select
              value={editData.passengers.toString()}
              onValueChange={(value) => setEditData(prev => ({ ...prev, passengers: parseInt(value) }))}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select passengers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Passenger</SelectItem>
                <SelectItem value="2">2 Passengers</SelectItem>
                <SelectItem value="3">3 Passengers</SelectItem>
                <SelectItem value="4">4 Passengers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSearch}
              disabled={!editData.from || !editData.to || !editData.date}
            >
              <Search className="h-3 w-3 mr-1" />
              Search
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
