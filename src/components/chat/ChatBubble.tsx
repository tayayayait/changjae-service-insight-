import React from 'react';
import { ChatMessage } from '../../types/result';
import ReactMarkdown from 'react-markdown';
import { User, Sparkles } from 'lucide-react';

interface ChatBubbleProps {
    message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
    const isUser = message.role === "user";

    return (
        <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="flex-shrink-0 mr-3 mt-1">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/20">
                        <Sparkles size={16} className="text-purple-400" />
                    </div>
                </div>
            )}

            <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm
          ${isUser
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm'
                        : 'bg-zinc-800/80 border border-zinc-700 text-zinc-100 rounded-tl-sm backdrop-blur-sm'
                    }`}
            >
                {isUser ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700 prose-strong:text-purple-300">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                )}
            </div>

            {isUser && (
                <div className="flex-shrink-0 ml-3 mt-1">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center border border-indigo-500/30">
                        <User size={16} className="text-indigo-200" />
                    </div>
                </div>
            )}
        </div>
    );
};
