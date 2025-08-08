import React from "react";
import { useFetcher } from "@remix-run/react";
import { json, type ActionFunctionArgs } from "@remix-run/node";

// --- Remix Action ---
// This function runs ONLY on the server. It receives the form data,
// securely accesses the API key, calls the Gemini API, and returns the result.
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const chartData = formData.get("chartData");
  const userQuestion = formData.get("userQuestion");

  // Securely access the API key from server environment variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return json(
      {
        error:
          "Error: GEMINI_API_KEY not found on the server. Please set it in your .env file and restart.",
      },
      { status: 500 }
    );
  }

  if (!chartData || !userQuestion) {
    return json(
      { error: "Please provide both chart data and a question." },
      { status: 400 }
    );
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
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return json(
        { error: errorData.error?.message || `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return json(
        { error: "The response from the AI was empty or malformed." },
        { status: 500 }
      );
    }

    return json({ response: text, error: null });
  } catch (err: any) {
    return json(
      { error: err.message || "An unknown error occurred." },
      { status: 500 }
    );
  }
};

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

const AstrologyInputForm = ({ fetcher }: { fetcher: any }) => {
  const isLoading =
    fetcher.state === "submitting" || fetcher.state === "loading";

  return (
    // This form submits data to the `action` function without a page reload.
    <fetcher.Form method="post" className="p-6 md:p-8 space-y-6">
      <div>
        <label
          htmlFor="chartData"
          className="block text-lg font-medium text-gray-200 mb-2"
        >
          Astrological Data
        </label>
        <textarea
          id="chartData"
          name="chartData" // The `name` attribute is crucial for form data
          rows={10}
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
          name="userQuestion" // The `name` attribute is crucial for form data
          type="text"
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
    </fetcher.Form>
  );
};

const ResponseDisplay = ({ fetcher }: { fetcher: any }) => {
  const isLoading =
    fetcher.state === "submitting" || fetcher.state === "loading";
  const responseData = fetcher.data;

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (responseData?.error) {
      return (
        <div className="text-red-400 bg-red-900 bg-opacity-50 p-4 rounded-lg border border-red-500">
          {responseData.error}
        </div>
      );
    }
    if (responseData?.response) {
      const formattedResponse = responseData.response.replace(/\n/g, "<br />");
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
  // The useFetcher hook manages the form submission, loading state, and data.
  const fetcher = useFetcher();

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl shadow-indigo-900/50 overflow-hidden">
        <Header />
        <main>
          <AstrologyInputForm fetcher={fetcher} />
          <ResponseDisplay fetcher={fetcher} />
        </main>
      </div>
    </div>
  );
}
