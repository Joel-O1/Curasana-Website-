import { useRef, useState } from "react";
import {
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  Cell,
  ReferenceLine,
  CartesianGrid,
  PieChart,
  Pie,
} from "recharts";
import testHealthEvents from "../data/testHealthEvents";
import testMedicationEvents from "../data/testMedicationEvents";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const DAY_LEFT_GAP = 30 * 60 * 1000;
const HARD_SWIPE_VELOCITY = 0.3;
const SNAP_ANIMATION_DURATION = 350;

const CHART_WIDTH = 1250;
const CHART_HEIGHT = 420;

const CHART_MARGIN = {
  top: 20,
  right: 30,
  bottom: 40,
  left: 280,
};

const HIDDEN_MEDICATION_Y_VALUE = 0.25;
const MEDICATION_STACK_GAP = 0.16;

const symptomColors = [
  "#059669",
  "#4f46e5",
  "#dc5f35",
  "#b7791f",
  "#0891b2",
  "#9333ea",
  "#be123c",
  "#65a30d",
  "#0f766e",
  "#7c3aed",
];

const medicationColors = {
  "Medication 1": "#2563eb",
  "Medication 2": "#16a34a",
  "Medication 3": "#9333ea",
  "Medication 4": "#ea580c",
  "Medication 5": "#0891b2",
};

const categoryGroups = [
  {
    name: "Health Events",
    options: [
      "Headache",
      "Cough",
      "Fever",
      "Sore Throat",
      "Fatigue",
      "Dizziness",
      "Nausea",
      "Vomiting",
      "Diarrhea",
      "Constipation",
      "Shortness of Breath",
      "Chest Discomfort",
      "Stomach Pain",
      "Back Pain",
      "Joint Pain",
      "Rash",
      "Itching",
    ],
  },
  {
    name: "Medications",
    options: [
      "Medication 1",
      "Medication 2",
      "Medication 3",
      "Medication 4",
      "Medication 5",
    ],
  },
];

const allEventTypes = categoryGroups.flatMap((group) => group.options);

const medicationTypes = categoryGroups.find(
  (group) => group.name === "Medications"
).options;

function parseLocalDate(dateString) {
  const [datePart, timePart] = dateString.split("T");
  const [year, month, day] = datePart.split("-").map(Number);

  if (!timePart) {
    return new Date(year, month - 1, day).getTime();
  }

  const [hour, minute] = timePart.split(":").map(Number);

  return new Date(year, month - 1, day, hour, minute).getTime();
}

function subtractMonths(timestamp, months) {
  const date = new Date(timestamp);

  date.setMonth(date.getMonth() - months);

  return date.getTime();
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(timestamp) {
  return `${formatDate(timestamp)}, ${formatTime(timestamp)}`;
}

function formatXAxisTick(timestamp, activeRange) {
  if (activeRange === "D") {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  }

  return formatDate(timestamp);
}

function getChartDomain(startDate, endDate, activeRange) {
  if (activeRange === "D") {
    return [startDate - DAY_LEFT_GAP, endDate];
  }

  return [startDate, endDate];
}

function getDateTicks(startDate, endDate, activeRange) {
  const ticks = [];

  if (activeRange === "D") {
    return [
      startDate + 6 * HOUR,
      startDate + 12 * HOUR,
      startDate + 18 * HOUR,
      endDate,
    ];
  }

  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  let step = DAY;

  if (activeRange === "M") {
    step = 7 * DAY;
  }

  if (activeRange === "3M" || activeRange === "6M") {
    step = 14 * DAY;
  }

  if (activeRange === "Y") {
    step = 30 * DAY;
  }

  while (currentDate.getTime() <= startDate) {
    currentDate.setTime(currentDate.getTime() + step);
  }

  while (currentDate.getTime() <= endDate) {
    ticks.push(currentDate.getTime());
    currentDate.setTime(currentDate.getTime() + step);
  }

  return ticks;
}

function getHealthRowsSortedByOccurrence(selectedTypes, startDate, endDate) {
  const healthTypeCounts = selectedTypes
    .filter((type) => !medicationTypes.includes(type))
    .map((type) => {
      const count = testHealthEvents.filter((event) => {
        const eventTime = parseLocalDate(event.date);

        return (
          event.type === type &&
          eventTime >= startDate &&
          eventTime <= endDate
        );
      }).length;

      return {
        type,
        count,
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.type.localeCompare(b.type);
    });

  return healthTypeCounts.map((item) => item.type);
}

function getSymptomBreakdownData(selectedTypes, startDate, endDate) {
  return selectedTypes
    .filter((type) => !medicationTypes.includes(type))
    .map((type) => {
      const count = testHealthEvents.filter((event) => {
        const eventTime = parseLocalDate(event.date);

        return (
          event.type === type &&
          eventTime >= startDate &&
          eventTime <= endDate
        );
      }).length;

      return {
        name: type,
        count,
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.name.localeCompare(b.name);
    })
    .map((item, index) => ({
      ...item,
      color: symptomColors[index % symptomColors.length],
    }));
}

function getAxisRows(chartRows) {
  const rowCount = Math.ceil(chartRows.length / 2);

  const availableSlots = chartRows.map((type, index) => {
    const rowNumber = Math.floor(index / 2) + 1;
    const isLeftSide = index % 2 === 0;

    return {
      side: isLeftSide ? "left" : "right",
      y: isLeftSide ? rowNumber : rowNumber + 0.5,
    };
  });

  const minYValue = 1;

  const maxYValue =
    availableSlots.length > 0
      ? Math.max(...availableSlots.map((slot) => slot.y))
      : rowCount;

  const centerYValue = (minYValue + maxYValue) / 2;

  const centeredSlots = [...availableSlots].sort((a, b) => {
    const distanceA = Math.abs(a.y - centerYValue);
    const distanceB = Math.abs(b.y - centerYValue);

    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }

    return a.y - b.y;
  });

  return chartRows.map((type, index) => {
    const slot = centeredSlots[index];

    return {
      type,
      side: slot.side,
      y: slot.y,
    };
  });
}

function getYAxisTicks(axisRows, side) {
  return axisRows
    .filter((row) => row.side === side)
    .map((row) => row.y);
}

function formatYAxisTick(value, axisRows, side) {
  const matchingRow = axisRows.find(
    (row) => row.side === side && row.y === value
  );

  return matchingRow ? matchingRow.type : "";
}

function getYValueForType(type, axisRows) {
  const matchingRow = axisRows.find((row) => row.type === type);

  return matchingRow ? matchingRow.y : null;
}

function getRedShade(severity) {
  const safeSeverity = Math.max(1, Math.min(10, severity));
  const lightness = 92 - safeSeverity * 6;

  return `hsl(0, 85%, ${lightness}%)`;
}

function getMedicationColor(type) {
  return medicationColors[type] || "#4b5563";
}

function clampToAllowedRange(start, end, activeRange) {
  const now = Date.now();
  const range = activeRange === "D" ? DAY : end - start;

  if (end > now) {
    return {
      start: now - range,
      end: now,
    };
  }

  return {
    start,
    end: activeRange === "D" ? start + DAY : end,
  };
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function getRangeLabel(startDate, endDate, activeRange) {
  if (activeRange === "D") {
    return `Showing ${formatDate(startDate)}, ${formatTime(
      startDate
    )} to ${formatDate(endDate)}, ${formatTime(endDate)}`;
  }

  return `Showing ${formatDate(startDate)} to ${formatDate(endDate)}`;
}

function PillGlyph(props) {
  const { cx, cy, payload } = props;

  if (!payload || payload.isPlaceholder) {
    return null;
  }

  const fillColor = getMedicationColor(payload.type);

  return (
    <g transform={`translate(${cx}, ${cy}) rotate(-45)`}>
      <rect
        x="-11"
        y="-5"
        width="22"
        height="10"
        rx="5"
        ry="5"
        fill={fillColor}
        stroke="#111827"
        strokeWidth="1.2"
      />

      <line
        x1="0"
        y1="-5"
        x2="0"
        y2="5"
        stroke="#111827"
        strokeWidth="1.2"
      />
    </g>
  );
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    if (data.isPlaceholder) {
      return null;
    }

    if (data.itemKind === "medication") {
      return (
        <div className="rounded-lg border bg-white p-3 shadow">
          <p className="font-semibold">{data.type}</p>
          <p>Group: {data.group}</p>
          <p>Date: {formatDateTime(data.x)}</p>
          <p>Dose: {data.dose}</p>
          <p>{data.note}</p>
        </div>
      );
    }

    return (
      <div className="rounded-lg border bg-white p-3 shadow">
        <p className="font-semibold">{data.type}</p>
        <p>Group: {data.group}</p>
        <p>Date: {formatDateTime(data.x)}</p>
        <p>Severity: {data.severity}/10</p>
      </div>
    );
  }

  return null;
}

function SymptomBreakdown({ data }) {
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);

  const maxCount =
    data.length > 0 ? Math.max(...data.map((item) => item.count)) : 0;

  const visibleData = showAllSymptoms ? data : data.slice(0, 5);
  const hasMoreSymptoms = data.length > 5;

  return (
    <div className="h-full rounded-2xl bg-white p-6 shadow">
      <h3 className="text-lg font-bold text-gray-900">Symptom Breakdown</h3>

      <p className="mt-1 text-sm text-gray-500">by selected date range</p>

      {data.length === 0 ? (
        <div className="mt-10 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
          No symptoms in this date range.
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-5">
            <PieChart width={130} height={130}>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={62}
                paddingAngle={0}
              >
                {data.map((entry) => (
                  <Cell key={`pie-cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>

            <div className="flex flex-col gap-2">
              {data.slice(0, 5).map((item) => (
                <div
                  key={`legend-${item.name}`}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />

                  <span>
                    {item.name} ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {visibleData.map((item) => {
              const widthPercent =
                maxCount > 0 ? (item.count / maxCount) * 100 : 0;

              return (
                <div
                  key={`bar-${item.name}`}
                  className="grid grid-cols-[110px_1fr_24px] items-center gap-3"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />

                    <span className="truncate">{item.name}</span>
                  </div>

                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                  <span className="text-right text-sm text-gray-500">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>

          {hasMoreSymptoms && (
            <button
              onClick={() => setShowAllSymptoms((prev) => !prev)}
              className="mt-5 w-full rounded-xl bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100"
            >
              {showAllSymptoms
                ? "Show less"
                : `Show ${data.length - 5} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function HealthTimeline() {
  const [selectedTypes, setSelectedTypes] = useState(allEventTypes);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({
    "Health Events": true,
    Medications: true,
  });

  const [startDate, setStartDate] = useState(Date.now() - 7 * DAY);
  const [endDate, setEndDate] = useState(Date.now());
  const [activeRange, setActiveRange] = useState("W");

  const [dragInfo, setDragInfo] = useState(null);

  const animationFrameRef = useRef(null);
  const lastMoveTimeRef = useRef(Date.now());
  const velocityRef = useRef(0);

  const chartDomain = getChartDomain(startDate, endDate, activeRange);

  const healthRows = getHealthRowsSortedByOccurrence(
    selectedTypes,
    startDate,
    endDate
  );

  const symptomBreakdownData = getSymptomBreakdownData(
    selectedTypes,
    startDate,
    endDate
  );

  const axisRows = getAxisRows(healthRows);
  const leftYAxisTicks = getYAxisTicks(axisRows, "left");
  const rightYAxisTicks = getYAxisTicks(axisRows, "right");

  const horizontalLineTicks = axisRows.map((row) => row.y);

  const maxYValue = Math.max(...axisRows.map((row) => row.y), 1);

  const healthChartData = testHealthEvents
    .filter((event) => {
      const eventTime = parseLocalDate(event.date);

      return (
        selectedTypes.includes(event.type) &&
        healthRows.includes(event.type) &&
        eventTime >= chartDomain[0] &&
        eventTime <= chartDomain[1]
      );
    })
    .map((event) => {
      const yValue = getYValueForType(event.type, axisRows);

      return {
        x: parseLocalDate(event.date),
        y: yValue,
        severity: event.severity,
        type: event.type,
        group: event.group,
        date: event.date,
        itemKind: "health",
      };
    })
    .filter((event) => event.y !== null);

  const medicationStackCounts = {};

  const medicationChartData = testMedicationEvents
    .filter((event) => {
      const eventTime = parseLocalDate(event.date);

      return (
        selectedTypes.includes(event.type) &&
        eventTime >= chartDomain[0] &&
        eventTime <= chartDomain[1]
      );
    })
    .map((event) => {
      const eventTime = parseLocalDate(event.date);
      const stackKey = eventTime.toString();

      const stackIndex = medicationStackCounts[stackKey] || 0;
      medicationStackCounts[stackKey] = stackIndex + 1;

      return {
        x: eventTime,
        y: HIDDEN_MEDICATION_Y_VALUE + stackIndex * MEDICATION_STACK_GAP,
        type: event.type,
        group: event.group,
        date: event.date,
        dose: event.dose,
        note: event.note,
        stackIndex,
        itemKind: "medication",
      };
    });

  const placeholderData = [
    {
      x: chartDomain[0],
      y: 1,
      isPlaceholder: true,
    },
    {
      x: chartDomain[1],
      y: 1,
      isPlaceholder: true,
    },
  ];

  const rightAxisPlaceholderData = rightYAxisTicks.map((tick) => ({
    x: chartDomain[0],
    y: tick,
    isPlaceholder: true,
  }));

  function animateTimelineTo(targetStartDate, targetEndDate) {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const animationStartDate = startDate;
    const animationEndDate = endDate;
    const animationStartTime = performance.now();

    function animate(currentTime) {
      const elapsedTime = currentTime - animationStartTime;
      const progress = Math.min(elapsedTime / SNAP_ANIMATION_DURATION, 1);
      const easedProgress = easeOutCubic(progress);

      const nextStartDate =
        animationStartDate +
        (targetStartDate - animationStartDate) * easedProgress;

      const nextEndDate =
        animationEndDate + (targetEndDate - animationEndDate) * easedProgress;

      setStartDate(nextStartDate);
      setEndDate(nextEndDate);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setStartDate(targetStartDate);
        setEndDate(targetEndDate);
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }

  function setTimelineRange(rangeType) {
    const now = Date.now();

    let newStartDate = now - DAY;
    let newEndDate = now;

    if (rangeType === "D") {
      newStartDate = now - DAY;
      newEndDate = now;
    }

    if (rangeType === "W") {
      newStartDate = now - 7 * DAY;
      newEndDate = now;
    }

    if (rangeType === "M") {
      newStartDate = subtractMonths(now, 1);
      newEndDate = now;
    }

    if (rangeType === "3M") {
      newStartDate = subtractMonths(now, 3);
      newEndDate = now;
    }

    if (rangeType === "6M") {
      newStartDate = subtractMonths(now, 6);
      newEndDate = now;
    }

    if (rangeType === "Y") {
      newStartDate = subtractMonths(now, 12);
      newEndDate = now;
    }

    const clampedRange = clampToAllowedRange(
      newStartDate,
      newEndDate,
      rangeType
    );

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setStartDate(clampedRange.start);
    setEndDate(clampedRange.end);
    setActiveRange(rangeType);
  }

  function toggleDropdown() {
    setDropdownOpen((prev) => !prev);
  }

  function toggleGroup(groupName) {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  }

  function toggleHealthEvent(type) {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((item) => item !== type);
      }

      return [...prev, type];
    });
  }

  function toggleCategory(options) {
    const allSelected = options.every((option) =>
      selectedTypes.includes(option)
    );

    if (allSelected) {
      setSelectedTypes((prev) =>
        prev.filter((type) => !options.includes(type))
      );
    } else {
      setSelectedTypes((prev) => [...new Set([...prev, ...options])]);
    }
  }

  function selectAllEvents() {
    setSelectedTypes(allEventTypes);
  }

  function clearAllEvents() {
    setSelectedTypes([]);
  }

  function getVisibleOptions(options) {
    if (searchText.trim() === "") {
      return options;
    }

    return options.filter((option) =>
      option.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    lastMoveTimeRef.current = Date.now();
    velocityRef.current = 0;

    const originalRange = activeRange === "D" ? DAY : endDate - startDate;

    setDragInfo({
      startX: event.clientX,
      lastX: event.clientX,
      originalStartDate: startDate,
      originalEndDate: startDate + originalRange,
      originalRange,
      originalActiveRange: activeRange,
    });
  }

  function handlePointerMove(event) {
    if (!dragInfo) {
      return;
    }

    const now = Date.now();
    const timePassed = now - lastMoveTimeRef.current || 16;
    const distanceMoved = event.clientX - dragInfo.lastX;

    velocityRef.current = distanceMoved / timePassed;
    lastMoveTimeRef.current = now;

    const newDragInfo = {
      ...dragInfo,
      lastX: event.clientX,
    };

    setDragInfo(newDragInfo);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const dragDistance = event.clientX - newDragInfo.startX;
      const timeShift =
        (dragDistance / CHART_WIDTH) * newDragInfo.originalRange;

      const newStart = newDragInfo.originalStartDate - timeShift;
      const newEnd = newStart + newDragInfo.originalRange;

      const clampedRange = clampToAllowedRange(
        newStart,
        newEnd,
        newDragInfo.originalActiveRange
      );

      setStartDate(clampedRange.start);
      setEndDate(clampedRange.end);
    });
  }

  function handlePointerUp(event) {
    if (!dragInfo) {
      return;
    }

    const totalDragDistance = event.clientX - dragInfo.startX;

    if (Math.abs(velocityRef.current) >= HARD_SWIPE_VELOCITY) {
      const range =
        dragInfo.originalActiveRange === "D" ? DAY : dragInfo.originalRange;

      if (totalDragDistance < 0) {
        const newStart = dragInfo.originalStartDate + range;
        const newEnd = newStart + range;
        const clampedRange = clampToAllowedRange(
          newStart,
          newEnd,
          dragInfo.originalActiveRange
        );

        animateTimelineTo(clampedRange.start, clampedRange.end);
      } else {
        const newStart = dragInfo.originalStartDate - range;
        const newEnd = newStart + range;
        const clampedRange = clampToAllowedRange(
          newStart,
          newEnd,
          dragInfo.originalActiveRange
        );

        animateTimelineTo(clampedRange.start, clampedRange.end);
      }
    }

    setDragInfo(null);
  }

  function handlePointerLeave(event) {
    handlePointerUp(event);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">
          Health Event Timeline
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Health events are shown as red circles. Medications are shown as small
          pill glyphs with different colours.
        </p>
      </div>

      <div className="mb-4 flex items-start gap-4">
        <div className="relative w-80">
          <button
            onClick={toggleDropdown}
            className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-left shadow-sm"
          >
            <span className="font-semibold">Event Categories</span>

            <span>{dropdownOpen ? "▲" : "▼"}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 mt-2 w-full rounded-xl bg-white p-4 shadow-lg">
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search events..."
                className="mb-3 w-full rounded-lg border px-3 py-2 outline-none"
              />

              <div className="mb-3 flex gap-2">
                <button
                  onClick={selectAllEvents}
                  className="rounded-lg bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                >
                  Select All
                </button>

                <button
                  onClick={clearAllEvents}
                  className="rounded-lg bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {categoryGroups.map((group) => {
                  const visibleOptions = getVisibleOptions(group.options);

                  if (visibleOptions.length === 0) {
                    return null;
                  }

                  const allGroupOptionsSelected = group.options.every(
                    (option) => selectedTypes.includes(option)
                  );

                  const someGroupOptionsSelected = group.options.some(
                    (option) => selectedTypes.includes(option)
                  );

                  return (
                    <div key={group.name} className="mb-3">
                      <div className="flex w-full items-center justify-between rounded-lg bg-gray-100 px-3 py-2 font-semibold hover:bg-gray-200">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allGroupOptionsSelected}
                            ref={(input) => {
                              if (input) {
                                input.indeterminate =
                                  someGroupOptionsSelected &&
                                  !allGroupOptionsSelected;
                              }
                            }}
                            onChange={() => toggleCategory(group.options)}
                          />

                          <span>{group.name}</span>
                        </label>

                        <button
                          onClick={() => toggleGroup(group.name)}
                          className="rounded px-2"
                        >
                          {expandedGroups[group.name] ? "-" : "+"}
                        </button>
                      </div>

                      {expandedGroups[group.name] && (
                        <div className="mt-2 flex flex-col gap-2 pl-3">
                          {visibleOptions.map((type) => (
                            <label
                              key={type}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTypes.includes(type)}
                                onChange={() => toggleHealthEvent(type)}
                              />

                              <span>{type}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          {["D", "W", "M", "3M", "6M", "Y"].map((range) => (
            <button
              key={range}
              onClick={() => setTimelineRange(range)}
              className={
                activeRange === range
                  ? "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow"
                  : "rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-gray-100"
              }
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-sm text-gray-600">
        {getRangeLabel(startDate, endDate, activeRange)}
      </p>

      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <div
            className="inline-block max-w-full cursor-grab touch-none overflow-x-auto overflow-y-hidden rounded-2xl bg-white active:cursor-grabbing select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onDragStart={(event) => event.preventDefault()}
          >
            <div
              className="relative"
              style={{
                width: `${CHART_WIDTH}px`,
                height: `${CHART_HEIGHT}px`,
              }}
            >
              <ScatterChart
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                margin={CHART_MARGIN}
              >
                <CartesianGrid
                  vertical={true}
                  horizontal={false}
                  strokeDasharray="3 3"
                />

                <XAxis
                  type="number"
                  dataKey="x"
                  domain={chartDomain}
                  ticks={getDateTicks(startDate, endDate, activeRange)}
                  tickFormatter={(value) =>
                    formatXAxisTick(value, activeRange)
                  }
                  name="Date"
                  tick={{ fontSize: 12 }}
                  allowDataOverflow
                  padding={{ left: 0, right: 0 }}
                />

                <YAxis
                  yAxisId="left"
                  orientation="left"
                  type="number"
                  dataKey="y"
                  domain={[0.1, maxYValue + 0.5]}
                  ticks={leftYAxisTicks}
                  tickFormatter={(value) =>
                    formatYAxisTick(value, axisRows, "left")
                  }
                  name="Health Event Left"
                  width={130}
                  tick={{ fontSize: 12 }}
                  axisLine
                  tickLine
                  allowDecimals={false}
                  interval={0}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  type="number"
                  dataKey="y"
                  domain={[0.1, maxYValue + 0.5]}
                  ticks={rightYAxisTicks}
                  tickFormatter={(value) =>
                    formatYAxisTick(value, axisRows, "right")
                  }
                  name="Health Event Right"
                  width={170}
                  tick={{ fontSize: 12 }}
                  axisLine
                  tickLine
                  allowDecimals={false}
                  interval={0}
                />

                <ZAxis range={[180, 180]} />

                {horizontalLineTicks.map((tick) => (
                  <ReferenceLine
                    key={`horizontal-line-${tick}`}
                    yAxisId="left"
                    y={tick}
                    stroke="#d1d5db"
                    strokeDasharray="3 3"
                  />
                ))}

                <ReferenceLine x={Date.now()} yAxisId="left" stroke="#999" />

                <Tooltip content={<CustomTooltip />} />

                <Scatter
                  yAxisId="left"
                  data={placeholderData}
                  isAnimationActive={false}
                >
                  {placeholderData.map((entry, index) => (
                    <Cell
                      key={`placeholder-cell-${index}`}
                      fill="transparent"
                    />
                  ))}
                </Scatter>

                <Scatter
                  yAxisId="right"
                  data={rightAxisPlaceholderData}
                  isAnimationActive={false}
                >
                  {rightAxisPlaceholderData.map((entry, index) => (
                    <Cell
                      key={`right-axis-placeholder-cell-${index}`}
                      fill="transparent"
                    />
                  ))}
                </Scatter>

                <Scatter
                  yAxisId="left"
                  data={healthChartData}
                  isAnimationActive={false}
                >
                  {healthChartData.map((entry, index) => (
                    <Cell
                      key={`health-cell-${index}`}
                      fill={getRedShade(entry.severity)}
                    />
                  ))}
                </Scatter>

                <Scatter
                  yAxisId="left"
                  data={medicationChartData}
                  shape={(props) => <PillGlyph {...props} />}
                  isAnimationActive={false}
                />
              </ScatterChart>
            </div>
          </div>
        </div>

        <div className="w-[430px] shrink-0">
          <SymptomBreakdown data={symptomBreakdownData} />
        </div>
      </div>
    </div>
  );
}

export default HealthTimeline;