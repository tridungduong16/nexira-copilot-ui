import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  BarChart3, 
  FileText,
  Headphones,
  Users,
  Target,
  TrendingUp,
  Clock,
  Star,
  Mic
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import AgentConfigPanel from './ui/AgentConfigPanel';
import { useTheme } from '../contexts/ThemeContext';
import { trackToolUsage } from './tracking/tracker';
import AgentHeader from './ui/AgentHeader';
import AgentMainContent from './ui/AgentMainContent';



const TelesalesAgentPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [status, setStatus] = useState("Disconnected");
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
  
    const [sentenceCount, setSentenceCount] = useState(0);
    const [messageCount, setMessageCount] = useState(0);
    const [summaryCount, setSummaryCount] = useState(0);
  
    const [messages, setMessages] = useState<any[]>([]);
    const [summaries, setSummaries] = useState<any[]>([]);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const visualizerRef = useRef<HTMLDivElement>(null);
  
    const { resolvedTheme } = useTheme();

    useEffect(() => {
    if (visualizerRef.current) {
        visualizerRef.current.innerHTML = ""; // clear any previous
        for (let i = 0; i < 20; i++) {
        const bar = document.createElement("div");
        bar.className = "audio-bar";
        bar.style.width = "4px";
        bar.style.borderRadius = "2px";
        bar.style.background = "linear-gradient(to top, #667eea, #764ba2)";
        bar.style.height = "5px";
        visualizerRef.current.appendChild(bar);
        }
    }
    }, []);

    const wsUrl = import.meta.env.VITE_WS_URL || "";
    const updateVisualizer = (dataArray: Float32Array) => {
        if (!visualizerRef.current) return;
        const bars = visualizerRef.current.querySelectorAll<HTMLDivElement>(".audio-bar");
        const bufferLength = dataArray.length;
        const barCount = bars.length;
        const samplesPerBar = Math.floor(bufferLength / barCount);
      
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < samplesPerBar; j++) {
            sum += Math.abs(dataArray[i * samplesPerBar + j]);
          }
          const avg = sum / samplesPerBar;
          const height = Math.min(50, avg * 200);
          bars[i].style.height = `${Math.max(5, height)}px`;
        }
      };

    const connect = async () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        return;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        await trackToolUsage('telesales_agent', 'connect', {});

        ws.onopen = () => {
        console.log("WebSocket connected");
        setStatus("Connected");
        setIsConnected(true);

        // Keep alive ping
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 30000);
        };

        ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleMessage(data);
        } catch (e) {
            console.error("Error parsing WS:", e);
        }
        };

        ws.onclose = () => {
            console.log("WebSocket disconnected");
            setStatus("Disconnected");
            setIsConnected(false);
            setIsRecording(false);
        };
    };

    const handleMessage = (data: any) => {
        setMessageCount((c) => c + 1);

        switch (data.type) {
        case "sentence":
            setSentenceCount((c) => c + 1);
            setMessages((prev) => [
            { type: "sentence", text: data.text, time: new Date().toLocaleTimeString() },
            ...prev,
            ]);
            break;

        case "live":
            setMessages((prev) => [
            { type: "live", text: data.text, time: new Date().toLocaleTimeString() },
            ...prev.filter((m) => m.type !== "live"), // only 1 live item
            ]);
            break;

        case "llm_summary":
            setSummaryCount((c) => c + 1);
            setSummaries((prev) => [
            {
                id: Date.now(),
                text: data.data,
                count: data.conversation_count,
                time: new Date(data.timestamp || Date.now()).toLocaleTimeString(),
            },
            ...prev,
            ]);
            break;

        case "error":
            setMessages((prev) => [
            { type: "error", text: data.message, time: new Date().toLocaleTimeString() },
            ...prev,
            ]);
            break;

        default:
            setMessages((prev) => [
            { type: data.type, text: data.message, time: new Date().toLocaleTimeString() },
            ...prev,
            ]);
        }
    };

    const isRecordingRef = useRef(false);
    const startRecording = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsRecording(true);
          isRecordingRef.current = true;
      
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
          processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
          sourceRef.current.connect(processorRef.current);
          processorRef.current.connect(audioContextRef.current.destination);
      
          processorRef.current.onaudioprocess = (e) => {
            if (!isRecordingRef.current) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            updateVisualizer(inputData);
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                const u8 = new Uint8Array(pcmData.buffer);
                let binary = "";
                u8.forEach((byte) => {
                  binary += String.fromCharCode(byte);
                });
                const base64 = btoa(binary);
              wsRef.current.send(JSON.stringify({ type: "audio", audio: base64, sampleRate: audioContextRef.current!.sampleRate }));
            }
          };
        } catch (err) {
          setMessages((prev) => [{ type: "error", text: "Failed to access microphone", time: new Date().toLocaleTimeString() }, ...prev]);
        }
      };
      
      const stopRecording = () => {
        setIsRecording(false);
        isRecordingRef.current = false;
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        audioContextRef.current?.close();
        wsRef.current?.send(JSON.stringify({ type: "command", command: "stop" }));
      };


      const handleReset = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "command", command: "reset" }));
          setMessages([]); // clear transcription messages
          setSummaries([]); // clear summaries
          // reset counters if you track them in state
        }
      };
      
      const handleSummarize = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "command", command: "summarize" }));
        }
      };
      
      const handleStatus = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "command", command: "status" }));
        }
      };

  return (
  <div
    className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-[#001F3F]' : 'bg-[#E6F0FF]'}`}
    style={{
      margin: "0 auto",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
      padding: 20,
    }}
  >
    <div
      className="header"
      style={{
        textAlign: "center",
        color: "white",
        marginBottom: 30,
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          marginBottom: 10,
          textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        🎙️ WebSocket Transcription Tester
      </h1>
      <p>Real-time audio transcription with WebSocket</p>
    </div>

    <div
      className="status-bar"
      style={{
        background: "rgba(255,255,255,0.95)",
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      }}
    >
      <div
        className="status-indicator"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          className={`status-dot${isConnected ? " connected" : ""}${isRecording ? " recording" : ""}`}
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: isRecording
              ? "#ff6b6b"
              : isConnected
              ? "#28a745"
              : "#dc3545",
            marginRight: 8,
            animation: isRecording
              ? "recording-pulse 1s infinite"
              : "pulse 2s infinite",
            display: "inline-block",
          }}
        />
        <span style={{ fontWeight: 500, color: "#333" }}>{status}</span>
      </div>
      <div className="controls" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={isConnected ? undefined : connect}
          disabled={isConnected}
          className="btn-primary"
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: isConnected ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            opacity: isConnected ? 0.5 : 1,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease",
          }}
        >
          Connect
        </button>
        <button
          onClick={isConnected && !isRecording ? startRecording : undefined}
          disabled={!isConnected || isRecording}
          className="btn-success"
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: !isConnected || isRecording ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
            color: "white",
            opacity: !isConnected || isRecording ? 0.5 : 1,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease",
          }}
        >
          Start Recording
        </button>
        <button
          onClick={isRecording ? stopRecording : undefined}
          disabled={!isRecording}
          className="btn-danger"
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: !isRecording ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            opacity: !isRecording ? 0.5 : 1,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease",
          }}
        >
          Stop Recording
        </button>

        <button
        onClick={isConnected ? handleReset : undefined}
        disabled={!isConnected}
        className="btn-warning"
        style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: !isConnected ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)",
            color: "white",
            opacity: !isConnected ? 0.5 : 1,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease",
        }}
        >
        Reset
        </button>

        <button
        onClick={isConnected ? handleSummarize : undefined}
        disabled={!isConnected}
        className="btn-info"
        style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: !isConnected ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
            color: "white",
            opacity: !isConnected ? 0.5 : 1,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease",
        }}
        >
        Summarize
        </button>

        <button
        onClick={isConnected ? handleStatus : undefined}
        disabled={!isConnected}
        className="btn-primary"
        style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: !isConnected ? "not-allowed" : "pointer",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            opacity: !isConnected ? 0.5 : 1,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease",
        }}
        >
        Get Status
        </button>

        <button
          onClick={onBack}
          className="btn-warning"
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            background: "linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)",
            color: "white",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={18} /> Back
          </span>
        </button>
      </div>
    </div>

    <div
      className="main-content"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
      }}
    >
      <div className="panel" style={{
        background: "rgba(255,255,255,0.95)",
        borderRadius: 15,
        padding: 20,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      }}>
        <h2 style={{
          color: "#333",
          marginBottom: 15,
          fontSize: "1.2rem",
          borderBottom: "2px solid #667eea",
          paddingBottom: 10,
        }}>
          📝 Transcription Output
        </h2>
        <div
          className="transcription-container"
          style={{
            maxHeight: 400,
            overflowY: "auto",
            padding: 10,
            background: "#f8f9fa",
            borderRadius: 8,
          }}
        >
          {messages.length === 0 && (
            <div style={{ color: "#888" }}>No transcript yet.</div>
          )}
          {/* Hide ping messages */}
          {/* Filter out "ping" messages from rendering */}
          {messages
            .filter(msg => msg.type !== "ping")
            .map((msg) => {
              let className = "transcription-item sentence-item";
              if (msg.type === "partial") className = "transcription-item partial-item";
              if (msg.type === "live") className = "transcription-item live-item";
              if (msg.type === "error") className = "transcription-item error-item";
              if (msg.type === "status") className = "transcription-item status-item";
              return (
                <div
                  key={msg.id}
                  className={className}
                  style={{
                    padding: 10,
                    marginBottom: 10,
                    borderRadius: 8,
                    animation: "slideIn 0.3s ease",
                    background:
                      msg.type === "partial"
                        ? "#e3f2fd"
                        : msg.type === "live"
                        ? "#fff3e0"
                        : msg.type === "error"
                        ? "#ffebee"
                        : msg.type === "status"
                        ? "#e1f5fe"
                        : "#e8f5e9",
                    borderLeft:
                      msg.type === "partial"
                        ? "4px solid #2196f3"
                        : msg.type === "live"
                        ? "4px solid #ff9800"
                        : msg.type === "error"
                        ? "4px solid #f44336"
                        : msg.type === "status"
                        ? "4px solid #03a9f4"
                        : "4px solid #4caf50",
                    color:
                      msg.type === "error"
                        ? "#c62828"
                        : "#333",
                    fontStyle: msg.type === "live" ? "italic" : "normal",
                  }}
                >
                  <div className="item-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: "0.85rem", color: "#666" }}>
                    <span className="item-type" style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem" }}>
                      {msg.type || "sentence"}
                    </span>
                    <span className="item-time" style={{ fontSize: "0.75rem" }}>
                      {msg.time || (msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString()
                        : "")}
                    </span>
                  </div>
                  <div className="item-content" style={{ whiteSpace: "pre-wrap", fontSize: "1rem" }}>
                    {msg.text || msg.content || JSON.stringify(msg)}
                  </div>
                </div>
              );
            })}
        </div>
        <div className="stats" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 15,
          marginTop: 20,
        }}>
          <div className="stat-card" style={{
            background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
            padding: 15,
            borderRadius: 8,
            textAlign: "center",
          }}>
            <div className="stat-value" style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#667eea",
            }}>{messages.filter(m => m.type === "sentence").length}</div>
            <div className="stat-label" style={{
              fontSize: "0.85rem",
              color: "#666",
              marginTop: 5,
            }}>Sentences</div>
          </div>
          <div className="stat-card" style={{
            background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
            padding: 15,
            borderRadius: 8,
            textAlign: "center",
          }}>
            <div className="stat-value" style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#667eea",
            }}>{messages.filter(m => m.type !== "ping").length}</div>
            <div className="stat-label" style={{
              fontSize: "0.85rem",
              color: "#666",
              marginTop: 5,
            }}>Messages</div>
          </div>
          <div className="stat-card" style={{
            background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
            padding: 15,
            borderRadius: 8,
            textAlign: "center",
          }}>
            <div className="stat-value" style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#667eea",
            }}>{summaries.length}</div>
            <div className="stat-label" style={{
              fontSize: "0.85rem",
              color: "#666",
              marginTop: 5,
            }}>Summaries</div>
          </div>
        </div>
      </div>
      <div className="panel" style={{
        background: "rgba(255,255,255,0.95)",
        borderRadius: 15,
        padding: 20,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      }}>
        <h2 style={{
          color: "#333",
          marginBottom: 15,
          fontSize: "1.2rem",
          borderBottom: "2px solid #667eea",
          paddingBottom: 10,
        }}>
          🎵 Audio Monitor
        </h2>
        <div
          ref={visualizerRef}
          className="audio-visualizer"
          style={{
            height: 60,
            background: "#f8f9fa",
            borderRadius: 8,
            marginTop: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            padding: 10,
          }}
        >
        </div>
        <div className="connection-info" style={{
          marginTop: 20,
          padding: 15,
          background: "#f8f9fa",
          borderRadius: 8,
          fontFamily: "'Courier New', monospace",
          fontSize: "0.9rem",
        }}>
          <strong>WebSocket URL:</strong>
          <input
            type="text"
            value={wsUrl}
            readOnly
            style={{
              width: "100%",
              padding: 8,
              marginTop: 10,
              border: "1px solid #ddd",
              borderRadius: 4,
              fontFamily: "inherit",
            }}
          />
          <div style={{ marginTop: 10 }}>
            <strong>Sample Rate:</strong> <span>16000 Hz</span>
          </div>
          <div style={{ marginTop: 5 }}>
            <strong>Audio Format:</strong> <span>PCM16 (Int16)</span>
          </div>
        </div>
      </div>
    </div>

    <div className="bottom-section" style={{ marginTop: 20 }}>
      <div className="panel" style={{
        background: "rgba(255,255,255,0.95)",
        borderRadius: 15,
        padding: 20,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      }}>
        <h2 style={{
          color: "#333",
          marginBottom: 15,
          fontSize: "1.2rem",
          borderBottom: "2px solid #667eea",
          paddingBottom: 10,
        }}>
          🤖 AI Summaries
        </h2>
        <div className="summary-container" style={{
          maxHeight: 300,
          overflowY: "auto",
          padding: 10,
          background: "#f8f9fa",
          borderRadius: 8,
        }}>
          {summaries.length === 0 ? (
            <p style={{ color: "#999", textAlign: "center", padding: 20 }}>
              No summaries yet. Summaries will appear here after 15 seconds of conversation or when you click the "Summarize" button.
            </p>
          ) : (
            summaries.map((sum) => (
              <div
                key={sum.id}
                className="summary-entry"
                style={{
                  background: "linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)",
                  borderLeft: "4px solid #9c27b0",
                  padding: 15,
                  marginBottom: 15,
                  borderRadius: 8,
                  animation: "slideIn 0.3s ease",
                }}
              >
                <div className="summary-header" style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: "1px solid rgba(156, 39, 176, 0.2)",
                }}>
                  <span className="summary-meta" style={{ fontSize: "0.85rem", color: "#666" }}>
                    {sum.type || "llm_summary"}
                  </span>
                  <span className="summary-meta" style={{ fontSize: "0.85rem", color: "#666" }}>
                    {sum.timestamp
                      ? new Date(sum.timestamp).toLocaleTimeString()
                      : ""}
                  </span>
                </div>
                <div className="summary-content" style={{
                  color: "#333",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}>
                  {sum.summary || sum.text || JSON.stringify(sum)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    {/* Animations for status-dot and slideIn */}
    <style>
      {`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes recording-pulse {
          0%, 100% { opacity: 1; transform: scale(1);}
          50% { opacity: 0.7; transform: scale(1.2);}
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px);}
          to { opacity: 1; transform: translateX(0);}
        }
      `}
    </style>
  </div>
  
  )
}

export default TelesalesAgentPage;