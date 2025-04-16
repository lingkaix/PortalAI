import React, { useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react"; // Import icons from lucide-react
import { PageContent } from "../layouts/PageContent";
import { Card } from "../components/Card";
import { Avatar } from "../components/Avatar";
import { mockUsers } from "../data/mockData";
import { cn } from "../lib/utils"; // Import cn utility

// Settings Page Component
export const SettingsPage: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  // In a real app, these would likely come from user context or API
  const currentUser = mockUsers["user3"];
  const [currentName, setCurrentName] = useState(currentUser.name);
  const [currentStatus, setCurrentStatus] = useState(currentUser.status);

  // TODO: Implement save logic (e.g., API call)
  const handleSaveChanges = () => {
    console.log("Saving changes:", { name: currentName, status: currentStatus });
    // Update mock data (for demo purposes only)
    mockUsers["user3"].name = currentName;
    mockUsers["user3"].status = currentStatus;
    alert("Settings saved (mock)");
  };

  // TODO: Implement theme change logic
  const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Theme changed to:", event.target.id.replace("theme-", ""));
    // Apply theme change logic here (e.g., update class on body, save preference)
  };

  // Define class strings using CSS variables
  const cardTitleClasses = "text-xl font-semibold leading-6 text-[var(--text-primary)] mb-5";
  const cardDescriptionClasses = "text-sm text-[var(--text-secondary)] mb-6";
  const labelClasses = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";
  const inputClasses = "block w-full rounded-lg border border-[var(--input-border)] px-4 py-2 shadow-sm focus:border-[var(--input-focus-ring)] focus:ring-1 focus:ring-[var(--input-focus-ring)] sm:text-sm bg-[var(--input-background)] text-[var(--text-primary)]"; // Reusing from GroupChatAdminPage
  const selectClasses = inputClasses; // Selects share the same base style
  const changeButtonClasses = "px-4 py-1.5 rounded-lg border border-[var(--button-secondary-border)] text-sm font-medium text-[var(--button-secondary-text)] bg-[var(--button-secondary-background)] hover:bg-[var(--button-secondary-hover-bg)] hover:border-[var(--button-secondary-hover-border)] transition-colors duration-150"; // Secondary button style
  const saveButtonClasses = "px-5 py-2 rounded-lg border border-transparent text-sm font-medium text-[var(--button-primary-text)] bg-[var(--button-primary-background)] hover:bg-[var(--button-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--input-focus-ring)] dark:focus:ring-offset-[var(--card-background)] transition-colors duration-150"; // Primary button style
  const toggleContainerClasses = "flex items-center justify-between py-3";
  const toggleLabelClasses = "text-sm font-medium text-[var(--text-primary)]";
  const toggleDescriptionClasses = "text-sm text-[var(--text-secondary)] mt-1";
  // Removed old toggle button classes
  const radioInputClasses = "focus:ring-[var(--input-focus-ring)] h-4 w-4 text-[var(--accent-primary)] border-[var(--input-border)] bg-[var(--input-background)] dark:checked:bg-[var(--accent-primary)]"; // Use accent for checked state
  const radioLabelClasses = "ml-3 block text-sm font-medium text-[var(--text-primary)]";

  // Add new classes for Select styling
  const selectTriggerClasses = cn(
    inputClasses,
    "flex items-center justify-between"
  );

  const selectContentClasses = cn(
    "overflow-hidden bg-[var(--card-background)] rounded-lg border border-[var(--input-border)] shadow-md",
    "radix-state-open:animate-in radix-state-open:fade-in-0 radix-state-open:zoom-in-95",
    "radix-state-closed:animate-out radix-state-closed:fade-out-0 radix-state-closed:zoom-out-95"
  );

  const selectItemClasses = cn(
    "relative flex items-center px-4 py-2 text-sm text-[var(--text-primary)]",
    "focus:bg-[var(--background-secondary)] focus:outline-none",
    "radix-disabled:opacity-50 radix-disabled:pointer-events-none"
  );

  return (
    <PageContent title="Settings" data-component-id="SettingsPage">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Profile Settings Card */}
        <Card className="p-8">
          <h3 className={cardTitleClasses}>Profile</h3>
          <p className={cardDescriptionClasses}>Update your name, avatar, and status message.</p>
          <div className="space-y-5">
            {" "}
            {/* Increased spacing */}
            {/* Name Input */}
            <div>
              <label htmlFor="name" className={labelClasses}>
                Name
              </label>
              <input type="text" name="name" id="name" value={currentName} onChange={(e) => setCurrentName(e.target.value)} className={inputClasses} />
            </div>
            {/* Avatar Display & Change Button */}
            <div>
              <label className={labelClasses}>Avatar</label>
              <div className="flex items-center space-x-4">
                <Avatar src={currentUser.avatar} alt="Current Avatar" size="lg" />
                {/* TODO: Implement avatar change functionality */}
                <button type="button" className={changeButtonClasses}>
                  Change
                </button>
              </div>
            </div>
            {/* Status Select */}
            <div>
              <label htmlFor="status" className={labelClasses}>
                Status
              </label>
              <Select.Root value={currentStatus} onValueChange={(value) => setCurrentStatus(value as "online" | "offline" | "away")}>
                <Select.Trigger className={selectTriggerClasses} id="status">
                  <Select.Value />
                  <Select.Icon className="ml-2">
                    <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className={selectContentClasses}>
                    <Select.Viewport>
                      <Select.Item value="online" className={selectItemClasses}>
                        <Select.ItemText>Online</Select.ItemText>
                        <Select.ItemIndicator className="absolute right-2">
                          <Check className="h-4 w-4" />
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item value="away" className={selectItemClasses}>
                        <Select.ItemText>Away</Select.ItemText>
                        <Select.ItemIndicator className="absolute right-2">
                          <Check className="h-4 w-4" />
                        </Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item value="offline" className={selectItemClasses}>
                        <Select.ItemText>Offline</Select.ItemText>
                        <Select.ItemIndicator className="absolute right-2">
                          <Check className="h-4 w-4" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>
          {/* Save Button */}
          <div className="mt-8 border-t border-[var(--border-primary)] pt-5 flex justify-end">
            <button type="button" onClick={handleSaveChanges} className={saveButtonClasses}>
              Save Changes
            </button>
          </div>
        </Card>
        {/* Notification Settings Card */}
        <Card className="p-8">
          <h3 className={cardTitleClasses}>Notifications</h3>
          <p className={cardDescriptionClasses}>Configure how you receive notifications.</p>
          {/* Radix Switch */}
          <div className={toggleContainerClasses}>
            <span className="flex-grow flex flex-col mr-4" id="desktop-notifications-label">
              <label htmlFor="desktop-notifications-switch" className={toggleLabelClasses}>
                Enable Desktop Notifications
              </label>
              <span className={toggleDescriptionClasses}>Show alerts on your desktop.</span>
            </span>
            <Switch.Root
              id="desktop-notifications-switch"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              className={cn(
                "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card-background)] disabled:cursor-not-allowed disabled:opacity-50",
                "data-[state=checked]:bg-[var(--accent-primary)]", // Teal/Green when checked
                "data-[state=unchecked]:bg-[var(--background-tertiary)]" // Hover gray when unchecked
              )}
              aria-labelledby="desktop-notifications-label"
            >
              <Switch.Thumb className={cn("pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform", "data-[state=checked]:translate-x-5", "data-[state=unchecked]:translate-x-0")} />
            </Switch.Root>
          </div>
        </Card>
        {/* Appearance Settings Card */}
        <Card className="p-8">
          <h3 className={cardTitleClasses}>Appearance</h3>
          <p className={`${cardDescriptionClasses} mb-4`}>Choose your theme.</p> {/* Adjusted margin */}
          <fieldset>
            <legend className="sr-only">Theme</legend>
            <div className="space-y-3">
              {" "}
              {/* Increased spacing */}
              {/* Theme Radio Buttons */}
              {["Light", "Dark", "System"].map((theme) => (
                <div key={theme} className="flex items-center">
                  <input
                    id={`theme-${theme.toLowerCase()}`}
                    name="theme"
                    type="radio"
                    // TODO: Set defaultChecked based on actual current theme
                    defaultChecked={theme === "System"}
                    onChange={handleThemeChange}
                    className={radioInputClasses}
                  />
                  <label htmlFor={`theme-${theme.toLowerCase()}`} className={radioLabelClasses}>
                    {theme}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </Card>
      </div>
    </PageContent>
  );
};
