import React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  ariaLabel?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  ariaLabel = 'Navigation Tabs',
}) => {
  const tablistRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let targetIndex = currentIndex;
    if (e.key === 'ArrowRight') {
      targetIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const targetTab = tabs[targetIndex];
    if (targetTab && !targetTab.disabled) {
      onChange(targetTab.id);
      const buttons = tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[targetIndex]?.focus();
    }
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={tablistRef}
        role="tablist"
        aria-label={ariaLabel}
        className="flex space-x-1 border-b border-border p-1 overflow-x-auto select-none"
      >
        {tabs.map((tab, idx) => {
          const isSelected = tab.id === activeTab;
          const tabId = `tab-${tab.id}`;
          const panelId = `panel-${tab.id}`;

          return (
            <button
              key={tab.id}
              role="tab"
              id={tabId}
              type="button"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'border-primary text-primary font-semibold bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-surface/40'
              } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-xs">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="pt-4 focus:outline-none"
        tabIndex={0}
      >
        {activeContent}
      </div>
    </div>
  );
};
