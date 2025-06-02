// the app states that need to be persisted
// use indexed db for now
export type AppState = Record<string, any> & {
    activeChatId: string | null; // the id of the active chat
};