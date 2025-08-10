import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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

// --- Form Components ---

const AddEventForm = ({ onSave, isLoading, saveMessage, clearSaveMessage }) => {
  const [label, setLabel] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [ampm, setAmpm] = useState("AM");
  const [location, setLocation] = useState("");
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);

  useEffect(() => {
    // Clear message on input change
    if (saveMessage) clearSaveMessage();
  }, [
    label,
    year,
    month,
    day,
    hour,
    minute,
    location,
    isTimeUnknown,
    ampm,
    saveMessage,
    clearSaveMessage,
  ]);

  const handleSave = async () => {
    let finalHour = parseInt(hour, 10);
    if (ampm === "PM" && finalHour < 12) {
      finalHour += 12;
    }
    if (ampm === "AM" && finalHour === 12) {
      finalHour = 0;
    }

    const eventData = {
      label,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      time: isTimeUnknown
        ? "12:00"
        : `${String(finalHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      location,
    };

    if (
      !label ||
      !year ||
      !month ||
      !day ||
      !location ||
      (!isTimeUnknown && (hour === "" || minute === ""))
    ) {
      alert("Please fill all required fields for the new event.");
      return;
    }
    const success = await onSave(eventData);
    if (success) {
      setLabel("");
      setYear("");
      setMonth("");
      setDay("");
      setHour("");
      setMinute("");
      setLocation("");
      setIsTimeUnknown(false);
      setAmpm("AM");
    }
  };

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
      <h3 className="text-lg font-semibold text-white">Add New Event</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Label (e.g., John Smith)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        />
        <input
          type="text"
          placeholder="Location (e.g., Paris, France)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        />
        <input
          type="number"
          placeholder="Month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        />
        <input
          type="number"
          placeholder="Day"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
        />
      </div>
      {!isTimeUnknown && (
        <div className="grid grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="Hour (1-12)"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
          />
          <input
            type="number"
            placeholder="Minute (0-59)"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
          />
          <select
            value={ampm}
            onChange={(e) => setAmpm(e.target.value)}
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
            className="rounded bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-500"
          />
          <span>Time is unknown (uses 12:00 PM)</span>
        </label>
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-gray-500 transition"
        >
          {isLoading ? "Saving..." : "Save Event"}
        </button>
      </div>
      {saveMessage && (
        <div className="text-center text-green-400 bg-green-900/50 p-3 rounded-lg border border-green-500 mt-2">
          {saveMessage}
        </div>
      )}
    </div>
  );
};

const EventList = ({ events, checkedEvents, onToggle }) => (
  <div className="space-y-3">
    <h3 className="text-lg font-semibold text-white">
      Select Events to Include
    </h3>
    {events.length > 0 ? (
      events.map((event) => (
        <div
          key={event.event_id}
          className="p-3 bg-gray-700/50 rounded-lg flex items-center space-x-4"
        >
          <input
            type="checkbox"
            id={`event-${event.event_id}`}
            checked={!!checkedEvents[event.event_id]}
            onChange={() => onToggle(event.event_id)}
            className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-500"
          />
          <label
            htmlFor={`event-${event.event_id}`}
            className="text-gray-200 cursor-pointer"
          >
            {event.label}
          </label>
        </div>
      ))
    ) : (
      <p className="text-gray-500 italic">
        No saved events. Add one above to get started.
      </p>
    )}
    <p className="text-xs text-gray-400 pt-2">
      Check one or more boxes to include that person/event in your question.
    </p>
  </div>
);

const ManualEntry = ({ manualChartData, setManualChartData, isEnabled }) => {
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

const AstrologyQueryForm = ({
  onSubmit,
  onSaveEvent,
  events,
  checkedEvents,
  onToggleEvent,
  isLoading,
  message,
  saveMessage,
  clearSaveMessage,
}) => {
  const [userQuestion, setUserQuestion] = useState("");
  const [manualChartData, setManualChartData] = useState("");
  const [useManualData, setUseManualData] = useState(false);

  const isAskDisabled =
    isLoading ||
    (useManualData
      ? !manualChartData.trim()
      : Object.keys(checkedEvents).filter((id) => checkedEvents[id]).length ===
        0) ||
    !userQuestion.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(userQuestion, useManualData, manualChartData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
      <AddEventForm
        onSave={onSaveEvent}
        isLoading={isLoading}
        saveMessage={saveMessage}
        clearSaveMessage={clearSaveMessage}
      />
      <EventList
        events={events}
        checkedEvents={checkedEvents}
        onToggle={onToggleEvent}
      />

      <div>
        <label className="flex items-center space-x-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={useManualData}
            onChange={(e) => setUseManualData(e.target.checked)}
            className="rounded bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-500"
          />
          <span>Enter chart data manually for this query</span>
        </label>
        {useManualData && (
          <ManualEntry
            manualChartData={manualChartData}
            setManualChartData={setManualChartData}
            isEnabled={!isLoading}
          />
        )}
      </div>

      <div>
        <label
          htmlFor="userQuestion"
          className="block text-lg font-medium text-gray-200 mb-2"
        >
          Your Question
        </label>
        <input
          id="userQuestion"
          type="text"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          placeholder="e.g., What does my Mars in Scorpio reveal?"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
          disabled={isLoading}
          required
        />
      </div>

      {message && (
        <div className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500">
          {message}
        </div>
      )}

      <div className="text-center">
        <button
          type="submit"
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
          disabled={isAskDisabled}
        >
          {isLoading ? "Thinking..." : "Ask"}
        </button>
        {isAskDisabled && !isLoading && (
          <p className="text-xs text-gray-500 mt-2">
            Please select at least one event and enter a question.
          </p>
        )}
      </div>
    </form>
  );
};

const ResponseDisplay = ({ isLoading, response, error }) => {
  const renderContent = () => {
    if (isLoading)
      return (
        <>
          <p>Results take about 1 minute to generate. Please be patient.</p>
          <p>
            Your questions are never stored on our servers because we value your
            privacy.
          </p>
          <LoadingSpinner />
        </>
      );
    if (error)
      return (
        <div className="text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-500">
          {error}
        </div>
      );
    if (response) {
      const formattedResponse = response.replace(/\n/g, "<br />");
      return (
        <div
          className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: formattedResponse }}
        />
      );
    }
    return (
      <div className="text-center text-gray-500 italic">
        Enter a question above to see results here.
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 bg-gray-800/50 rounded-b-xl min-h-[200px] flex flex-col justify-center">
      <h2 className="text-2xl font-semibold text-white mb-4 border-b border-gray-600 pb-2">
        Results
      </h2>
      <div className="mt-4">{renderContent()}</div>
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
  const [message, setMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState(""); // New state for save event messages
  const [events, setEvents] = useState([]);
  const [checkedEvents, setCheckedEvents] = useState({});

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (session?.user) {
          setUserId(session.user.id);
          await fetchEvents(session.user.id);
        } else {
          navigate("/home");
        }
      } catch (err) {
        console.error("Error fetching user session:", err.message);
        navigate("/home");
      } finally {
        setIsUserLoading(false);
      }
    };
    fetchUserAndEvents();
  }, [navigate]);

  const fetchEvents = async (currentUserId) => {
    const baseApiUrl = import.meta.env.VITE_API_URI;
    if (!baseApiUrl || !currentUserId) return;
    try {
      const res = await fetch(`${baseApiUrl}/events/${currentUserId}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(`Failed to load saved events: ${err.message}`);
    }
  };

  const handleSaveEvent = async (eventData) => {
    setIsLoading(true);
    setError(null);
    setMessage("");
    setSaveMessage(""); // Clear previous save message
    const baseApiUrl = import.meta.env.VITE_API_URI;
    try {
      const res = await fetch(`${baseApiUrl}/natal-chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...eventData, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save event");

      const newEvent = {
        ...data,
        label: eventData.label,
        event_id: data.event_id,
        event_data: JSON.stringify(data),
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
      setSaveMessage("Event saved successfully!"); // Use the new state
      return true;
    } catch (err) {
      setSaveMessage(`Save failed: ${err.message}`); // Use the new state for save errors too
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEvent = (eventId) => {
    setCheckedEvents((prev) => {
      const newCheckedEvents = { ...prev };
      if (newCheckedEvents[eventId]) {
        delete newCheckedEvents[eventId];
      } else {
        newCheckedEvents[eventId] = true;
      }
      return newCheckedEvents;
    });
  };

  const handleAstrologyQuery = async (
    userQuestion,
    useManualData,
    manualChartData
  ) => {
    setIsLoading(true);
    setResponse("");
    setError(null);
    setMessage("");
    setSaveMessage(""); // Clear save message when asking a question

    let finalChartData = "";
    if (useManualData) {
      finalChartData = manualChartData;
    } else {
      const selectedEventIds = Object.keys(checkedEvents).filter(
        (id) => checkedEvents[id]
      );
      finalChartData = events
        .filter((event) => selectedEventIds.includes(String(event.event_id)))
        .map((event) => {
          let parsedData;
          try {
            parsedData =
              typeof event.event_data === "string"
                ? JSON.parse(event.event_data)
                : event.event_data;
          } catch (e) {
            console.error("Error parsing event_data:", e);
            parsedData = { error: "Malformed chart data" };
          }
          return `Chart for ${event.label}:\n${JSON.stringify(parsedData, null, 2)}`;
        })
        .join("\n\n---\n\n");
    }

    if (!finalChartData.trim() || !userQuestion.trim()) {
      setIsLoading(false);
      setMessage("Please provide chart data and a question.");
      return;
    }

    const baseApiUrl = import.meta.env.VITE_API_URI;
    try {
      const res = await fetch(`${baseApiUrl}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          chartData: finalChartData,
          userQuestion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);
      setResponse(data.response);
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
        <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl shadow-indigo-900/50 overflow-hidden">
          <Header />
          <main>
            <AstrologyQueryForm
              onSubmit={handleAstrologyQuery}
              onSaveEvent={handleSaveEvent}
              events={events}
              checkedEvents={checkedEvents}
              onToggleEvent={handleToggleEvent}
              isLoading={isLoading}
              message={message}
              saveMessage={saveMessage}
              clearSaveMessage={() => setSaveMessage("")}
            />
            <ResponseDisplay
              isLoading={isLoading}
              response={response}
              error={error}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
