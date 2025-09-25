import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';

const meta = {
  title: 'Components/UI/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A control that allows the user to toggle between checked and not checked.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'The controlled checked state of the checkbox',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'The default checked state when uncontrolled',
    },
    disabled: {
      control: 'boolean',
      description: 'When true, prevents the user from interacting with the checkbox',
    },
  },
} satisfies Meta<typeof Checkbox>

export default meta;
type Story = StoryObj<typeof meta>;

// Playground
export const Playground: Story = {
  args: {
    defaultChecked: false,
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="playground" {...args} />
      <Label htmlFor="playground">Accept terms and conditions</Label>
    </div>
  ),
};

// States
export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="unchecked" />
        <Label htmlFor="unchecked">Unchecked</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="checked" defaultChecked />
        <Label htmlFor="checked">Checked</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled">Disabled</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked">Disabled & Checked</Label>
      </div>
    </div>
  ),
};

// With Labels
export const WithLabels: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms and conditions</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="marketing" />
        <Label htmlFor="marketing">Send me marketing emails</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="newsletter" defaultChecked />
        <Label htmlFor="newsletter">Subscribe to newsletter</Label>
      </div>
    </div>
  ),
};