import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Add router hook
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

const HamburgerMenu = ({ onLogout }: any) => {
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
        Paste your astrological chart data and ask any question about it.
      </p>
    </div>
  </header>
);

// --- Instructions Component ---
const Instructions = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        type="button" // Prevents form submission
        onClick={() => setIsOpen(!isOpen)}
        className="text-indigo-400 hover:text-indigo-300 transition text-sm mb-2 inline-flex items-center focus:outline-none"
      >
        {isOpen ? "Hide Instructions" : "How can I get my birth data?"}
        <svg
          className={`w-4 h-4 ml-1 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-300 text-sm space-y-4 prose prose-invert prose-sm max-w-none">
          <p>
            Go to{" "}
            <a
              href="http://astrodienst.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              astrodienst.com
            </a>
            , navigate to{" "}
            <strong>Horoscopes &gt; Extended Chart Selection</strong>, and add a
            new person or select an existing one. Click "Show the Chart," then
            near the top of the page, click{" "}
            <strong>PDF Show Additional Tables</strong>. Copy everything under
            the <strong>Planetary positions</strong> section and paste it into
            the app.
          </p>
          <div>
            <p className="font-semibold text-gray-200">Example data:</p>
            <pre className="bg-gray-900 p-3 whitespace-pre-wrap rounded-md text-xs overflow-x-auto max-h-48 overflow-y-auto">
              {`Planet positions Jul.Day (http://jul.day/) 2448974.351378 TT, pT 59.1 sec Planet Longitude house Speed Latitude Declination A Sun i 26°10' 5" 9 1° 1' 5" 0° 0' 1" S 23°23' 4" S B Moon g 9°51'41" 7 13°58'27" 5° 1' 8" S 8°31' 7" S C Mercury i 7° 0'53" 8 1°21'12" 1°20'39" N 20° 9'22" S D Venus k 10°36'19" 11 1° 9'18" 2° 8'55" S 19°38'42" S E Mars d 25° 8'50"# 4 - 15'36" 3°20'39" N 24°23'34" N F Jupiter g 12° 2' 0" 7 7'12" 1°14'53" N 3°36'28" S G Saturn k 14°56'53" 11 5'33" 1° 0'50" S 17°19'15" S O Uranus j 16°50'50" 10 3'24" 0°24'40" S 22°47' 8" S I Neptune j 17°50' 3" 10 2' 9" 0°40'36" N 21°34'50" S J Pluto h 24° 8'14" 8 2' 8" 14° 7'35" N 5° 5'20" S K Mean Node i 21°10'29" 9 - 3'11" 0° 0' 0" N 23° 8'45" S L True Node i 21°29'51"D 9 14" 0° 0' 0" N 23°10' 1" S N Chiron e 23°28' 0"# 5 - 1'14" 6°58'16" S 7° 6'19" N Houses (Plac.) Declination Asc. a 7° 1'20" 2°47'15" N 2 b 14°35' 2" 16°12'50" N 3 c 11°25'45" 22° 9' 9" N IC d 4°11'10" 23°22'24" N 5 d 27°34' 1" 20°38'52" N 6 e 26°29'37" 12°41' 6" N Desc. g 7° 1'20" 2°47'15" S 8 h 14°35' 2" 16°12'50" S 9 i 11°25'45" 22° 9' 9" S MC j 4°11'10" 23°22'24" S 11 j 27°34' 1" 20°38'52" S 12 k 26°29'37" 12°41' 6" S`}
            </pre>
          </div>
          <div className="mt-4 p-3 bg-indigo-900/50 rounded-lg border border-indigo-700">
            <h4 className="font-bold text-indigo-300">Pro Tip 💡</h4>
            <p className="mt-1">
              You can put in multiple people's data to ask synastry questions.
              Just label each person with a name right above their birth data,
              and then ask something like, "What are the strengths between Mike
              and I?"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const AstrologyInputForm = ({
  onSubmit,
  isLoading,
  message,
  clearMessage,
}: any) => {
  const [chartData, setChartData] = useState("");
  const [userQuestion, setUserQuestion] = useState("");

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!chartData.trim() || !userQuestion.trim()) {
      clearMessage();
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
        <Instructions />
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

const ResponseDisplay = ({ isLoading, response, error }: any) => {
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

export default function App() {
  const navigate = useNavigate(); // ✅ Router navigation hook

  const [userId, setUserId] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        if (session && session.user) {
          setUserId(session.user.id as any);
        } else {
          navigate("/home"); // ✅ Redirect if not logged in
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error("Error fetching user session:", err.message);
        } else {
          console.error("Error fetching user session:", err);
        }
        navigate("/home");
      } finally {
        setIsUserLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    }
    navigate("/home"); // ✅ Redirect after logout
  };

  const handleAstrologyQuery = async (
    chartData: string,
    userQuestion: string
  ) => {
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
        body: JSON.stringify({
          userId: userId,
          chartData: chartData,
          userQuestion: userQuestion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `API Error: ${res.status}`);
      }

      if (!data.response) {
        throw new Error("The response from the server was empty or malformed.");
      }

      setResponse(data.response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
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
