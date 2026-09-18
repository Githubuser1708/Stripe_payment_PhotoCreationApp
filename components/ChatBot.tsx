import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Send, User, Bot, Loader2 } from 'lucide-react';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add initial greeting
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: 'Hello! I am your AI photo assistant. Ask me anything about photo concepts, model poses, lighting setups, or style tips.',
        timestamp: Date.now(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const responseText = await sendChatMessage(history, userMsg.text);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error: any) {
      console.error('Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: error?.message || "I'm sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center">
          <Bot className="w-6 h-6 text-stone-950" />
        </div>
        <div>
          <h3 className="font-serif text-lg text-amber-100">Photo Creation AI Assistant</h3>
          <p className="text-xs text-stone-400">Powered by Gemini 3 Pro</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-stone-700' : 'bg-amber-600'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-stone-200" />
              ) : (
                <Bot className="w-4 h-4 text-stone-950" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-stone-800 text-stone-100 rounded-tr-none border border-stone-700'
                  : 'bg-amber-950/50 text-amber-100 rounded-tl-none border border-amber-900/60'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
             <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center shrink-0">
               <Bot className="w-4 h-4 text-stone-950" />
             </div>
             <div className="bg-amber-950/50 px-4 py-3 rounded-2xl rounded-tl-none border border-amber-900/60">
               <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-stone-950 border-t border-stone-800">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about photography themes, model poses, lighting..."
            className="w-full bg-stone-900 text-stone-100 rounded-xl pl-4 pr-12 py-3 border border-stone-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-stone-500 transition-all text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg disabled:opacity-50 disabled:hover:bg-amber-600 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;