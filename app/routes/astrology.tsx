import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { DateTime } from "luxon";
import { commonTimezones } from "../lib/timezones";
import { useEncryption } from "../lib/EncryptionContext";

// --- TypeScript Types ---
interface ChatMessage {
  messageId: number;
  conversationId?: number;
  userMessage?: string;
  assistantResponse?: string;
  userMessageEncrypted?: string;
  assistantResponseEncrypted?: string;
  encryptionIVUser?: string;
  encryptionIVAssistant?: string;
  isEncrypted?: boolean;
  eventIdsUsed: number[];
  createdAt: string;
}

interface ChatSession {
  conversationId: number;
  title: string;
  createdAt: string;
  lastMessageAt: string | null;
  messageCount: number;
}

// --- Helper & Icon Components ---
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
  </div>
);

const HamburgerIcon = () => (
  <svg
    className="w-8 h-8 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16m-7 6h7"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
);

const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path
      fillRule="evenodd"
      d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
      clipRule="evenodd"
    />
  </svg>
);

// --- Chart Viewer Helper Functions ---

const getPlanetSymbol = (name: string): string => {
  const symbols: Record<string, string> = {
    Sun: "☉",
    Moon: "☽",
    Mercury: "☿",
    Venus: "♀",
    Mars: "♂",
    Jupiter: "♃",
    Saturn: "♄",
    Uranus: "♅",
    Neptune: "♆",
    Pluto: "♇",
    "North Node": "☊",
    "South Node": "☋",
    Chiron: "⚷",
  };
  return symbols[name] || name;
};

const getPlanetColor = (name: string): string => {
  const colors: Record<string, string> = {
    Sun: "#fbbf24",
    Moon: "#cbd5e1",
    Mercury: "#a3e635",
    Venus: "#86efac",
    Mars: "#ef4444",
    Jupiter: "#fb923c",
    Saturn: "#a78bfa",
    Uranus: "#60a5fa",
    Neptune: "#818cf8",
    Pluto: "#e879f9",
  };
  return colors[name] || "#ffffff";
};

const longitudeToAngle = (longitude: number): number => {
  // Astrological charts start at Aries (0°) at the left (180° in SVG).
  // Zodiac longitude increases in chart wheel order from the Ascendant side.
  return 180 + longitude;
};

const getPointOnCircle = (
  angle: number,
  radius: number,
  centerX: number,
  centerY: number
) => {
  const radians = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY - radius * Math.sin(radians),
  };
};

// --- Navigation ---

const TabNav = ({ activeTab, onChange }: { activeTab: 'chat' | 'chart', onChange: (tab: 'chat' | 'chart') => void }) => (
  <div className="flex items-center justify-center gap-2 p-4 border-b border-gray-700">
    <button
      onClick={() => onChange('chat')}
      className={`px-6 py-2 rounded-lg transition font-medium ${
        activeTab === 'chat'
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      Astrology Chat
    </button>
    <button
      onClick={() => onChange('chart')}
      className={`px-6 py-2 rounded-lg transition font-medium ${
        activeTab === 'chart'
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      Slidable Ephemeris History Charts
    </button>
  </div>
);

const HamburgerMenu = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Open menu"
      >
        <HamburgerIcon />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-10 border border-gray-700">
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500 hover:text-white transition-colors duration-200"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

const Header = () => (
  <header className="p-6 bg-gray-900 text-white rounded-t-xl shadow-lg">
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-wider">
        Pythia
      </h1>
      <p className="text-indigo-300 mt-3 text-lg">
        Select a saved chart or add a new one to begin.
      </p>
    </div>
  </header>
);

// --- Chart Viewer Components ---

const ZodiacRing = ({
  centerX,
  centerY,
  radius,
}: {
  centerX: number;
  centerY: number;
  radius: number;
}) => {
  const zodiacSigns = [
    { name: "Aries", symbol: "♈", color: "#ef4444" },
    { name: "Taurus", symbol: "♉", color: "#10b981" },
    { name: "Gemini", symbol: "♊", color: "#f59e0b" },
    { name: "Cancer", symbol: "♋", color: "#8b5cf6" },
    { name: "Leo", symbol: "♌", color: "#f59e0b" },
    { name: "Virgo", symbol: "♍", color: "#10b981" },
    { name: "Libra", symbol: "♎", color: "#ef4444" },
    { name: "Scorpio", symbol: "♏", color: "#8b5cf6" },
    { name: "Sagittarius", symbol: "♐", color: "#f59e0b" },
    { name: "Capricorn", symbol: "♑", color: "#10b981" },
    { name: "Aquarius", symbol: "♒", color: "#ef4444" },
    { name: "Pisces", symbol: "♓", color: "#8b5cf6" },
  ];

  return (
    <g>
      {zodiacSigns.map((sign, index) => {
        const startAngle = 180 + index * 30;
        const endAngle = startAngle + 30;
        const midAngle = startAngle + 15;

        const startPoint = getPointOnCircle(startAngle, radius, centerX, centerY);
        const endPoint = getPointOnCircle(endAngle, radius, centerX, centerY);
        const largeArc = 0;

        return (
          <g key={sign.name}>
            <path
              d={`M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 0 ${endPoint.x} ${endPoint.y}`}
              fill="none"
              stroke="#4b5563"
              strokeWidth="2"
            />
            <text
              x={getPointOnCircle(midAngle, radius + 20, centerX, centerY).x}
              y={getPointOnCircle(midAngle, radius + 20, centerX, centerY).y}
              fontSize="24"
              fill={sign.color}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {sign.symbol}
            </text>
          </g>
        );
      })}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="none"
        stroke="#4b5563"
        strokeWidth="3"
      />
    </g>
  );
};

const HousesRing = ({
  centerX,
  centerY,
  radius,
  houseCusps,
}: {
  centerX: number;
  centerY: number;
  radius: number;
  houseCusps: number[];
}) => {
  if (!houseCusps || houseCusps.length !== 12) return null;

  return (
    <g>
      {houseCusps.map((cusp, index) => {
        const angle = longitudeToAngle(cusp);
        const point = getPointOnCircle(angle, radius, centerX, centerY);
        const innerPoint = getPointOnCircle(angle, radius - 50, centerX, centerY);

        return (
          <g key={index}>
            <line
              x1={innerPoint.x}
              y1={innerPoint.y}
              x2={point.x}
              y2={point.y}
              stroke="#6b7280"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <text
              x={getPointOnCircle(angle, radius - 25, centerX, centerY).x}
              y={getPointOnCircle(angle, radius - 25, centerX, centerY).y}
              fontSize="10"
              fill="#9ca3af"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {index + 1}
            </text>
          </g>
        );
      })}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius - 50}
        fill="none"
        stroke="#4b5563"
        strokeWidth="2"
      />
    </g>
  );
};

const ChartWheel = ({
  chartData,
  isLoading,
}: {
  chartData: any;
  isLoading: boolean;
}) => {
  if (isLoading) return <LoadingSpinner />;
  if (!chartData) {
    return (
      <div className="text-center text-gray-500 italic p-8">
        No chart data available. Please wait while we calculate the chart.
      </div>
    );
  }

  const radius = 300;
  const centerX = 350;
  const centerY = 350;

  return (
    <div className="w-full flex justify-center">
      <svg
        width="700"
        height="700"
        viewBox="0 0 700 700"
        className="bg-gray-900 rounded-lg"
      >
        <ZodiacRing centerX={centerX} centerY={centerY} radius={radius} />

        {chartData.houses && chartData.houses.cusps && (
          <HousesRing
            centerX={centerX}
            centerY={centerY}
            radius={radius - 50}
            houseCusps={chartData.houses.cusps}
          />
        )}

        <circle
          cx={centerX}
          cy={centerY}
          r={radius - 100}
          fill="#1f2937"
          stroke="#4b5563"
          strokeWidth="2"
        />

        {chartData.positions &&
          Object.entries(chartData.positions).map(([name, data]: [string, any]) => {
            const angle = longitudeToAngle(data.longitude);
            const point = getPointOnCircle(angle, radius - 75, centerX, centerY);

            return (
              <g key={name}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="10"
                  fill={getPlanetColor(name)}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <text
                  x={point.x}
                  y={point.y + 30}
                  fontSize="20"
                  fill="#ffffff"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {getPlanetSymbol(name)}
                </text>
              </g>
            );
          })}

        {chartData.houses && chartData.houses.ascendant && (
          <line
            x1={centerX}
            y1={centerY}
            x2={
              getPointOnCircle(
                longitudeToAngle(chartData.houses.ascendant),
                radius,
                centerX,
                centerY
              ).x
            }
            y2={
              getPointOnCircle(
                longitudeToAngle(chartData.houses.ascendant),
                radius,
                centerX,
                centerY
              ).y
            }
            stroke="#60a5fa"
            strokeWidth="3"
            strokeDasharray="5,5"
          />
        )}
      </svg>
    </div>
  );
};

const DateSlider = ({
  dayOffset,
  onChange,
}: {
  dayOffset: number;
  onChange: (dayOffset: number) => void;
}) => {
  const min = -30;
  const max = 30;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-lg font-medium text-gray-200">
          Day Offset: {dayOffset > 0 ? `+${dayOffset}` : dayOffset} day{Math.abs(dayOffset) === 1 ? "" : "s"} from today
        </label>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={dayOffset}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />

      <div className="flex justify-between text-xs text-gray-500">
        <span>-30 days</span>
        <span>Today</span>
        <span>+30 days</span>
      </div>
    </div>
  );
};

const DateInput = ({
  date,
  onChange,
}: {
  date: DateTime;
  onChange: (date: DateTime) => void;
}) => {
  const [yearAbs, setYearAbs] = useState(Math.abs(date.year));
  const [era, setEra] = useState<'AD' | 'BC'>(date.year < 0 ? 'BC' : 'AD');
  const [month, setMonth] = useState(date.month);
  const [day, setDay] = useState(date.day);
  const [hour, setHour] = useState(date.hour);
  const [minute, setMinute] = useState(date.minute);

  const handleDateChange = () => {
    try {
      // Convert BC/AD to actual year value (BC is negative)
      const actualYear = era === 'BC' ? -yearAbs : yearAbs;
      const newDate = DateTime.fromObject({ year: actualYear, month, day, hour, minute });
      if (newDate.isValid) {
        onChange(newDate);
      }
    } catch (err) {
      console.error("Invalid date:", err);
    }
  };

  useEffect(() => {
    setYearAbs(Math.abs(date.year));
    setEra(date.year < 0 ? 'BC' : 'AD');
    setMonth(date.month);
    setDay(date.day);
    setHour(date.hour);
    setMinute(date.minute);
  }, [date]);

  return (
    <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
      <label className="block text-lg font-medium text-gray-200 mb-3">
        Manual Date Entry
      </label>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <input
          type="number"
          placeholder="Year"
          value={yearAbs}
          onChange={(e) => setYearAbs(parseInt(e.target.value) || 1)}
          onBlur={handleDateChange}
          min={1}
          max={17000}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
        <select
          value={era}
          onChange={(e) => {
            setEra(e.target.value as 'AD' | 'BC');
            setTimeout(handleDateChange, 0);
          }}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        >
          <option value="AD">AD</option>
          <option value="BC">BC</option>
        </select>
        <input
          type="number"
          placeholder="Month"
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value) || 1)}
          onBlur={handleDateChange}
          min={1}
          max={12}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
        <input
          type="number"
          placeholder="Day"
          value={day}
          onChange={(e) => setDay(parseInt(e.target.value) || 1)}
          onBlur={handleDateChange}
          min={1}
          max={31}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
        <input
          type="number"
          placeholder="Hour"
          value={hour}
          onChange={(e) => setHour(parseInt(e.target.value) || 0)}
          onBlur={handleDateChange}
          min={0}
          max={23}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
        <input
          type="number"
          placeholder="Minute"
          value={minute}
          onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
          onBlur={handleDateChange}
          min={0}
          max={59}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
      </div>

      <p className="mt-2 text-sm text-gray-400">
        Date range: 1300 BC to 17000 AD (Swiss Ephemeris)
      </p>
    </div>
  );
};

const LocationInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [inputValue, setInputValue] = useState(value);

  const handleBlur = () => {
    onChange(inputValue);
  };

  return (
    <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
      <label className="block text-lg font-medium text-gray-200 mb-3">
        Location
      </label>

      <input
        type="text"
        placeholder="e.g., Paris, France or New York, USA"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyPress={(e) => e.key === "Enter" && handleBlur()}
        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
      />

      <p className="mt-2 text-sm text-gray-400">
        Location affects house placements and local time calculations
      </p>
    </div>
  );
};

const ChartViewerTab = ({
  userId,
  getFreshToken,
}: {
  userId: string | null;
  getFreshToken: () => Promise<string | null>;
}) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<DateTime>(DateTime.now());
  const [location, setLocation] = useState<string>("Greenwich, UK");
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const baseDate = React.useMemo(() => DateTime.now(), []);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Update date when slider offset changes
  const handleDayOffsetChange = (dayOffset: number) => {
    const clampedOffset = Math.max(-30, Math.min(30, dayOffset));
    setSelectedDayOffset(clampedOffset);
    setCurrentDate((prev) =>
      baseDate
        .plus({ days: clampedOffset })
        .set({ hour: prev.hour, minute: prev.minute })
    );
  };

  // Keep slider synced if date is changed manually.
  useEffect(() => {
    const dayDiff = Math.round(
      currentDate.startOf("day").diff(baseDate.startOf("day"), "days").days
    );
    const clampedDayDiff = Math.max(-30, Math.min(30, dayDiff));
    if (clampedDayDiff !== selectedDayOffset) {
      setSelectedDayOffset(clampedDayDiff);
    }
  }, [currentDate, baseDate, selectedDayOffset]);

  useEffect(() => {
    if (!userId) return;

    const timer = setTimeout(() => {
      fetchChartData();
    }, 300);

    return () => clearTimeout(timer);
  }, [currentDate, location, userId]);

  const fetchChartData = async () => {
    setIsLoading(true);
    setError(null);

    const token = await getFreshToken();
    if (!token) return;

    const baseApiUrl = import.meta.env.VITE_API_URI;

    try {
      const res = await fetch(`${baseApiUrl}/ephemeris`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          userId,
          year: currentDate.year,
          month: currentDate.month,
          day: currentDate.day,
          time: `${String(currentDate.hour).padStart(2, "0")}:${String(currentDate.minute).padStart(2, "0")}`,
          location: location,
          houseSystem: "P",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch chart data");

      setChartData(data);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch chart data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center border-b border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-white">
          {currentDate.toFormat("MMMM d, yyyy - HH:mm")}
        </h2>
        <p className="text-indigo-300 mt-1">{location}</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      <ChartWheel chartData={chartData} isLoading={isLoading} />

      <DateSlider
        dayOffset={selectedDayOffset}
        onChange={handleDayOffsetChange}
      />

      <DateInput date={currentDate} onChange={setCurrentDate} />

      <LocationInput value={location} onChange={setLocation} />
    </div>
  );
};

// --- Form Components ---

const AddEventForm = ({
  onSave,
  onUpdate,
  editingEvent,
  setEditingEvent,
  isLoading,
  saveMessage,
}: any) => {
  const [formData, setFormData] = useState({
    label: "",
    year: "",
    month: "",
    day: "",
    hour: "",
    minute: "",
    ampm: "AM",
    location: "",
    houseSystem: "P",
  });
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);

  // When editingEvent changes, populate the form
  useEffect(() => {
    if (editingEvent) {
      const eventInputs = editingEvent.event_data.meta.inputs;
      const timeParts = eventInputs.time.split(":");
      let hour = parseInt(timeParts[0], 10);
      let ampm = "AM";
      if (hour >= 12) {
        ampm = "PM";
        if (hour > 12) hour -= 12;
      }
      if (hour === 0) hour = 12;

      setFormData({
        label: editingEvent.label,
        year: eventInputs.year,
        month: eventInputs.month,
        day: eventInputs.day,
        hour: String(hour),
        minute: timeParts[1],
        ampm: ampm,
        location: eventInputs.location,
        houseSystem: editingEvent.event_data.houses?.system || "P",
      });
      setIsTimeUnknown(eventInputs.time === "12:00");
    } else {
      // Clear form when not editing
      setFormData({
        label: "",
        year: "",
        month: "",
        day: "",
        hour: "",
        minute: "",
        ampm: "AM",
        location: "",
        houseSystem: "P",
      });
      setIsTimeUnknown(false);
    }
  }, [editingEvent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveOrUpdate = async () => {
    let finalHour = parseInt(formData.hour, 10);
    if (formData.ampm === "PM" && finalHour < 12) finalHour += 12;
    if (formData.ampm === "AM" && finalHour === 12) finalHour = 0;

    const eventPayload = {
      label: formData.label,
      year: parseInt(formData.year),
      month: parseInt(formData.month),
      day: parseInt(formData.day),
      time: isTimeUnknown
        ? "12:00"
        : `${String(finalHour).padStart(2, "0")}:${String(formData.minute).padStart(2, "0")}`,
      location: formData.location,
      houseSystem: formData.houseSystem,
    };

    let success = false;
    if (editingEvent) {
      success = await onUpdate(editingEvent.event_id, eventPayload);
    } else {
      success = await onSave(eventPayload);
    }

    if (success) {
      setFormData({
        label: "",
        year: "",
        month: "",
        day: "",
        hour: "",
        minute: "",
        ampm: "AM",
        location: "",
        houseSystem: "P",
      });
      setEditingEvent(null);
    }
  };

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
      <h3 className="text-lg font-semibold text-white">
        {editingEvent ? "Edit Event" : "Add New Event"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="label"
          placeholder="Label (e.g., John Smith)"
          value={formData.label}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        />
        <input
          type="text"
          name="location"
          placeholder="Location (e.g., Paris, France)"
          value={formData.location}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        <input
          type="number"
          name="year"
          placeholder="Year"
          value={formData.year}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        />
        <input
          type="number"
          name="month"
          placeholder="Month"
          value={formData.month}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        />
        <input
          type="number"
          name="day"
          placeholder="Day"
          value={formData.day}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        />
        <select
          name="houseSystem"
          value={formData.houseSystem}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        >
          <option value="P">Placidus</option>
          <option value="W">Whole Sign</option>
          <option value="R">Regiomontanus</option>
          <option value="K">Koch</option>
        </select>
      </div>
      {!isTimeUnknown && (
        <div className="grid grid-cols-3 gap-4">
          <input
            type="number"
            name="hour"
            placeholder="Hour"
            value={formData.hour}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
          />
          <input
            type="number"
            name="minute"
            placeholder="Minute"
            value={formData.minute}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
          />
          <select
            name="ampm"
            value={formData.ampm}
            onChange={handleChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      )}
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={isTimeUnknown}
            onChange={(e) => setIsTimeUnknown(e.target.checked)}
            className="rounded bg-gray-600 border-gray-500 text-indigo-500"
          />
          <span>Time is unknown (uses 12:00 PM)</span>
        </label>
        <div className="flex items-center gap-2">
          {editingEvent && (
            <button
              type="button"
              onClick={() => setEditingEvent(null)}
              className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveOrUpdate}
            disabled={isLoading}
            className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 transition"
          >
            {isLoading
              ? "Saving..."
              : editingEvent
                ? "Update Event"
                : "Save Event"}
          </button>
        </div>
      </div>
      {saveMessage && (
        <div className="text-center text-green-400 bg-green-900/50 p-3 rounded-lg border border-green-500 mt-2">
          {saveMessage}
        </div>
      )}
    </div>
  );
};

const EventList = ({
  events,
  checkedEvents,
  onToggle,
  onEdit,
  onDelete,
  progressedChecks,
  onToggleProgressed,
  progressedTimezones,
  onProgressedTimezoneChange,
}) => (
  <div className="space-y-2">
    <h3 className="text-lg font-semibold text-white">
      Select Events to Include
    </h3>
    {events.length > 0 ? (
      events.map((event) => {
        const isEventChecked = !!checkedEvents[event.event_id];
        const isProgressedChecked = !!progressedChecks[event.event_id];

        return (
          <div
            key={event.event_id}
            className="p-3 bg-gray-700/50 rounded-lg flex flex-col gap-2"
          >
            {/* Main Event Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  id={`event-${event.event_id}`}
                  checked={isEventChecked}
                  onChange={() => onToggle(event.event_id)}
                  className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-indigo-500"
                />
                <label
                  htmlFor={`event-${event.event_id}`}
                  className="text-gray-200 cursor-pointer"
                >
                  {event.label}
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onEdit(event)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => onDelete(event.event_id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {/* ✅ CORRECTED: Progressed options are always visible, but enabled/disabled */}
            <div
              className={`pl-9 pt-2 border-t border-gray-600/50 flex flex-col gap-3 transition-opacity ${!isEventChecked ? "opacity-50" : ""}`}
            >
              {/* Checkbox to enable progressions */}
              <label
                className={`flex items-center space-x-2 text-sm text-gray-400 ${!isEventChecked ? "cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isProgressedChecked}
                  onChange={() => onToggleProgressed(event.event_id)}
                  className="rounded bg-gray-600 border-gray-500 text-indigo-500"
                  disabled={!isEventChecked}
                />
                <span>Include progressed chart</span>
              </label>

              {/* Timezone selector section */}
              <div className="pl-6">
                <label
                  className={`text-xs transition-colors ${!isEventChecked ? "text-gray-600" : "text-gray-500"}`}
                  htmlFor={`tz-select-${event.event_id}`}
                >
                  Uses natal timezone by default. Change here if needed:
                </label>
                <select
                  id={`tz-select-${event.event_id}`}
                  value={progressedTimezones[event.event_id] || ""}
                  onChange={(e) =>
                    onProgressedTimezoneChange(event.event_id, e.target.value)
                  }
                  disabled={!isEventChecked || !isProgressedChecked}
                  className="mt-1 w-full max-w-xs p-1 bg-gray-600 border border-gray-500 rounded-md text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Use Natal Location's Timezone</option>
                  {commonTimezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      })
    ) : (
      <p className="text-gray-500 italic">No saved events.</p>
    )}
  </div>
);

const TransitOptions = ({
  includeTransits,
  setIncludeTransits,
  transitTimestamp,
  setTransitTimestamp,
}) => (
  <div className="p-3 bg-gray-700/50 rounded-lg flex items-center gap-4">
    <label className="flex items-center space-x-2 text-sm text-gray-200">
      <input
        type="checkbox"
        checked={includeTransits}
        onChange={(e) => setIncludeTransits(e.target.checked)}
        className="rounded bg-gray-600 border-gray-500 text-indigo-500"
      />
      <span>Include Transits for</span>
    </label>
    <input
      type="datetime-local"
      value={transitTimestamp}
      onChange={(e) => setTransitTimestamp(e.target.value)}
      disabled={!includeTransits}
      className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm disabled:opacity-50"
    />
  </div>
);

const ManualEntry = ({
  manualChartData,
  setManualChartData,
  isEnabled,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-indigo-400 hover:text-indigo-300"
      >
        {isOpen ? "Close" : "Or, Enter Chart Data Manually"}
      </button>
      {isOpen && (
        <div className="mt-2">
          <textarea
            rows={10}
            value={manualChartData}
            onChange={(e) => setManualChartData(e.target.value)}
            placeholder="Paste your complete birth chart data here..."
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
            disabled={!isEnabled}
          />
        </div>
      )}
    </div>
  );
};

const EventConfigSection = ({
  onSaveEvent,
  onUpdateEvent,
  onDeleteEvent,
  setEditingEvent,
  editingEvent,
  events,
  checkedEvents,
  onToggleEvent,
  isLoading,
  saveMessage,
  progressedChecks,
  onToggleProgressed,
  progressedTimezones,
  onProgressedTimezoneChange,
}: any) => {
  return (
    <div className="p-6 md:p-8 space-y-6 border-b border-gray-700">
      <AddEventForm
        onSave={onSaveEvent}
        onUpdate={onUpdateEvent}
        editingEvent={editingEvent}
        setEditingEvent={setEditingEvent}
        isLoading={isLoading}
        saveMessage={saveMessage}
      />
      <EventList
        events={events}
        checkedEvents={checkedEvents}
        onToggle={onToggleEvent}
        onEdit={setEditingEvent}
        onDelete={onDeleteEvent}
        progressedChecks={progressedChecks}
        onToggleProgressed={onToggleProgressed}
        progressedTimezones={progressedTimezones}
        onProgressedTimezoneChange={onProgressedTimezoneChange}
      />
    </div>
  );
};


const ChatInterface = ({
  messages,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isLoading,
  error,
  onClearSession,
  onSubmit,
  singleResponseMode,
  setSingleResponseMode,
  encryptionEnabled,
  setEncryptionEnabled,
  encryptionStatus,
  onUnlockEncryption,
  response,
  progressedChecks,
  progressedTimezones,
}: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [includeTransits, setIncludeTransits] = useState(true);
  const [transitTimestamp, setTransitTimestamp] = useState(
    DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm")
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, response, isLoading]);

  const isAskDisabled = isLoading || !userQuestion.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    const progressedEventIds = Object.keys(progressedChecks)
      .filter((id) => progressedChecks[id])
      .map(Number);

    const queryPayload = {
      userQuestion,
      progressed: progressedEventIds.length > 0,
      progressedEventIds,
      progressedTimezones,
      transitTimestamp: includeTransits
        ? DateTime.fromISO(transitTimestamp).toISO()
        : null,
    };

    onSubmit(queryPayload);
    setUserQuestion(""); // Clear input after sending
  };

  return (
    <div className="p-6 md:p-8 bg-gray-800/50 flex flex-col" style={{ minHeight: '500px' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
        <h2 className="text-2xl font-semibold text-white">
          {singleResponseMode ? "Response" : "Chat History"}
        </h2>
        <div className="flex items-center gap-2">
          {!singleResponseMode && (
            <>
              <button
                onClick={onNewConversation}
                className="text-sm text-indigo-300 hover:text-indigo-200"
              >
                New Chat
              </button>
              {messages.length > 0 && (
                <button
                  onClick={onClearSession}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Clear Chat
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!singleResponseMode && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={encryptionEnabled}
              onChange={(e) => setEncryptionEnabled(e.target.checked)}
              className="rounded bg-gray-600 border-gray-500 text-indigo-500"
            />
            <span>Encrypt chats</span>
          </label>
          {encryptionEnabled && encryptionStatus !== "unlocked" && (
            <button
              type="button"
              onClick={onUnlockEncryption}
              className="text-sm px-3 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Unlock
            </button>
          )}
        </div>
      )}

      <div className={`${!singleResponseMode ? "grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4" : ""} flex-1 min-h-0`}>
        {!singleResponseMode && (
          <aside className="bg-gray-900/50 border border-gray-700 rounded-lg p-2 overflow-y-auto max-h-[520px]">
            <button
              type="button"
              onClick={onNewConversation}
              className={`w-full text-left px-3 py-2 rounded-md text-sm mb-2 ${
                currentConversationId === null
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-200 hover:bg-gray-700"
              }`}
            >
              New Chat
            </button>
            {conversations.map((session) => (
              <button
                key={session.conversationId}
                type="button"
                onClick={() => onSelectConversation(session.conversationId)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm mb-2 ${
                  currentConversationId === session.conversationId
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-200 hover:bg-gray-700"
                }`}
              >
                {session.title || `Chat ${session.conversationId}`}
              </button>
            ))}
          </aside>
        )}

        <div className="min-h-0 flex flex-col">
      {/* Chat messages / Single response */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4"
        style={{ maxHeight: '400px' }}
      >
        {singleResponseMode ? (
          // Single response mode
          <>
            {!response && !isLoading && (
              <div className="text-center text-gray-500 italic mt-8">
                Enter a question below to see results here.
              </div>
            )}
            {response && (
              <div className="bg-gray-700 text-gray-200 rounded-lg px-4 py-3">
                <div
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: response.replace(/\n/g, '<br />')
                  }}
                />
              </div>
            )}
          </>
        ) : (
          // Chat history mode
          <>
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 italic mt-8">
                No messages yet. Ask a question to start your chat!
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.messageId} className="space-y-2">
                {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 max-w-[80%]">
                    {msg.userMessage || ""}
                    </div>
                  </div>

                {/* Assistant response */}
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-gray-200 rounded-lg px-4 py-3 max-w-[80%]">
                    <div
                      className="prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: (msg.assistantResponse || "").replace(/\n/g, '<br />')
                      }}
                    />
                  </div>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-gray-500 text-right">
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-4 py-3">
              <LoadingSpinner />
              <p className="mt-2 text-xs text-gray-300">
                Messages may take up to a minute to generate.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500">
          {error}
        </div>
      )}

      {/* Question input form */}
      <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-700 pt-4">
        <div className="flex items-center gap-2">
          <input
            id="userQuestion"
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
            disabled={isAskDisabled}
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center space-x-2 text-gray-300">
            <input
              type="checkbox"
              checked={singleResponseMode}
              onChange={(e) => setSingleResponseMode(e.target.checked)}
              className="rounded bg-gray-600 border-gray-500 text-indigo-500"
            />
            <span>Single response mode</span>
          </label>

          <div className="flex items-center gap-2 text-gray-300">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeTransits}
                onChange={(e) => setIncludeTransits(e.target.checked)}
                className="rounded bg-gray-600 border-gray-500 text-indigo-500"
              />
              <span>Include transits</span>
            </label>
            {includeTransits && (
              <input
                type="datetime-local"
                value={transitTimestamp}
                onChange={(e) => setTransitTimestamp(e.target.value)}
                className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            )}
          </div>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [events, setEvents] = useState([]);
  const [checkedEvents, setCheckedEvents] = useState({});
  const [editingEvent, setEditingEvent] = useState(null); // For edit mode
  const [progressedChecks, setProgressedChecks] = useState({}); // For progressed checkboxes
  const [progressedTimezones, setProgressedTimezones] = useState({});
  const handleProgressedTimezoneChange = (eventId, timezone) => {
    setProgressedTimezones((prev) => ({ ...prev, [eventId]: timezone }));
  };

  // Tab state
  const [activeTab, setActiveTab] = useState<'chat' | 'chart'>('chat');

  // Chat mode state
  const [singleResponseMode, setSingleResponseMode] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatSession[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [encryptionEnabled, setEncryptionEnabled] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const { status: encryptionStatus, hasStoredKeys, initializeWithPassphrase, unlockWithPassphrase, encryptText, decryptText } = useEncryption();

  // This initial effect just verifies the user and sets their ID
  useEffect(() => {
    const getUserAndEvents = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchEvents(user.id);
        await fetchConversations(user.id);
      } else {
        navigate("/home");
      }
      setIsUserLoading(false);
    };
    getUserAndEvents();
  }, [navigate]);

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  useEffect(() => {
    if (!userId) return;
    const stored = localStorage.getItem(`pythia:encrypt:${userId}`);
    if (stored !== null) {
      setEncryptionEnabled(stored === "true");
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(`pythia:encrypt:${userId}`, String(encryptionEnabled));
  }, [userId, encryptionEnabled]);

  useEffect(() => {
    if (!singleResponseMode && currentConversationId) {
      loadChatHistory(currentConversationId);
    }
    if (!singleResponseMode && !currentConversationId) {
      setChatHistory([]);
    }
  }, [singleResponseMode, currentConversationId, encryptionEnabled, encryptionStatus]);

  const fetchConversations = async (currentUserId: string) => {
    const token = await getFreshToken();
    if (!token) return;

    const baseApiUrl = import.meta.env.VITE_API_URI;
    try {
      const res = await fetch(`${baseApiUrl}/chat-sessions/${currentUserId}`, {
        headers: {
          Authorization: `${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load chat sessions");
      const data = await res.json();
      const loaded = data.sessions || [];
      setConversations(loaded);
      if (loaded.length > 0 && !currentConversationId) {
        setCurrentConversationId(loaded[0].conversationId);
      }
    } catch (err) {
      console.error("Failed to fetch chat sessions:", err);
      setConversations([]);
    }
  };

  const loadChatHistory = async (conversationId: number) => {
    if (!conversationId || !userId) return;

    setIsLoadingHistory(true);
    const token = await getFreshToken();
    if (!token) return;

    const baseApiUrl = import.meta.env.VITE_API_URI;
    try {
      const res = await fetch(
        `${baseApiUrl}/chat/${userId}/conversation/${conversationId}?limit=100`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${token}`,
          },
        }
      );
      if (!res.ok) throw new Error('Failed to load chat history');
      const data = await res.json();
      const loadedMessages = data.messages || [];

      if (encryptionEnabled && encryptionStatus === "unlocked") {
        const decryptedMessages = await Promise.all(
          loadedMessages.map(async (msg: ChatMessage) => {
            if (!msg.isEncrypted) return msg;
            if (!msg.userMessageEncrypted || !msg.assistantResponseEncrypted || !msg.encryptionIVUser || !msg.encryptionIVAssistant) {
              return msg;
            }

            try {
              const [userMessage, assistantResponse] = await Promise.all([
                decryptText(msg.userMessageEncrypted, msg.encryptionIVUser),
                decryptText(msg.assistantResponseEncrypted, msg.encryptionIVAssistant),
              ]);
              return { ...msg, userMessage, assistantResponse };
            } catch {
              return {
                ...msg,
                userMessage: "[Unable to decrypt message]",
                assistantResponse: "[Unable to decrypt response]",
              };
            }
          })
        );
        setChatHistory(decryptedMessages);
      } else {
        setChatHistory(
          loadedMessages.map((msg: ChatMessage) =>
            msg.isEncrypted
              ? {
                  ...msg,
                  userMessage: msg.userMessage || "[Encrypted message]",
                  assistantResponse: msg.assistantResponse || "[Encrypted response]",
                }
              : msg
          )
        );
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setChatHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleClearSession = async () => {
    if (!currentConversationId) return;
    if (!window.confirm('Clear all messages in this chat?')) return;

    const token = await getFreshToken();
    if (!token) return;

    const baseApiUrl = import.meta.env.VITE_API_URI;
    try {
      const res = await fetch(
        `${baseApiUrl}/chat-conversation/${userId}/${currentConversationId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `${token}` },
        }
      );

      if (!res.ok) throw new Error('Failed to clear session');
      setChatHistory([]);
      setSaveMessage('Chat cleared successfully.');
      await fetchConversations(userId);
    } catch (err) {
      setError(`Failed to clear session: ${err.message}`);
    }
  };

  const getFreshToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/home");
      return null;
    }
    return session.access_token;
  };

  const fetchEvents = async (currentUserId) => {
    const token = await getFreshToken();
    if (!token) return;

    const baseApiUrl = import.meta.env.VITE_API_URI;
    try {
      const res = await fetch(`${baseApiUrl}/events/${currentUserId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`, // ✅ REMOVED "Bearer "
        },
      });
      if (!res.ok) throw new Error("Failed to fetch events");
      let data = await res.json();
      data = data.map((event) => ({
        ...event,
        event_data:
          typeof event.event_data === "string"
            ? JSON.parse(event.event_data)
            : event.event_data,
      }));
      setEvents(data);
    } catch (err) {
      setError(`Failed to load saved events: ${err.message}`);
    }
  };
  const handleSaveEvent = async (eventData) => {
    setIsLoading(true);
    setSaveMessage("");
    const token = await getFreshToken();
    if (!token) return false;

    const baseApiUrl = import.meta.env.VITE_API_URI;
    try {
      const res = await fetch(`${baseApiUrl}/natal-chart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ ...eventData, userId: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save event");
      await fetchEvents(userId);
      setSaveMessage("Event saved successfully!");
      return true;
    } catch (err) {
      setSaveMessage(`Save failed: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    setIsLoading(true);
    setSaveMessage("");
    const token = await getFreshToken();
    if (!token) return false;

    const baseApiUrl = import.meta.env.VITE_API_URI;
    try {
      const res = await fetch(`${baseApiUrl}/astro-event/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ ...eventData, userId: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update event");
      await fetchEvents(userId);
      setSaveMessage("Event updated successfully!");
      setEditingEvent(null);
      return true;
    } catch (err) {
      setSaveMessage(`Update failed: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      setIsLoading(true);
      setSaveMessage("");
      const token = await getFreshToken();
      if (!token) return;

      const baseApiUrl = import.meta.env.VITE_API_URI;
      try {
        const res = await fetch(`${baseApiUrl}/astro-event/${eventId}`, {
          method: "DELETE",
          headers: { Authorization: `${token}` },
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete event");
        }
        setSaveMessage("Event deleted successfully.");
        setEvents((prev) => prev.filter((event) => event.event_id !== eventId));
        if (checkedEvents[eventId]) onToggleEvent(eventId);
      } catch (err) {
        setSaveMessage(`Delete failed: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const onToggleEvent = (eventId) => {
    setCheckedEvents((prev) => {
      const newChecked = { ...prev };
      if (newChecked[eventId]) {
        delete newChecked[eventId];
        // Also uncheck its progressed chart
        if (progressedChecks[eventId]) {
          onToggleProgressed(eventId);
        }
      } else {
        newChecked[eventId] = true;
      }
      return newChecked;
    });
  };

  const onToggleProgressed = (eventId) => {
    setProgressedChecks((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setChatHistory([]);
  };

  const handleSelectConversation = (conversationId: number) => {
    if (!conversationId) {
      handleNewConversation();
      return;
    }
    setCurrentConversationId(conversationId);
  };

  const handleUnlockEncryption = async (): Promise<boolean> => {
    try {
      const passphrase = window.prompt(
        hasStoredKeys
          ? "Enter your encryption passphrase to unlock this device:"
          : "Set an encryption passphrase for your chats:"
      );
      if (!passphrase) return false;

      if (hasStoredKeys) {
        await unlockWithPassphrase(passphrase);
      } else {
        const initialized = await initializeWithPassphrase(passphrase);
        try {
          await navigator.clipboard.writeText(initialized.recoveryKey);
          window.prompt(
            "Recovery key copied. Save this key securely:",
            initialized.recoveryKey
          );
        } catch {
          window.prompt(
            "Copy and save this recovery key securely:",
            initialized.recoveryKey
          );
        }
      }
      return true;
    } catch (err) {
      setError(err.message || "Failed to unlock encryption");
      return false;
    }
  };

  const handleAstrologyQuery = async (queryPayload) => {
    setIsLoading(true);
    setError(null);
    setSaveMessage("");
    const token = await getFreshToken();
    if (!token) return;

    const selectedEventIds = Object.keys(checkedEvents)
      .filter((id) => checkedEvents[id])
      .map(Number);

    const chartDataForQuery = events.filter((event) =>
      selectedEventIds.includes(event.event_id)
    );

    // Allow queries with or without events selected
    // Empty array = general astrology questions

    const baseApiUrl = import.meta.env.VITE_API_URI;
    const endpoint = singleResponseMode ? '/query' : '/chat';
    const shouldEncrypt = !singleResponseMode && encryptionEnabled;

    const requestBody = {
      userId,
      chartData: JSON.stringify(chartDataForQuery),
      userMessage: queryPayload.userQuestion, // API expects userMessage, not userQuestion
      chatHistoryContext: chatHistory
        .slice(-12)
        .map((msg) => ({
          userMessage: msg.userMessage,
          assistantResponse: msg.assistantResponse,
        }))
        .filter((msg) => msg.userMessage && msg.assistantResponse),
      progressed: queryPayload.progressed,
      progressedEventIds: queryPayload.progressedEventIds,
      progressedTimezones: queryPayload.progressedTimezones,
      transitTimestamp: queryPayload.transitTimestamp,
      ...(!singleResponseMode && {
        conversationId: currentConversationId,
        saveToHistory: !shouldEncrypt,
      }),
    };

    try {
      if (selectedEventIds.length === 0) {
        const shouldContinue = window.confirm(
          "No charts/events are selected. This message will be answered without chart context. Continue?"
        );
        if (!shouldContinue) {
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch(`${baseApiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);

      if (singleResponseMode) {
        setResponse(data.response);
        setChatHistory([]); // Clear chat history in single response mode
      } else {
        let resultingConversationId = data.conversationId || currentConversationId;

        if (shouldEncrypt) {
          if (encryptionStatus !== "unlocked") {
            const unlocked = await handleUnlockEncryption();
            if (!unlocked) {
              throw new Error("Encryption must be unlocked before sending encrypted chats");
            }
          }

          const [encryptedUser, encryptedAssistant] = await Promise.all([
            encryptText(queryPayload.userQuestion),
            encryptText(data.response),
          ]);

          const encryptedSaveResponse = await fetch(`${baseApiUrl}/chat/save-encrypted`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${token}`,
            },
            body: JSON.stringify({
              userId,
              conversationId: resultingConversationId || currentConversationId,
              conversationTitle: queryPayload.userQuestion,
              userMessageEncrypted: encryptedUser.ciphertext,
              assistantResponseEncrypted: encryptedAssistant.ciphertext,
              encryptionIVUser: encryptedUser.iv,
              encryptionIVAssistant: encryptedAssistant.iv,
              eventIdsUsed: selectedEventIds,
              queryMetadata: {
                transitTimestamp: queryPayload.transitTimestamp,
                progressed: queryPayload.progressed,
                progressedEventIds: queryPayload.progressedEventIds,
                progressedTimezones: queryPayload.progressedTimezones,
              },
            }),
          });

          const encryptedSaveData = await encryptedSaveResponse.json();
          if (!encryptedSaveResponse.ok) {
            throw new Error(encryptedSaveData?.error || "Failed to save encrypted chat");
          }
          resultingConversationId = encryptedSaveData.conversationId || resultingConversationId;
        }

        // Add to chat history immediately
        const newMessage: ChatMessage = {
          messageId: data.messageId || Date.now(),
          conversationId: resultingConversationId || undefined,
          userMessage: queryPayload.userQuestion,
          assistantResponse: data.response,
          eventIdsUsed: selectedEventIds,
          createdAt: new Date().toISOString(),
        };
        setChatHistory((prev) => [...prev, newMessage]);
        if (resultingConversationId) {
          setCurrentConversationId(resultingConversationId);
        }
        await fetchConversations(userId);
        setResponse(''); // Clear single response
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/home");
  };

  if (isUserLoading) return <LoadingSpinner />;

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white relative">
      <div className="fixed top-4 right-4 z-20">
        <HamburgerMenu onLogout={handleLogout} />
      </div>
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-6xl mx-auto bg-gray-800 rounded-xl shadow-2xl shadow-indigo-900/50 overflow-hidden">
          <Header />

          {/* Tab Navigation */}
          <TabNav activeTab={activeTab} onChange={setActiveTab} />

          <main>
            {activeTab === 'chat' ? (
              <>
                {/* Event Configuration at Top */}
                <EventConfigSection
                  onSaveEvent={handleSaveEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onDeleteEvent={handleDeleteEvent}
                  setEditingEvent={setEditingEvent}
                  editingEvent={editingEvent}
                  events={events}
                  checkedEvents={checkedEvents}
                  onToggleEvent={onToggleEvent}
                  isLoading={isLoading}
                  saveMessage={saveMessage}
                  progressedChecks={progressedChecks}
                  onToggleProgressed={onToggleProgressed}
                  progressedTimezones={progressedTimezones}
                  onProgressedTimezoneChange={handleProgressedTimezoneChange}
                />

                {/* Chat Interface with Input at Bottom */}
                <ChatInterface
                  messages={chatHistory}
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  onSelectConversation={handleSelectConversation}
                  onNewConversation={handleNewConversation}
                  isLoading={isLoading || isLoadingHistory}
                  error={error}
                  onClearSession={handleClearSession}
                  onSubmit={handleAstrologyQuery}
                  singleResponseMode={singleResponseMode}
                  setSingleResponseMode={setSingleResponseMode}
                  encryptionEnabled={encryptionEnabled}
                  setEncryptionEnabled={setEncryptionEnabled}
                  encryptionStatus={encryptionStatus}
                  onUnlockEncryption={handleUnlockEncryption}
                  response={response}
                  progressedChecks={progressedChecks}
                  progressedTimezones={progressedTimezones}
                />
              </>
            ) : (
              <ChartViewerTab userId={userId} getFreshToken={getFreshToken} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
