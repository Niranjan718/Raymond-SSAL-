import { useState } from "react";
import { Bot, Send, X } from "lucide-react";

function AIAssistant({
  setActivePage,
  darkMode,
  setDarkMode,
  setAttendance,
  setSkillMatrix,
  setOperationBulletin,
  setOperatorAssignments,
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hi, I can control this dashboard (try: open attendance, set target 700, turn on dark mode) — or just ask me anything else!",
    },
  ]);

  function reply(text) {
    setMessages((prev) => [...prev, { from: "ai", text }]);
  }

  async function askGemini(question) {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: question }] }],
          }),
        }
      );

      const data = await response.json();

      const aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't get a response. Please try again.";

      reply(aiText);
    } catch (error) {
      reply("Something went wrong connecting to the AI. Check your internet connection and API key.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const command = input.toLowerCase();

    setMessages((prev) => [...prev, { from: "user", text: input }]);

    if (command.includes("open dashboard")) {
      setActivePage("Dashboard");
      reply("Opened Dashboard.");
    } else if (command.includes("open attendance")) {
      setActivePage("Attendance");
      reply("Opened Attendance page.");
    } else if (command.includes("open upload")) {
      setActivePage("Upload Center");
      reply("Opened Upload Center.");
    } else if (command.includes("open analytics")) {
      setActivePage("Analytics");
      reply("Opened Analytics page.");
    } else if (command.includes("open reports")) {
      setActivePage("Reports");
      reply("Opened Reports page.");
    } else if (command.includes("open settings")) {
      setActivePage("Settings");
      reply("Opened Settings page.");
    } else if (command.includes("dark mode on") || command.includes("turn on dark")) {
      setDarkMode(true);
      reply("Dark mode turned on.");
    } else if (command.includes("dark mode off") || command.includes("turn off dark")) {
      setDarkMode(false);
      reply("Dark mode turned off.");
    } else if (command.includes("toggle dark")) {
      setDarkMode(!darkMode);
      reply("Dark mode toggled.");
    } else if (command.includes("set style")) {
      const style = input.replace(/set style/i, "").trim();
      localStorage.setItem("currentStyle", style);
      reply(`Current style changed to ${style}.`);
    } else if (command.includes("set target")) {
      const number = command.match(/\d+/)?.[0];

      if (number) {
        localStorage.setItem("aiTarget", number);
        window.dispatchEvent(new Event("ai-set-target"));
        setActivePage("Dashboard");
        reply(`Target output changed to ${number} pieces/day and Dashboard opened.`);
      } else {
        reply("Please say a number. Example: set target 700");
      }
    } else if (command.includes("clear attendance")) {
      localStorage.removeItem("attendance");
      localStorage.removeItem("operatorAssignments");
      setAttendance({});
      setOperatorAssignments({});
      reply("Attendance and operator assignments cleared.");
    } else if (command.includes("clear uploaded data")) {
      localStorage.removeItem("skillMatrix");
      localStorage.removeItem("operationBulletin");
      setSkillMatrix([]);
      setOperationBulletin([]);
      reply("Uploaded Skill Matrix and OB data cleared.");
    } else {
      await askGemini(input);
    }

    setInput("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-[#071b33] text-white rounded-full p-5 shadow-2xl z-50"
      >
        <Bot size={28} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-3xl shadow-2xl border z-50 overflow-hidden">
          <div className="bg-[#071b33] text-white p-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Bot />
              <div>
                <h2 className="font-bold">Raymond AI Assistant</h2>
                <p className="text-xs text-slate-300">Dashboard controller</p>
              </div>
            </div>

            <button onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>

          <div className="p-5 h-80 overflow-y-auto space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-2xl text-sm ${
                  msg.from === "ai"
                    ? "bg-slate-100 text-slate-800"
                    : "bg-teal-600 text-white ml-10"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div className="p-3 rounded-2xl text-sm bg-slate-100 text-slate-800">
                Thinking...
              </div>
            )}
          </div>

          <div className="p-4 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Tell AI what to do..."
              className="flex-1 border rounded-xl px-3 py-2"
              disabled={loading}
            />

            <button
              onClick={sendMessage}
              className="bg-teal-600 text-white px-4 rounded-xl"
              disabled={loading}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AIAssistant;