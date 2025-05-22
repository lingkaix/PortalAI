// create a test for the agent class use vitest 
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent, LocalAgentConfig, RemoteAgentConfig, AgentConfig } from './agent';
import { generateText } from 'ai';
import { openai, createOpenAI } from "@ai-sdk/openai";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { xai, createXai } from "@ai-sdk/xai"
import { generateId } from '../lib/utils';

describe('Agent', () => {
  let localAgentConfig: LocalAgentConfig;
  let remoteAgentConfig: RemoteAgentConfig;

  beforeEach(() => {
    localAgentConfig = {
      id: generateId(),
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

    remoteAgentConfig = {
      id: generateId(),
      kind: 'remote',
      url: 'http://test.com',
      apiKey: 'test-api-key',
      isEnabled: true, 
      isRetired: false
    };
  });

  it('should create a local agent', () => {
    const agent = new Agent(localAgentConfig);
    expect(agent.id).toBe(localAgentConfig.id);
    expect(agent.name).toBe(localAgentConfig.name);
    expect(agent.description).toBe(localAgentConfig.description);
  });

  it('should create a remote agent', () => {
    const agent = new Agent(remoteAgentConfig);
    expect(agent.id).toBe(remoteAgentConfig.id);
  });

  it('should throw error when getting model for remote agent', () => {
    const agent = new Agent(remoteAgentConfig);
    expect(() => agent.getModel()).toThrow('Agent is not local');
  });

  it('should throw error when getting model for disabled agent', () => {
    const disabledConfig = {...localAgentConfig, isEnabled: false};
    const agent = new Agent(disabledConfig);
    expect(() => agent.getModel()).toThrow('Agent is retired or disabled');
  });

  it('should throw error when getting model for retired agent', () => {
    const retiredConfig = {...localAgentConfig, isRetired: true};
    const agent = new Agent(retiredConfig);
    expect(() => agent.getModel()).toThrow('Agent is retired or disabled');
  });

  it('should update agent config', () => {
    const agent = new Agent(localAgentConfig);
    const updatedConfig = {
      ...localAgentConfig,
      name: 'Updated Agent',
      description: 'Updated description'
    };
    agent.updateConfig(updatedConfig);
    expect(agent.name).toBe('Updated Agent');
    expect(agent.description).toBe('Updated description');
  });

  it('should disable agent', () => {
    const agent = new Agent(localAgentConfig);
    agent.disable();
    expect(() => agent.getModel()).toThrow('Agent is retired or disabled');
    expect(agent.name).toBe('Disabled Agent');
  });

  it('should retire agent', () => {
    const agent = new Agent(localAgentConfig);
    agent.retire();
    expect(() => agent.getModel()).toThrow('Agent is retired or disabled');
    expect(agent.name).toBe('Retired Agent');
  });
});
