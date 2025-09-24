import type { Meta, StoryObj } from '@storybook/react'
import { Slider } from '../../components/ui/slider'
import { Label } from '../../components/ui/label'
import { useState } from 'react'

const meta = {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
    className: 'w-60',
  },
}

export const PriceRange: Story = {
  render: () => {
    const [priceRange, setPriceRange] = useState([500, 2000])

    return (
      <div className="w-80 space-y-4">
        <div>
          <Label className="text-sm font-medium">Price Range</Label>
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={200}
          max={5000}
          step={100}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹200</span>
          <span>₹5000</span>
        </div>
      </div>
    )
  },
}

export const RatingFilter: Story = {
  render: () => {
    const [rating, setRating] = useState([3.5])

    return (
      <div className="w-80 space-y-4">
        <div>
          <Label className="text-sm font-medium">Minimum Rating</Label>
          <div className="text-sm text-muted-foreground mt-1">
            ⭐ {rating[0]} and above
          </div>
        </div>
        <Slider
          value={rating}
          onValueChange={setRating}
          min={1}
          max={5}
          step={0.5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1.0</span>
          <span>5.0</span>
        </div>
      </div>
    )
  },
}

export const TravelTimeRange: Story = {
  render: () => {
    const [timeRange, setTimeRange] = useState([6, 22])

    const formatTime = (hour: number) => {
      if (hour === 0) return '12:00 AM'
      if (hour < 12) return `${hour}:00 AM`
      if (hour === 12) return '12:00 PM'
      return `${hour - 12}:00 PM`
    }

    return (
      <div className="w-80 space-y-4">
        <div>
          <Label className="text-sm font-medium">Departure Time Range</Label>
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>{formatTime(timeRange[0])}</span>
            <span>{formatTime(timeRange[1])}</span>
          </div>
        </div>
        <Slider
          value={timeRange}
          onValueChange={setTimeRange}
          min={0}
          max={23}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>12:00 AM</span>
          <span>11:00 PM</span>
        </div>
      </div>
    )
  },
}

export const JourneyDuration: Story = {
  render: () => {
    const [duration, setDuration] = useState([12])

    return (
      <div className="w-80 space-y-4">
        <div>
          <Label className="text-sm font-medium">Maximum Journey Duration</Label>
          <div className="text-sm text-muted-foreground mt-1">
            {duration[0]} hours
          </div>
        </div>
        <Slider
          value={duration}
          onValueChange={setDuration}
          min={4}
          max={24}
          step={2}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>4h</span>
          <span>24h</span>
        </div>
      </div>
    )
  },
}

export const FilterSliders: Story = {
  render: () => {
    const [priceRange, setPriceRange] = useState([500, 2000])
    const [rating, setRating] = useState([3.5])
    const [timeRange, setTimeRange] = useState([6, 22])

    const formatTime = (hour: number) => {
      if (hour === 0) return '12:00 AM'
      if (hour < 12) return `${hour}:00 AM`
      if (hour === 12) return '12:00 PM'
      return `${hour - 12}:00 PM`
    }

    return (
      <div className="w-80 space-y-8 p-4 border rounded-lg">
        <h3 className="font-medium">Filter Options</h3>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Price Range</Label>
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </div>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={200}
            max={5000}
            step={100}
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Minimum Rating</Label>
            <div className="text-sm text-muted-foreground mt-1">
              ⭐ {rating[0]} and above
            </div>
          </div>
          <Slider
            value={rating}
            onValueChange={setRating}
            min={1}
            max={5}
            step={0.5}
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Departure Time</Label>
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>{formatTime(timeRange[0])}</span>
              <span>{formatTime(timeRange[1])}</span>
            </div>
          </div>
          <Slider
            value={timeRange}
            onValueChange={setTimeRange}
            min={0}
            max={23}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    )
  },
}