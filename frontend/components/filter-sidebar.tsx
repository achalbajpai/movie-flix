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

  const [priceRange, setPriceRange] = useState(() => {
    const minPrice = searchParams.get('priceMin')
    const maxPrice = searchParams.get('priceMax')
    return [
      minPrice ? parseInt(minPrice) : 0,
      maxPrice ? parseInt(maxPrice) : 2000
    ]
  })

  const [selectedOperators, setSelectedOperators] = useState<string[]>(() => {
    const operators = searchParams.get('operators')
    return operators ? operators.split(',').filter(Boolean) : []
  })

  const [selectedBusTypes, setSelectedBusTypes] = useState<string[]>(() => {
    const busTypes = searchParams.get('busTypes')
    return busTypes ? busTypes.split(',').filter(Boolean) : []
  })

  const [selectedDepartureTime, setSelectedDepartureTime] = useState<string[]>(() => {
    const timeSlots = searchParams.get('departureTimeSlots')
    if (!timeSlots) return []

    const slots: string[] = []
    timeSlots.split(',').forEach(range => {
      const [start] = range.split('-')
      switch (start) {
        case '06:00': slots.push('early'); break
        case '12:00': slots.push('afternoon'); break
        case '18:00': slots.push('evening'); break
        case '23:00': slots.push('night'); break
      }
    })
    return slots
  })

  useEffect(() => {
    if (filters?.priceRange) {
      const currentMin = priceRange[0]
      const currentMax = priceRange[1]
      const apiMin = filters.priceRange.min
      const apiMax = filters.priceRange.max

      if (currentMin < apiMin || currentMax > apiMax || (currentMin === 0 && currentMax === 2000)) {
        setPriceRange([
          Math.max(currentMin, apiMin),
          Math.min(currentMax, apiMax)
        ])
      }
    }
  }, [filters, priceRange])

  useEffect(() => {
    const minPrice = searchParams.get('priceMin')
    const maxPrice = searchParams.get('priceMax')
    const newPriceRange = [
      minPrice ? parseInt(minPrice) : (filters?.priceRange?.min || 0),
      maxPrice ? parseInt(maxPrice) : (filters?.priceRange?.max || 2000)
    ]
    setPriceRange(newPriceRange)

    const operators = searchParams.get('operators')
    setSelectedOperators(operators ? operators.split(',').filter(Boolean) : [])

    const busTypes = searchParams.get('busTypes')
    setSelectedBusTypes(busTypes ? busTypes.split(',').filter(Boolean) : [])

    const timeSlots = searchParams.get('departureTimeSlots')
    if (timeSlots) {
      const slots: string[] = []
      timeSlots.split(',').forEach(range => {
        const [start] = range.split('-')
        switch (start) {
          case '06:00': slots.push('early'); break
          case '12:00': slots.push('afternoon'); break
          case '18:00': slots.push('evening'); break
          case '23:00': slots.push('night'); break
        }
      })
      setSelectedDepartureTime(slots)
    } else {
      setSelectedDepartureTime([])
    }
  }, [searchParams, filters])

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
  }

  const handleBusTypeChange = (busType: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedBusTypes, busType]
    } else {
      newSelected = selectedBusTypes.filter((type) => type !== busType)
    }
    setSelectedBusTypes(newSelected)
  }

  const handleDepartureTimeChange = (slot: string, checked: boolean) => {
    let newSelected: string[]
    if (checked) {
      newSelected = [...selectedDepartureTime, slot]
    } else {
      newSelected = selectedDepartureTime.filter((time) => time !== slot)
    }
    setSelectedDepartureTime(newSelected)
  }

  const clearAllFilters = () => {
    const defaultMin = filters?.priceRange?.min || 0
    const defaultMax = filters?.priceRange?.max || 2000

    setPriceRange([defaultMin, defaultMax])
    setSelectedOperators([])
    setSelectedBusTypes([])
    setSelectedDepartureTime([])

    const params = new URLSearchParams(searchParams.toString())
    const keysToRemove = ['priceMin', 'priceMax', 'operators', 'busTypes', 'departureTimeSlots']
    keysToRemove.forEach(key => params.delete(key))
    router.push(`/results?${params.toString()}`)
  }

  const resetCurrentSelection = () => {
    const minPrice = searchParams.get('priceMin')
    const maxPrice = searchParams.get('priceMax')
    setPriceRange([
      minPrice ? parseInt(minPrice) : (filters?.priceRange?.min || 0),
      maxPrice ? parseInt(maxPrice) : (filters?.priceRange?.max || 2000)
    ])

    const operators = searchParams.get('operators')
    setSelectedOperators(operators ? operators.split(',').filter(Boolean) : [])

    const busTypes = searchParams.get('busTypes')
    setSelectedBusTypes(busTypes ? busTypes.split(',').filter(Boolean) : [])

    const timeSlots = searchParams.get('departureTimeSlots')
    if (timeSlots) {
      const slots: string[] = []
      timeSlots.split(',').forEach(range => {
        const [start] = range.split('-')
        switch (start) {
          case '06:00': slots.push('early'); break
          case '12:00': slots.push('afternoon'); break
          case '18:00': slots.push('evening'); break
          case '23:00': slots.push('night'); break
        }
      })
      setSelectedDepartureTime(slots)
    } else {
      setSelectedDepartureTime([])
    }
  }

  const hasUnappliedChanges = () => {
    const currentUrlOperators = searchParams.get('operators')?.split(',').filter(Boolean) || []
    const currentUrlBusTypes = searchParams.get('busTypes')?.split(',').filter(Boolean) || []
    const currentUrlTimeSlots = searchParams.get('departureTimeSlots') || ''
    const currentUrlMinPrice = parseInt(searchParams.get('priceMin') || (filters?.priceRange?.min || 0).toString())
    const currentUrlMaxPrice = parseInt(searchParams.get('priceMax') || (filters?.priceRange?.max || 2000).toString())

    const currentTimeSlots: string[] = []
    if (currentUrlTimeSlots) {
      currentUrlTimeSlots.split(',').forEach(range => {
        const [start] = range.split('-')
        switch (start) {
          case '06:00': currentTimeSlots.push('early'); break
          case '12:00': currentTimeSlots.push('afternoon'); break
          case '18:00': currentTimeSlots.push('evening'); break
          case '23:00': currentTimeSlots.push('night'); break
        }
      })
    }

    return (
      JSON.stringify(selectedOperators.sort()) !== JSON.stringify(currentUrlOperators.sort()) ||
      JSON.stringify(selectedBusTypes.sort()) !== JSON.stringify(currentUrlBusTypes.sort()) ||
      JSON.stringify(selectedDepartureTime.sort()) !== JSON.stringify(currentTimeSlots.sort()) ||
      priceRange[0] !== currentUrlMinPrice ||
      priceRange[1] !== currentUrlMaxPrice
    )
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
      <div className="space-y-4 mb-6">
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

      {/* Apply Filters Button */}
      <div className="pt-4 border-t border-border space-y-2">
        <Button
          onClick={applyFilters}
          className="w-full"
          size="sm"
          variant={hasUnappliedChanges() ? "default" : "outline"}
          disabled={!hasUnappliedChanges()}
        >
          <Filter className="h-4 w-4 mr-2" />
          {hasUnappliedChanges() ? "Apply Filters" : "No Changes"}
        </Button>

        {hasUnappliedChanges() && (
          <Button
            onClick={resetCurrentSelection}
            className="w-full"
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4 mr-2" />
            Reset Changes
          </Button>
        )}
      </div>
    </Card>
  )
}