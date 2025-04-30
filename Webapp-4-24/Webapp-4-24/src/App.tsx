import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrash, FaCheck, FaTimes, FaPlus, FaPencilAlt, FaCalendarAlt } from 'react-icons/fa';

/**
 * Interface for diary entry data structure
 * Contains all information about a single reflection entry
 */
interface Entry {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  location: string;
  mood: number;
}

/**
 * Type definition for the Diary Context
 * Provides diary state and functions to child components
 */
interface DiaryContextType {
  entries: Record<string, Entry[]>;
  currentDate: string;
  setEntries: React.Dispatch<React.SetStateAction<Record<string, Entry[]>>>;
  setCurrentDate: React.Dispatch<React.SetStateAction<string>>;
}

// Create context for global diary state management
const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

/**
 * Custom hook to access DiaryContext
 * Provides type-safe access to diary state and functions
 */
const useDiary = () => {
  const context = useContext(DiaryContext);
  if (!context) throw new Error("useDiary must be used within DiaryProvider");
  return context;
};

/**
 * Custom hook that provides current time with automatic updates
 * Returns a Date object that updates every second
 */
const useCurrentTime = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
};

const moodLabels = [
  "awful",
  "very bad",
  "bad",
  "somewhat bad",
  "neutral/okay",
  "somewhat good",
  "good",
  "very good",
  "great",
  "amazing",
];

const getMoodColor = (mood: number) => {
  const colors = [
    "#ff3333",
    "#ff6633",
    "#ff9933",
    "#ffcc33",
    "#ffff33",
    "#ccff33",
    "#66ff33",
    "#33cc66",
    "#33aaff",
    "#3399ff",
  ];
  const index = Math.round(mood) - 1;
  return colors[index] || "#cccccc";
};

/**
 * Function to consistently format dates as YYYY-MM-DD
 * Prevents timezone issues when storing and comparing dates
 */
const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Dialog component for editing entry details
 * Allows configuring timestamp, location, and mood for an entry
 */
const EntryDialog: React.FC<{
  entry: Partial<Entry>;
  onSave: (entry: Entry) => void;
  onClose: () => void;
}> = ({ entry, onSave, onClose }) => {
  const [timestamp, setTimestamp] = useState(
    entry.timestamp || new Date().toISOString(),
  );
  const [location, setLocation] = useState(entry.location || "");
  const [mood, setMood] = useState(entry.mood || 5);

  // Format datetime-local string correctly for the input element
  const getLocalDatetimeString = () => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSave = () => {
    if (!entry.id || !entry.title) return;
    
    const completedEntry: Entry = {
      id: entry.id,
      title: entry.title || "",
      content: entry.content || "",
      timestamp,
      location,
      mood,
    };
    
    onSave(completedEntry);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white p-6 rounded-lg relative max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Entry Details</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <FaTimes />
          </motion.button>
        </div>
        <div className="mb-4">
          <label className="block mb-2">When did this happen?</label>
          <input
            type="datetime-local"
            value={getLocalDatetimeString()}
            onChange={(e) => {
              const selectedDate = new Date(e.target.value);
              setTimestamp(selectedDate.toISOString());
            }}
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
            <div className="flex justify-between text-xl mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <span key={num}>{num}</span>
              ))}
            </div>
            <div className="mb-4 relative">
              <div
                className="h-2 rounded-full w-full"
                style={{
                  background: "linear-gradient(to right, #ff3333, #ff6633, #ff9933, #ffcc33, #ffff33, #ccff33, #66ff33, #33cc66, #33aaff)",
                }}
              ></div>
              <div
                className="absolute w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-lg -translate-x-1/2"
                style={{
                  left: `${((mood - 1) / 9) * 100}%`,
                  top: "-13px",
                }}
              ></div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="mt-6 text-center">
              {moodLabels[Math.round(mood) - 1]}
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Save Entry
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

/**
 * Calendar dialog component for date selection
 * Displays entries by date with color-coded mood indicators
 * Supports month and year views for easy navigation
 */
const CalendarDialog: React.FC<{
  onClose: () => void;
  onDateSelect: (date: string) => void;
}> = ({ onClose, onDateSelect }) => {
  const { entries, currentDate } = useDiary();
  const [viewDate, setViewDate] = useState(() => {
    // Parse the currentDate string directly to avoid timezone issues
    const [year, month, day] = currentDate.split('-').map(num => parseInt(num));
    return new Date(year, month - 1, day);
  });
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
    const avgMood =
      dayEntries.reduce((sum, entry) => sum + entry.mood, 0) /
      dayEntries.length;
    return { mood: avgMood, color: getMoodColor(avgMood) };
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDay = getFirstDayOfMonth(viewDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array(firstDay).fill(null);

    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white p-6 rounded-lg relative max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowYearView(true)}
          >
            {viewDate.getFullYear()}
          </motion.button>
          <div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1),
                )
              }
            >
              &lt;
            </motion.button>
            <span className="mx-2">
              {viewDate.toLocaleString("default", { month: "long" })}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() =>
                setViewDate(
                  new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1),
                )
              }
            >
              &gt;
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <FaTimes />
          </motion.button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-xs">
              {day}
            </div>
          ))}
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}
          {days.map((day) => {
            // Get a date object for this day and format it consistently
            const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
            const dateStr = formatDateString(date);
            const moodData = getMoodForDate(dateStr);
            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDateSelect(dateStr)}
                className="h-8 rounded"
                style={{ backgroundColor: moodData?.color || "#f0f0f0" }}
              >
                {day}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white p-6 rounded-lg relative max-w-4xl w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{viewDate.getFullYear()}</h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <FaTimes />
          </motion.button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {months.map((month) => {
            const monthDate = new Date(viewDate.getFullYear(), month, 1);
            const daysInMonth = getDaysInMonth(monthDate);
            const firstDay = getFirstDayOfMonth(monthDate);
            const emptyDays = Array(firstDay).fill(null);
            
            return (
              <motion.div 
                key={month} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: month * 0.02 }}
                className="border p-2"
              >
                <div className="text-center mb-2">
                  {monthDate.toLocaleString("default", { month: "long" })}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Day headers */}
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div key={`header-${i}`} className="text-xs text-gray-500">
                      {day}
                    </div>
                  ))}
                  
                  {/* Empty cells for first row alignment */}
                  {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} className="h-4 w-4" />
                  ))}
                  
                  {/* Days with numbers */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    // Get a date object for this day and format it consistently
                    const date = new Date(viewDate.getFullYear(), month, i + 1);
                    const dateStr = formatDateString(date);
                    const moodData = getMoodForDate(dateStr);
                    return (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.2 }}
                        className="h-4 w-4 rounded text-[6px] flex items-center justify-center cursor-pointer"
                        style={{
                          backgroundColor: moodData?.color || "#f0f0f0",
                        }}
                        onClick={() => onDateSelect(dateStr)}
                      >
                        {i + 1}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <AnimatePresence mode="wait">
        {showYearView ? renderYearView() : renderMonthView()}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Entry editor component for creating and editing diary entries
 * Provides text fields for title and content with a minimalist interface
 * Handles saving and discarding entries with confirmation
 */
const EntryEditor: React.FC<{
  initialEntry?: Partial<Entry>;
  onSave: (entry: Entry) => void;
  onCancel: () => void;
}> = ({ initialEntry, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [showDialog, setShowDialog] = useState(false);
  const [discardState, setDiscardState] = useState<"initial" | "warning">(
    "initial",
  );

  const handleDiscard = () => {
    if (discardState === "initial") {
      setDiscardState("warning");
    } else {
      onCancel();
    }
  };

  const handleBlur = () => {
    if (discardState === "warning") {
      setDiscardState("initial");
    }
  };

  const handleDialogSave = (dialogEntry: Entry) => {
    onSave(dialogEntry);
    setShowDialog(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-4"
      onClick={handleBlur}
    >
      <div className="w-1/3 relative">
        <motion.input
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          type="text"
          placeholder="a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl mb-2 bg-transparent focus:outline-none"
        />
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full border-b mb-4" 
        />
        <motion.textarea
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          placeholder="an event..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-64 bg-transparent focus:outline-none resize-none"
        />
        
        {content && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-2 right-2 flex gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDiscard}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                discardState === "warning" ? "bg-red-200" : "bg-gray-200"
              }`}
            >
              <FaTrash className="text-gray-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowDialog(true)}
              className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center"
            >
              <FaCheck />
            </motion.button>
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {showDialog && (
          <EntryDialog
            entry={{ 
              id: initialEntry?.id || Date.now().toString(), 
              title, 
              content,
              timestamp: initialEntry?.timestamp || new Date().toISOString(),
              location: initialEntry?.location || "",
              mood: initialEntry?.mood || 5
            }}
            onSave={handleDialogSave}
            onClose={() => setShowDialog(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Overview component that displays all entries for the selected date
 * Shows a grid of entry cards with edit capabilities
 * Provides navigation to calendar and entry creation
 */
const Overview: React.FC = () => {
  const { entries, currentDate, setCurrentDate, setEntries } = useDiary();
  const [editingEntry, setEditingEntry] = useState<Partial<Entry> | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Partial<Entry> | null>(null);

  const currentEntries = entries[currentDate] || [];
  
  // Format date consistently for display by manually parsing the YYYY-MM-DD format
  const formatDisplayDate = (dateString: string) => {
    // Parse from YYYY-MM-DD format directly
    const [year, month, day] = dateString.split('-').map(num => parseInt(num));
    
    // Create date with correct values (month is 0-indexed in JS Date)
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  // Debug date formats - can be removed after fixing
  useEffect(() => {
    console.log("Current date string:", currentDate);
    const [year, month, day] = currentDate.split('-').map(num => parseInt(num));
    const manualDate = new Date(year, month - 1, day);
    const standardDate = new Date(currentDate);
    
    console.log("Manual parsed date:", manualDate.toDateString());
    console.log("Standard parsed date:", standardDate.toDateString());
    console.log("Formatted display date:", formatDisplayDate(currentDate));
  }, [currentDate]);

  const handleSave = (entry: Entry) => {
    const updatedEntries = { ...entries };
    
    // Use our consistent date formatting function to avoid timezone issues
    const entryDate = new Date(entry.timestamp);
    const date = formatDateString(entryDate);
    
    if (!updatedEntries[date]) updatedEntries[date] = [];
    
    const existingIndex = updatedEntries[date].findIndex(
      (e) => e.id === entry.id,
    );
    
    if (existingIndex >= 0) {
      updatedEntries[date][existingIndex] = entry;
    } else {
      updatedEntries[date].push(entry);
    }
    
    setEntries(updatedEntries);
    setCurrentDate(date);
    setEditingEntry(null);
    setShowEntryDialog(false);
    setSelectedEntry(null);
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setShowEntryDialog(false);
    setSelectedEntry(null);
  };

  const handleEditClick = (e: React.MouseEvent, entry: Entry) => {
    e.stopPropagation();
    setSelectedEntry(entry);
    setShowEntryDialog(true);
  };

  if (editingEntry) {
    return (
      <EntryEditor
        initialEntry={editingEntry}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex"
    >
      <div className="w-16 bg-gray-100 p-4">
        <button
          onClick={() => setShowCalendar(true)}
          className="absolute top-4 left-4 border rounded-full w-8 h-8 flex items-center justify-center"
        >
          <FaCalendarAlt className="text-gray-700" />
        </button>
      </div>
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">Reflection</h1>
          <div className="text-sm text-gray-500 mb-6">
            {formatDisplayDate(currentDate)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {currentEntries.map((entry) => (
              <motion.div 
                key={entry.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border p-4 rounded-lg shadow h-48 relative group overflow-hidden"
                onClick={() => setEditingEntry(entry)}
              >
                <button
                  onClick={(e) => handleEditClick(e, entry)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white rounded-full p-1 shadow"
                >
                  <FaPencilAlt className="text-gray-600" />
                </button>
                <div className="cursor-pointer h-full">
                  <h3 className="font-bold truncate">{entry.title}</h3>
                  <p className="text-sm h-32 overflow-hidden">{entry.content}</p>
                </div>
              </motion.div>
            ))}
            <div className="h-48 flex items-center justify-center">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setEditingEntry({id: Date.now().toString()})}
                className="w-14 h-14 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 shadow-sm"
              >
                <FaPlus size={20} />
              </motion.button>
            </div>
          </div>
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

      {showEntryDialog && selectedEntry && (
        <EntryDialog
          entry={selectedEntry}
          onSave={handleSave}
          onClose={handleCancel}
        />
      )}
    </motion.div>
  );
};

/**
 * Landing page component with time display and navigation options
 * Entry point to the application with reflect and review options
 */
const Landing: React.FC<{ onReflect: () => void; onReview: () => void }> = ({
  onReflect,
  onReview,
}) => {
  const time = useCurrentTime();
  const formattedTime = time
    .toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/, (\d{2}):/, ", $1:");

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center"
    >
      <motion.h1 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-9xl font-bold mb-4"
      >
        Reflection
      </motion.h1>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg mb-8"
      >
        {formattedTime}
      </motion.div>
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReflect}
          className="border-2 border-gray-800 text-gray-800 px-6 py-2 rounded-full"
        >
          Let's reflect
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReview}
          className="border-2 border-gray-800 text-gray-800 px-6 py-2 rounded-full"
        >
          Let's review
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * Main application component
 * Manages global state through context provider
 * Controls view transitions between landing, editor, and overview
 */
const App: React.FC = () => {
  const [entries, setEntries] = useState<Record<string, Entry[]>>({});
  const [currentDate, setCurrentDate] = useState(
    formatDateString(new Date())
  );
  const [view, setView] = useState<"landing" | "editor" | "overview">(
    "landing",
  );
  const [editingEntry, setEditingEntry] = useState<Partial<Entry> | null>(null);

  const handleSave = useCallback(
    (entry: Entry) => {
      const updatedEntries = { ...entries };
      
      // Use our consistent date formatting function to avoid timezone issues
      const entryDate = new Date(entry.timestamp);
      const date = formatDateString(entryDate);
      
      if (!updatedEntries[date]) updatedEntries[date] = [];
      
      const existingIndex = updatedEntries[date].findIndex(
        (e) => e.id === entry.id,
      );
      
      if (existingIndex >= 0) {
        updatedEntries[date][existingIndex] = entry;
      } else {
        updatedEntries[date].push(entry);
      }
      
      setEntries(updatedEntries);
      setCurrentDate(date);
      setView("overview");
      setEditingEntry(null);
    },
    [entries],
  );

  const handleCancel = useCallback(() => {
    setView("overview");
    setEditingEntry(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      entries,
      currentDate,
      setEntries,
      setCurrentDate,
    }),
    [entries, currentDate],
  );

  return (
    <DiaryContext.Provider value={contextValue}>
      <AnimatePresence mode="wait">
        {view === "landing" ? (
          <Landing
            onReflect={() => {
              setEditingEntry({});
              setView("editor");
            }}
            onReview={() => setView("overview")}
          />
        ) : view === "editor" || editingEntry ? (
          <EntryEditor
            initialEntry={editingEntry || {}}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <Overview />
        )}
      </AnimatePresence>
    </DiaryContext.Provider>
  );
};

export default App;
