import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { Bus, Clock, MapPin } from 'lucide-react'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
}

export const BusResultCard: Story = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Volvo Multi Axle Semi Sleeper
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span>RedBus Travels</span>
              <span>⭐ 4.2 (234 reviews)</span>
            </CardDescription>
          </div>
          <Badge variant="secondary">AC</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <p className="text-2xl font-bold">22:30</p>
            <p className="text-sm text-muted-foreground">Mumbai</p>
          </div>
          <div className="flex-1 px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>8h 30m</span>
            </div>
            <Separator className="mt-2" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">07:00<sup className="text-xs">+1</sup></p>
            <p className="text-sm text-muted-foreground">Bangalore</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            15 seats available
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">₹1,500</p>
            <p className="text-sm text-muted-foreground line-through">₹1,800</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-3">
        <Button variant="outline" className="flex-1">View Details</Button>
        <Button className="flex-1">Book Now</Button>
      </CardFooter>
    </Card>
  ),
}

export const FilterCard: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Price Range</h4>
          <div className="text-sm text-muted-foreground">₹500 - ₹2000</div>
        </div>
        <Separator />
        <div>
          <h4 className="font-medium mb-2">Departure Time</h4>
          <div className="space-y-2">
            <Badge variant="outline">Morning (6AM - 12PM)</Badge>
            <Badge variant="outline">Evening (6PM - 12AM)</Badge>
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-medium mb-2">Bus Types</h4>
          <div className="space-y-1">
            <Badge variant="secondary">AC</Badge>
            <Badge variant="secondary">Sleeper</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">Clear Filters</Button>
      </CardFooter>
    </Card>
  ),
}

export const SearchSummaryCard: Story = {
  render: () => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Mumbai</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">Bangalore</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm text-muted-foreground">
              25 Dec 2024 • 1 Passenger
            </div>
          </div>
          <Button variant="outline" size="sm">Modify Search</Button>
        </div>
      </CardContent>
    </Card>
  ),
}

export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardContent className="pt-6">
        <div className="text-center">
          <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium">No buses found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search criteria
          </p>
        </div>
      </CardContent>
    </Card>
  ),
}