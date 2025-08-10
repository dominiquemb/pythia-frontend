import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createContext, useState, useEffect, useMemo, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { ThemeSupa } from "@supabase/auth-ui-shared";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const supabaseUrl = "https://dldezknthsmgskwvhqtk.supabase.co";
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key:", "Loaded");
const supabase = createClient(
  "https://dldezknthsmgskwvhqtk.supabase.co",
  "sb_publishable_3cMHb4mKO7j86Y1auxgcDw_hkCJViCW"
);
const SessionContext$1 = createContext({
  session: null,
  loading: true
});
const SessionProvider$1 = ({
  children
}) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: session2 } }) => {
      setSession(session2);
      setLoading(false);
    });
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session2) => {
      setSession(session2);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const value = useMemo(
    () => ({
      session,
      loading
    }),
    [session, loading]
  );
  return /* @__PURE__ */ jsx(SessionContext$1.Provider, { value, children });
};
function AuthRedirector() {
  const { session, loading } = useContext(SessionContext$1);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    console.log("AuthRedirector: Checking state...", {
      isLoading: loading,
      hasSession: !!session,
      pathname
    });
    if (loading) {
      console.log("AuthRedirector: Still loading, will not redirect yet.");
      return;
    }
    const isAuthPage = pathname === "/login" || pathname === "/home";
    if (session && isAuthPage) {
      console.log(
        "AuthRedirector: DECISION - User is logged in and on the login page. Redirecting to '/'."
      );
      navigate("/", { replace: true });
    } else {
      console.log(
        "AuthRedirector: No redirection needed based on current state."
      );
    }
  }, [session, loading, navigate, pathname]);
  return null;
}
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsxs(SessionProvider$1, {
    children: [/* @__PURE__ */ jsx(AuthRedirector, {}), " ", /* @__PURE__ */ jsx(Outlet, {})]
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const Header$1 = () => /* @__PURE__ */ jsx("header", {
  className: "p-6 bg-gray-900 text-white rounded-t-xl shadow-lg",
  children: /* @__PURE__ */ jsx("div", {
    className: "text-center",
    children: /* @__PURE__ */ jsx("h1", {
      className: "text-4xl md:text-5xl font-bold font-serif tracking-wider",
      children: "Pythia"
    })
  })
});
const home = UNSAFE_withComponentProps(function App2() {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsx("div", {
    className: "bg-gray-900 min-h-screen font-sans text-white relative",
    children: /* @__PURE__ */ jsx("div", {
      className: "p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen",
      children: /* @__PURE__ */ jsxs("div", {
        className: "w-full max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl shadow-indigo-900/50 overflow-hidden",
        children: [/* @__PURE__ */ jsx(Header$1, {}), /* @__PURE__ */ jsxs("main", {
          className: "p-8 text-center",
          children: [/* @__PURE__ */ jsx("p", {
            className: "text-gray-300 leading-relaxed max-w-2xl mx-auto text-lg",
            children: "Pythia is a free service that allows you to ask 5 astrology-related questions per day. You can ask it about your birth chart, ask it relationship questions based on synastry & composite charts, or ask it about your progressed chart. The sky's the limit."
          }), /* @__PURE__ */ jsx("div", {
            className: "mt-8",
            children: /* @__PURE__ */ jsx("button", {
              onClick: () => navigate("/login"),
              className: "px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105",
              children: "Get Started"
            })
          }), /* @__PURE__ */ jsxs("div", {
            className: "mt-16",
            children: [/* @__PURE__ */ jsx("h2", {
              className: "text-3xl font-bold text-white mb-6",
              children: "Video of Pythia in Action"
            }), /* @__PURE__ */ jsx("div", {
              className: "max-w-2xl mx-auto bg-black rounded-lg overflow-hidden shadow-xl border border-indigo-800",
              children: /* @__PURE__ */ jsx("video", {
                src: "/pythia.mp4",
                autoPlay: true,
                loop: true,
                muted: true,
                playsInline: true,
                className: "w-full",
                children: "Your browser does not support the video tag."
              })
            })]
          })]
        })]
      })
    })
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home
}, Symbol.toStringTag, { value: "Module" }));
const login = UNSAFE_withComponentProps(function Login() {
  const navigate = useNavigate();
  const [AuthComponent, setAuthComponent] = useState(null);
  useEffect(() => {
    import("@supabase/auth-ui-react").then(({
      Auth
    }) => setAuthComponent(() => Auth)).catch((error) => console.error("Failed to load Auth component", error));
  }, []);
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/", {
          replace: true
        });
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  if (!AuthComponent) {
    return null;
  }
  return /* @__PURE__ */ jsx("div", {
    className: "flex justify-center items-center h-screen bg-gray-100",
    children: /* @__PURE__ */ jsx("div", {
      className: "w-96 p-8 bg-white rounded-lg shadow-md",
      children: /* @__PURE__ */ jsx(AuthComponent, {
        supabaseClient: supabase,
        appearance: {
          theme: ThemeSupa
        },
        providers: ["github"]
      })
    })
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: login
}, Symbol.toStringTag, { value: "Module" }));
const SessionContext = createContext({
  session: null,
  loading: true
});
const SessionProvider = ({
  children
}) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session: session2
      }
    }) => {
      setSession(session2);
      setLoading(false);
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session2) => {
      setSession(session2);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    console.log("[SessionProvider] Checking auth state...", {
      loading,
      hasSession: !!session
    });
    if (!loading && !session) {
      console.error("[SessionProvider] DECISION: No session found. Redirecting to /home.");
      navigate("/home", {
        replace: true
      });
    } else {
      console.log("[SessionProvider] No redirect needed (still loading or session exists).");
    }
  }, [loading, session, navigate]);
  const value = useMemo(() => ({
    session,
    loading
  }), [session, loading]);
  return /* @__PURE__ */ jsx(SessionContext.Provider, {
    value,
    children
  });
};
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SessionContext,
  SessionProvider
}, Symbol.toStringTag, { value: "Module" }));
const LoadingSpinner = () => /* @__PURE__ */ jsx("div", {
  className: "flex justify-center items-center p-8",
  children: /* @__PURE__ */ jsx("div", {
    className: "animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"
  })
});
const HamburgerIcon = () => /* @__PURE__ */ jsx("svg", {
  className: "w-8 h-8 text-white",
  fill: "none",
  stroke: "currentColor",
  viewBox: "0 0 24 24",
  xmlns: "http://www.w3.org/2000/svg",
  children: /* @__PURE__ */ jsx("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2,
    d: "M4 6h16M4 12h16m-7 6h7"
  })
});
const HamburgerMenu = ({
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", {
    className: "relative",
    children: [/* @__PURE__ */ jsx("button", {
      onClick: () => setIsOpen(!isOpen),
      className: "p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500",
      "aria-label": "Open menu",
      children: /* @__PURE__ */ jsx(HamburgerIcon, {})
    }), isOpen && /* @__PURE__ */ jsx("div", {
      className: "absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-10 border border-gray-700",
      children: /* @__PURE__ */ jsx("button", {
        onClick: () => {
          onLogout();
          setIsOpen(false);
        },
        className: "block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500 hover:text-white transition-colors duration-200",
        children: "Log Out"
      })
    })]
  });
};
const Header = () => /* @__PURE__ */ jsx("header", {
  className: "p-6 bg-gray-900 text-white rounded-t-xl shadow-lg",
  children: /* @__PURE__ */ jsxs("div", {
    className: "text-center",
    children: [/* @__PURE__ */ jsx("h1", {
      className: "text-4xl md:text-5xl font-bold font-serif tracking-wider",
      children: "Pythia"
    }), /* @__PURE__ */ jsx("p", {
      className: "text-indigo-300 mt-3 text-lg",
      children: "Paste your astrological chart data and ask any question about it."
    })]
  })
});
const Instructions = () => {
  const [isOpen, setIsOpen] = useState(false);
  return /* @__PURE__ */ jsxs("div", {
    className: "mb-4",
    children: [/* @__PURE__ */ jsxs("button", {
      type: "button",
      onClick: () => setIsOpen(!isOpen),
      className: "text-indigo-400 hover:text-indigo-300 transition text-sm mb-2 inline-flex items-center focus:outline-none",
      children: [isOpen ? "Hide Instructions" : "How can I get my birth data?", /* @__PURE__ */ jsx("svg", {
        className: `w-4 h-4 ml-1 transform transition-transform ${isOpen ? "rotate-180" : ""}`,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        xmlns: "http://www.w3.org/2000/svg",
        children: /* @__PURE__ */ jsx("path", {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "2",
          d: "M19 9l-7 7-7-7"
        })
      })]
    }), isOpen && /* @__PURE__ */ jsxs("div", {
      className: "p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-300 text-sm space-y-4 prose prose-invert prose-sm max-w-none",
      children: [/* @__PURE__ */ jsxs("p", {
        children: ["Go to", " ", /* @__PURE__ */ jsx("a", {
          href: "http://astrodienst.com/",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-indigo-400 hover:underline",
          children: "astrodienst.com"
        }), ", navigate to", " ", /* @__PURE__ */ jsx("strong", {
          children: "Horoscopes > Extended Chart Selection"
        }), ', and add a new person or select an existing one. Click "Show the Chart," then near the top of the page, click', " ", /* @__PURE__ */ jsx("strong", {
          children: "PDF Show Additional Tables"
        }), ". Copy everything under the ", /* @__PURE__ */ jsx("strong", {
          children: "Planetary positions"
        }), " section and paste it into the app."]
      }), /* @__PURE__ */ jsxs("div", {
        children: [/* @__PURE__ */ jsx("p", {
          className: "font-semibold text-gray-200",
          children: "Example data:"
        }), /* @__PURE__ */ jsx("pre", {
          className: "bg-gray-900 p-3 whitespace-pre-wrap rounded-md text-xs overflow-x-auto max-h-48 overflow-y-auto",
          children: `Planet positions Jul.Day (http://jul.day/) 2448974.351378 TT, pT 59.1 sec Planet Longitude house Speed Latitude Declination A Sun i 26°10' 5" 9 1° 1' 5" 0° 0' 1" S 23°23' 4" S B Moon g 9°51'41" 7 13°58'27" 5° 1' 8" S 8°31' 7" S C Mercury i 7° 0'53" 8 1°21'12" 1°20'39" N 20° 9'22" S D Venus k 10°36'19" 11 1° 9'18" 2° 8'55" S 19°38'42" S E Mars d 25° 8'50"# 4 - 15'36" 3°20'39" N 24°23'34" N F Jupiter g 12° 2' 0" 7 7'12" 1°14'53" N 3°36'28" S G Saturn k 14°56'53" 11 5'33" 1° 0'50" S 17°19'15" S O Uranus j 16°50'50" 10 3'24" 0°24'40" S 22°47' 8" S I Neptune j 17°50' 3" 10 2' 9" 0°40'36" N 21°34'50" S J Pluto h 24° 8'14" 8 2' 8" 14° 7'35" N 5° 5'20" S K Mean Node i 21°10'29" 9 - 3'11" 0° 0' 0" N 23° 8'45" S L True Node i 21°29'51"D 9 14" 0° 0' 0" N 23°10' 1" S N Chiron e 23°28' 0"# 5 - 1'14" 6°58'16" S 7° 6'19" N Houses (Plac.) Declination Asc. a 7° 1'20" 2°47'15" N 2 b 14°35' 2" 16°12'50" N 3 c 11°25'45" 22° 9' 9" N IC d 4°11'10" 23°22'24" N 5 d 27°34' 1" 20°38'52" N 6 e 26°29'37" 12°41' 6" N Desc. g 7° 1'20" 2°47'15" S 8 h 14°35' 2" 16°12'50" S 9 i 11°25'45" 22° 9' 9" S MC j 4°11'10" 23°22'24" S 11 j 27°34' 1" 20°38'52" S 12 k 26°29'37" 12°41' 6" S`
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "mt-4 p-3 bg-indigo-900/50 rounded-lg border border-indigo-700",
        children: [/* @__PURE__ */ jsx("h4", {
          className: "font-bold text-indigo-300",
          children: "Pro Tip 💡"
        }), /* @__PURE__ */ jsx("p", {
          className: "mt-1",
          children: `You can put in multiple people's data to ask synastry questions. Just label each person with a name right above their birth data, and then ask something like, "What are the strengths between Mike and I?"`
        })]
      })]
    })]
  });
};
const AstrologyInputForm = ({
  onSubmit,
  isLoading,
  message,
  clearMessage
}) => {
  const [chartData, setChartData] = useState("");
  const [userQuestion, setUserQuestion] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!chartData.trim() || !userQuestion.trim()) {
      clearMessage();
      return;
    }
    onSubmit(chartData, userQuestion);
  };
  return /* @__PURE__ */ jsxs("form", {
    onSubmit: handleSubmit,
    className: "p-6 md:p-8 space-y-6",
    children: [/* @__PURE__ */ jsxs("div", {
      children: [/* @__PURE__ */ jsx("label", {
        htmlFor: "chartData",
        className: "block text-lg font-medium text-gray-200 mb-2",
        children: "Astrological Data"
      }), /* @__PURE__ */ jsx(Instructions, {}), /* @__PURE__ */ jsx("textarea", {
        id: "chartData",
        name: "chartData",
        rows: 10,
        value: chartData,
        onChange: (e) => setChartData(e.target.value),
        placeholder: "Paste your complete birth chart data here...",
        className: "w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition",
        disabled: isLoading,
        required: true
      })]
    }), /* @__PURE__ */ jsxs("div", {
      children: [/* @__PURE__ */ jsx("label", {
        htmlFor: "userQuestion",
        className: "block text-lg font-medium text-gray-200 mb-2",
        children: "Your Question"
      }), /* @__PURE__ */ jsx("input", {
        id: "userQuestion",
        name: "userQuestion",
        type: "text",
        value: userQuestion,
        onChange: (e) => setUserQuestion(e.target.value),
        placeholder: "e.g., What does my Mars in Scorpio reveal?",
        className: "w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition",
        disabled: isLoading,
        required: true
      })]
    }), message && /* @__PURE__ */ jsx("div", {
      className: "text-center text-red-400 bg-red-900 bg-opacity-50 p-3 rounded-lg border border-red-500",
      children: message
    }), /* @__PURE__ */ jsx("div", {
      className: "text-center",
      children: /* @__PURE__ */ jsx("button", {
        type: "submit",
        className: "px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105",
        disabled: isLoading,
        children: isLoading ? "Thinking..." : "Ask"
      })
    })]
  });
};
const ResponseDisplay = ({
  isLoading,
  response,
  error
}) => {
  const renderContent = () => {
    if (isLoading) {
      return /* @__PURE__ */ jsx(LoadingSpinner, {});
    }
    if (error) {
      return /* @__PURE__ */ jsx("div", {
        className: "text-red-400 bg-red-900 bg-opacity-50 p-4 rounded-lg border border-red-500",
        children: error
      });
    }
    if (response) {
      const formattedResponse = response.replace(/\n/g, "<br />");
      return /* @__PURE__ */ jsx("div", {
        className: "text-gray-300 leading-relaxed prose prose-invert max-w-none",
        dangerouslySetInnerHTML: {
          __html: formattedResponse
        }
      });
    }
    return /* @__PURE__ */ jsx("div", {
      className: "text-center text-gray-500 italic",
      children: "Enter a question above to see results here."
    });
  };
  return /* @__PURE__ */ jsxs("div", {
    className: "p-6 md:p-8 bg-gray-800 bg-opacity-50 rounded-b-xl min-h-[200px] flex flex-col justify-center",
    children: [/* @__PURE__ */ jsx("h2", {
      className: "text-2xl font-semibold text-white mb-4 border-b border-gray-600 pb-2",
      children: "Results"
    }), /* @__PURE__ */ jsx("div", {
      className: "mt-4",
      children: renderContent()
    })]
  });
};
const astrology = UNSAFE_withComponentProps(function App3() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: {
            session
          },
          error: error2
        } = await supabase.auth.getSession();
        if (error2) throw error2;
        if (session && session.user) {
          setUserId(session.user.id);
        } else {
          navigate("/home");
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
    const {
      error: error2
    } = await supabase.auth.signOut();
    if (error2) {
      console.error("Error logging out:", error2.message);
    }
    navigate("/home");
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
    const baseApiUrl = "https://dominique.cc/astrology/api";
    try {
      const res = await fetch(`${baseApiUrl}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          chartData,
          userQuestion
        })
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
    return /* @__PURE__ */ jsx(LoadingSpinner, {});
  }
  return /* @__PURE__ */ jsxs("div", {
    className: "bg-gray-900 min-h-screen font-sans text-white relative",
    children: [/* @__PURE__ */ jsx("div", {
      className: "fixed top-4 right-4 z-20",
      children: /* @__PURE__ */ jsx(HamburgerMenu, {
        onLogout: handleLogout
      })
    }), /* @__PURE__ */ jsx("div", {
      className: "p-4 sm:p-6 lg:p-8 flex items-center justify-center",
      children: /* @__PURE__ */ jsxs("div", {
        className: "w-full max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl shadow-indigo-900/50 overflow-hidden",
        children: [/* @__PURE__ */ jsx(Header, {}), /* @__PURE__ */ jsxs("main", {
          children: [/* @__PURE__ */ jsx(AstrologyInputForm, {
            onSubmit: handleAstrologyQuery,
            isLoading,
            message,
            clearMessage: () => setMessage("")
          }), /* @__PURE__ */ jsx(ResponseDisplay, {
            isLoading,
            response,
            error
          })]
        })]
      })
    })]
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: astrology
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-N-n2NEhD.js", "imports": ["/assets/jsx-runtime-80hHRZYR.js", "/assets/chunk-ZYFC6VSF-DwndViN8.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-C9KUPQOb.js", "imports": ["/assets/jsx-runtime-80hHRZYR.js", "/assets/chunk-ZYFC6VSF-DwndViN8.js", "/assets/supabaseClient-DDNOmXCv.js"], "css": ["/assets/root-Da4HrhmN.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": "home", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-BFG1bi_u.js", "imports": ["/assets/chunk-ZYFC6VSF-DwndViN8.js", "/assets/jsx-runtime-80hHRZYR.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-CJ-kXjWi.js", "imports": ["/assets/login-BD_knN6Y.js", "/assets/supabaseClient-DDNOmXCv.js", "/assets/jsx-runtime-80hHRZYR.js", "/assets/chunk-ZYFC6VSF-DwndViN8.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "protectedRoute/protectedRoute": { "id": "protectedRoute/protectedRoute", "parentId": "root", "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/protectedRoute-DvjjmIGl.js", "imports": ["/assets/jsx-runtime-80hHRZYR.js", "/assets/supabaseClient-DDNOmXCv.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/astrology": { "id": "routes/astrology", "parentId": "protectedRoute/protectedRoute", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/astrology-WTJBSksi.js", "imports": ["/assets/chunk-ZYFC6VSF-DwndViN8.js", "/assets/jsx-runtime-80hHRZYR.js", "/assets/supabaseClient-DDNOmXCv.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-9050e85b.js", "version": "9050e85b", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: "home",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "protectedRoute/protectedRoute": {
    id: "protectedRoute/protectedRoute",
    parentId: "root",
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/astrology": {
    id: "routes/astrology",
    parentId: "protectedRoute/protectedRoute",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route4
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
