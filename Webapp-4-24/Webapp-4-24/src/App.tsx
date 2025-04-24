import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';

interface Entry {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  location: string;
  mood: number;
}

interface DiaryContextType {
  entries: Record<string, Entry[]>;
  currentDate: string;
  setEntries: React.Dispatch<React.SetStateAction<Record<string, Entry[]>>>;
  setCurrentDate: React.Dispatch<React.SetStateAction<string>>;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

const useDiary = () => {
  const context = useContext(DiaryContext);
  if (!context) throw new Error('useDiary must be used within DiaryProvider');
  return context;
};

const useCurrentTime = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
};

const moodLabels = ['awful', 'very bad', 'bad', 'somewhat bad', 'neutral/okay', 
  'somewhat good', 'good', 'very good', 'great', 'amazing'];

const getMoodColor = (mood: number) => {
  const colors = ['#ff3333', '#ff6633', '#ff9933', '#ffcc33', '#ffff33', 
    '#ccff33', '#99ff33', '#66ff33', '#33ff66', '#33ffcc'];
  const index = Math.round(mood) - 1;
  return colors[index] || '#cccccc';
};

const EntryDialog: React.FC<{
  entry: Partial<Entry>;
  onSave: (entry: Entry) => void;
  onClose: () => void;
}> = ({ entry, onSave, onClose }) => {
  const [timestamp, setTimestamp] = useState(entry.timestamp || new Date().toISOString());
  const [location, setLocation] = useState(entry.location || '');
  const [mood, setMood] = useState(entry.mood || 5);

  const handleSave = () => {
    onSave({
      id: entry.id || Date.now().toString(),
      title: entry.title || '',
      content: entry.content || '',
      timestamp,
      location,
      mood,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg relative max-w-md w-full">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 border border-red-500 rounded-full w-6 h-6 flex items-center justify-center">X</button>
        <div className="mb-4">
          <label className="block mb-2">When did this happen?</label>
          <input
            type="datetime-local"
            value={timestamp.slice(0, 16)}
            onChange={(e) => setTimestamp(new Date(e.target.value).toISOString())}
            className="border p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Where did this happen?</label>
          <input
            type="text"
            placeholder="a location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">How do you feel?</label>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-full"
              style={{ background: `linear-gradient(to right, ${getMoodColor(1)} 0%, ${getMoodColor(10)} 100%)` }}
            />
            <div className="flex justify-between text-xs mt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <span key={num}>{num}</span>
              ))}
            </div>
            <div className="mt-2 text-center">{moodLabels[Math.round(mood) - 1]}</div>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="bg-green-500 text-white p-2 rounded-full w-8 h-8 flex items-center justify-center"
        >
          ✓
        </button>
      </div>
    </div>
  );
};

const CalendarDialog: React.FC<{
  onClose: () => void;
  onDateSelect: (date: string) => void;
}> = ({ onClose, onDateSelect }) => {
  const { entries, currentDate } = useDiary();
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const [showYearView, setShowYearView] = useState(false);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMoodForDate = (date: string) => {
    const dayEntries = entries[date] || [];
    if (!dayEntries.length) return null;
    const avgMood = dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length;
    return { mood: avgMood, color: getMoodColor(avgMood) };
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDay = getFirstDayOfMonth(viewDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array(firstDay).fill(null);

    return (
      <div className="bg-white p-6 rounded-lg relative max-w-md w-full">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 border border-red-500 rounded-full w-6 h-6 flex items-center justify-center">X</button>
        <div className="flex justify-between mb-4">
          <button onClick={() => setShowYearView(true)}>{viewDate.getFullYear()}</button>
          <div>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>&lt;</button>
            <span className="mx-2">{viewDate.toLocaleString('default', { month: 'long' })}</span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>&gt;</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="text-xs">{day}</div>
          ))}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}
          {days.map((day) => {
            const dateStr = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().split('T')[0];
            const moodData = getMoodForDate(dateStr);
            return (
              <button
                key={day}
                onClick={() => onDateSelect(dateStr)}
                className="h-8 rounded"
                style={{ backgroundColor: moodData?.color || '#f0f0f0' }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    return (
      <div className="bg-white p-6 rounded-lg relative max-w-4xl w-full">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 border border-red-500 rounded-full w-6 h-6 flex items-center justify-center">X</button>
        <div className="grid grid-cols-4 gap-4">
          {months.map((month) => {
            const monthDate = new Date(viewDate.getFullYear(), month, 1);
            const daysInMonth = getDaysInMonth(monthDate);
            return (
              <div key={month} className="border p-2">
                <div className="text-center mb-2">{monthDate.toLocaleString('default', { month: 'long' })}</div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dateStr = new Date(viewDate.getFullYear(), month, i + 1).toISOString().split('T')[0];
                    const moodData = getMoodForDate(dateStr);
                    return (
                      <div
                        key={i}
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: moodData?.color || '#f0f0f0' }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {showYearView ? renderYearView() : renderMonthView()}
    </div>
  );
};

const EntryEditor: React.FC<{
  initialEntry?: Partial<Entry>;
  onSave: (entry: Entry) => void;
  onCancel: () => void;
}> = ({ initialEntry, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [showDialog, setShowDialog] = useState(false);
  const [discardState, setDiscardState] = useState<'initial' | 'warning'>('initial');

  const handleDiscard = () => {
    if (discardState === 'initial') {
      setDiscardState('warning');
    } else {
      setTitle('');
      setContent('');
      setDiscardState('initial');
    }
  };

  const handleBlur = () => {
    if (discardState === 'warning') {
      setDiscardState('initial');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" onClick={handleBlur}>
      <input
        type="text"
        placeholder="a title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-2/3 text-2xl mb-2 bg-transparent focus:outline-none"
      />
      <div className="w-2/3 border-b mb-4" />
      <textarea
        placeholder="an event..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-2/3 h-64 bg-transparent focus:outline-none resize-none"
      />
      {content && (
        <div className="fixed bottom-8 right-8 flex gap-4">
          <button
            onClick={handleDiscard}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              discardState === 'warning' ? 'bg-red-200' : 'bg-gray-200'
            }`}
          >
            🗑️
          </button>
          <button
            onClick={() => setShowDialog(true)}
            className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center"
          >
            ✓
          </button>
        </div>
      )}
      {showDialog && (
        <EntryDialog
          entry={{ id: initialEntry?.id, title, content }}
          onSave={onSave}
          onClose={() => setShowDialog(false)}
        />
      )}
    </div>
  );
};

const Overview: React.FC = () => {
  const { entries, currentDate, setCurrentDate } = useDiary();
  const [editingEntry, setEditingEntry] = useState<Partial<Entry> | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const currentEntries = entries[currentDate] || [];
  const avgMood = currentEntries.length
    ? currentEntries.reduce((sum, entry) => sum + entry.mood, 0) / currentEntries.length
    : 5;

  const handleSave = (entry: Entry) => {
    const updatedEntries = { ...entries };
    if (!updatedEntries[currentDate]) updatedEntries[currentDate] = [];
    const existingIndex = updatedEntries[currentDate].findIndex((e) => e.id === entry.id);
    if (existingIndex >= 0) {
      updatedEntries[currentDate][existingIndex] = entry;
    } else {
      updatedEntries[currentDate].push(entry);
    }
    setEntries(updatedEntries);
    setEditingEntry(null);
  };

  if (editingEntry) {
    return (
      <EntryEditor
        initialEntry={editingEntry}
        onSave={handleSave}
        onCancel={() => setEditingEntry(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="w-64 bg-gray-100 p-4">
        <button
          onClick={() => setShowCalendar(true)}
          className="absolute top-4 left-4 border rounded-full w-8 h-8 flex items-center justify-center"
        >
          📅
        </button>
        <h1 className="font-bold text-xl mt-12">Reflection</h1>
        <div className="text-gray-500 text-sm">
          {new Date(currentDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="mb-4">Average mood: {moodLabels[Math.round(avgMood) - 1]}</div>
        <div className="grid grid-cols-3 gap-4">
          {currentEntries.map((entry) => (
            <div key={entry.id} className="border p-4 rounded relative group">
              <button
                onClick={() => setEditingEntry(entry)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center"
              >
                ✏️
              </button>
              <div onClick={() => setEditingEntry(entry)} className="cursor-pointer">
                <h3 className="font-bold">{entry.title}</h3>
                <p className="text-sm line-clamp-3">{entry.content}</p>
              </div>
            </div>
          ))}
          <button
            onClick={() => setEditingEntry({})}
            className="border rounded-full w-12 h-12 flex items-center justify-center self-start"
          >
            +
          </button>
        </div>
      </div>
      {showCalendar && (
        <CalendarDialog
          onClose={() => setShowCalendar(false)}
          onDateSelect={(date) => {
            setCurrentDate(date);
            setShowCalendar(false);
          }}
        />
      )}
    </div>
  );
};

const Landing: React.FC<{ onReflect: () => void; onReview: () => void }> = ({ onReflect, onReview }) => {
  const time = useCurrentTime();
  const formattedTime = time.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(/, (\d{2}):/, ', $1:');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-4">Reflection</h1>
      <div className="text-lg mb-8">{formattedTime}</div>
      <div className="flex gap-4">
        <button onClick={onReflect} className="bg-blue-500 text-white px-6 py-2 rounded">Let's reflect</button>
        <button onClick={onReview} className="bg-gray-500 text-white px-6 py-2 rounded">Let's review</button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [entries, setEntries] = useState<Record<string, Entry[]>>({});
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'landing' | 'editor' | 'overview'>('landing');
  const [editingEntry, setEditingEntry] = useState<Partial<Entry> | null>(null);

  const handleSave = useCallback((entry: Entry) => {
    const updatedEntries = { ...entries };
    const date = entry.timestamp.split('T')[0];
    if (!updatedEntries[date]) updatedEntries[date] = [];
    const existingIndex = updatedEntries[date].findIndex((e) => e.id === entry.id);
    if (existingIndex >= 0) {
      updatedEntries[date][existingIndex] = entry;
    } else {
      updatedEntries[date].push(entry);
    }
    setEntries(updatedEntries);
    setCurrentDate(date);
    setView('overview');
    setEditingEntry(null);
  }, [entries]);

  const contextValue = useMemo(() => ({
    entries,
    currentDate,
    setEntries,
    setCurrentDate,
  }), [entries, currentDate]);

  if (view === 'editor' || editingEntry) {
    return (
      <DiaryContext.Provider value={contextValue}>
        <EntryEditor
          initialEntry={editingEntry || {}}
          onSave={handleSave}
          onCancel={() => {
            setView('overview');
            setEditingEntry(null);
          }}
        />
      </DiaryContext.Provider>
    );
  }

  return (
    <DiaryContext.Provider value={contextValue}>
      {view === 'landing' ? (
        <Landing
          onReflect={() => {
            setEditingEntry({});
            setView('editor');
          }}
          onReview={() => setView('overview')}
        />
      ) : (
        <Overview />
      )}
    </DiaryContext.Provider>
  );
};

export default App;