import { useState } from "react";
import {
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

const DAY = 24 * 60 * 60 * 1000;

const allHealthEvents = [
  { type: "Blood Pressure", date: "2026-05-01", value: 170 },
  { type: "Blood Pressure", date: "2026-05-03", value: 220 },
  { type: "Blood Pressure", date: "2026-05-06", value: 140 },

  { type: "Medication", date: "2026-05-02", value: 160 },
  { type: "Medication", date: "2026-05-05", value: 260 },
  { type: "Medication", date: "2026-05-08", value: 120 },

  { type: "Doctor Visit", date: "2026-05-01", value: 100 },
  { type: "Doctor Visit", date: "2026-05-04", value: 180 },
  { type: "Doctor Visit", date: "2026-05-09", value: 240 },

  { type: "Lab Result", date: "2026-05-03", value: 190 },
  { type: "Lab Result", date: "2026-05-07", value: 130 },
  { type: "Lab Result", date: "2026-05-11", value: 310 },

  { type: "Vaccination", date: "2026-05-04", value: 150 },
  { type: "Vaccination", date: "2026-05-12", value: 220 },
];

const eventTypes = [...new Set(allHealthEvents.map((event) => event.type))];

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="rounded-lg border bg-white p-3 shadow">
        <p className="font-semibold">{data.type}</p>
        <p>Date: {formatDate(data.x)}</p>
        <p>Value: {data.value}</p>
      </div>
    );
  }

  return null;
}

function App() {
  const [selectedTypes, setSelectedTypes] = useState(eventTypes);

  const [startDate, setStartDate] = useState(
    new Date("2026-05-01").getTime()
  );

  const [endDate, setEndDate] = useState(
    new Date("2026-05-08").getTime()
  );

  const [dragStartX, setDragStartX] = useState(null);

  const visibleRange = endDate - startDate;

  const visibleHealthEvents = eventTypes.filter((type) =>
    selectedTypes.includes(type)
  );

  const chartData = allHealthEvents
    .filter((event) => selectedTypes.includes(event.type))
    .map((event) => ({
      x: new Date(event.date).getTime(),
      y: visibleHealthEvents.indexOf(event.type) + 1,
      value: event.value,
      type: event.type,
      date: event.date,
    }));

  const allValues = chartData.map((entry) => entry.value);

  const domain = [0, Math.max(...allValues, 1)];

  const range = [80, 600];

  function toggleHealthEvent(type) {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((item) => item !== type);
      }

      return [...prev, type];
    });
  }

  function selectAllEvents() {
    setSelectedTypes(eventTypes);
  }

  function clearAllEvents() {
    setSelectedTypes([]);
  }

  function handleWheel(event) {
    event.preventDefault();

    const zoomAmount = event.deltaY > 0 ? 1.2 : 0.8;

    const center = (startDate + endDate) / 2;

    const newRange = visibleRange * zoomAmount;

    const minRange = DAY * 2;
    const maxRange = DAY * 31;

    if (newRange < minRange || newRange > maxRange) return;

    setStartDate(center - newRange / 2);
    setEndDate(center + newRange / 2);
  }

  function handleMouseDown(event) {
    setDragStartX(event.clientX);
  }

  function handleMouseMove(event) {
    if (dragStartX === null) return;

    const dragDistance = event.clientX - dragStartX;

    const chartWidth = 900;

    const timeShift = (dragDistance / chartWidth) * visibleRange;

    setStartDate((prev) => prev - timeShift);
    setEndDate((prev) => prev - timeShift);

    setDragStartX(event.clientX);
  }

  function handleMouseUp() {
    setDragStartX(null);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="mb-2 text-4xl font-bold">
        Health Event Timeline
      </h1>

      <p className="mb-6 text-gray-600">
        Select one or more health event types. Scroll to zoom.
        Click and drag to move through time.
      </p>

      <div className="mb-6 w-fit rounded-xl bg-white p-4 shadow">
        <p className="mb-3 font-semibold">
          Health Events:
        </p>

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

        <div className="flex flex-col gap-2">
          {eventTypes.map((type) => (
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
      </div>

      <div
        className="w-fit cursor-grab overflow-x-auto rounded-2xl bg-white p-6 shadow-lg active:cursor-grabbing select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragStart={(e) => e.preventDefault()}
      >
        <ScatterChart
          width={900}
          height={420}
          margin={{
            top: 20,
            right: 30,
            bottom: 40,
            left: 120,
          }}
        >
          <XAxis
            type="number"
            dataKey="x"
            domain={[startDate, endDate]}
            tickFormatter={formatDate}
            name="Date"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            type="number"
            dataKey="y"
            domain={[
              0.5,
              visibleHealthEvents.length > 0
                ? visibleHealthEvents.length + 0.5
                : 1,
            ]}
            ticks={visibleHealthEvents.map(
              (_, index) => index + 1
            )}
            tickFormatter={(value) =>
              visibleHealthEvents[value - 1] || ""
            }
            name="Health Event"
            width={110}
          />

          <ZAxis
            type="number"
            dataKey="value"
            domain={domain}
            range={range}
          />

          <Tooltip content={<CustomTooltip />} />

          <Scatter
            data={chartData}
            fill="#8884d8"
          />
        </ScatterChart>
      </div>
    </div>
  );
}

export default App;