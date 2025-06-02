import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from './chatStore';
import type { ChatStoreState } from './chatStore';
import { ActivityTypeValue } from '../types/message';
import type { ContentMessage } from '../types/message';

// Mock the database and dependencies
vi.mock('../lib/db/database', () => ({
  getSQLiteDB: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      })
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({})
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({})
      })
    })
  })
}));

vi.mock('../lib/utils', () => ({
  generateId: vi.fn(() => 'test-id-' + Math.random().toString(36).substr(2, 9))
}));

vi.mock('./appStateStore', () => ({
  useAppStateStore: {
    getState: vi.fn(() => ({
      appState: {
        activeChannelId: null,
        activeChatId: null
      }
    }))
  }
}));

// TODO: add tests for the chatStore
