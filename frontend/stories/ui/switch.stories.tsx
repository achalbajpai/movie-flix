import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';

const meta = {
  title: 'Components/UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A control that allows the user to toggle between two states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'The controlled checked state of the switch',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'The default checked state when uncontrolled',
    },
    disabled: {
      control: 'boolean',
      description: 'When true, prevents the user from interacting with the switch',
    },
  },
} satisfies Meta<typeof Switch>

export default meta;
type Story = StoryObj<typeof meta>;

// Playground
export const Playground: Story = {
  args: {
    defaultChecked: false,
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Switch id="playground" {...args} />
      <Label htmlFor="playground">Enable notifications</Label>
    </div>
  ),
};

// States
export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="flex items-center space-x-2">
        <Switch id="off" />
        <Label htmlFor="off">Off</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch id="on" defaultChecked />
        <Label htmlFor="on">On</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off">Disabled (Off)</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch id="disabled-on" disabled defaultChecked />
        <Label htmlFor="disabled-on">Disabled (On)</Label>
      </div>
    </div>
  ),
};

// With Labels
export const WithLabels: Story = {
  render: () => (
    <div className="grid gap-4 max-w-sm">
      <div className="flex items-center justify-between">
        <Label htmlFor="notifications">Push notifications</Label>
        <Switch id="notifications" />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="marketing">Marketing emails</Label>
        <Switch id="marketing" />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="security">Security alerts</Label>
        <Switch id="security" defaultChecked />
      </div>
    </div>
  ),
};