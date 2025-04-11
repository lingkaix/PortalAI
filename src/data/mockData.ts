import React from "react";
import { TreePine, Sprout, MountainSnow } from "lucide-react";
import { UserType, ChatType, MessageType, WorkspaceType } from "../types";

// Mock Workspaces
export const mockWorkspaces: WorkspaceType[] = [
  { id: "ws1", name: "Nature Escapes", icon: React.createElement(TreePine, { size: 24 }, null) },
  { id: "ws2", name: "Home & Garden", icon: React.createElement(Sprout, { size: 24 }, null) },
  { id: "ws3", name: "Alpine Club", icon: React.createElement(MountainSnow, { size: 24 }, null) },
];

// Mock Users
export const mockUsers: Record<string, UserType> = {
  user1: { id: "user1", name: "Alex Johnson", avatar: "https://placehold.co/40x40/C8E6C9/2E7D32?text=AJ", status: "online" },
  user2: { id: "user2", name: "Maria Garcia", avatar: "https://placehold.co/40x40/FFDAB9/D84315?text=MG", status: "offline" },
  user3: { id: "user3", name: "CurrentUser", avatar: "https://placehold.co/40x40/E1BEE7/6A1B9A?text=ME", status: "online" },
  user4: { id: "user4", name: "Keisha Brown", avatar: "https://placehold.co/40x40/FFF9C4/F9A825?text=KB", status: "online" },
};

// Mock Chats
export const mockChats: ChatType[] = [
  { id: "dm1", type: "direct", name: "Alex Johnson", avatar: mockUsers["user1"].avatar, lastMessage: "Okay, sounds good!", unreadCount: 2, timestamp: new Date(Date.now() - 3600 * 1000 * 5), workspaceId: "ws1" },
  { id: "group1", type: "group", name: "Forest Hike Planning", lastMessage: "Let's sync tomorrow morning.", unreadCount: 0, timestamp: new Date(Date.now() - 3600 * 1000 * 25), participants: [mockUsers["user1"], mockUsers["user2"], mockUsers["user3"]], workspaceId: "ws1" },
  { id: "dm2", type: "direct", name: "Maria Garcia", avatar: mockUsers["user2"].avatar, lastMessage: "Can you review this doc?", unreadCount: 0, timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 3), workspaceId: "ws2" },
  { id: "group2", type: "group", name: "Garden Club", lastMessage: "New seeds arrived!", unreadCount: 5, timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 8), participants: [mockUsers["user2"], mockUsers["user4"], mockUsers["user3"]], workspaceId: "ws2" },
  { id: "group3", type: "group", name: "Trail Maintenance", lastMessage: "Need volunteers this Sat.", unreadCount: 1, timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 2), participants: [mockUsers["user1"], mockUsers["user4"], mockUsers["user3"]], workspaceId: "ws3" },
];

// Mock Messages
// Note: This structure mutates. In a real app, this would likely be managed by state/API.
export const mockMessages: Record<string, MessageType[]> = {
  dm1: [
    { id: "m1", sender: mockUsers["user1"], content: "Hey! Ready for the weekend hike?", timestamp: new Date(Date.now() - 3600 * 1000 * 5 - 60000 * 5), upvotes: 2, downvotes: 0 },
    { id: "m2", sender: mockUsers["user3"], content: "Almost! Just need to pack snacks.", timestamp: new Date(Date.now() - 3600 * 1000 * 5 - 60000 * 3), upvotes: 1, downvotes: 0 },
    { id: "m3", sender: mockUsers["user1"], content: "Okay, sounds good!", timestamp: new Date(Date.now() - 3600 * 1000 * 5), upvotes: 0, downvotes: 0 },
  ],
  group1: [
    { id: "m4", sender: mockUsers["user2"], content: "Trail map is uploaded to shared files.", timestamp: new Date(Date.now() - 3600 * 1000 * 25 - 60000 * 10), upvotes: 5, downvotes: 0 },
    { id: "m5", sender: mockUsers["user1"], content: "Thanks Maria! Looks like a great route.", timestamp: new Date(Date.now() - 3600 * 1000 * 25 - 60000 * 8), upvotes: 1, downvotes: 0 },
    { id: "m6", sender: mockUsers["user3"], content: "Let's sync tomorrow morning for final details.", timestamp: new Date(Date.now() - 3600 * 1000 * 25), upvotes: 3, downvotes: 1 },
  ],
  dm2: [{ id: "m7", sender: mockUsers["user2"], content: "Can you review this planting schedule?", timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 3), upvotes: 0, downvotes: 0 }],
  group2: [{ id: "m8", sender: mockUsers["user4"], content: "New seeds arrived! Sunflowers and tomatoes.", timestamp: new Date(Date.now() - 3600 * 1000 * 24 * 8), upvotes: 4, downvotes: 0 }],
};
