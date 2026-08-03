import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { DateTime } from "luxon";

// --- Helper Functions ---

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

// Helper: Convert zodiacal longitude to SVG angle
const longitudeToAngle = (longitude: number): number => {
  // Astrological charts start at Aries (0°) at the left (180° in SVG)
  // Match chart wheel direction used in the main astrology tab.
  return 180 + longitude;
};

const ASPECT_DISPLAY: Record<string, { symbol: string; color: string }> = {
  conjunction: { symbol: "☌", color: "#94a3b8" },
  opposition:  { symbol: "☍", color: "#f87171" },
  trine:       { symbol: "△", color: "#4ade80" },
  square:      { symbol: "□", color: "#f87171" },
  sextile:     { symbol: "⚹", color: "#60a5fa" },
  quincunx:    { symbol: "⊼", color: "#fb923c" },
};

// Helper: Get SVG coordinates for a point on circle
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

// --- Icon Components ---

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
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16m-7 6h7"
    />
  </svg>
);

// --- Navigation Components ---

const HamburgerMenu = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
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
              navigate("/chart-viewer");
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-indigo-600 hover:text-white transition-colors duration-200"
          >
            Chart Viewer
          </button>
          <button
            onClick={() => {
              navigate("/");
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-indigo-600 hover:text-white transition-colors duration-200"
          >
            Astrology Query
          </button>
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

// --- Chart Components ---

const ELEMENT_COLOR: Record<string, string> = {
  fire:  "#ef4444",
  earth: "#10b981",
  air:   "#f59e0b",
  water: "#8b5cf6",
};

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
    { name: "Aries",       symbol: "♈", color: "#ef4444", element: "fire"  },
    { name: "Taurus",      symbol: "♉", color: "#10b981", element: "earth" },
    { name: "Gemini",      symbol: "♊", color: "#f59e0b", element: "air"   },
    { name: "Cancer",      symbol: "♋", color: "#8b5cf6", element: "water" },
    { name: "Leo",         symbol: "♌", color: "#f59e0b", element: "fire"  },
    { name: "Virgo",       symbol: "♍", color: "#10b981", element: "earth" },
    { name: "Libra",       symbol: "♎", color: "#ef4444", element: "air"   },
    { name: "Scorpio",     symbol: "♏", color: "#8b5cf6", element: "water" },
    { name: "Sagittarius", symbol: "♐", color: "#f59e0b", element: "fire"  },
    { name: "Capricorn",   symbol: "♑", color: "#10b981", element: "earth" },
    { name: "Aquarius",    symbol: "♒", color: "#ef4444", element: "air"   },
    { name: "Pisces",      symbol: "♓", color: "#8b5cf6", element: "water" },
  ];

  // Outer band ring: radius-40 to radius
  const bandInnerR = radius - 40;

  return (
    <g>
      {/* Step 1: pie slices from center to outer circle, one per sign */}
      {zodiacSigns.map((sign, index) => {
        const startAngle = 180 + index * 30;
        const endAngle   = startAngle + 30;
        const outerStart = getPointOnCircle(startAngle, radius, centerX, centerY);
        const outerEnd   = getPointOnCircle(endAngle,   radius, centerX, centerY);
        const piePath = [
          `M ${centerX} ${centerY}`,
          `L ${outerStart.x} ${outerStart.y}`,
          `A ${radius} ${radius} 0 0 0 ${outerEnd.x} ${outerEnd.y}`,
          `Z`,
        ].join(" ");
        return (
          <path
            key={sign.name}
            d={piePath}
            fill={ELEMENT_COLOR[sign.element]}
            fillOpacity="0.28"
            stroke="none"
          />
        );
      })}

      {/* Step 2: solid circle to mask everything inside the band */}
      <circle cx={centerX} cy={centerY} r={bandInnerR} fill="#111827" stroke="none" />

      {/* Step 3: divider lines at each 30° boundary, spanning band only */}
      {zodiacSigns.map((sign, index) => {
        const angle = 180 + index * 30;
        const inner = getPointOnCircle(angle, bandInnerR, centerX, centerY);
        const outer = getPointOnCircle(angle, radius,     centerX, centerY);
        return (
          <line
            key={`div-${sign.name}`}
            x1={inner.x} y1={inner.y}
            x2={outer.x} y2={outer.y}
            stroke="#ffffff"
            strokeWidth="2"
          />
        );
      })}

      {/* Step 4: sign symbols outside the band */}
      {zodiacSigns.map((sign, index) => {
        const midAngle = 180 + index * 30 + 15;
        const pt = getPointOnCircle(midAngle, radius + 18, centerX, centerY);
        return (
          <text
            key={`sym-${sign.name}`}
            x={pt.x}
            y={pt.y}
            fontSize="20"
            fill={sign.color}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {sign.symbol}
          </text>
        );
      })}

      {/* Step 5: ring borders */}
      <circle cx={centerX} cy={centerY} r={radius}     fill="none" stroke="#6b7280" strokeWidth="2" />
      <circle cx={centerX} cy={centerY} r={bandInnerR} fill="none" stroke="#6b7280" strokeWidth="1.5" />
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
            {/* House cusp line */}
            <line
              x1={innerPoint.x}
              y1={innerPoint.y}
              x2={point.x}
              y2={point.y}
              stroke="#6b7280"
              strokeWidth="1"
              strokeDasharray="3,3"
            />

            {/* House number */}
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

      {/* Inner circle border */}
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
        {/* Outer Circle - Zodiac Signs */}
        <ZodiacRing centerX={centerX} centerY={centerY} radius={radius} />

        {/* Middle Circle - Houses */}
        {chartData.houses && chartData.houses.cusps && (
          <HousesRing
            centerX={centerX}
            centerY={centerY}
            radius={radius - 50}
            houseCusps={chartData.houses.cusps}
          />
        )}

        {/* Inner Circle - Background */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius - 100}
          fill="#1f2937"
          stroke="#4b5563"
          strokeWidth="2"
        />

        {/* Aspect lines — rendered before planets so they sit behind */}
        {chartData.aspects &&
          chartData.aspects.map((asp: any, i: number) => {
            const p1 = chartData.positions[asp.planet1];
            const p2 = chartData.positions[asp.planet2];
            if (!p1 || !p2) return null;
            const innerR = radius - 100;
            const a1 = getPointOnCircle(longitudeToAngle(p1.longitude), innerR, centerX, centerY);
            const a2 = getPointOnCircle(longitudeToAngle(p2.longitude), innerR, centerX, centerY);
            const display = ASPECT_DISPLAY[asp.aspect];
            return (
              <line
                key={i}
                x1={a1.x} y1={a1.y}
                x2={a2.x} y2={a2.y}
                stroke={display?.color ?? "#6b7280"}
                strokeWidth="1"
                strokeOpacity="0.55"
              />
            );
          })}

        {/* Planets */}
        {chartData.positions &&
          Object.entries(chartData.positions).map(([name, data]: [string, any]) => {
            const angle = longitudeToAngle(data.longitude);
            const dotPoint   = getPointOnCircle(angle, radius - 75, centerX, centerY);
            const labelPoint = getPointOnCircle(angle, radius - 48, centerX, centerY);
            const isRetrograde = data.speed < 0;

            return (
              <g key={name}>
                <circle
                  cx={dotPoint.x}
                  cy={dotPoint.y}
                  r="8"
                  fill={getPlanetColor(name)}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  fontSize="11"
                  fill="#ffffff"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {getPlanetSymbol(name)}{isRetrograde ? "℞" : ""}
                </text>
              </g>
            );
          })}

        {/* Ascendant Line */}
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

// --- Chart Summary ---

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const ChartSummary = ({ chartData }: { chartData: any }) => {
  if (!chartData) return null;

  const positions = chartData.positions ?? {};
  const aspects: any[] = chartData.aspects ?? [];

  return (
    <div className="mt-4 space-y-5 text-sm">
      {/* Planetary positions */}
      <div>
        <h2 className="text-base font-semibold text-indigo-300 mb-2 border-b border-gray-700 pb-1">
          Planetary Positions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wide">
                <th className="py-1 pr-4">Planet</th>
                <th className="py-1 pr-4">Sign</th>
                <th className="py-1 pr-4">Degree</th>
                <th className="py-1 pr-4">House</th>
                <th className="py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(positions).map(([name, data]: [string, any]) => {
                const isRetrograde = data.speed < 0;
                const deg = typeof data.sign_degrees === "number"
                  ? data.sign_degrees.toFixed(2)
                  : "—";
                return (
                  <tr key={name} className="border-t border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="py-1.5 pr-4 font-medium" style={{ color: getPlanetColor(name) }}>
                      {getPlanetSymbol(name)} {name}
                    </td>
                    <td className="py-1.5 pr-4 text-gray-200">
                      {SIGN_SYMBOLS[data.sign] ?? ""} {data.sign ?? "—"}
                    </td>
                    <td className="py-1.5 pr-4 text-gray-300">{deg}°</td>
                    <td className="py-1.5 pr-4 text-gray-400">
                      {data.house != null ? `House ${data.house}` : "—"}
                    </td>
                    <td className="py-1.5">
                      {isRetrograde
                        ? <span className="text-amber-400 font-semibold">℞ Retrograde</span>
                        : <span className="text-gray-500">Direct</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aspects */}
      {aspects.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-indigo-300 mb-2 border-b border-gray-700 pb-1">
            Aspects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {aspects.map((asp, i) => {
              const display = ASPECT_DISPLAY[asp.aspect];
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1 rounded bg-gray-700/40 border border-gray-700/60"
                >
                  <span className="text-base leading-none" style={{ color: display?.color ?? "#9ca3af" }}>
                    {display?.symbol ?? asp.aspect[0]}
                  </span>
                  <span className="text-gray-200">
                    <span style={{ color: getPlanetColor(asp.planet1) }}>{getPlanetSymbol(asp.planet1)}</span>
                    {" "}{asp.planet1}
                  </span>
                  <span className="text-gray-500 text-xs capitalize">{asp.aspect}</span>
                  <span className="text-gray-200">
                    <span style={{ color: getPlanetColor(asp.planet2) }}>{getPlanetSymbol(asp.planet2)}</span>
                    {" "}{asp.planet2}
                  </span>
                  <span className="ml-auto text-gray-500 text-xs">{asp.orb.toFixed(1)}°</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Input Components ---

const DateSlider = ({
  value,
  onChange,
  rangeType,
  onRangeChange,
}: {
  value: number;
  onChange: (value: number) => void;
  rangeType: "hour" | "day" | "month" | "year";
  onRangeChange: (type: "hour" | "day" | "month" | "year") => void;
}) => {
  const min = -100;
  const max = 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-lg font-medium text-gray-200">
          Navigate Through Time
        </label>

        {/* Range Type Selector */}
        <div className="flex gap-2">
          {(["hour", "day", "month", "year"] as const).map((type) => (
            <button
              key={type}
              onClick={() => onRangeChange(type)}
              className={`px-3 py-1 rounded text-sm transition ${
                rangeType === type
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />

      <div className="flex justify-between text-xs text-gray-500">
        <span>
          -100 {rangeType}
          {rangeType === "hour" ? "s" : "s"}
        </span>
        <span>Now</span>
        <span>
          +100 {rangeType}
          {rangeType === "hour" ? "s" : "s"}
        </span>
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
  const [year, setYear] = useState(date.year);
  const [month, setMonth] = useState(date.month);
  const [day, setDay] = useState(date.day);
  const [hour, setHour] = useState(date.hour);
  const [minute, setMinute] = useState(date.minute);

  const handleDateChange = () => {
    try {
      const newDate = DateTime.fromObject({ year, month, day, hour, minute });
      if (newDate.isValid) {
        onChange(newDate);
      }
    } catch (err) {
      console.error("Invalid date:", err);
    }
  };

  // Update local state when prop changes (from slider)
  useEffect(() => {
    setYear(date.year);
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value) || 0)}
          onBlur={handleDateChange}
          min={-13000}
          max={17000}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        />
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
        Date range: 13000 BC to 17000 AD (Swiss Ephemeris)
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

// --- Main Component ---

export default function ChartViewer() {
  console.log("[ChartViewer] build-20260803-a loaded");
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<DateTime>(DateTime.now());
  const [location, setLocation] = useState<string>("Greenwich, UK");
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Slider state (offset from current date)
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [sliderRangeType, setSliderRangeType] = useState<
    "hour" | "day" | "month" | "year"
  >("day");

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        navigate("/home");
      }
    };
    checkAuth();
  }, [navigate]);

  // Update date when slider changes
  useEffect(() => {
    const baseDate = DateTime.now();
    let newDate: DateTime;

    switch (sliderRangeType) {
      case "hour":
        newDate = baseDate.plus({ hours: sliderValue });
        break;
      case "day":
        newDate = baseDate.plus({ days: sliderValue });
        break;
      case "month":
        newDate = baseDate.plus({ months: sliderValue });
        break;
      case "year":
        newDate = baseDate.plus({ years: sliderValue });
        break;
    }

    setCurrentDate(newDate);
  }, [sliderValue, sliderRangeType]);

  // Fetch chart data when date or location changes
  useEffect(() => {
    if (!userId) return;

    const timer = setTimeout(() => {
      fetchChartData();
    }, 300); // Debounce for slider smoothness

    return () => clearTimeout(timer);
  }, [currentDate, location, userId]);

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
          houseSystem: "P", // Placidus by default
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/home");
  };

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white">
      <div className="fixed top-4 right-4 z-20">
        <HamburgerMenu onLogout={handleLogout} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl mx-auto bg-gray-800 rounded-xl shadow-2xl shadow-indigo-900/50 p-6 space-y-6">
          <header className="text-center border-b border-gray-700 pb-4">
            <h1 className="text-4xl font-bold font-serif tracking-wider">
              Astrological Chart Viewer <span style={{fontSize:"0.6rem",opacity:0.5}}>build-20260803-a</span>
            </h1>
            <p className="text-indigo-300 mt-2">
              {currentDate.toFormat("MMMM d, yyyy - HH:mm")} · {location}
            </p>
          </header>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
              {error}
            </div>
          )}

          <ChartWheel chartData={chartData} isLoading={isLoading} />

          {!isLoading && chartData && <ChartSummary chartData={chartData} />}

          <DateSlider
            value={sliderValue}
            onChange={setSliderValue}
            rangeType={sliderRangeType}
            onRangeChange={setSliderRangeType}
          />

          <DateInput date={currentDate} onChange={setCurrentDate} />

          <LocationInput value={location} onChange={setLocation} />
        </div>
      </div>
    </div>
  );
}
