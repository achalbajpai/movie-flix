'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSeatSelection } from '@/lib/hooks'
import {
  Users,
  Clock,
  IndianRupee,
  AlertCircle,
  Loader2,
  Car,
  Zap
} from 'lucide-react'

interface SeatMapProps {
  scheduleId: number
  userId: string
  onSeatSelectionChange?: (seatIds: number[], totalPrice: number) => void
  className?: string
}

export function SeatMap({ scheduleId, userId, onSeatSelectionChange, className }: SeatMapProps) {
  const {
    layout,
    selectedSeats,
    pricing,
    loading,
    error,
    reservationTimer,
    toggleSeat,
    isSeatAvailable,
    isSeatSelected,
    isSeatReserved,
    getTotalPrice,
    formatTime,
    clearSelection
  } = useSeatSelection(scheduleId, userId)

  React.useEffect(() => {
    if (onSeatSelectionChange) {
      onSeatSelectionChange(selectedSeats, getTotalPrice())
    }
  }, [selectedSeats, pricing])

  const handleSeatClick = async (seatId: number) => {
    await toggleSeat(seatId)
  }

  const getSeatStatus = (seatId: number) => {
    if (isSeatSelected(seatId)) return 'selected'
    if (isSeatReserved(seatId)) return 'reserved'
    if (isSeatAvailable(seatId)) return 'available'
    return 'occupied'
  }

  const getSeatClassName = (seatId: number) => {
    const status = getSeatStatus(seatId)
    const baseClasses = 'w-8 h-8 rounded-md border-2 cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-semibold'

    switch (status) {
      case 'selected':
        return cn(baseClasses, 'bg-primary text-primary-foreground border-primary hover:bg-primary/90')
      case 'reserved':
        return cn(baseClasses, 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200')
      case 'available':
        return cn(baseClasses, 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100')
      case 'occupied':
        return cn(baseClasses, 'bg-red-100 text-red-800 border-red-300 cursor-not-allowed opacity-60')
      default:
        return baseClasses
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading seat layout...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              onClick={clearSelection}
              className="mt-2"
            >
              Clear Selection
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!layout) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">No seat layout available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Car className="h-5 w-5" />
            <span>Select Your Seats</span>
            <Badge variant="secondary" className="ml-auto">
              {layout.busType || 'Standard'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-primary border-2 border-primary rounded"></div>
              <span className="text-sm">Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
              <span className="text-sm">Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded"></div>
              <span className="text-sm">Reserved</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 px-4 py-2 rounded-md text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <Users className="h-3 w-3" />
                  </div>
                  <span>Driver</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {layout.layout.map((row) => (
                <div key={row.rowNumber} className="relative">
                  <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground font-medium">
                    {row.rowNumber}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-1">
                      {row.leftSeats.map((seat) => (
                        <button
                          key={seat.seat_id}
                          className={getSeatClassName(seat.seat_id)}
                          onClick={() => handleSeatClick(seat.seat_id)}
                          disabled={!isSeatAvailable(seat.seat_id) && !isSeatSelected(seat.seat_id)}
                          title={`Seat ${seat.seat_no} - ₹${seat.price}`}
                        >
                          {seat.seat_no}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 flex justify-center">
                      {row.isExit && (
                        <Badge variant="outline" className="text-xs">
                          EXIT
                        </Badge>
                      )}
                    </div>

                    <div className="flex space-x-1">
                      {row.rightSeats.map((seat) => (
                        <button
                          key={seat.seat_id}
                          className={getSeatClassName(seat.seat_id)}
                          onClick={() => handleSeatClick(seat.seat_id)}
                          disabled={!isSeatAvailable(seat.seat_id) && !isSeatSelected(seat.seat_id)}
                          title={`Seat ${seat.seat_no} - ₹${seat.price}`}
                        >
                          {seat.seat_no}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSeats.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Selected Seats:</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {pricing?.seatPrices.map((seat) => (
                  <Badge key={seat.seatId} variant="secondary" className="space-x-1">
                    <span>{seat.seatNo}</span>
                    <span>-</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {seat.price}
                    </span>
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold">Total Amount:</span>
                <div className="flex items-center space-x-1 text-lg font-bold text-primary">
                  <IndianRupee className="h-4 w-4" />
                  <span>{getTotalPrice()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4" />
              <span>AC</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>WiFi</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>USB Charging</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}