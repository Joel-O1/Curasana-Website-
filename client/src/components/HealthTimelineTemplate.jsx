import { useMemo, useState } from "react";
import {
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Cell,
  ReferenceLine,
  PieChart,
  Pie,
} from "recharts";
import testGroupedHealthEvents from "../data/testGroupedHealthEvents";

const DAY = 24 * 60 * 60 * 1000;

const CHART_WIDTH = 900;
const CHART_HEIGHT = 460;

const CHART_MARGIN = {
  top: 30,
  right: 30,
  bottom: 45,
  left: 20,
};

const CHART_BASELINE_Y =
  CHART_HEIGHT - CHART_MARGIN.bottom - CHART_MARGIN.top;

const categoryColors = {
  Pain: "#ef4444",
  Digestive: "#f97316",
  Energy: "#eab308",
  Sleep: "#6366f1",
  Mood: "#a855f7",
  Respiratory: "#06b6d4",
};

const categories = [
  "Pain",
  "Digestive",
  "Energy",
  "Sleep",
  "Mood",
  "Respiratory",
];

const mlPatternSymptoms = [
  "Headache",
  "Poor sleep",
  "Fatigue",
  "Anxiety",
];

const ranges = {
  "7D": 7 * DAY,
  "14D": 14 * DAY,
  "30D": 30 * DAY,
};

function getTodayRangeEndTime() {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today.getTime() + DAY;
}

function parseEventDateTime(event) {
  return new Date(`${event.date}T${event.time}`).getTime();
}

function parseDateOnly(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).getTime();
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

function getDurationSize(durationMinutes) {
  if (!durationMinutes) {
    return 260;
  }

  if (durationMinutes <= 30) {
    return 260;
  }

  if (durationMinutes <= 90) {
    return 340;
  }

  if (durationMinutes <= 180) {
    return 430;
  }

  if (durationMinutes <= 300) {
    return 540;
  }

  return 680;
}

function getTicks(startTime, endTime, rangeKey) {
  const ticks = [];
  const current = new Date(startTime);
  const todayTick = endTime - DAY;

  current.setHours(0, 0, 0, 0);

  let step = DAY;

  if (rangeKey === "30D") {
    step = 5 * DAY;
  }

  while (current.getTime() < startTime) {
    current.setTime(current.getTime() + step);
  }

  while (current.getTime() < todayTick) {
    ticks.push(current.getTime());
    current.setTime(current.getTime() + step);
  }

  if (!ticks.includes(todayTick)) {
    ticks.push(todayTick);
  }

  return ticks;
}

function getDateRange(startTime, endTime) {
  const dates = [];
  const current = new Date(startTime);

  current.setHours(0, 0, 0, 0);

  while (current.getTime() < endTime) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");

    dates.push(`${year}-${month}-${day}`);
    current.setTime(current.getTime() + DAY);
  }

  return dates;
}

function getDailyCountData(events, startTime, endTime) {
  return getDateRange(startTime, endTime).map((date) => {
    const matchingEvents = events.filter((event) => {
      return event.date === date && event.x >= startTime && event.x < endTime;
    });

    const categoryCounts = categories.reduce((counts, category) => {
      counts[category] = matchingEvents.filter(
        (event) => event.category === category
      ).length;

      return counts;
    }, {});

    const eventsByCategory = categories.reduce((groupedEvents, category) => {
      groupedEvents[category] = matchingEvents.filter(
        (event) => event.category === category
      );

      return groupedEvents;
    }, {});

    return {
      id: `daily-count-${date}`,
      x: parseDateOnly(date) + DAY / 2,
      y: matchingEvents.length,
      count: matchingEvents.length,
      date,
      label: formatDate(parseDateOnly(date)),
      categoryCounts,
      eventsByCategory,
    };
  });
}

function getBarWidth(rangeKey) {
  if (rangeKey === "7D") {
    return 95;
  }

  if (rangeKey === "14D") {
    return 54;
  }

  return 22;
}

function DailyCountBar(props) {
  const { cx, cy, payload, rangeKey, setHoveredBarSection } = props;

  if (!payload || payload.count === 0) {
    return null;
  }

  const barWidth = getBarWidth(rangeKey);
  const totalBarHeight = Math.max(CHART_BASELINE_Y - cy, 2);
  const unitHeight = totalBarHeight / payload.count;

  let stackedCount = 0;

  return (
    <g onMouseLeave={() => setHoveredBarSection(null)}>
      {[...categories].reverse().map((category) => {
        const categoryCount = payload.categoryCounts[category];

        if (!categoryCount) {
          return null;
        }

        const sectionHeight = unitHeight * categoryCount;
        const yPosition =
          CHART_BASELINE_Y - unitHeight * (stackedCount + categoryCount);

        stackedCount += categoryCount;

        return (
          <rect
            key={`${payload.id}-${category}`}
            x={cx - barWidth / 2}
            y={yPosition}
            width={barWidth}
            height={sectionHeight}
            rx={4}
            ry={4}
            fill={categoryColors[category]}
            opacity={0.9}
            onMouseEnter={() =>
              setHoveredBarSection({
                date: payload.date,
                category,
              })
            }
          />
        );
      })}
    </g>
  );
}

function RepeatedSymptomIcon({ color, number, isHidden, isHovered }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle
        cx="14"
        cy="14"
        r={isHovered ? "12" : "11"}
        fill={color}
        stroke="#ffffff"
        strokeWidth="2"
        opacity={isHidden ? "0.25" : "0.9"}
      />

      <text
        x="14"
        y="14"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight={isHovered ? "900" : "800"}
        fill="#111827"
        opacity={isHidden ? "0.35" : "1"}
      >
        {number}
      </text>
    </svg>
  );
}

function getStarPoints(cx, cy, outerRadius, innerRadius) {
  const points = [];

  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;

    points.push(
      `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`
    );
  }

  return points.join(" ");
}

function CustomPoint(props) {
  const {
    cx,
    cy,
    payload,
    detailedView,
    repeatedTypeNumbers,
    hoveredRepeatedType,
    setHoveredRepeatedType,
    hoveredBreakdownTarget,
  } = props;

  if (!payload) {
    return null;
  }

  if (!detailedView) {
    return null;
  }

  const fill = categoryColors[payload.category] || "#6b7280";
  const size = getDurationSize(payload.durationMinutes);
  const radius = Math.sqrt(size / Math.PI);
  const repeatedNumber = repeatedTypeNumbers[payload.type];
  const isMlPattern = mlPatternSymptoms.includes(payload.type);
  const isRepeatedSymptom = Boolean(repeatedNumber);

  const matchesRepeatedHover = hoveredRepeatedType === payload.type;

  const matchesBreakdownHover =
    hoveredBreakdownTarget?.type === "category"
      ? hoveredBreakdownTarget.value === payload.category
      : hoveredBreakdownTarget?.type === "event"
      ? hoveredBreakdownTarget.value === payload.type
      : false;

  const somethingIsHovered =
    Boolean(hoveredRepeatedType) || Boolean(hoveredBreakdownTarget);

  const isHighlighted = matchesRepeatedHover || matchesBreakdownHover;

  const pointOpacity = somethingIsHovered && !isHighlighted ? 0.18 : 0.95;
  const pointScale = isHighlighted ? 1.2 : 1;

  return (
    <g
      onMouseEnter={() => {
        if (isRepeatedSymptom) {
          setHoveredRepeatedType(payload.type);
        }
      }}
      onMouseLeave={() => {
        if (isRepeatedSymptom) {
          setHoveredRepeatedType(null);
        }
      }}
      style={{ cursor: isRepeatedSymptom ? "pointer" : "default" }}
    >
      {isMlPattern ? (
        <polygon
          points={getStarPoints(
            cx,
            cy,
            radius * 1.25 * pointScale,
            radius * 0.55 * pointScale
          )}
          fill={fill}
          stroke="#ffffff"
          strokeWidth={2}
          opacity={pointOpacity}
        />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={radius * pointScale}
          fill={fill}
          stroke="#ffffff"
          strokeWidth={2}
          opacity={pointOpacity}
        />
      )}

      {repeatedNumber && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={Math.max(11, radius * 0.9)}
          fontWeight={isHighlighted ? "900" : "800"}
          fill="#111827"
          pointerEvents="none"
          opacity={pointOpacity}
        >
          {repeatedNumber}
        </text>
      )}
    </g>
  );
}

function CustomTooltip({
  active,
  payload,
  detailedView,
  repeatedTypeNumbers,
  hoveredBarSection,
}) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const event = payload[0].payload;

  if (!detailedView) {
    const hoveredCategory =
      hoveredBarSection?.date === event.date
        ? hoveredBarSection.category
        : null;

    const categoryEvents = hoveredCategory
      ? event.eventsByCategory[hoveredCategory] || []
      : [];

    if (hoveredCategory && categoryEvents.length > 0) {
      return (
        <div className="max-w-xs rounded-lg border bg-white p-3 text-sm shadow">
          <div className="space-y-2">
            {categoryEvents.map((item) => (
              <div
                key={item.id}
                className="border-t border-gray-100 pt-2 first:border-t-0 first:pt-0"
              >
                <p className="font-semibold text-gray-900">{item.type}</p>
                <p className="text-gray-700">Severity: {item.severity}/10</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  }

  const repeatedNumber = repeatedTypeNumbers[event.type];
  const isMlPattern = mlPatternSymptoms.includes(event.type);

  return (
    <div className="rounded-lg border bg-white p-3 text-sm shadow">
      <p className="font-bold text-gray-900">{event.type}</p>
      <p className="mt-1 text-gray-700">Category: {event.category}</p>
      <p className="text-gray-700">Date: {formatDateTime(event.x)}</p>
      <p className="text-gray-700">Severity: {event.severity}/10</p>
      <p className="text-gray-700">Group: {event.eventGroup}</p>
      <p className="text-gray-700">
        Duration: {event.durationMinutes} minutes
      </p>

      {isMlPattern && (
        <p className="mt-1 font-semibold text-blue-700">
          ML pattern detected
        </p>
      )}

      {repeatedNumber && (
        <p className="text-gray-700">
          Repeated symptom marker: {repeatedNumber}
        </p>
      )}

      {event.notes && <p className="mt-2 text-gray-500">{event.notes}</p>}
    </div>
  );
}

function BreakdownPanel({
  breakdownData,
  focusedCategory,
  selectedCategories,
  onCategoryClick,
  onShowAll,
  hoveredBreakdownTarget,
  setHoveredBreakdownTarget,
}) {
  const maxCount = Math.max(...breakdownData.map((item) => item.count), 1);
  const totalEvents = breakdownData.reduce((sum, item) => sum + item.count, 0);

  const getBreakdownColor = (itemName) => {
    if (focusedCategory) {
      return categoryColors[focusedCategory] || "#2563eb";
    }

    return categoryColors[itemName] || "#2563eb";
  };

  const getHeaderText = () => {
    if (focusedCategory) {
      return focusedCategory;
    }

    if (selectedCategories.length === categories.length) {
      return "";
    }

    if (selectedCategories.length === 0) {
      return "None";
    }

    return `${selectedCategories.length} selected`;
  };

  const getTargetForItem = (itemName) => {
    if (focusedCategory) {
      return {
        type: "event",
        value: itemName,
      };
    }

    return {
      type: "category",
      value: itemName,
    };
  };

  const isItemHovered = (itemName) => {
    const target = getTargetForItem(itemName);

    return (
      hoveredBreakdownTarget?.type === target.type &&
      hoveredBreakdownTarget?.value === target.value
    );
  };

  return (
    <div className="ml-4 w-80 shrink-0 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
      <div className="mb-2 flex items-start justify-between">
        <div>
            <p className="font-bold text-gray-900">Breakdown</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">
            Total: {totalEvents} events
            </p>
        </div>

        <div className="min-h-[24px] text-right text-sm font-semibold text-gray-600">
            {getHeaderText()}
        </div>
        </div>

      <div className="relative flex justify-center">
        <PieChart width={210} height={170}>
          <Pie
            data={breakdownData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={75}
            paddingAngle={2}
            stroke="#ffffff"
            strokeWidth={2}
            onClick={(data) => {
              if (!focusedCategory && data?.name) {
                onCategoryClick(data.name);
              }
            }}
            onMouseEnter={(data) => {
              if (data?.name) {
                setHoveredBreakdownTarget(getTargetForItem(data.name));
              }
            }}
            onMouseLeave={() => setHoveredBreakdownTarget(null)}
            cursor={!focusedCategory ? "pointer" : "default"}
          >
            {breakdownData.map((item) => {
              const itemHovered = isItemHovered(item.name);
              const anotherItemHovered =
                hoveredBreakdownTarget && !itemHovered;

              return (
                <Cell
                  key={item.name}
                  fill={getBreakdownColor(item.name)}
                  opacity={anotherItemHovered ? 0.25 : 1}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              );
            })}
          </Pie>
        </PieChart>

        {focusedCategory && (
          <button
            onClick={onShowAll}
            className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl font-bold text-gray-700 shadow hover:bg-gray-100"
            title="Back to all categories"
          >
            ↺
          </button>
        )}
      </div>

      <div className="mt-2 space-y-3">
        {breakdownData.map((item) => {
          const widthPercent = Math.max((item.count / maxCount) * 100, 6);
          const itemColor = getBreakdownColor(item.name);
          const itemHovered = isItemHovered(item.name);
          const anotherItemHovered = hoveredBreakdownTarget && !itemHovered;

          return (
            <div
              key={item.name}
              className={
                itemHovered
                  ? "rounded-lg bg-white p-1"
                  : !focusedCategory
                  ? "cursor-pointer rounded-lg p-1 hover:bg-white"
                  : "rounded-lg p-1 hover:bg-white"
              }
              style={{
                opacity: anotherItemHovered ? 0.35 : 1,
              }}
              onClick={() => {
                if (!focusedCategory) {
                  onCategoryClick(item.name);
                }
              }}
              onMouseEnter={() =>
                setHoveredBreakdownTarget(getTargetForItem(item.name))
              }
              onMouseLeave={() => setHoveredBreakdownTarget(null)}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span
                  className={
                    itemHovered
                      ? "whitespace-nowrap font-bold text-gray-900"
                      : "whitespace-nowrap text-gray-700"
                  }
                >
                  {item.name}
                </span>
                <span
                  className={
                    itemHovered ? "font-bold text-gray-900" : "text-gray-500"
                  }
                >
                  {item.count}
                </span>
              </div>

              <div className="h-1.5 rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: itemColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HealthTimeline() {
  const [rangeKey, setRangeKey] = useState("30D");
  const [selectedCategories, setSelectedCategories] = useState(categories);
  const [detailedView, setDetailedView] = useState(false);
  const [hiddenRepeatedTypes, setHiddenRepeatedTypes] = useState([]);
  const [hoveredBarSection, setHoveredBarSection] = useState(null);
  const [hoveredRepeatedType, setHoveredRepeatedType] = useState(null);
  const [hoveredBreakdownTarget, setHoveredBreakdownTarget] = useState(null);

  const endTime = useMemo(() => getTodayRangeEndTime(), []);
  const startTime = endTime - ranges[rangeKey];

  const focusedCategory =
    selectedCategories.length === 1 ? selectedCategories[0] : null;

  const allRangeData = useMemo(() => {
    return testGroupedHealthEvents
      .map((event) => ({
        ...event,
        x: parseEventDateTime(event),
        y: event.severity,
        z: detailedView ? getDurationSize(event.durationMinutes) : 150,
      }))
      .filter((event) => event.x >= startTime && event.x < endTime);
  }, [startTime, endTime, detailedView]);

  const baseChartData = useMemo(() => {
    return allRangeData.filter((event) =>
      selectedCategories.includes(event.category)
    );
  }, [allRangeData, selectedCategories]);

  const repeatedTypeNumbers = useMemo(() => {
    const typeCounts = {};
    const typeFirstSeen = {};
    const typeCategory = {};

    baseChartData.forEach((event) => {
      typeCounts[event.type] = (typeCounts[event.type] || 0) + 1;
      typeCategory[event.type] = event.category;

      if (typeFirstSeen[event.type] === undefined) {
        typeFirstSeen[event.type] = event.x;
      }
    });

    const repeatedTypes = Object.keys(typeCounts)
      .filter((type) => typeCounts[type] > 1)
      .sort((a, b) => {
        const categoryDifference =
          categories.indexOf(typeCategory[a]) -
          categories.indexOf(typeCategory[b]);

        if (categoryDifference !== 0) {
          return categoryDifference;
        }

        return typeFirstSeen[a] - typeFirstSeen[b];
      });

    return repeatedTypes.reduce((numbers, type, index) => {
      numbers[type] = index + 2;

      return numbers;
    }, {});
  }, [baseChartData]);

  const chartData = useMemo(() => {
    if (!detailedView) {
      return baseChartData;
    }

    return baseChartData.filter((event) => {
      return !hiddenRepeatedTypes.includes(event.type);
    });
  }, [baseChartData, detailedView, hiddenRepeatedTypes]);

  const dailyCountData = useMemo(() => {
    return getDailyCountData(baseChartData, startTime, endTime);
  }, [baseChartData, startTime, endTime]);

  const maxDailyCount = useMemo(() => {
    if (dailyCountData.length === 0) {
      return 5;
    }

    return Math.max(5, ...dailyCountData.map((item) => item.count));
  }, [dailyCountData]);

  const standardTicks = useMemo(() => {
    return Array.from({ length: maxDailyCount + 1 }, (_, index) => index);
  }, [maxDailyCount]);

  const repeatedLegendItems = useMemo(() => {
    return Object.keys(repeatedTypeNumbers)
      .map((type) => {
        const matchingEvents = baseChartData.filter(
          (event) => event.type === type
        );
        const matchingEvent = matchingEvents[0];

        return {
          type,
          category: matchingEvent?.category || "Other",
          color: categoryColors[matchingEvent?.category] || "#6b7280",
          number: repeatedTypeNumbers[type],
          occurrences: matchingEvents.length,
        };
      })
      .sort((a, b) => a.number - b.number);
  }, [baseChartData, repeatedTypeNumbers]);

  const categoryBreakdownData = useMemo(() => {
    return selectedCategories.map((category) => {
      const count = allRangeData.filter(
        (event) => event.category === category
      ).length;

      return {
        name: category,
        count,
      };
    });
  }, [allRangeData, selectedCategories]);

  const symptomBreakdownData = useMemo(() => {
    if (!focusedCategory) {
      return [];
    }

    const symptomCounts = {};

    allRangeData
      .filter((event) => event.category === focusedCategory)
      .forEach((event) => {
        symptomCounts[event.type] = (symptomCounts[event.type] || 0) + 1;
      });

    return Object.keys(symptomCounts)
      .map((symptom) => ({
        name: symptom,
        count: symptomCounts[symptom],
      }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return a.name.localeCompare(b.name);
      });
  }, [allRangeData, focusedCategory]);

  const breakdownData = focusedCategory
    ? symptomBreakdownData
    : categoryBreakdownData;

  const isolateBreakdownCategory = (category) => {
    setSelectedCategories([category]);
    setHiddenRepeatedTypes([]);
    setHoveredRepeatedType(null);
    setHoveredBreakdownTarget(null);
  };

  const showAllBreakdownCategories = () => {
    setSelectedCategories(categories);
    setHiddenRepeatedTypes([]);
    setHoveredRepeatedType(null);
    setHoveredBreakdownTarget(null);
  };

  const toggleCategory = (category) => {
    setHoveredBreakdownTarget(null);

    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((item) => item !== category);
      }

      return [...prev, category];
    });
  };

  const toggleRepeatedType = (type) => {
    setHiddenRepeatedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((item) => item !== type);
      }

      return [...prev, type];
    });
  };

  const selectAllCategories = () => {
    setHoveredBreakdownTarget(null);
    setSelectedCategories(categories);
  };

  const clearAllCategories = () => {
    setHoveredBreakdownTarget(null);
    setSelectedCategories([]);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={selectAllCategories}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            Select All
          </button>

          <button
            onClick={clearAllCategories}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            Clear All
          </button>

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={
                selectedCategories.includes(category)
                  ? "rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow"
                  : "rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-200"
              }
              style={
                selectedCategories.includes(category)
                  ? { backgroundColor: categoryColors[category] }
                  : {}
              }
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.keys(ranges).map((range) => (
            <button
              key={range}
              onClick={() => setRangeKey(range)}
              className={
                rangeKey === range
                  ? "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow"
                  : "rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-gray-100"
              }
            >
              {range}
            </button>
          ))}

          <button
            onClick={() => setDetailedView((prev) => !prev)}
            className={
              detailedView
                ? "rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow"
                : "rounded-lg bg-gray-50 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-gray-100"
            }
          >
            Detailed View
          </button>
        </div>
      </div>

      <p className="mb-3 text-sm text-gray-600">
        {formatDate(startTime)} to {formatDate(endTime - 1)}
      </p>

      <div className="flex items-start overflow-x-auto rounded-2xl bg-white">
        <div className="shrink-0">
          <ScatterChart
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            margin={CHART_MARGIN}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              type="number"
              dataKey="x"
              domain={[startTime, endTime]}
              ticks={getTicks(startTime, endTime, rangeKey)}
              tickFormatter={formatDate}
              name="Date"
              tick={{ fontSize: 12 }}
              allowDataOverflow
            />

            {!detailedView ? (
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, maxDailyCount]}
                ticks={standardTicks}
                name="Number of Events"
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                label={{
                  value: "# of Events",
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                }}
              />
            ) : (
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 10]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                name="Severity"
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                label={{
                  value: "Severity",
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                }}
              />
            )}

            <ZAxis dataKey="z" range={[80, 340]} />

            {detailedView && (
              <ReferenceLine y={5} stroke="#9ca3af" strokeDasharray="4 4" />
            )}

            <Tooltip
              content={(props) => (
                <CustomTooltip
                  {...props}
                  detailedView={detailedView}
                  repeatedTypeNumbers={repeatedTypeNumbers}
                  hoveredBarSection={hoveredBarSection}
                />
              )}
            />

            {!detailedView ? (
              <Scatter
                name="Daily event count"
                data={dailyCountData}
                shape={(props) => (
                  <DailyCountBar
                    {...props}
                    rangeKey={rangeKey}
                    setHoveredBarSection={setHoveredBarSection}
                  />
                )}
                isAnimationActive={false}
              />
            ) : (
              categories.map((category) => (
                <Scatter
                  key={category}
                  name={category}
                  data={chartData.filter(
                    (event) => event.category === category
                  )}
                  shape={(props) => (
                    <CustomPoint
                      {...props}
                      detailedView={detailedView}
                      repeatedTypeNumbers={repeatedTypeNumbers}
                      hoveredRepeatedType={hoveredRepeatedType}
                      setHoveredRepeatedType={setHoveredRepeatedType}
                      hoveredBreakdownTarget={hoveredBreakdownTarget}
                    />
                  )}
                  isAnimationActive={false}
                >
                  {chartData
                    .filter((event) => event.category === category)
                    .map((event) => (
                      <Cell
                        key={event.id}
                        fill={categoryColors[event.category]}
                      />
                    ))}
                </Scatter>
              ))
            )}
          </ScatterChart>

          {detailedView && repeatedLegendItems.length > 0 && (
            <div className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-bold text-gray-900">Repeated Symptoms</p>

              <div className="mt-2 grid grid-cols-5 gap-x-1 gap-y-1">
                {repeatedLegendItems.map((item) => {
                  const isHidden = hiddenRepeatedTypes.includes(item.type);
                  const isHovered =
                    hoveredRepeatedType === item.type ||
                    (hoveredBreakdownTarget?.type === "event" &&
                      hoveredBreakdownTarget?.value === item.type);

                  const anotherItemHovered =
                    (hoveredRepeatedType ||
                      hoveredBreakdownTarget?.type === "event") &&
                    !isHovered;

                  return (
                    <button
                      key={item.type}
                      onClick={() => toggleRepeatedType(item.type)}
                      onMouseEnter={() => setHoveredRepeatedType(item.type)}
                      onMouseLeave={() => setHoveredRepeatedType(null)}
                      className={
                        isHidden
                          ? "flex w-44 items-center gap-1 rounded-lg px-1 py-1 text-left text-gray-400 hover:bg-gray-100"
                          : isHovered
                          ? "flex w-44 items-center gap-1 rounded-lg bg-white px-1 py-1 text-left font-bold text-gray-900"
                          : "flex w-44 items-center gap-1 rounded-lg px-1 py-1 text-left text-gray-800 hover:bg-gray-100"
                      }
                      style={{
                        opacity: anotherItemHovered ? 0.35 : 1,
                      }}
                    >
                      <RepeatedSymptomIcon
                        color={item.color}
                        number={item.number}
                        isHidden={isHidden}
                        isHovered={isHovered}
                      />

                      <span className="whitespace-nowrap text-sm">
                        - {item.type} ({item.occurrences})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <BreakdownPanel
          breakdownData={breakdownData}
          focusedCategory={focusedCategory}
          selectedCategories={selectedCategories}
          onCategoryClick={isolateBreakdownCategory}
          onShowAll={showAllBreakdownCategories}
          hoveredBreakdownTarget={hoveredBreakdownTarget}
          setHoveredBreakdownTarget={setHoveredBreakdownTarget}
        />
      </div>
    </div>
  );
}

export default HealthTimeline;