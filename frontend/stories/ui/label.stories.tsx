import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Switch } from '../../components/ui/switch';

const meta = {
  title: 'Components/UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Renders an accessible label associated with controls.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    htmlFor: {
      control: 'text',
      description: 'The id of the form control this label is associated with',
    },
    children: {
      control: 'text',
      description: 'The content of the label',
    },
  },
} satisfies Meta<typeof Label>

export default meta;
type Story = StoryObj<typeof meta>;

// Playground
export const Playground: Story = {
  args: {
    children: 'Label text',
  },
  render: (args) => <Label {...args} />,
};

// With Form Controls
export const WithFormControls: Story = {
  render: () => (
    <div className="grid gap-6 w-[300px]">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" placeholder="Enter your email" />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">I accept the terms and conditions</Label>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="notifications">Enable notifications</Label>
        <Switch id="notifications" />
      </div>
    </div>
  ),
};

// Different Styles
export const Styles: Story = {
  render: () => (
    <div className="grid gap-4">
      <Label>Default label</Label>
      <Label className="text-sm font-medium">Small medium label</Label>
      <Label className="text-lg font-semibold">Large semibold label</Label>
      <Label className="text-muted-foreground">Muted label</Label>
      <Label className="text-destructive">Error label</Label>
    </div>
  ),
};