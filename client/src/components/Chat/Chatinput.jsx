import { useState } from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 bg-gray-900 border-t border-gray-800">
      <div className="flex items-center gap-3 bg-gray-800 rounded-2xl px-4 py-2.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 resize-none outline-none max-h-32"
          style={{ lineHeight: '1.5' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={`p-2 rounded-full transition-all ${text.trim()
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-center text-gray-700 text-[10px] mt-1.5 tracking-wider">
        ENTER TO SEND · SHIFT+ENTER FOR NEW LINE
      </p>
    </div>
  );
};

export default ChatInput;