import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageContent } from "../layouts/PageContent";
import { Card } from "../components/Card";
import { useChatStore } from "../data/chatStore";
import { ChannelInfo } from "../data/chatStore";
import { Plus, Pin, PinOff, Archive, RefreshCcw, ChevronsUpDown } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    pinnedChannelIds,
    activeChannelIds,
    channels,
    setActiveChannel,
    toggleChannelPin,
    reorderPinnedChannels,
    toggleChannelArchive,
    createChannel,
    reloadIndex,
  } = useChatStore();

  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [reordering, setReordering] = useState(false);
  const [pinnedOrder, setPinnedOrder] = useState<string[]>([]);

  useEffect(() => {
    setPinnedOrder(pinnedChannelIds);
  }, [pinnedChannelIds]);

  const handleSelectChannel = async (channelId: string) => {
    await setActiveChannel(channelId);
    navigate(`/chat/group/${channelId}`);
  };

  const handlePinToggle = async (channelId: string) => {
    await toggleChannelPin(channelId);
    reloadIndex();
  };

  const handleArchiveToggle = async (channelId: string) => {
    await toggleChannelArchive(channelId);
    reloadIndex();
  };

  const handleReorder = async () => {
    await reorderPinnedChannels(pinnedOrder);
    setReordering(false);
    reloadIndex();
  };

  const handleNewChannel = async () => {
    if (!newChannelName.trim()) return;
    await createChannel({
      id: Date.now().toString(),
      name: newChannelName,
      order: 0,
      participants: [{ userId: '0000', addedBy: '0000', role: 'owner' }],
    });
    setShowNewChannel(false);
    setNewChannelName("");
    reloadIndex();
  };

  // Helper to render a channel row
  const renderChannelRow = (channel: ChannelInfo) => (
    <div key={channel.id} className="flex items-center justify-between p-3 border-b border-[var(--border-primary)] hover:bg-[var(--background-hover)]">
      <div className="flex-1 cursor-pointer" onClick={() => handleSelectChannel(channel.id)}>
        <span className="font-medium text-[var(--text-primary)]">{channel.name}</span>
        {channel.hasUnread && <span className="ml-2 text-xs text-[var(--accent-primary)]">●</span>}
      </div>
      <div className="flex items-center space-x-2">
        {channel.order > 0 ? (
          <button title="Unpin" onClick={() => handlePinToggle(channel.id)}><PinOff size={16} /></button>
        ) : (
          <button title="Pin" onClick={() => handlePinToggle(channel.id)}><Pin size={16} /></button>
        )}
        {channel.order >= 0 ? (
          <button title="Archive" onClick={() => handleArchiveToggle(channel.id)}><Archive size={16} /></button>
        ) : (
          <button title="Reactivate" onClick={() => handleArchiveToggle(channel.id)}><RefreshCcw size={16} /></button>
        )}
      </div>
    </div>
  );

  return (
    <PageContent title="Dashboard" data-component-id="DashboardPage">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* New Channel Modal (simple inline for now) */}
        {showNewChannel && (
          <Card className="p-6 mb-4">
            <h3 className="text-lg font-semibold mb-2">New Channel</h3>
            <input
              className="w-full border rounded p-2 mb-2"
              placeholder="Channel name"
              value={newChannelName}
              onChange={e => setNewChannelName(e.target.value)}
            />
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-[var(--button-primary-background)] text-white rounded" onClick={handleNewChannel}>Create</button>
              <button className="px-4 py-2 bg-[var(--button-secondary-background)] text-[var(--button-secondary-text)] rounded" onClick={() => setShowNewChannel(false)}>Cancel</button>
            </div>
          </Card>
        )}
        {/* Reorder Modal (simple inline for now) */}
        {reordering && (
          <Card className="p-6 mb-4">
            <h3 className="text-lg font-semibold mb-2">Reorder Pinned Channels</h3>
            <ul className="mb-2">
              {pinnedOrder.map((id, idx) => (
                <li key={id} className="flex items-center space-x-2 mb-1">
                  <span className="flex-1">{channels[id]?.name}</span>
                  {idx > 0 && <button onClick={() => {
                    const newOrder = [...pinnedOrder];
                    [newOrder[idx-1], newOrder[idx]] = [newOrder[idx], newOrder[idx-1]];
                    setPinnedOrder(newOrder);
                  }}><ChevronsUpDown size={16} /></button>}
                </li>
              ))}
            </ul>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-[var(--button-primary-background)] text-white rounded" onClick={handleReorder}>Save</button>
              <button className="px-4 py-2 bg-[var(--button-secondary-background)] text-[var(--button-secondary-text)] rounded" onClick={() => setReordering(false)}>Cancel</button>
            </div>
          </Card>
        )}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Channels</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-[var(--button-primary-background)] text-white rounded" onClick={() => setShowNewChannel(true)}><Plus size={16} className="inline mr-1" />New</button>
            <button className="px-3 py-1 bg-[var(--button-secondary-background)] text-[var(--button-secondary-text)] rounded" onClick={() => setReordering(true)}><ChevronsUpDown size={16} className="inline mr-1" />Reorder</button>
          </div>
        </div>
        {/* Pinned Channels */}
        {pinnedChannelIds.length > 0 && (
          <Card className="mb-4">
            <h3 className="font-semibold text-[var(--text-secondary)] px-4 pt-4">Pinned</h3>
            <div>
              {pinnedChannelIds.map(id => channels[id] && renderChannelRow(channels[id]))}
            </div>
          </Card>
        )}
        {/* Active Channels */}
        {activeChannelIds.length > 0 && (
          <Card className="mb-4">
            <h3 className="font-semibold text-[var(--text-secondary)] px-4 pt-4">Active</h3>
            <div>
              {activeChannelIds.map(id => channels[id] && renderChannelRow(channels[id]))}
            </div>
          </Card>
        )}
        {/* Archived Channels */}
        {Object.values(channels).filter(c => c.order < 0).length > 0 && (
          <Card className="mb-4">
            <h3 className="font-semibold text-[var(--text-secondary)] px-4 pt-4">Archived</h3>
            <div>
              {Object.values(channels).filter(c => c.order < 0).map(c => renderChannelRow(c))}
            </div>
          </Card>
        )}
      </div>
    </PageContent>
  );
}; 