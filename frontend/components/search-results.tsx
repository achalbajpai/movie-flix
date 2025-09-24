"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Star, Wifi, Zap, Snowflake, Users, ChevronDown, ChevronUp } from "lucide-react"
import { Bus } from "@/lib/api"
import { useSearchParams, useRouter } from "next/navigation"

// Mock data for demonstration
const mockBuses = [
  {
    id: 1,
    operator: "Volvo Travels",
    busType: "AC Sleeper",
    rating: 4.2,
    reviews: 1250,
    departureTime: "22:30",
    arrivalTime: "06:45",
    duration: "8h 15m",
    departureLocation: "Central Bus Stand",
    arrivalLocation: "City Terminal",
    price: 1200,
    seatsAvailable: 12,
    amenities: ["wifi", "ac", "charging"],
    features: ["Live Tracking", "Emergency Contact"],
  },
  {
    id: 2,
    operator: "RedBus Express",
    busType: "AC Seater",
    rating: 4.0,
    reviews: 890,
    departureTime: "14:15",
    arrivalTime: "20:30",
    duration: "6h 15m",
    departureLocation: "Main Station",
    arrivalLocation: "Downtown Terminal",
    price: 850,
    seatsAvailable: 8,
    amenities: ["ac", "charging"],
    features: ["Live Tracking"],
  },
  {
    id: 3,
    operator: "SRS Travels",
    busType: "Non-AC Sleeper",
    rating: 3.8,
    reviews: 650,
    departureTime: "23:45",
    arrivalTime: "07:30",
    duration: "7h 45m",
    departureLocation: "Bus Depot",
    arrivalLocation: "Central Station",
    price: 750,
    seatsAvailable: 15,
    amenities: ["charging"],
    features: ["Emergency Contact"],
  },
]

interface SearchResultsProps {
  buses: Bus[]
  loading: boolean
}

export function SearchResults({ buses, loading }: SearchResultsProps) {
  const [expandedBus, setExpandedBus] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState("price")
  const searchParams = useSearchParams()
  const router = useRouter()

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', newSortBy)
    router.push(`/results?${params.toString()}`)
  }

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "wifi":
        return <Wifi className="h-4 w-4" />
      case "ac":
        return <Snowflake className="h-4 w-4" />
      case "charging":
        return <Zap className="h-4 w-4" />
      default:
        return null
    }
  }

  const toggleExpanded = (busId: string) => {
    setExpandedBus(expandedBus === busId ? null : busId)
  }

  // Sort buses based on current sort option
  const sortedBuses = [...buses].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price
      case 'departure':
        return a.departureTime.localeCompare(b.departureTime)
      case 'duration':
        return a.duration - b.duration
      case 'rating':
        return b.operatorRating - a.operatorRating
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

  if (buses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">No buses found</h3>
        <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{buses.length} buses found</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-sm border border-border rounded-md px-3 py-1 bg-background"
          >
            <option value="price">Price</option>
            <option value="departure">Departure Time</option>
            <option value="duration">Duration</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      {/* Bus Results */}
      {sortedBuses.map((bus) => (
        <Card key={bus.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Bus Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{bus.operatorName}</h3>
                  <p className="text-sm text-muted-foreground">{bus.busType.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{bus.operatorRating.toFixed(1)}</span>
                </div>
              </div>

              {/* Time and Duration */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{bus.departureTime}</div>
                  <div className="text-xs text-muted-foreground">{bus.departureLocation}</div>
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 border-t border-dashed border-border"></div>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{Math.floor(bus.duration / 60)}h {bus.duration % 60}m</div>
                  <div className="flex-1 border-t border-dashed border-border"></div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-bold text-foreground">{bus.arrivalTime}</div>
                  <div className="text-xs text-muted-foreground">{bus.arrivalLocation}</div>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex items-center gap-3">
                {bus.amenities.slice(0, 3).map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-1 text-muted-foreground">
                    {getAmenityIcon(amenity.name.toLowerCase())}
                    <span className="text-xs capitalize">{amenity.name}</span>
                  </div>
                ))}
                {bus.amenities.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{bus.amenities.length - 3} more</span>
                )}
              </div>
            </div>

            {/* Price and Info */}
            <div className="flex lg:flex-col items-center lg:items-end gap-4 lg:gap-2">
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">₹{bus.price}</div>
                <div className="text-xs text-muted-foreground">
                  <Users className="h-3 w-3 inline mr-1" />
                  {bus.availableSeats} seats left
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => toggleExpanded(bus.id)} className="text-xs">
                {expandedBus === bus.id ? (
                  <>
                    Less Info <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    More Info <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedBus === bus.id && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-foreground mb-2">All Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {bus.amenities.map((amenity) => (
                      <Badge key={amenity.id} variant="secondary" className="text-xs">
                        {amenity.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Bus Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div>Bus Type: {bus.busType.name}</div>
                      <div>Total Seats: {bus.totalSeats}</div>
                    </div>
                    <div className="space-y-2">
                      <div>Category: {bus.busType.category}</div>
                      <div>Available: {bus.availableSeats}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  )
}
