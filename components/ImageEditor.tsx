import React, { useState } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64, getMimeType } from '../utils/fileUtils';
import { Upload, Wand2, Loader2, Image as ImageIcon, Download } from 'lucide-react';

const ImageEditor: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const base64 = await fileToBase64(file);
        setSelectedImage({ base64, mimeType: getMimeType(file) });
        setResultImage(null); // Reset result when new image is picked
      } catch (err) {
        console.error("Failed to load image", err);
      }
    }
  };

  const handleEdit = async () => {
    if (!selectedImage || !prompt.trim()) return;

    setIsProcessing(true);
    try {
      const result = await editImage(selectedImage.base64, selectedImage.mimeType, prompt);
      setResultImage(result);
    } catch (error) {
      alert("Failed to edit image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif text-stone-100">Magic Editor</h2>
        <p className="text-stone-400">Powered by Gemini 2.5 Flash</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 shadow-xl">
            <h3 className="text-lg font-medium text-stone-200 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-500" />
              Upload Source
            </h3>
            
            <div className="relative group">
              {selectedImage ? (
                <div className="relative rounded-xl overflow-hidden aspect-square bg-stone-950 border border-stone-700">
                   <img src={`data:${selectedImage.mimeType};base64,${selectedImage.base64}`} alt="Source" className="w-full h-full object-contain" />
                   <button 
                    onClick={() => { setSelectedImage(null); setResultImage(null); }}
                    className="absolute top-2 right-2 bg-stone-950/80 text-white p-1 rounded-full hover:bg-amber-600 transition-colors"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                   </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-stone-700 rounded-xl cursor-pointer hover:border-amber-500 hover:bg-stone-800/50 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-12 h-12 text-stone-500 mb-3" />
                    <p className="mb-2 text-sm text-stone-400"><span className="font-semibold">Click to upload</span></p>
                    <p className="text-xs text-stone-500">PNG, JPG</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 shadow-xl">
             <label className="block text-sm font-medium text-stone-300 mb-2">
                How should we edit this image?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., 'Add a warm golden vintage filter', 'Enhance portrait lighting', 'Make background soft bokeh'..."
                className="w-full bg-stone-950 text-stone-100 rounded-xl p-3 border border-stone-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-stone-600 h-28 resize-none"
              />
              <button
                onClick={handleEdit}
                disabled={!selectedImage || !prompt.trim() || isProcessing}
                className="w-full mt-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-semibold py-3 px-4 rounded-xl shadow-lg shadow-amber-950/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Edit
                  </>
                )}
              </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 shadow-xl flex flex-col h-full">
            <h3 className="text-lg font-medium text-stone-200 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-500" />
              Result
            </h3>
            <div className="flex-1 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-center overflow-hidden min-h-[300px]">
              {isProcessing ? (
                <div className="text-center space-y-3">
                  <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
                  <p className="text-stone-400 text-sm animate-pulse">Gemini is working its magic...</p>
                </div>
              ) : resultImage ? (
                <div className="relative w-full h-full group">
                   <img src={resultImage} alt="Edited Result" className="w-full h-full object-contain" />
                   <a 
                     href={resultImage} 
                     download="edited-image.png"
                     className="absolute bottom-4 right-4 bg-amber-500 hover:bg-amber-400 text-stone-950 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Download className="w-6 h-6" />
                   </a>
                </div>
              ) : (
                <p className="text-stone-500 text-sm">Edited image will appear here</p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;