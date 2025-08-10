import React from "react";
import { useNavigate } from "react-router-dom"; // Add router hook

// --- Helper & Icon Components ---
const Header = () => (
  <header className="p-6 bg-gray-900 text-white rounded-t-xl shadow-lg">
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-wider">
        Pythia
      </h1>
    </div>
  </header>
);

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white relative">
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl shadow-indigo-900/50 overflow-hidden">
          <Header />
          <main className="p-8 text-center">
            <p className="text-gray-300 leading-relaxed max-w-2xl mx-auto text-lg">
              Pythia is a free service that allows you to ask 5
              astrology-related questions per day. You can ask it about your
              birth chart, ask it relationship questions based on synastry &
              composite charts, or ask it about your progressed chart. The sky's
              the limit.
            </p>

            <div className="mt-8">
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </button>
            </div>

            {/* Pythia in Action Video Section */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-white mb-6">
                Video of Pythia in Action
              </h2>
              <div className="max-w-2xl mx-auto bg-black rounded-lg overflow-hidden shadow-xl border border-indigo-800">
                <video
                  src="/pythia.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
