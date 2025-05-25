
import React from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const emojiCategories = {
    'Frequentes': ['😊', '😂', '❤️', '👍', '👎', '😭', '😘', '😍', '🤔', '👏'],
    'Pessoas': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚'],
    'Natureza': ['🌱', '🌿', '🍀', '🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌾', '🌵', '🌲', '🌳', '🌴', '🎋', '🎍', '🌊', '💧', '⭐', '🌟'],
    'Objetos': ['📱', '💻', '⌨️', '🖱️', '🖥️', '📺', '📷', '📹', '🎥', '📞', '☎️', '📠', '📧', '📮', '📬', '📭', '📫', '📪', '📤', '📥'],
    'Símbolos': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️']
  };

  return (
    <div className="p-4 max-h-80 overflow-y-auto">
      {Object.entries(emojiCategories).map(([category, emojis]) => (
        <div key={category} className="mb-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
          <div className="grid grid-cols-8 gap-1">
            {emojis.map((emoji, index) => (
              <button
                key={`${category}-${index}`}
                onClick={() => onEmojiSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmojiPicker;
