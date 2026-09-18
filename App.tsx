import React, { useState, useEffect } from "react";
import PreWeddingGen from "./components/PreWeddingGen";
import { Camera, X } from "lucide-react";
import bgImage from "./src/assets/images/studio_bg_1787479509390.jpg";

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [archivedPhotos, setArchivedPhotos] = useState<{preview: string, imageId: string}[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "archive">("create");
  const [archiveCheckoutError, setArchiveCheckoutError] = useState<
    string | null
  >(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (
        (window as any).aistudio &&
        (window as any).aistudio.hasSelectedApiKey
      ) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        // Fallback for environments without the wrapper, or assume key is set if wrapper is missing
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success after dialog interaction to avoid race conditions
      setHasApiKey(true);
    }
  };

  if (!hasApiKey) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat text-stone-900 flex flex-col items-center justify-center p-4"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-600 p-3 rounded-xl shadow-lg shadow-amber-950/40">
              <Camera className="w-8 h-8 text-stone-950" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Welcome to Cinematic PhotoCreation
          </h1>
          <p className="text-stone-700">
            To use our premium photo generation features (powered by Gemini 3
            Pro), please select a paid API key from your Google Cloud project.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-950/40"
          >
            Select API Key
          </button>
          <div className="pt-2">
            <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-500 hover:text-amber-400 underline transition-colors"
            >
              Read Billing Documentation
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat text-stone-900 flex flex-col"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-stone-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-tr from-amber-600 to-amber-500 p-2 rounded-xl shadow-md shadow-amber-950/40">
                <Camera className="w-5 h-5 text-stone-950" />
              </div>
              <span className="text-xl font-serif font-bold tracking-wide bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Cinematic PhotoCreation
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 bg-white/10 p-1 rounded-xl border border-stone-200/50 shadow-sm backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("create")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "create" ? "bg-white/5 text-stone-900 shadow-sm backdrop-blur-sm" : "text-stone-500 hover:text-stone-800"}`}
              >
                Create
              </button>
              <button
                onClick={() => setActiveTab("archive")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "archive" ? "bg-white/5 text-stone-900 shadow-sm backdrop-blur-sm" : "text-stone-500 hover:text-stone-800"}`}
              >
                Archive ({archivedPhotos.length})
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        {activeTab === "create" ? (
          <PreWeddingGen
            onGenerateSuccess={(data) =>
              setArchivedPhotos((prev) => [data, ...prev])
            }
          />
        ) : (
          <div className="space-y-12">
            <div className="text-center mb-10 space-y-3">
              <h2 className="text-4xl font-serif font-extrabold tracking-wide bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                Photo Archive
              </h2>
              <p className="text-stone-600 max-w-2xl mx-auto">
                Your past generated cinematic masterpieces.
              </p>
            </div>

            {archivedPhotos.length === 0 ? (
              <div className="text-center py-20 bg-white/10 backdrop-blur-md rounded-3xl border border-stone-200/50 shadow-sm">
                <p className="text-stone-600">
                  No photos generated yet. Head to Create to make your first
                  one!
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {archiveCheckoutError && (
                  <div className="bg-rose-500/90 text-white px-4 py-3 rounded-xl text-sm shadow-xl flex items-center justify-between backdrop-blur-sm border border-rose-400">
                    <span>{archiveCheckoutError}</span>
                    <button
                      onClick={() => setArchiveCheckoutError(null)}
                      className="text-white hover:text-rose-200 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archivedPhotos.map((photo, i) => (
                    <div
                      key={i}
                      className="group relative rounded-2xl overflow-hidden border border-stone-200 bg-white/10 backdrop-blur-md shadow-md aspect-[3/4]"
                    >
                      <img
                        src={photo.preview}
                        alt={`Archived ${i}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                        <span className="text-xs text-stone-300 font-medium tracking-wide uppercase">
                          Cinematic Render
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/create-checkout-session", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ imageId: photo.imageId }),
                              });
                              const data = await res.json();
                              if (data.url) {
                                window.open(data.url, "_blank");
                              } else {
                                setArchiveCheckoutError(
                                  data.error || "Unknown error",
                                );
                              }
                            } catch (error) {
                              console.error("Checkout error:", error);
                              setArchiveCheckoutError(
                                "Failed to start checkout.",
                              );
                            }
                          }}
                          className="bg-amber-500 text-stone-950 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors"
                        >
                          Download High Res
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="border-t border-stone-200/80 py-6 text-center text-stone-600 text-sm backdrop-blur-sm bg-white/5">
        <p>
          &copy; {new Date().getFullYear()} Cinematic PhotoCreation. Copyrights reserved. Powered by
          Google Gemini.
        </p>
      </footer>
    </div>
  );
};
export default App;
