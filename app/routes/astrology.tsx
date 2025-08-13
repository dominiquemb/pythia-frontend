import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { DateTime } from "luxon";
import { commonTimezones } from "../lib/timezones";

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

const AstrologyQueryForm = ({
  onSubmit,
  onSaveEvent,
  onUpdateEvent,
  onDeleteEvent,
  setEditingEvent,
  editingEvent,
  events,
  checkedEvents,
  onToggleEvent,
  isLoading,
  message,
  saveMessage,
  progressedChecks,
  onToggleProgressed,
  progressedTimezones, // ✅ Add this prop
  onProgressedTimezoneChange,
}: any) => {
  const [userQuestion, setUserQuestion] = useState("");
  const [includeTransits, setIncludeTransits] = useState(true);
  const [transitTimestamp, setTransitTimestamp] = useState(
    DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm")
  );

  const isAskDisabled =
    isLoading ||
    Object.keys(checkedEvents).filter((id) => checkedEvents[id]).length === 0 ||
    !userQuestion.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    const progressedEventIds = Object.keys(progressedChecks)
      .filter((id) => progressedChecks[id])
      .map(Number);

    // ✅ MODIFIED: Add progressedTimezones to the payload
    const queryPayload = {
      userQuestion,
      progressed: progressedEventIds.length > 0,
      progressedEventIds,
      progressedTimezones, // Add this line
      transitTimestamp: includeTransits
        ? DateTime.fromISO(transitTimestamp).toISO()
        : null,
    };

    onSubmit(queryPayload);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
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
        progressedTimezones={progressedTimezones} // ✅ Add this prop
        onProgressedTimezoneChange={onProgressedTimezoneChange} // ✅ Add this prop
      />

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
          placeholder="e.g., What are the themes for the upcoming month?"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
          disabled={isLoading}
          required
        />
      </div>

      <TransitOptions
        includeTransits={includeTransits}
        setIncludeTransits={setIncludeTransits}
        transitTimestamp={transitTimestamp}
        setTransitTimestamp={setTransitTimestamp}
      />

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
  const [session, setSession] = useState(null);
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

  // This initial effect just verifies the user and sets their ID
  useEffect(() => {
    const getUserAndEvents = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await fetchEvents(user.id);
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

  const handleAstrologyQuery = async (queryPayload) => {
    setIsLoading(true);
    setResponse("");
    setError(null);
    setSaveMessage("");
    const token = await getFreshToken();
    if (!token) return;

    const selectedEventIds = Object.keys(checkedEvents).filter(
      (id) => checkedEvents[id]
    );
    const chartDataForQuery = events.filter((event) =>
      selectedEventIds.includes(String(event.event_id))
    );

    if (chartDataForQuery.length === 0) {
      setIsLoading(false);
      setError("Please select at least one event.");
      return;
    }

    const baseApiUrl = import.meta.env.VITE_API_URI;
    try {
      const res = await fetch(`${baseApiUrl}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          userId: userId,
          chartData: JSON.stringify(chartDataForQuery),
          ...queryPayload,
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
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              editingEvent={editingEvent}
              setEditingEvent={setEditingEvent}
              events={events}
              checkedEvents={checkedEvents}
              onToggleEvent={onToggleEvent}
              isLoading={isLoading}
              message={error}
              saveMessage={saveMessage}
              progressedChecks={progressedChecks}
              onToggleProgressed={onToggleProgressed}
              progressedTimezones={progressedTimezones} // ✅ Add this prop
              onProgressedTimezoneChange={handleProgressedTimezoneChange} // ✅ Add this prop
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
