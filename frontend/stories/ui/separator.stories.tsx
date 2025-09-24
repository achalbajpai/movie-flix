import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from '../../components/ui/separator'

const meta = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <p>Content above separator</p>
      <Separator />
      <p>Content below separator</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex items-center space-x-4 h-16">
      <span>Left content</span>
      <Separator orientation="vertical" className="h-6" />
      <span>Right content</span>
    </div>
  ),
}

export const InCard: Story = {
  render: () => (
    <div className="w-96 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Bus Details</h3>
      <p className="text-sm text-muted-foreground">Volvo Multi Axle</p>

      <Separator className="my-4" />

      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Departure:</span>
          <span>22:30</span>
        </div>
        <div className="flex justify-between">
          <span>Arrival:</span>
          <span>07:00+1</span>
        </div>
        <div className="flex justify-between">
          <span>Duration:</span>
          <span>8h 30m</span>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between items-center">
        <span className="text-lg font-bold">₹1,500</span>
        <span className="text-sm text-muted-foreground">15 seats available</span>
      </div>
    </div>
  ),
}

export const InSearchSummary: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="font-medium">Mumbai → Bangalore</span>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">25 Dec 2024</span>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-muted-foreground">1 Passenger</span>
        </div>
        <button className="text-sm text-primary">Modify Search</button>
      </div>
    </div>
  ),
}

export const InFilterSection: Story = {
  render: () => (
    <div className="w-80 p-4 border rounded-lg space-y-4">
      <h3 className="font-medium">Filters</h3>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Price Range</h4>
        <p className="text-sm text-muted-foreground">₹500 - ₹2000</p>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Departure Time</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-xs bg-secondary rounded">Morning</span>
          <span className="px-2 py-1 text-xs bg-secondary rounded">Evening</span>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Bus Types</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-xs bg-secondary rounded">AC</span>
          <span className="px-2 py-1 text-xs bg-secondary rounded">Sleeper</span>
        </div>
      </div>
    </div>
  ),
}

export const JourneyPath: Story = {
  render: () => (
    <div className="w-96 p-4 border rounded-lg">
      <div className="flex justify-between items-center">
        <div className="text-center">
          <p className="text-2xl font-bold">22:30</p>
          <p className="text-sm text-muted-foreground">Mumbai</p>
        </div>
        <div className="flex-1 px-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <span>8h 30m</span>
          </div>
          <Separator className="relative">
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
            </div>
          </Separator>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">07:00<sup className="text-xs">+1</sup></p>
          <p className="text-sm text-muted-foreground">Bangalore</p>
        </div>
      </div>
    </div>
  ),
}