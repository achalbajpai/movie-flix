import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';

const meta = {
  title: 'Components/UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a list of options for the user to pick from—triggered by a button.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'When true, prevents the user from interacting with the select',
    },
    defaultValue: {
      control: 'text',
      description: 'The value of the select when initially rendered',
    },
  },
} satisfies Meta<typeof Select>

export default meta;
type Story = StoryObj<typeof meta>;

// Playground
export const Playground: Story = {
  render: () => (
    <div className="w-[280px]">
      <Label htmlFor="select-demo">Select a fruit</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

// States
export const States: Story = {
  render: () => (
    <div className="grid gap-4 w-[280px]">
      <div>
        <Label>Default</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>With Value</Label>
        <Select defaultValue="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Disabled</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Disabled select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

// Different Options
export const WithOptions: Story = {
  render: () => (
    <div className="grid gap-6 w-[280px]">
      <div>
        <Label>Cities</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mumbai">Mumbai</SelectItem>
            <SelectItem value="delhi">Delhi</SelectItem>
            <SelectItem value="bangalore">Bangalore</SelectItem>
            <SelectItem value="pune">Pune</SelectItem>
            <SelectItem value="chennai">Chennai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Priority</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Status</Label>
        <Select defaultValue="active">
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};