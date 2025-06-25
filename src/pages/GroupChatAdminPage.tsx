import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageContent } from "../layouts/PageContent";
import { Card } from "../components/Card";
import { Avatar } from "../components/Avatar";
import { useChatStore } from "../data/chatStore";
import { useSettingsStore } from "../data/settingsStore";

// Group Chat Admin Page Component
export const GroupChatAdminPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  // Get group chat from chatStore
  const chat = useChatStore((state) => (groupId ? state.chats[groupId] : undefined));

  // Get current user info from settings
  const name = useSettingsStore((state) => state.name);
  const status = useSettingsStore((state) => state.status);
  const avatar = "/default-avatar.png";
  const currentUser = { id: "user3", name, status, avatar };

  // State for editable group name
  const [groupName, setGroupName] = useState(chat?.name || "");
  // State for managing members (could be more complex in real app)
  const [participants, setParticipants] = useState(chat?.participants || []);

  // Handle navigation back to the chat
  const handleBackToChat = () => {
    navigate(`/chat/group/${groupId}`);
  };

  // TODO: Implement save group details logic
  const handleSaveDetails = () => {
    if (!chat) return;
    // Update group name in the store
    useChatStore.getState().setChatProfile(chat.id, { name: groupName });
    alert("Group details saved");
  };

  // TODO: Implement add member logic
  const handleAddMember = () => {
    alert("Add member functionality not implemented.");
  };

  // TODO: Implement remove member logic
  const handleRemoveMember = (memberId: string) => {
    setParticipants((prev) => prev.filter((p) => p.userId !== memberId));
    // In a real app, you would update the chat participants in the store or backend here
    alert(`Member ${memberId} removed`);
  };

  // TODO: Implement delete group logic
  const handleDeleteGroup = () => {
    if (window.confirm(`Are you sure you want to delete the group "${groupName}"? This cannot be undone.`)) {
      if (!chat) return;
      useChatStore.getState().removeChat(chat.id);
      alert("Group deleted");
      navigate("/");
    }
  };

  // Show not found message if group doesn't exist
  if (!chat) {
    return (
      <PageContent title="Group Not Found">
        <Card className="p-6">
          {/* Use theme variables for Not Found message */}
          <p className="text-[var(--text-secondary)]">Could not find the requested group.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] hover:underline">
             Go Home
           </button>
        </Card>
      </PageContent>
    );
  }

  // Define class strings using CSS variables
  const backButtonClasses = "mb-8 inline-flex items-center px-4 py-2 rounded-lg border border-[var(--button-secondary-border)] text-sm font-medium text-[var(--button-secondary-text)] bg-[var(--button-secondary-background)] hover:bg-[var(--button-secondary-hover-bg)] hover:border-[var(--button-secondary-hover-border)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--input-focus-ring)] dark:focus:ring-offset-[var(--background-primary)] transition-colors duration-150";
  const cardTitleClasses = "text-xl font-semibold leading-6 text-[var(--text-primary)] mb-5";
  const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";
  const inputClasses = "block w-full rounded-lg border border-[var(--input-border)] px-4 py-2 shadow-sm focus:border-[var(--input-focus-ring)] focus:ring-1 focus:ring-[var(--input-focus-ring)] sm:text-sm bg-[var(--input-background)] text-[var(--text-primary)]";
  const saveButtonClasses = "px-5 py-2 rounded-lg border border-transparent text-sm font-medium text-[var(--button-primary-text)] bg-[var(--button-primary-background)] hover:bg-[var(--button-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--input-focus-ring)] dark:focus:ring-offset-[var(--card-background)] transition-colors duration-150"; // Use primary button styles
  const addMemberButtonClasses = "px-4 py-2 rounded-lg border border-transparent text-sm font-medium text-[var(--success-text)] bg-[var(--success)] hover:bg-[var(--success-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--success)] dark:focus:ring-offset-[var(--card-background)] transition-colors duration-150"; // Use success button styles
  const cardHeaderClasses = "p-5 flex justify-between items-center border-b border-[var(--border-primary)]";
  const memberListClasses = "divide-y divide-[var(--border-primary)]";
  const memberListItemClasses = "flex items-center justify-between p-4 hover:bg-[var(--background-secondary)] transition-colors duration-150";
  const memberNameClasses = "text-sm font-medium text-[var(--text-primary)]";
  const memberYouTagClasses = "text-xs text-[var(--text-muted)]";
  const removeButtonClasses = "text-xs text-[var(--destructive)] hover:text-[var(--destructive-hover)] font-medium px-3 py-1 rounded-md hover:bg-[var(--destructive)]/10 dark:hover:bg-[var(--destructive)]/20 transition-colors duration-150"; // Use destructive text/hover
  const dangerCardClasses = "p-8 border border-[var(--destructive)]/50 bg-[var(--destructive)]/10 dark:bg-[var(--destructive)]/20"; // Use destructive colors with opacity
  const dangerTitleClasses = "text-xl font-semibold leading-6 text-[var(--destructive)] dark:text-[var(--destructive)]/80 mb-4"; // Use destructive text
  const deleteButtonClasses = "px-4 py-2 rounded-lg border border-[var(--destructive)] text-sm font-medium text-[var(--destructive)] hover:bg-[var(--destructive)]/10 dark:hover:bg-[var(--destructive)]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--destructive)] dark:focus:ring-offset-[var(--background-primary)] transition-colors duration-150"; // Destructive outline button
  const dangerTextClasses = "text-sm text-[var(--destructive)]/80 dark:text-[var(--destructive)]/70 mt-3"; // Muted destructive text

  return (
    <PageContent title={`Manage: ${chat.name}`} data-component-id="GroupChatAdminPage">
      {/* Back Button */}
      <button onClick={handleBackToChat} className={backButtonClasses}>
        <ArrowLeft size={16} className="mr-2" /> Back to Chat
      </button>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Group Details Card */}
        <Card className="p-8">
          <h3 className={cardTitleClasses}>Group Details</h3>
          <div className="mt-4">
            <label htmlFor="group-name" className={labelClasses}>
               Group Name
             </label>
            <input type="text" name="group-name" id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className={inputClasses} />
          </div>
          {/* Save Details Button */}
          <div className="mt-8 border-t border-[var(--border-primary)] pt-5 flex justify-end">
            <button type="button" onClick={handleSaveDetails} className={saveButtonClasses}>
               Save Details
             </button>
          </div>
        </Card>

        {/* Manage Members Card */}
        <Card>
          <div className={cardHeaderClasses}>
             <h3 className="text-xl font-semibold leading-6 text-[var(--text-primary)]">Members ({participants.length})</h3>
            {/* Add Member Button */}
            <button onClick={handleAddMember} className={addMemberButtonClasses}>
               Add Member
             </button>
          </div>
          {/* Member List */}
          <ul className={memberListClasses}>
            {participants.map((p) => (
              <li key={p.userId} className={memberListItemClasses}>
                <div className="flex items-center space-x-4">
                  <Avatar src={"/default-avatar.png"} alt={p.userId} size="md" status={(p as any).status || 'offline'} />
                  <span className={memberNameClasses}>
                    {p.userId} {p.userId === currentUser.id ? <span className={memberYouTagClasses}>(You)</span> : ""}
                  </span>
                </div>
                {/* Remove Button (only for non-current users) */}
                {p.userId !== currentUser.id && (
                  <button onClick={() => handleRemoveMember(p.userId)} className={removeButtonClasses}>
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* Danger Zone Card - Warmer Red */}
        <Card className={dangerCardClasses}>
          <h3 className={dangerTitleClasses}>Danger Zone</h3>
          {/* Delete Group Button */}
          <button onClick={handleDeleteGroup} className={deleteButtonClasses}>
             Delete Group
           </button>
          <p className={dangerTextClasses}>This action cannot be undone.</p>
        </Card>
      </div>
    </PageContent>
  );
};
