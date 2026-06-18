import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { getSeverityConfig } from "@/lib/utils/severity";

export default function HealthEventRow({ event }) {
  const { date, display_name, sub_title, custom_fields, severity } = event;
  const config = getSeverityConfig(severity);

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Collapsible>
      <Card className="hover:shadow-sm transition-all duration-200 border border-[var(--border-soft)] overflow-hidden">
        {/* Clickable Header Area */}
        <CollapsibleTrigger className="w-full text-left outline-none group">
          {/* Updated to strict grid layouts with defensive spacing */}
          <div className="w-full grid grid-cols-12 items-center p-4 gap-4 bg-[var(--surface)] hover:bg-[var(--gray-soft)] transition-colors duration-150">
            
            {/* Column 1: Chevron (Span 1) */}
            <div className="col-span-1 flex items-center justify-start">
              <ChevronDown 
                size={18} 
                className="text-[var(--text3)] transition-transform duration-200 group-data-[state=open]:rotate-180" 
              />
            </div>

            {/* Column 2: Date (Span 2 - perfectly sized for short date formats) */}
            <div className="col-span-2 text-sm font-medium text-[var(--text2)]">
              {formattedDate}
            </div>

            {/* Column 3: Symptom / Text Area (Expanded to Span 6 so long names don't crowd the status) */}
            <div className="col-span-6 flex flex-col pr-4">
              <span className="text-sm font-semibold text-[var(--text)] line-clamp-1">
                {display_name}
              </span>
              {sub_title && (
                <span className="text-xs text-[var(--text3)] mt-0.5 line-clamp-1">
                  {sub_title}
                </span>
              )}
            </div>

            {/* Column 4: Severity Status (Span 3 - Changed to justify-end with a right-hand safety pad) */}
            <div className="col-span-3 flex items-center justify-end gap-2.5 pr-2">
              <span 
                className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm" 
                style={{ backgroundColor: config.dotBg }} 
              />
              <Badge 
                variant="outline" 
                className={`px-2.5 py-0.5 text-xs tracking-wide shrink-0 ${config.badgeClass}`}
              >
                Level {severity} • {config.label}
              </Badge>
            </div>

          </div>
        </CollapsibleTrigger>

        {/* Hidden expandable info box */}
        {/* Hidden expandable content block */}
        <CollapsibleContent className="bg-[var(--bg)] border-t border-[var(--border-soft)]">
          <div className="p-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text3)] mb-2">
              Logged Details
            </h4>
            
            {custom_fields && custom_fields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {custom_fields.map((field, idx) => {
                  const name = field.field_name || "";
                  const value = field.field_value || "—";

                  return (
                    <div 
                      key={idx} 
                      className="flex justify-between items-center p-2.5 bg-[var(--surface)] rounded-[var(--r-sm)] border border-[var(--border-soft)]"
                    >
                      <span className="text-xs font-medium text-[var(--text2)] capitalize">
                        {name.replace(/_/g, " ")}:
                      </span>
                      <span className="text-xs font-semibold text-[var(--text)]">
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Clean, minimalist placeholder when no fields exist */
              <p className="text-xs italic text-[var(--text3)] pl-1">
                No additional metadata fields recorded for this entry.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}