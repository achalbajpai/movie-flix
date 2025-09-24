import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from '../../components/ui/checkbox'
import { Label } from '../../components/ui/label'

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    checked: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
}

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="checked" defaultChecked />
      <Label htmlFor="checked">This option is checked</Label>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled">Disabled unchecked</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked">Disabled checked</Label>
      </div>
    </div>
  ),
}

export const FilterCheckboxes: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div>
        <h3 className="font-medium mb-3">Departure Time</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="morning" />
            <Label htmlFor="morning">Morning (6AM - 12PM)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="afternoon" />
            <Label htmlFor="afternoon">Afternoon (12PM - 6PM)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="evening" />
            <Label htmlFor="evening">Evening (6PM - 12AM)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="night" />
            <Label htmlFor="night">Night (12AM - 6AM)</Label>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const BusTypeFilters: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div>
        <h3 className="font-medium mb-3">Bus Type</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="ac" />
            <Label htmlFor="ac">AC</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="non-ac" />
            <Label htmlFor="non-ac">Non-AC</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="sleeper" />
            <Label htmlFor="sleeper">Sleeper</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="semi-sleeper" />
            <Label htmlFor="semi-sleeper">Semi Sleeper</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="seater" />
            <Label htmlFor="seater">Seater</Label>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const OperatorFilters: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div>
        <h3 className="font-medium mb-3">Operators</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="redbus" defaultChecked />
            <Label htmlFor="redbus">RedBus Travels</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="volvo" />
            <Label htmlFor="volvo">Volvo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="patel" />
            <Label htmlFor="patel">Patel Tours</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="srs" />
            <Label htmlFor="srs">SRS Travels</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="orange" />
            <Label htmlFor="orange">Orange Tours</Label>
          </div>
        </div>
      </div>
    </div>
  ),
}