import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Download, Loader2, ArrowLeft, XCircle } from "lucide-react";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMsg("No session ID found.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        
        const data = await res.json();
        if (data.downloadUrl) {
          setDownloadUrl(data.downloadUrl);
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Payment verification failed.");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMsg("Network error verifying payment.");
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-stone-100 p-8 text-center space-y-6">
        
        {status === "loading" && (
          <div className="space-y-4 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
            <h2 className="text-2xl font-serif font-bold text-stone-800">Verifying Payment...</h2>
            <p className="text-stone-500 text-sm">Please wait while we confirm your purchase.</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 flex flex-col items-center">
            <XCircle className="w-12 h-12 text-rose-500" />
            <h2 className="text-2xl font-serif font-bold text-stone-800">Verification Failed</h2>
            <p className="text-stone-500 text-sm">{errorMsg}</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 px-6 py-2.5 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Return Home
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6 flex flex-col items-center">
            <div className="bg-emerald-100 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">Payment Successful</h2>
              <p className="text-stone-600">Your high-resolution photo is ready.</p>
            </div>
            
            {downloadUrl && (
              <a
                href={downloadUrl}
                download="high-res-cinematic-photo.png"
                className="w-full py-4 bg-amber-500 text-stone-950 font-bold rounded-xl hover:bg-amber-400 transition shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" /> Download High Resolution
              </a>
            )}

            <button
              onClick={() => navigate("/")}
              className="text-sm text-stone-500 hover:text-stone-800 underline transition mt-4"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
