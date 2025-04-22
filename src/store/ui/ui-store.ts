import { create } from 'zustand';

interface NewConversationFeatureState {
  shouldShowNewConversation: boolean;
  // eslint-disable-next-line no-unused-vars
  setShouldShowNewConversation: (shouldShow: boolean) => void;
}

export const useNewConversationFeature = create<NewConversationFeatureState>()(
  (set) => ({
    shouldShowNewConversation: false,
    setShouldShowNewConversation: (value: boolean) => set({ shouldShowNewConversation: value }),
  })
);
