import React, { useState } from "react";

// --- Helper & Icon Components ---
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
  </div>
);

// --- Core Components ---
const Header = () => (
  <header className="text-center p-6 bg-gray-900 text-white rounded-t-xl shadow-lg">
    <div className="flex justify-center items-center">
      <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-wider">
        Pythia
      </h1>
    </div>
    <p className="text-indigo-300 mt-3 text-lg">
      Paste your astrological chart data and ask any question about it.
    </p>
  </header>
);

const AstrologyInputForm = ({ onSubmit, isLoading }) => {
  const [chartData, setChartData] = useState("");
  const [userQuestion, setUserQuestion] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chartData.trim() || !userQuestion.trim()) {
      alert("Please fill in your Chart Data and your Question.");
      return;
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
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState(null);

  const handleAstrologyQuery = async (chartData, userQuestion) => {
    setIsLoading(true);
    setResponse("");
    setError(null);

    // Access the API key using Vite's client-side environment variable syntax.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      setError(
        "Error: Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file and restart the server."
      );
      setIsLoading(false);
      return;
    }

    const prompt = `
      You are an expert astrologer with deep knowledge of various astrological techniques including natal charts, synastry, composite charts, progressed charts, astrocartography, and zodiacal releasing.
      Analyze the following astrological data and answer the user's question based on it. Provide a thoughtful, detailed, and insightful interpretation.
      **Astrological Data:**
      ---
      ${chartData}
      ---
      **User's Question:**
      ${userQuestion}
      **Your Interpretation:**
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-latest:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || `API Error: ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("The response from the AI was empty or malformed.");
      }

      setResponse(text);
    } catch (err) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl shadow-indigo-900/50 overflow-hidden">
        <Header />
        <main>
          <AstrologyInputForm
            onSubmit={handleAstrologyQuery}
            isLoading={isLoading}
          />
          <ResponseDisplay
            isLoading={isLoading}
            response={response}
            error={error}
          />
        </main>
      </div>
    </div>
  );
}
