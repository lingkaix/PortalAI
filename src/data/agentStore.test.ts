// Mock generateId
import { vi } from 'vitest';
const FIXED_ID = 'fixed-local-test-id';
vi.mock('../lib/utils', () => ({
    generateId: vi.fn(() => FIXED_ID),
}));
// Mock the file operations
vi.mock('../lib/localAppData', () => ({
    readJsonFile: vi.fn(),
    writeJsonFile: vi.fn()
}));

import { describe, it, expect, beforeEach, Mock } from 'vitest';
import { useAgentStore, loadAgentConfig, saveAgentConfig } from './agentStore';
import { Agent, LocalAgentConfig, RemoteAgentConfig } from '../types';
import { generateId } from '../lib/utils';
import { readJsonFile, writeJsonFile } from '../lib/localAppData';
import { FileX } from 'lucide-react';

describe('AgentStore', () => {
    let localAgentConfig: LocalAgentConfig;
    let remoteAgentConfig: RemoteAgentConfig;
    let store: ReturnType<typeof useAgentStore.getState>;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Reset the store state
        store = useAgentStore.getState();
        store.agentConfigs.clear();
        store.agents.clear();
        store.error = null;
        store.isLoading = false;  // Set initial loading state to false

        // Create test configs with fixed IDs for predictable testing
        localAgentConfig = {
            id: 'localId',
            kind: 'local',
            name: 'Test Agent',
            description: 'Test agent description',
            modelProvider: 'openai',
            model: 'gpt-4',
            systemPrompt: 'You are a test agent',
            apiKey: 'test-api-key',
            isEnabled: true,
            isRetired: false
        };
        // TODO: add remote agent to testings
        remoteAgentConfig = {
            id: 'remoteId',
            kind: 'remote',
            url: 'http://test.com',
            apiKey: 'test-api-key',
            isEnabled: true,
            isRetired: false
        };
        // Mock file operations to return empty array by default
        (readJsonFile as Mock).mockResolvedValue([localAgentConfig]);  // Return the local agent config
        (writeJsonFile as Mock).mockResolvedValue(null);
    });

    it('should load agents', async () => {
        await store.loadAgent();
        const newState = useAgentStore.getState();
        expect(newState.error).toBeNull();
        expect(newState.isLoading).toBe(false);
        expect(newState.agentConfigs.size).toBe(1);
        expect(newState.agents.size).toBe(1);
    });

    it('should add an agent', async () => {
        await store.addAgent(localAgentConfig);
        const newState = useAgentStore.getState();
        expect(newState.agentConfigs.size).toBe(1);
        expect(newState.agents.size).toBe(1);
    });

    it('should update an agent', async () => {
        await store.loadAgent();
        let newState = useAgentStore.getState();
        expect(newState.agentConfigs.size).toBe(1);
        const updatedConfig = { ...localAgentConfig, name: 'Updated Agent' };
        await newState.updateAgent(updatedConfig);
        newState = useAgentStore.getState();
        expect(newState.agentConfigs.size).toBe(1);
        expect(newState.agents.size).toBe(1);
        expect(newState.agents.get(localAgentConfig.id)?.name).toBe('Updated Agent');

        // if update status as well, ignore it
        const updatedConfig2 = { ...updatedConfig, isEnabled: !updatedConfig.isEnabled, isRetired: !updatedConfig.isRetired, name: 'Updated Agent 2' };
        await newState.updateAgent(updatedConfig2);
        newState = useAgentStore.getState();
        expect(newState.agents.get(localAgentConfig.id)?.name).toBe('Updated Agent 2');
        expect(newState.agentConfigs.get(localAgentConfig.id)?.isEnabled).toBe(updatedConfig.isEnabled);
        expect(newState.agentConfigs.get(localAgentConfig.id)?.isRetired).toBe(updatedConfig.isRetired);
    });
});
