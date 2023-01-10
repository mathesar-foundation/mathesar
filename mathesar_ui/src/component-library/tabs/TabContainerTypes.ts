export interface Tab {
  [key: string]: unknown;
  href?: string;
  disabled?: boolean;
}

export type TabEvents = {
  tabSelected: {
    tab: Tab;
    originalEvent: Event;
  };
  tabRemoved: {
    removedTab: Tab;
    activeTab: Tab | undefined;
    originalEvent: Event;
  };
};
