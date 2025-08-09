import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; // Make sure this path is correct

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

// --- New Hamburger Menu Component ---
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

// --- Core Components ---
const Header = () => (
  <header className="p-6 bg-gray-900 text-white rounded-t-xl shadow-lg">
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-wider">
        Pythia
      </h1>
      <p className="text-indigo-300 mt-3 text-lg">
        Paste your astrological chart data and ask any question about it.
      </p>
    </div>
  </header>
);

const AstrologyInputForm = ({ onSubmit, isLoading, message, clearMessage }) => {
  const [chartData, setChartData] = useState("");
  const [userQuestion, setUserQuestion] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chartData.trim() || !userQuestion.trim()) {
      clearMessage(); // Clear previous message
      return; // The validation is now handled in the parent component
    }
    onSubmit(chartData, userQuestion);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
      <div>
        <label
          htmlFor="chartData"
          className="block text-lg font-medium text-gray-200 mb-2"
        >
          Astrological Data
        </label>
        <textarea
          id="chartData"
          name="chartData"
          rows={10}
          value={chartData}
          onChange={(e) => setChartData(e.target.value)}
          placeholder="Paste your complete birth chart data here..."
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          disabled={isLoading}
          required
        />
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
          name="userQuestion"
          type="text"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          placeholder="e.g., What does my Mars in Scorpio reveal?"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          disabled={isLoading}
          required
        />
      </div>
      {message && (
        <div className="text-center text-red-400 bg-red-900 bg-opacity-50 p-3 rounded-lg border border-red-500">
          {message}
        </div>
      )}
      <div className="text-center">
        <button
          type="submit"
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          disabled={isLoading}
        >
          {isLoading ? "Thinking..." : "Ask"}
        </button>
      </div>
    </form>
  );
};

const ResponseDisplay = ({ isLoading, response, error }) => {
  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return (
        <div className="text-red-400 bg-red-900 bg-opacity-50 p-4 rounded-lg border border-red-500">
          {error}
        </div>
      );
    }
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
    <div className="p-6 md:p-8 bg-gray-800 bg-opacity-50 rounded-b-xl min-h-[200px] flex flex-col justify-center">
      <h2 className="text-2xl font-semibold text-white mb-4 border-b border-gray-600 pb-2">
        Results
      </h2>
      <div className="mt-4">{renderContent()}</div>
    </div>
  );
};

/**
 * Main App Component
 */
export default function App() {
  // New state to hold the user ID and track if the user data is still loading
  const [userId, setUserId] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  // Effect to fetch the user ID from Supabase on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        if (session && session.user) {
          setUserId(session.user.id);
        }
      } catch (err) {
        console.error("Error fetching user session:", err.message);
        // You might want to handle this error more gracefully in a real app
      } finally {
        setIsUserLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    }
    // The onAuthStateChange listener in your context will handle the redirect.
  };

  const handleAstrologyQuery = async (chartData, userQuestion) => {
    setIsLoading(true);
    setResponse("");
    setError(null);
    setMessage("");

    if (!userId) {
      setIsLoading(false);
      setMessage("User not authenticated. Please log in.");
      return;
    }
    if (!chartData.trim() || !userQuestion.trim()) {
      setIsLoading(false);
      setMessage("Please fill in your Chart Data and your Question.");
      return;
    }

    const baseApiUrl = import.meta.env.VITE_API_URI;

    if (!baseApiUrl) {
      setError(
        "Error: API URI not found. Please set VITE_API_URI in your .env file and restart the server."
      );
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${baseApiUrl}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the correct payload to your backend server, now including the userId
        body: JSON.stringify({
          userId: userId, // Pass the user ID here
          chartData: chartData,
          userQuestion: userQuestion,
        }),
      });

      const data = await res.json();

      // Handle potential errors from your server first
      if (!res.ok) {
        throw new Error(data.error || `API Error: ${res.status}`);
      }

      // Parse the response from your backend server
      const text = data.response;

      if (!text) {
        throw new Error("The response from the server was empty or malformed.");
      }

      setResponse(text);
    } catch (err) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white relative">
      <div className="fixed top-4 right-4 z-20">
        <HamburgerMenu onLogout={handleLogout} />
      </div>
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl shadow-indigo-900/50 overflow-hidden">
          <Header />
          <main>
            <AstrologyInputForm
              onSubmit={handleAstrologyQuery}
              isLoading={isLoading}
              message={message}
              clearMessage={() => setMessage("")}
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
