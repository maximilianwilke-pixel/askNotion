import { useState, useRef, useEffect } from 'react'

const GRAD_START = '#7B6BFF'
const GRAD_END = '#C63EFF'
const HEADER_BG = '#1A0828'
const USER_BG = '#F0E8FF'
const BOT_BG = '#F7F7F5'
const TEXT = '#1A0828'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    text: "Hi! I'm Alfred, your AI assistant. Ask me anything about your workspace or company policies.",
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
  const [password, setPassword] = useState(() => sessionStorage.getItem('alfred_pw') ?? '')
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [open, setOpen] = useState(true)
  const [showRecs, setShowRecs] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function verifyAndLogin() {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Password': pwInput },
      body: JSON.stringify({ text: 'ping' }),
    })
    if (res.status === 401) {
      setPwError(true)
    } else {
      sessionStorage.setItem('alfred_pw', pwInput)
      setPassword(pwInput)
      setPwError(false)
    }
  }

  async function callApi(text: string): Promise<string> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Password': password },
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

  if (!password) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0D0015',
      }}>
        <div style={{
          background: '#1A0828', borderRadius: 20, padding: '40px 36px',
          width: 340, boxShadow: '0 16px 64px rgba(198,62,255,0.25)',
          border: '1px solid #2E1040', textAlign: 'center',
        }}>
          <div style={{
            fontWeight: 800, fontSize: 24, marginBottom: 6,
            background: `linear-gradient(90deg, ${GRAD_START}, ${GRAD_END})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Ask — Alfred</div>
          <div style={{ color: '#8B6FA8', fontSize: 13, marginBottom: 28 }}>
            Enter the access password to continue
          </div>
          <input
            type="password"
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false) }}
            onKeyDown={e => e.key === 'Enter' && verifyAndLogin()}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              border: `1px solid ${pwError ? '#FF4466' : '#3D1A5A'}`,
              borderRadius: 12, padding: '11px 14px', fontSize: 15,
              background: '#0D0015', color: '#fff', outline: 'none',
              marginBottom: pwError ? 8 : 16,
            }}
          />
          {pwError && (
            <div style={{ color: '#FF4466', fontSize: 12, marginBottom: 14 }}>
              Incorrect password. Please try again.
            </div>
          )}
          <button
            onClick={verifyAndLogin}
            disabled={!pwInput}
            style={{
              width: '100%', padding: '12px',
              background: pwInput
                ? `linear-gradient(135deg, ${GRAD_START}, ${GRAD_END})`
                : '#2E1040',
              color: pwInput ? '#fff' : '#6B4A8A',
              border: 'none', borderRadius: 12, fontSize: 15,
              fontWeight: 700, cursor: pwInput ? 'pointer' : 'not-allowed',
              boxShadow: pwInput ? '0 4px 16px rgba(198,62,255,0.35)' : 'none',
            }}
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  if (!open) {
    return (
      <div style={{ position: 'fixed', bottom: 24, right: 24 }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: `linear-gradient(135deg, ${GRAD_START}, ${GRAD_END})`,
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 60,
            height: 60,
            fontSize: 26,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(198,62,255,0.4)',
          }}
        >
          💬
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 440, fontFamily: 'inherit', zIndex: 9999 }}>
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 12px 48px rgba(198,62,255,0.2)',
          display: 'flex',
          flexDirection: 'column',
          height: 640,
          overflow: 'hidden',
          border: '1px solid #E8E8E5',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: HEADER_BG,
            color: '#fff',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{
              fontWeight: 800,
              fontSize: 17,
              background: `linear-gradient(90deg, ${GRAD_START}, ${GRAD_END})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Ask — Alfred</div>
            <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>Your AI assistant</div>
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
                  border: msg.sender === 'bot' ? '1px solid #EDE0FF' : 'none',
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
                border: '1px solid #EDE0FF',
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
                    background: '#F5EEFF',
                    border: `1px solid ${GRAD_END}44`,
                    color: GRAD_END,
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
            padding: '12px 16px',
            borderTop: '1px solid #EDE0FF',
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
              border: '1px solid #EDE0FF',
              borderRadius: 12,
              padding: '10px 14px',
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
              background: thinking || !input.trim()
                ? '#E8E8E5'
                : `linear-gradient(135deg, ${GRAD_START}, ${GRAD_END})`,
              color: thinking || !input.trim() ? '#9CA3AF' : '#fff',
              border: 'none',
              borderRadius: 12,
              width: 42,
              height: 42,
              cursor: thinking || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: 18,
              flexShrink: 0,
              transition: 'opacity 0.15s',
              boxShadow: thinking || !input.trim() ? 'none' : '0 2px 12px rgba(198,62,255,0.35)',
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
