"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchFilters } from "@/lib/api"

interface FilterSidebarProps {
  filters: SearchFilters | null
  loading: boolean
}

export function FilterSidebar({ filters, loading }: FilterSidebarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [priceRange, setPriceRange] = useState([0, 2000])
  const [selectedOperators, setSelectedOperators] = useState<string[]>([])
  const [selectedBusTypes, setSelectedBusTypes] = useState<string[]>([])
  const [selectedDepartureTime, setSelectedDepartureTime] = useState<string[]>([])

  // Update filter options when filters from API are loaded
  useEffect(() => {
    if (filters?.priceRange) {
      setPriceRange([
        Math.min(priceRange[0], filters.priceRange.min),
        Math.max(priceRange[1], filters.priceRange.max)
      ])
    }
  }, [filters])

  const operators = filters?.availableOperators?.map(op => op.name) || ["RedBus Express", "Volvo Travels", "SRS Travels", "Orange Tours", "Greenline Travels"]
  const busTypes = filters?.availableBusTypes?.map(bt => bt.name) || ["AC Sleeper", "Non-AC Sleeper", "AC Seater", "Non-AC Seater", "Volvo AC", "Multi-Axle"]

  const departureSlots = [
    { label: "Early Morning", value: "early", time: "6 AM - 12 PM" },
    { label: "Afternoon", value: "afternoon", time: "12 PM - 6 PM" },
    { label: "Evening", value: "evening", time: "6 PM - 11 PM" },
    { label: "Night", value: "night", time: "11 PM - 6 AM" },
  ]

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Clear existing filter params
    const filterKeys = ['priceMin', 'priceMax', 'operators', 'busTypes', 'departureTimeSlots'] as const
    filterKeys.forEach(key => {
      params.delete(key)
    })

    // Apply price range
    if (priceRange[0] > 0) params.set('priceMin', priceRange[0].toString())
    if (priceRange[1] < 2000) params.set('priceMax', priceRange[1].toString())

    // Apply selected filters
    if (selectedOperators.length > 0) params.set('operators', selectedOperators.join(','))
    if (selectedBusTypes.length > 0) params.set('busTypes', selectedBusTypes.join(','))
    if (selectedDepartureTime.length > 0) {
      // Convert time slots to actual time ranges
      const timeRanges: string[] = []
      selectedDepartureTime.forEach(slot => {
        switch (slot) {
          case 'early': timeRanges.push('06:00-12:00'); break
          case 'afternoon': timeRanges.push('12:00-18:00'); break
          case 'evening': timeRanges.push('18:00-23:00'); break
          case 'night': timeRanges.push('23:00-06:00'); break
        }
      })
      params.set('departureTimeSlots', timeRanges.join(','))
    }

    router.push(`/results?${params.toString()}`)
  }

  const handleOperatorChange = (operator: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedOperators, operator]
    } else {
      newSelected = selectedOperators.filter((op) => op !== operator)
    }
    setSelectedOperators(newSelected)

    // Auto-apply filter after short delay
    setTimeout(() => applyFilters(), 100)
  }

  const handleBusTypeChange = (busType: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedBusTypes, busType]
    } else {
      newSelected = selectedBusTypes.filter((type) => type !== busType)
    }
    setSelectedBusTypes(newSelected)

    // Auto-apply filter after short delay
    setTimeout(() => applyFilters(), 100)
  }

  const handleDepartureTimeChange = (slot: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedDepartureTime, slot]
    } else {
      newSelected = selectedDepartureTime.filter((time) => time !== slot)
    }
    setSelectedDepartureTime(newSelected)

    // Auto-apply filter after short delay
    setTimeout(() => applyFilters(), 100)
  }

  const clearAllFilters = () => {
    setPriceRange([0, 2000])
    setSelectedOperators([])
    setSelectedBusTypes([])
    setSelectedDepartureTime([])

    // Clear URL params and reload
    const params = new URLSearchParams(searchParams.toString())
    const keysToRemove = ['priceMin', 'priceMax', 'operators', 'busTypes', 'departureTimeSlots']
    keysToRemove.forEach(key => params.delete(key))
    router.push(`/results?${params.toString()}`)
  }

  const activeFiltersCount = selectedOperators.length + selectedBusTypes.length + selectedDepartureTime.length

  if (loading) {
    return (
      <Card className="p-6 h-fit sticky top-24">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-muted rounded w-20"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold text-foreground">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Price Range */}
      <div className="space-y-4 mb-6">
        <Label className="text-sm font-medium">Price Range</Label>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            onValueCommit={() => setTimeout(() => applyFilters(), 300)}
            max={filters?.priceRange?.max || 2000}
            min={filters?.priceRange?.min || 0}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Departure Time */}
      <div className="space-y-4 mb-6">
        <Label className="text-sm font-medium">Departure Time</Label>
        <div className="space-y-3">
          {departureSlots.map((slot) => (
            <div key={slot.value} className="flex items-center space-x-2">
              <Checkbox
                id={slot.value}
                checked={selectedDepartureTime.includes(slot.value)}
                onCheckedChange={(checked) => handleDepartureTimeChange(slot.value, checked as boolean)}
              />
              <div className="flex flex-col">
                <Label htmlFor={slot.value} className="text-sm font-normal cursor-pointer">
                  {slot.label}
                </Label>
                <span className="text-xs text-muted-foreground">{slot.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Bus Type */}
      <div className="space-y-4 mb-6">
        <Label className="text-sm font-medium">Bus Type</Label>
        <div className="space-y-3">
          {busTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={type}
                checked={selectedBusTypes.includes(type)}
                onCheckedChange={(checked) => handleBusTypeChange(type, checked as boolean)}
              />
              <Label htmlFor={type} className="text-sm font-normal cursor-pointer">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Operators */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Operators</Label>
        <div className="space-y-3">
          {operators.map((operator) => (
            <div key={operator} className="flex items-center space-x-2">
              <Checkbox
                id={operator}
                checked={selectedOperators.includes(operator)}
                onCheckedChange={(checked) => handleOperatorChange(operator, checked as boolean)}
              />
              <Label htmlFor={operator} className="text-sm font-normal cursor-pointer">
                {operator}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}