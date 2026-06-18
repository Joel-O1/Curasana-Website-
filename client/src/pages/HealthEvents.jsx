import React, { useState, useMemo } from "react";
import { AlertCircle, Loader2, SlidersHorizontal, ArrowUpDown, Search } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import useTimelineData from "../hooks/useTimelineData";
import HealthEventRow from "../components/HealthEventRow"; 
import CenteredCard from "./Dashboard"; 
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HealthEvents() {
  const { user } = useAuth();
  
  // 1. Fetching the user's live health events from hook
  const { events, loading, error } = useTimelineData(
    user?.patientId,
    user?.dbId
  );

  // 2. Filter, Search, and Sort States
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc"); //newest first

  // 3. The Reset Mechanisms 
  const isFilterActive = useMemo(() => {
    return severityFilter !== "all" || searchQuery.trim() !== "" || sortBy !== "date-desc";
  }, [severityFilter, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSeverityFilter("all");
    setSortBy("date-desc");
  };

  // 4. Process the events array locally using useMemo
  const processedEvents = useMemo(() => {
    let result = events ? [...events] : [];

    // Live Search Filter 
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.display_name?.toLowerCase().includes(query) ||
          e.sub_title?.toLowerCase().includes(query) ||
          e.event_title?.toLowerCase().includes(query)
      );
    }

    // Severity Range Filter
    if (severityFilter !== "all") {
      if (severityFilter === "minimal") {
        result = result.filter((e) => e.severity >= 1 && e.severity <= 3);
      } else if (severityFilter === "moderate") {
        result = result.filter((e) => e.severity >= 4 && e.severity <= 6);
      } else if (severityFilter === "severe") {
        result = result.filter((e) => e.severity >= 7 && e.severity <= 10);
      }
    }

    // Sorting Engine
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.date) - new Date(a.date);
      }
      if (sortBy === "date-asc") {
        return new Date(a.date) - new Date(b.date);
      }
      if (sortBy === "severity-desc") {
        return b.severity - a.severity;
      }
      if (sortBy === "symptom-asc") {
        return (a.display_name || "").localeCompare(b.display_name || "");
      }
      if (sortBy === "symptom-desc") {
        return (b.display_name || "").localeCompare(a.display_name || "");
      }
      return 0;
    });

    return result;
  }, [events, severityFilter, searchQuery, sortBy]);

  // Loading State
  if (loading) return (
    <CenteredCard>
      <Loader2 size={32} className="animate-spin" style={{ color: "var(--teal)" }} />
      <p className="mt-2 text-sm text-[var(--text2)]">Loading events...</p>
    </CenteredCard>
  );

  // Error State
  if (error) return (
    <CenteredCard>
      <AlertCircle size={32} style={{ color: "var(--coral)" }} />
      <p className="mt-2 text-sm text-[var(--text2)]">Error: {error}</p>
    </CenteredCard>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">Health Events History</h2>
        <p className="text-sm text-[var(--text3)] mt-1">A timeline track of your logged symptoms, severities and other details.</p>
      </div>

      {/* CONTROL BAR SECTION */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[var(--surface)] p-3 rounded-xl border border-[var(--border-soft)] shadow-sm">
        
        {/* Search Input Box */}
        <div className="w-full md:w-72 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)]" size={16} />
          <Input
            type="text"
            placeholder="Search symptoms or logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-[var(--bg)] border-[var(--border-soft)] pl-9 pr-3 h-9 outline-none focus-visible:ring-1 focus-visible:ring-[var(--text3)]"
          />
        </div>

        {/* Dropdowns Wrapper Group */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3 justify-end">
          
          {/* CONDITIONAL RESET BUTTON */}
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold px-3 h-9 rounded-lg transition-colors text-[var(--coral)] hover:bg-[var(--coral-soft)] border border-[var(--border-soft)] w-full sm:w-auto shrink-0 animate-in fade-in duration-200"
            >
              Reset Filters
            </button>
          )}
          
          {/* Severity Bracket Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-44">
            <SlidersHorizontal size={14} className="text-[var(--text3)] shrink-0" />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full text-xs h-9 bg-[var(--bg)] border-[var(--border-soft)]">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="minimal">Minimal (Levels 1-3)</SelectItem>
                <SelectItem value="moderate">Moderate (Levels 4-6)</SelectItem>
                <SelectItem value="severe">Critical (Levels 7-10)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sorter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-48">
            <ArrowUpDown size={14} className="text-[var(--text3)] shrink-0" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full text-xs h-9 bg-[var(--bg)] border-[var(--border-soft)]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date: Newest First</SelectItem>
                <SelectItem value="date-asc">Date: Oldest First</SelectItem>
                <SelectItem value="severity-desc">Highest Severity</SelectItem>
                <SelectItem value="symptom-asc">Symptom: A to Z</SelectItem>
                <SelectItem value="symptom-desc">Symptom: Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* Table-Like Column Header Structure for Grid Alignment */}
      <div className="hidden md:grid grid-cols-12 px-4 mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text3)]">
        <span className="col-span-1"></span>
        <span className="col-span-2">Date</span>
        <span className="col-span-6">Symptom Name</span>
        <span className="col-span-3 text-right pr-2">Severity Status</span>
      </div>

      {/* Dynamic List Rendering */}
      <div className="space-y-3">
        {processedEvents.length > 0 ? (
          processedEvents.map((event) => (
            <HealthEventRow key={event.id || event.idx} event={event} />
          ))
        ) : (
          /* Empty Search or Range Match Condition View */
          <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl bg-[var(--surface)] p-6">
            <p className="text-[var(--text2)] text-sm font-medium mb-3">
              {events && events.length > 0 
                ? "No health logs found matching your active filter criteria." 
                : "No health logs recorded yet."}
            </p>
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-medium px-4 py-2 bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text)]"
              >
                Clear all active parameters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}