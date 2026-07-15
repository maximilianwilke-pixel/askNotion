import { useState, useRef, useEffect } from 'react'

const PRIMARY = '#2383E2'
const USER_BG = '#E8F4FD'
const BOT_BG = '#F7F7F5'
const TEXT = '#37352F'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    text: "Hi! I'm your Notion assistant. Ask me anything about your workspace or company policies.",
    sender: 'bot',
  },
]

const RECOMMENDATIONS = [
  'How do I request sick leave?',
  'What is our vacation policy?',
  'How do I submit an expense report?',
]

const iconBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.2)',
  border: 'none',
  color: '#fff',
  borderRadius: 8,
  width: 32,
  height: 32,
  cursor: 'pointer',
  fontSize: 15,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [open, setOpen] = useState(true)
  const [showRecs, setShowRecs] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function callApi(text: string): Promise<string> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    const data: unknown = await res.json()
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>
      const answer = d['output'] ?? d['text'] ?? d['answer'] ?? d['message']
      if (typeof answer === 'string') return answer
    }
    return JSON.stringify(data)
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || thinking) return
    setInput('')
    setShowRecs(false)
    setMessages(prev => [...prev, { id: Date.now(), text: msg, sender: 'user' }])
    setThinking(true)
    try {
      const answer = await callApi(msg)
      setMessages(prev => [...prev, { id: Date.now() + 1, text: answer, sender: 'bot' }])
    } catch {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: 'Sorry, something went wrong. Please try again.', sender: 'bot' },
      ])
    } finally {
      setThinking(false)
    }
  }

  function restartChat() {
    setMessages(INITIAL_MESSAGES)
    setInput('')
    setShowRecs(true)
    setThinking(false)
  }

  if (!open) {
    return (
      <div style={{ position: 'fixed', bottom: 24, right: 24 }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: PRIMARY,
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 56,
            height: 56,
            fontSize: 24,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          }}
        >
          💬
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 380, fontFamily: 'inherit', zIndex: 9999 }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          display: 'flex',
          flexDirection: 'column',
          height: 540,
          overflow: 'hidden',
          border: '1px solid #E8E8E5',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: PRIMARY,
            color: '#fff',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>askNotion</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Your Notion AI assistant</div>
          </div>
          <button onClick={restartChat} title="Restart conversation" style={iconBtn}>
            ↻
          </button>
          <button onClick={() => setOpen(false)} title="Close" style={iconBtn}>
            ✕
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '9px 13px',
                  borderRadius:
                    msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.sender === 'user' ? USER_BG : BOT_BG,
                  color: TEXT,
                  fontSize: 14,
                  lineHeight: 1.55,
                  border: msg.sender === 'bot' ? '1px solid #E8E8E5' : 'none',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {thinking && (
            <div
              style={{
                display: 'flex',
                gap: 5,
                padding: '11px 14px',
                background: BOT_BG,
                borderRadius: '16px 16px 16px 4px',
                border: '1px solid #E8E8E5',
                width: 'fit-content',
              }}
            >
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#9CA3AF',
                    animation: 'bounce 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}

          {showRecs && !thinking && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {RECOMMENDATIONS.map(rec => (
                <button
                  key={rec}
                  onClick={() => handleSend(rec)}
                  style={{
                    background: '#F0F7FF',
                    border: `1px solid ${PRIMARY}44`,
                    color: PRIMARY,
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    lineHeight: 1.4,
                  }}
                >
                  {rec}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid #E8E8E5',
            display: 'flex',
            gap: 8,
            background: '#fff',
          }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={thinking}
            placeholder="Ask me anything..."
            style={{
              flex: 1,
              border: '1px solid #E8E8E5',
              borderRadius: 10,
              padding: '9px 12px',
              fontSize: 14,
              outline: 'none',
              background: thinking ? '#F9FAFB' : '#fff',
              color: TEXT,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={thinking || !input.trim()}
            style={{
              background: thinking || !input.trim() ? '#E8E8E5' : PRIMARY,
              color: thinking || !input.trim() ? '#9CA3AF' : '#fff',
              border: 'none',
              borderRadius: 10,
              width: 40,
              height: 40,
              cursor: thinking || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: 18,
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            ↑
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
