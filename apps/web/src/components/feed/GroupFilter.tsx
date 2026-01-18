'use client';

import { useState, useRef, useEffect } from 'react';
import type { Group } from '@cooked/shared';

interface GroupFilterProps {
  groups: Group[];
  selectedGroupId: string | null;
  onGroupChange: (groupId: string | null) => void;
}

export function GroupFilter({
  groups,
  selectedGroupId,
  onGroupChange,
}: GroupFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected group name or "All Groups"
  const selectedGroup = selectedGroupId
    ? groups.find((g) => g.id === selectedGroupId)
    : null;
  const displayText = selectedGroup ? selectedGroup.name : 'All Groups';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (groupId: string | null) => {
    onGroupChange(groupId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full max-w-xs px-4 py-2 bg-surface border border-text-muted/20 rounded-lg text-sm font-semibold text-text-primary hover:bg-surface-elevated transition-colors"
      >
        <span>{displayText}</span>
        <span className="ml-2 text-text-muted">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full max-w-xs bg-surface border border-text-muted/20 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* All Groups Option */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
              selectedGroupId === null
                ? 'bg-primary/20 text-primary font-semibold'
                : 'text-text-primary hover:bg-surface-elevated'
            }`}
          >
            All Groups
          </button>

          {/* Divider */}
          {groups.length > 0 && (
            <div className="border-t border-text-muted/20" />
          )}

          {/* Individual Group Options */}
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleSelect(group.id)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                selectedGroupId === group.id
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-text-primary hover:bg-surface-elevated'
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
