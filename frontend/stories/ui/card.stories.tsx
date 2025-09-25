import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { MoreVertical, Heart, Share, Star, Clock, MapPin, Users } from 'lucide-react';

const meta = {
  title: 'Components/UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible container component for grouping related content. Cards can contain headers, content, actions, and footers.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the card',
    },
    children: {
      control: 'text',
      description: 'The content of the card',
    },
  },
} satisfies Meta<typeof Card>

export default meta;
type Story = StoryObj<typeof meta>;

// Playground story
export const Playground: Story = {
  render: () => (
    <div className="w-96">
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description goes here</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card.</p>
        </CardContent>
        <CardFooter>
          <Button>Action</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

// Basic variations
export const Variations: Story = {
  render: () => (
    <div className="grid gap-4 w-full max-w-2xl">
      {/* Basic card */}
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Basic Card</CardTitle>
          <CardDescription>Simple card with header and content</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content area.</p>
        </CardContent>
      </Card>

      {/* With action */}
      <Card className="w-96">
        <CardHeader>
          <CardTitle>With Action</CardTitle>
          <CardDescription>Card with header action</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Content with action button in header.</p>
        </CardContent>
      </Card>

      {/* With footer */}
      <Card className="w-96">
        <CardHeader>
          <CardTitle>With Footer</CardTitle>
          <CardDescription>Card with footer actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content with footer buttons.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

