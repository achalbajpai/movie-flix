import type { Meta, StoryObj } from '@storybook/react'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Checkbox } from '../../components/ui/checkbox'

const meta = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Label',
  },
}

export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
}

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
}

export const Required: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="required">
        Name <span className="text-destructive">*</span>
      </Label>
      <Input id="required" placeholder="Enter your name" />
    </div>
  ),
}

export const SearchFormLabels: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <div className="grid items-center gap-1.5">
        <Label htmlFor="from">From</Label>
        <Input id="from" placeholder="Departure city" />
      </div>

      <div className="grid items-center gap-1.5">
        <Label htmlFor="to">To</Label>
        <Input id="to" placeholder="Destination city" />
      </div>

      <div className="grid items-center gap-1.5">
        <Label htmlFor="departure">Departure Date</Label>
        <Input id="departure" type="date" />
      </div>

      <div className="grid items-center gap-1.5">
        <Label htmlFor="return">Return Date (Optional)</Label>
        <Input id="return" type="date" />
      </div>

      <div className="grid items-center gap-1.5">
        <Label htmlFor="passengers">Passengers</Label>
        <Input id="passengers" type="number" min="1" max="10" defaultValue="1" />
      </div>
    </div>
  ),
}

export const FilterLabels: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <div>
        <Label className="text-base font-semibold">Filters</Label>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Price Range</Label>
        <p className="text-sm text-muted-foreground">₹500 - ₹2000</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Departure Time</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="morning" />
            <Label htmlFor="morning" className="text-sm">Morning (6AM - 12PM)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="evening" />
            <Label htmlFor="evening" className="text-sm">Evening (6PM - 12AM)</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Bus Type</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="ac" />
            <Label htmlFor="ac" className="text-sm">AC</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="sleeper" />
            <Label htmlFor="sleeper" className="text-sm">Sleeper</Label>
          </div>
        </div>
      </div>
    </div>
  ),
}