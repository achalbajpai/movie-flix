import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";

const meta = {
  title: "Components/UI/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "An image element with a fallback for representing the user.",
      },
    },
  },
  argTypes: {
    className: {
      description: "Additional CSS classes to apply to the avatar",
      control: { type: "text" },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

export const WithImage: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Avatar>
        <AvatarImage src="https://github.com/vercel.png" alt="@vercel" />
        <AvatarFallback>VC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/nextjs.png" alt="@nextjs" />
        <AvatarFallback>NX</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const Fallback: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Avatar>
        <AvatarImage src="/broken-image.png" alt="Broken" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="/another-broken.png" alt="Broken" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>User</AvatarFallback>
      </Avatar>
    </div>
  ),
};