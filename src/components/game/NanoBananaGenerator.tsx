import { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useGameStore } from '../../store/useGameStore';
import { GROTESQUE_ASSETS } from '../../constants/assets';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, X, Loader2, Image as ImageIcon } from 'lucide-react';

export function NanoBananaGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [targetAsset, setTargetAsset] = useState(GROTESQUE_ASSETS.SAD[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const setGeneratedAsset = useGameStore((state) => state.setGeneratedAsset);

  const generateImage = async () => {
    if (!prompt) return;
    
    // Check for API key
    if (!(window as any).aistudio?.hasSelectedApiKey()) {
      await (window as any).aistudio?.openSelectKey();
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              text: `A grotesque, bizarre, caricatured, and distorted 2D character on a transparent background. Style: 90s digital animation, gross-out humor, crunchy textures. Prompt: ${prompt}`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          const imageUrl = `data:image/png;base64,${base64Data}`;
          setGeneratedAsset(targetAsset, imageUrl);
          setIsOpen(false);
          break;
        }
      }
    } catch (error) {
      console.error('Generation failed:', error);
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        await (window as any).aistudio?.openSelectKey();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-8 pointer-events-auto z-50">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-black border-4 border-white p-4 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:bg-emerald-400 transition-colors group"
      >
        <Wand2 className="text-white group-hover:text-black" size={32} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-96 bg-black border-8 border-white p-8 shadow-[16px_16px_0px_0px_rgba(255,255,255,1)]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase italic skew-x-[-10deg] text-white">Nano Banana Lab</h3>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Target Asset</label>
                <select
                  value={targetAsset}
                  onChange={(e) => setTargetAsset(e.target.value)}
                  className="w-full bg-white text-black p-2 font-mono text-sm border-4 border-black"
                >
                  <optgroup label="SAD CLIENTS">
                    {GROTESQUE_ASSETS.SAD.map(a => <option key={a} value={a}>{a.split('/').pop()}</option>)}
                  </optgroup>
                  <optgroup label="ANGRY CLIENTS">
                    {GROTESQUE_ASSETS.ANGRY.map(a => <option key={a} value={a}>{a.split('/').pop()}</option>)}
                  </optgroup>
                  <optgroup label="BACKGROUNDS">
                    <option value={GROTESQUE_ASSETS.BACKGROUND.FLOOR}>Brutalist Floor</option>
                    <option value={GROTESQUE_ASSETS.BACKGROUND.CEILING}>Brutalist Ceiling</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Grotesque Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. melted face with leaking eyes..."
                  className="w-full bg-white text-black p-4 font-mono text-sm border-4 border-black h-32 resize-none"
                />
              </div>

              <button
                onClick={generateImage}
                disabled={isGenerating || !prompt}
                className="w-full bg-emerald-400 text-black py-4 font-black uppercase flex items-center justify-center gap-2 hover:bg-white transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" /> Distorting...
                  </>
                ) : (
                  <>
                    <ImageIcon size={20} /> Generate Asset
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-white/30 text-center uppercase tracking-tighter">
                Powered by Gemini 3.1 Flash Image
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
