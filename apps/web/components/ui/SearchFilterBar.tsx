import { Filter, RotateCcw, Search } from "lucide-react";
import React from "react";
import { Button } from "./Button";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search by name, code, or email...",
  filterGroups = [],
  onResetFilters,
  hasActiveFilters = false,
  className = "",
}: SearchFilterBarProps) {
  return (
    <div
      className={`search-filter-bar ${className}`}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
      }}
    >
      {/* Search Input */}
      <div
        style={{
          position: "relative",
          flex: "1 1 260px",
          minWidth: 220,
        }}
      >
        <Search
          size={16}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value);
          }}
          placeholder={searchPlaceholder}
          className="form-input"
          style={{
            paddingLeft: 36,
            height: 38,
            fontSize: "0.88rem",
          }}
        />
      </div>

      {/* Filter Dropdowns */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
        }}
      >
        {filterGroups.map((group) => (
          <div
            key={group.id}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem" }}
          >
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
              <Filter size={12} style={{ display: "inline", marginRight: 2 }} />
              {group.label}:
            </span>
            <select
              value={group.value}
              onChange={(e) => {
                group.onChange(e.target.value);
              }}
              className="switcher-select"
              style={{
                height: 38,
                fontSize: "0.82rem",
                padding: "4px 8px",
                borderColor: group.value ? "var(--secondary)" : "var(--border)",
              }}
            >
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Reset Filters Action */}
        {hasActiveFilters && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            leftIcon={<RotateCcw size={13} />}
            style={{ height: 38, fontSize: "0.8rem", width: "auto" }}
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
