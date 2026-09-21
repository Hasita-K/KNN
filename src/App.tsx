import { useState, useRef, useEffect } from 'react'
import { supabase } from './supabaseClient'
import house1Src from './imports/house1.png'

// ── Types ────────────────────────────────────────────────────────────────────
type FoodItem = { id: string; icon: string; name: string; count: number }
type Friend = { id: string; name: string; hutColor: string; roofColor: string; fridge: FoodItem[] }
type IncomingRequest = { id: string; from: string; item: string; time: string }

type View =
  | { type: 'title' }
  | { type: 'home' }
  | { type: 'friend-fridge'; friendId: string }
  | { type: 'food-request'; foodId: string; friendId: string }
  | { type: 'my-fridge' }
  | { type: 'food-manage'; foodId: string }
  | { type: 'add-food' }
  | { type: 'name-food'; iconEmoji: string }
  | { type: 'friend-options'; friendId: string }
  | { type: 'confirm-delete'; friendId: string }

// ── Village type ─────────────────────────────────────────────────────────────
type Village = { id: string; name: string; friends: Friend[] }

// ── Constants ────────────────────────────────────────────────────────────────
const FOOD_ICONS = [
  { emoji: '🥩', label: 'Meat' },
  { emoji: '🥛', label: 'Milk' },
  { emoji: '🧈', label: 'Butter' },
  { emoji: '🧀', label: 'Cheese' },
  { emoji: '🍞', label: 'Bread' },
  { emoji: '🥚', label: 'Egg' },
  { emoji: '🥦', label: 'Vegetable' },
  { emoji: '🍎', label: 'Fruit' },
  { emoji: '🍚', label: 'Rice' },
  { emoji: '🦐', label: 'Seafood' },
  { emoji: '🫙', label: 'Other' },
]

let nextId = 100
const uid = () => String(nextId++)

const INITIAL_FRIENDS: Friend[] = [
  {
    id: '1', name: 'Mochi', hutColor: '#E8A87C', roofColor: '#C4603A',
    fridge: [
      { id: 'f1', icon: '🍎', name: 'Apple', count: 3 },
      { id: 'f2', icon: '🥛', name: 'Milk', count: 1 },
      { id: 'f3', icon: '🧀', name: 'Cheese', count: 2 },
    ]
  },
  {
    id: '2', name: 'Pudding', hutColor: '#A0C8E8', roofColor: '#3A6A9E',
    fridge: [
      { id: 'f4', icon: '🍌', name: 'Banana', count: 5 },
      { id: 'f5', icon: '🍓', name: 'Strawberry', count: 4 },
    ]
  },
  {
    id: '3', name: 'Biscuit', hutColor: '#A8D87C', roofColor: '#3A7830',
    fridge: [
      { id: 'f6', icon: '🥩', name: 'Beef', count: 2 },
      { id: 'f7', icon: '🍞', name: 'Bread', count: 3 },
      { id: 'f8', icon: '🥕', name: 'Carrot', count: 6 },
    ]
  },
]

const INITIAL_MY_FRIDGE: FoodItem[] = [
  { id: 'm1', icon: '🥚', name: 'Eggs', count: 6 },
  { id: 'm2', icon: '🥑', name: 'Avocado', count: 2 },
  { id: 'm3', icon: '🍋', name: 'Lemon', count: 3 },
]

const INITIAL_REQUESTS: IncomingRequest[] = [
  { id: 'r1', from: 'Mochi', item: '🥚 Eggs', time: '2m ago' },
  { id: 'r2', from: 'Pudding', item: '🧀 Cheese', time: '10m ago' },
]

// ── House image ───────────────────────────────────────────────────────────────
function TopDownHouse({
  star = false,
}: {
  roofColor?: string
  wallColor?: string
  doorSide?: string
  star?: boolean
}) {
  return (
    <div className="relative w-full h-full flex items-end justify-center pb-1">
      <img
        src={house1Src}
        alt="house"
        draggable={false}
        style={{
          width: '88%',
          height: '88%',
          objectFit: 'contain',
          imageRendering: 'pixelated',
          display: 'block',
        }}
      />
      {star && (
        <div className="absolute top-0 right-1 text-lg leading-none" style={{ imageRendering: 'auto' }}>⭐</div>
      )}
    </div>
  )
}

// ── Top-down tree ─────────────────────────────────────────────────────────────
function PixelTree({ size = 22 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, position: 'relative', imageRendering: 'pixelated' }}>
      <div style={{
        width: '100%', height: '100%',
        backgroundColor: '#2D7A22',
        border: '2px solid #1A5010',
        borderRadius: '50%',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: '25%', left: '25%',
          width: '35%', height: '35%',
          backgroundColor: '#4CAF40',
          borderRadius: '50%',
        }} />
      </div>
    </div>
  )
}

// ── Lot: one clickable property block ─────────────────────────────────────────
function Lot({
  label,
  roofColor,
  wallColor,
  doorSide,
  star,
  onClick,
  trees,
}: {
  label: string
  roofColor: string
  wallColor: string
  doorSide?: 'bottom' | 'right'
  star?: boolean
  onClick?: () => void
  trees: { top: number; left: number; size?: number }[]
}) {
  const inner = (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Yard path */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6"
        style={{ height: 14, backgroundColor: '#C4A878', borderTop: '1px solid #A08050' }} />
      {/* Trees */}
      {trees.map((t, i) => (
        <div key={i} className="absolute" style={{ top: t.top, left: t.left }}>
          <PixelTree size={t.size} />
        </div>
      ))}
      {/* House */}
      <TopDownHouse roofColor={roofColor} wallColor={wallColor} doorSide={doorSide} star={star} />
      {/* Name tag */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center">
        <span style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 6,
          color: '#fff',
          textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
          letterSpacing: 0,
        }}>
          {label}
        </span>
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="focus:outline-none active:brightness-90 transition-all w-full h-full"
        style={{ backgroundColor: '#4A9E30' }}
      >
        {inner}
      </button>
    )
  }
  return <div className="w-full h-full" style={{ backgroundColor: '#4A9E30' }}>{inner}</div>
}

// ── Fridge Grid ───────────────────────────────────────────────────────────────
const COLS = 4

function FoodGrid({
  items,
  onSelect,
}: {
  items: FoodItem[]
  onSelect: (item: FoodItem) => void
}) {
  // Split items into rows of COLS, then interleave shelf elements
  const rows: FoodItem[][] = []
  for (let i = 0; i < items.length; i += COLS) {
    rows.push(items.slice(i, i + COLS))
  }

  return (
    <div className="flex flex-col px-2 pt-2 pb-3">
      {rows.map((row, ri) => (
        <div key={ri}>
          {/* Items on this shelf */}
          <div className="grid gap-3 pb-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {row.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="food-badge flex flex-col items-center gap-1 focus:outline-none active:scale-90 transition-transform"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/80 border-2 border-amber-200 shadow-sm flex items-center justify-center text-3xl hover:bg-amber-50 transition-colors">
                    {item.icon}
                  </div>
                  {item.count >= 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#D4783A] border-2 border-white flex items-center justify-center">
                      <span className="text-white text-[9px] font-800 font-display leading-none">{item.count}</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-700 text-amber-900 text-center leading-tight">{item.name}</span>
              </button>
            ))}
          </div>
          {/* Shelf plank */}
          <div className="relative mb-3">
            <div className="h-3 rounded-sm shadow-md" style={{ background: 'linear-gradient(180deg, #C4956A 0%, #A07040 60%, #8B5C2A 100%)', border: '1px solid #7A4A1A' }} />
            {/* shelf edge highlight */}
            <div className="absolute top-0 left-0 right-0 h-px rounded-sm" style={{ backgroundColor: '#E0B880', opacity: 0.6 }} />
            {/* shelf shadow below */}
            <div className="h-1 rounded-b-sm" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 100%)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Fridge Shell ──────────────────────────────────────────────────────────────
function FridgeShell({ title, subtitle, onBack, children }: {
  title: string; subtitle: string; onBack: () => void; children: React.ReactNode
}) {
  return (
    <div className="fridge-view flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #C8EDBA 0%, #A8D890 100%)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/70 border-2 border-amber-300 flex items-center justify-center text-amber-900 font-bold text-lg active:scale-90 transition-transform"
        >
          ←
        </button>
        <div>
          <h2 className="font-display font-800 text-xl text-amber-900 leading-tight">{title}</h2>
          <p className="text-xs font-600 text-green-800/70">{subtitle}</p>
        </div>
      </div>

      {/* Fridge body */}
      <div className="mx-4 flex-1 rounded-3xl overflow-hidden shadow-xl" style={{ background: 'linear-gradient(180deg, #E8F4FF 0%, #D0E8F8 100%)', border: '3px solid #B0CCDD' }}>
        {/* Fridge top strip */}
        <div className="h-4 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #A0BFD0, #C0DCE8, #A0BFD0)' }} />
        {/* Handle */}
        <div className="flex justify-center py-1">
          <div className="w-16 h-2 rounded-full bg-[#8AABB8]/60" />
        </div>
        {/* Content */}
        <div className="scrollable overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>({ type: 'title' })
  const [titlePhase, setTitlePhase] = useState<'idle' | 'signup' | 'login'>('idle')
  const [authUser, setAuthUser] = useState('')
  const [authPhone, setAuthPhone] = useState('')
  const [authError, setAuthError] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [villages, setVillages] = useState<Village[]>([
    { id: 'v1', name: 'Clayville', friends: INITIAL_FRIENDS }
  ])
  const [currentVillageId, setCurrentVillageId] = useState('v1')
  const currentVillage = villages.find(v => v.id === currentVillageId)!
  const friends = currentVillage.friends

  const setCurrentFriends = (updater: Friend[] | ((prev: Friend[]) => Friend[])) =>
    setVillages(prev => prev.map(v => v.id !== currentVillageId ? v : {
      ...v,
      friends: typeof updater === 'function' ? updater(v.friends) : updater
    }))
  const [myFridge, setMyFridge] = useState<FoodItem[]>(INITIAL_MY_FRIDGE)
  const [requests, setRequests] = useState<IncomingRequest[]>(INITIAL_REQUESTS)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [pendingFoodEmoji, setPendingFoodEmoji] = useState('')
  const [foodNameInput, setFoodNameInput] = useState('')
  const [pendingNeighbor, setPendingNeighbor] = useState<string | null>(null)
  const [deniedMsg, setDeniedMsg] = useState<string | null>(null)
  const [villageFullMsg, setVillageFullMsg] = useState(false)
  const [addVillageOpen, setAddVillageOpen] = useState(false)
  const [newVillageName, setNewVillageName] = useState('')
  const [villageDropdownOpen, setVillageDropdownOpen] = useState(false)
  const [deletingFriendId, setDeletingFriendId] = useState<string | null>(null)
  type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'fulfilled' | 'thanked'
  type ReqEntry = { status: RequestStatus; qty: number; icon: string; foodName: string }
  const [requestMap, setRequestMap] = useState<Record<string, ReqEntry>>({})

  const getReq = (friendId: string, foodId: string): ReqEntry | undefined =>
    requestMap[`${friendId}:${foodId}`]

  const setReqStatus = (friendId: string, foodId: string, s: RequestStatus, qty?: number, icon?: string, foodName?: string) =>
    setRequestMap(prev => {
      const key = `${friendId}:${foodId}`
      const current = prev[key]
      return { ...prev, [key]: {
        status: s,
        qty: qty ?? current?.qty ?? 1,
        icon: icon ?? current?.icon ?? '🍽️',
        foodName: foodName ?? current?.foodName ?? 'item',
      } }
    })

  const clearReq = (friendId: string, foodId: string) =>
    setRequestMap(prev => {
      const next = { ...prev }
      delete next[`${friendId}:${foodId}`]
      return next
    })

  const overlayRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  // Re-center the map on YOUR house whenever the village changes
  useEffect(() => {
    const el = mapRef.current
    if (!el) return
    const LOT = 172, ROAD = 14, YOUR_COL = 2, YOUR_ROW = 2
    const unit = LOT + ROAD
    const yourCx = ROAD + YOUR_COL * unit + LOT / 2
    const yourCy = ROAD + YOUR_ROW * unit + LOT / 2
    el.scrollLeft = yourCx - el.clientWidth / 2
    el.scrollTop  = yourCy - el.clientHeight / 2
  }, [currentVillageId])

  // Close sheet on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setAddSheetOpen(false)
  }

  // ── Friend fridge logic ────────────────────────────────────────────────────
  const getFriend = (id: string) => friends.find(f => f.id === id)!
  const getFoodFromFriend = (friendId: string, foodId: string) =>
    getFriend(friendId).fridge.find(f => f.id === foodId)!
  const getMyFood = (foodId: string) => myFridge.find(f => f.id === foodId)!

  // ── My fridge logic ────────────────────────────────────────────────────────
  const adjustCount = (foodId: string, delta: number) => {
    setMyFridge(prev => prev.map(f => f.id === foodId
      ? { ...f, count: Math.min(99, Math.max(0, f.count + delta)) }
      : f
    ))
  }

  const addFoodToFridge = (emoji: string, name: string) => {
    const existing = myFridge.find(f => f.icon === emoji && f.name === name)
    if (existing) {
      setMyFridge(prev => prev.map(f => f.id === existing.id ? { ...f, count: f.count + 1 } : f))
    } else {
      setMyFridge(prev => [...prev, { id: uid(), icon: emoji, name, count: 1 }])
    }
    setView({ type: 'my-fridge' })
    setFoodNameInput('')
    setPendingFoodEmoji('')
  }

  const dismissRequest = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  const HUT_COLORS: { hutColor: string; roofColor: string }[] = [
    { hutColor: '#E8C87C', roofColor: '#8B6010' },
    { hutColor: '#C8A0E8', roofColor: '#6030A0' },
    { hutColor: '#E87CA0', roofColor: '#A02050' },
    { hutColor: '#7CE8D0', roofColor: '#10806A' },
    { hutColor: '#E8A07C', roofColor: '#A04010' },
    { hutColor: '#A0C8E8', roofColor: '#205080' },
  ]

  const sendFriendRequest = () => {
    if (!usernameInput.trim()) return
    const name = usernameInput.trim()
    setUsernameInput('')
    setAddSheetOpen(false)
    setPendingNeighbor(name)
  }

  const acceptNeighbor = () => {
    if (!pendingNeighbor) return
    const colors = HUT_COLORS[friends.length % HUT_COLORS.length]
    setCurrentFriends(prev => [...prev, {
      id: uid(),
      name: pendingNeighbor,
      hutColor: colors.hutColor,
      roofColor: colors.roofColor,
      fridge: [],
    }])
    setPendingNeighbor(null)
  }

  const rejectNeighbor = () => {
    if (!pendingNeighbor) return
    setDeniedMsg(`${pendingNeighbor} denied your request to be neighbors.`)
    setPendingNeighbor(null)
    setTimeout(() => setDeniedMsg(null), 4000)
  }

  const openAddSheet = () => {
    if (friends.length >= 24) {
      setVillageFullMsg(true)
      setTimeout(() => setVillageFullMsg(false), 3500)
      return
    }
    setAddSheetOpen(true)
  }

  const addVillage = () => {
    if (!newVillageName.trim()) return
    const id = uid()
    setVillages(prev => [...prev, { id, name: newVillageName.trim(), friends: [] }])
    setCurrentVillageId(id)
    setNewVillageName('')
    setAddVillageOpen(false)
  }

  const deleteFriend = (friendId: string) => {
    setCurrentFriends(prev => prev.filter(f => f.id !== friendId))
    setView({ type: 'home' })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const renderView = () => {

    // ── Title screen ──────────────────────────────────────────────────────────
    if (view.type === 'title') {

      const N = FOOD_ICONS.length
      const ORBIT_R = 168   // px from center — large enough to ring the screen
      const ORBIT_DUR = 18  // seconds per full revolution

     

      const handleAuth = async () => {
        if (!authUser.trim() || !authPassword.trim() || (titlePhase === 'signup' && !authPhone.trim())) {
          setAuthError('Please fill in all fields.')
          return
        }
        setAuthError('')
//start 
        if(titlePhase === 'signup'){
          const { data, error } = await supabase.auth.signUp({
            email: `${authUser.trim()}@kapitbahay.com`,
            password: authPassword.trim(),
            options: {
              data: {
                username: authUser.trim(),
                phone_number: authPhone.trim()
              }
            }
           
          })
          if (error) { setAuthError(error.message); return}

        } else {
          const{ error } = await supabase.auth.signInWithPassword({
            email: `${authUser.trim()}@yourapp.local`,
            password: authPassword.trim(),
          })
          if (error) { setAuthError(error.message); return }
        } //stop
        setView({ type: 'home' })
      }

      return (
        <div
          className="relative flex flex-col h-full overflow-hidden select-none"
          style={{ background: 'linear-gradient(180deg, #050E05 0%, #0A200A 45%, #142814 100%)' }}
          onClick={titlePhase === 'idle' ? () => setTitlePhase('signup') : undefined}
        >
          {/* ── Orbiting food icons — centered on screen ── */}
          <div
            className="absolute pointer-events-none"
            style={{ left: '50%', top: '50%' }}
          >
            {FOOD_ICONS.map(({ emoji, label }, i) => (
              <div
                key={label}
                style={{
                  position: 'absolute',
                  left: -18,
                  top: -18,
                  fontSize: 30,
                  // each icon starts at its own angle via negative delay
                  ['--orbit-r' as string]: `${ORBIT_R}px`,
                  animation: `orbit ${ORBIT_DUR}s linear infinite`,
                  animationDelay: `-${(i / N) * ORBIT_DUR}s`,
                  filter: 'drop-shadow(0 0 8px rgba(100,255,80,0.5))',
                }}
              >
                {emoji}
              </div>
            ))}
          </div>

          {/* ── Title + CTA — centered ── */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0 pointer-events-none">
            <h1 style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 56,
              color: '#fff',
              textShadow: '4px 4px 0 #1E6010, 8px 8px 0 #0A2A04, 0 0 40px rgba(100,230,60,0.5)',
              letterSpacing: 8,
              pointerEvents: 'none',
            }}>
              KNN
            </h1>

            {titlePhase === 'idle' && (
              <div
                className="mt-10 px-7 py-4 pointer-events-auto"
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 13,
                  color: '#0A200A',
                  backgroundColor: '#78E050',
                  border: '3px solid #3AAA10',
                  boxShadow: '0 5px 0 #1E5808, 0 0 20px rgba(100,230,60,0.4)',
                  animation: titlePhase === 'idle' ? 'blink 1.6s step-end infinite' : 'none',
                  cursor: 'pointer',
                  lineHeight: 1.6,
                  textAlign: 'center',
                }}
              >
                CLICK TO GET<br />STARTED
              </div>
            )}
          </div>

          {/* ── Auth card ── */}
          {titlePhase !== 'idle' && (
            <div
              className="absolute inset-0 flex items-center justify-center px-6 z-10"
              onClick={e => e.stopPropagation()}
            >
              {/* scrim */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                onClick={() => { setTitlePhase('idle'); setAuthError('') }}
              />

              <div
                className="relative w-full max-w-xs z-10"
                style={{
                  backgroundColor: '#FDF3E3',
                  border: '4px solid #8B5010',
                  boxShadow: '6px 6px 0 #3A1A00',
                  padding: 28,
                }}
              >
                {/* Card title */}
                <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 11, color: '#4A2800', marginBottom: 20, textAlign: 'center' }}>
                  {titlePhase === 'signup' ? 'SIGN UP' : 'LOG IN'}
                </p>

                {/* Fields */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#6B4A20' }}>USERNAME</label>
                    <input
                      type="text"
                      value={authUser}
                      onChange={e => { setAuthUser(e.target.value); setAuthError('') }}
                      placeholder="yourname"
                      className="w-full px-3 py-2 focus:outline-none"
                      style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: 9,
                        border: '2px solid #C4844A',
                        backgroundColor: '#FFF8EE',
                        color: '#3A1A00',
                      }}
                    />
                  </div>

                  {titlePhase === 'signup' && (
                    <div className="flex flex-col gap-1">
                      <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#6B4A20' }}>PHONE NUMBER</label>
                      <input
                        type="tel"
                        value={authPhone}
                        onChange={e => { setAuthPhone(e.target.value); setAuthError('') }}
                        placeholder="555-0100"
                        className="w-full px-3 py-2 focus:outline-none"
                        style={{
                          fontFamily: "'Press Start 2P', monospace",
                          fontSize: 9,
                          border: '2px solid #C4844A',
                          backgroundColor: '#FFF8EE',
                          color: '#3A1A00',
                        }}
                      />
                      
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <label style={{fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#6B4A20' }}>PASSWORD</label>
                    <input
                    type="password"
                    value={authPassword}
                    onChange={e => { setAuthPassword(e.target.value); setAuthError('') }}
                    placeholder="•••••••"
                    className="w-full px-3 py-2 focus:outline-none"
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 9,
                      border: '2px solid #C4844A',
                      backgroundColor: '#FFF8EE',
                      color: '#3A1A00',
                    }}
                    />
                </div>
                </div>

                {/* Error */}
                {authError && (
                  <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#CC2200', marginTop: 10, lineHeight: 1.8 }}>
                    {authError}
                  </p>
                )}

                {/* Submit */}
                <button
                  onClick={handleAuth}
                  className="w-full mt-5 py-3 active:translate-y-1 transition-transform"
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 10,
                    backgroundColor: '#5A9E3A',
                    color: '#fff',
                    border: '2px solid #3A7022',
                    boxShadow: '0 4px 0 #1E4A0A',
                  }}
                >
                  {titlePhase === 'signup' ? 'CREATE ACCOUNT' : 'LOG IN'}
                </button>

                {/* Toggle */}
                <div className="text-center mt-4">
                  <button
                    onClick={() => { setTitlePhase(titlePhase === 'signup' ? 'login' : 'signup'); setAuthError('') }}
                    style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#8B5010', textDecoration: 'underline' }}
                  >
                    {titlePhase === 'signup' ? 'HAVE AN ACCOUNT? LOGIN' : "DON'T HAVE AN ACCOUNT?"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    // Friend's fridge
    if (view.type === 'friend-fridge') {
      const friend = getFriend(view.friendId)
      return (
        <FridgeShell
          title={`${friend.name}'s Fridge`}
          subtitle={`${friend.fridge.length} items inside`}
          onBack={() => setView({ type: 'home' })}
        >
          {friend.fridge.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-5xl">🌬️</span>
              <p className="font-display font-700 text-blue-900/50">Empty fridge!</p>
            </div>
          ) : (
            <FoodGrid
              items={friend.fridge}
              onSelect={(item) => setView({ type: 'food-request', foodId: item.id, friendId: friend.id })}
            />
          )}
        </FridgeShell>
      )
    }

    // Request food from friend
    if (view.type === 'food-request') {
      const friend = getFriend(view.friendId)
      const food = getFoodFromFriend(view.friendId, view.foodId)
      const req = getReq(view.friendId, view.foodId)
      const status = req?.status
      const qty = req?.qty ?? 1
      // food may be undefined after delivery removes it from the fridge; snapshot icon/name in req
      const maxQty = food?.count ?? qty
      const foodIcon = food?.icon ?? req?.icon ?? '🍽️'
      const foodName = food?.name ?? req?.foodName ?? 'item'

      const goBack = (reset: boolean) => {
        if (reset) clearReq(view.friendId, view.foodId)
        setView({ type: 'friend-fridge', friendId: view.friendId })
      }

      const bgGrad = status === 'rejected'
        ? 'linear-gradient(180deg, #F8C8C8 0%, #E8A0A0 100%)'
        : 'linear-gradient(180deg, #C8EDBA 0%, #A8D890 100%)'

      return (
        <div className="fridge-view flex flex-col h-full items-center justify-center gap-4 px-8 relative"
          style={{ background: bgGrad }}>

          {/* Back — resets so the item can be re-requested */}
          <button
            onClick={() => goBack(!!status && (status === 'rejected' || status === 'thanked'))}
            className="absolute top-6 left-4 w-9 h-9 rounded-full bg-white/70 border-2 border-amber-300 flex items-center justify-center text-amber-900 font-bold text-lg active:scale-90 transition-transform"
          >
            ←
          </button>

          {/* ── No request sent yet ── */}
          {!status && food && (
            <div className="flex flex-col items-center gap-4 bg-white/70 rounded-3xl p-8 shadow-xl border-2 border-amber-200 w-full max-w-xs">
              <div className="text-7xl">{foodIcon}</div>
              <div className="text-center">
                <h2 className="font-display font-800 text-2xl text-amber-900">{foodName}</h2>
                <p className="text-sm font-600 text-amber-700/70 mt-1">
                  {friend.name} has <strong>{maxQty}</strong> of these
                </p>
              </div>

              {/* Qty stepper */}
              <div className="flex items-center gap-3">
                <button
                  disabled={qty <= 1}
                  className="w-9 h-9 rounded-xl font-display font-800 text-lg text-white disabled:opacity-30 flex items-center justify-center"
                  style={{ backgroundColor: '#C4844A', boxShadow: '0 3px 0 #8B5010' }}
                  onClick={() => setRequestMap(prev => {
                    const key = `${view.friendId}:${view.foodId}`
                    const cur = prev[key]
                    return { ...prev, [key]: { ...cur, status: cur?.status, icon: cur?.icon ?? '🍽️', foodName: cur?.foodName ?? 'item', qty: Math.max(1, (cur?.qty ?? 1) - 1) } }
                  })}
                >
                  −
                </button>
                <div className="flex flex-col items-center min-w-[48px]">
                  <span className="font-display font-800 text-3xl text-amber-900">{qty}</span>
                  <span className="text-[10px] font-700 text-amber-600">of {maxQty}</span>
                </div>
                <button
                  disabled={qty >= maxQty}
                  className="w-9 h-9 rounded-xl font-display font-800 text-lg text-white disabled:opacity-30 flex items-center justify-center"
                  style={{ backgroundColor: '#5A9E3A', boxShadow: '0 3px 0 #3A7022' }}
                  onClick={() => setRequestMap(prev => {
                    const key = `${view.friendId}:${view.foodId}`
                    const cur = prev[key]
                    return { ...prev, [key]: { ...cur, status: cur?.status, icon: cur?.icon ?? '🍽️', foodName: cur?.foodName ?? 'item', qty: Math.min(maxQty, (cur?.qty ?? 1) + 1) } }
                  })}
                >
                  +
                </button>
              </div>

              <button
                onClick={() => setReqStatus(view.friendId, view.foodId, 'pending', qty, food?.icon, food?.name)}
                className="btn-primary w-full py-3 rounded-2xl font-display font-800 text-lg text-white"
                style={{ backgroundColor: '#D4783A' }}
              >
                Request {qty > 1 ? `×${qty}` : ''} 🤲
              </button>
            </div>
          )}

          {/* ── Pending ── */}
          {status === 'pending' && (
            <div className="flex flex-col items-center gap-4 bg-white/70 rounded-3xl p-8 shadow-xl border-2 border-amber-200 w-full max-w-xs">
              <div className="text-7xl">{foodIcon}</div>
              <div className="text-center">
                <span className="text-3xl">📬</span>
                <p className="font-display font-800 text-lg text-amber-900 mt-2">Request sent!</p>
                <p className="text-sm font-600 text-amber-700/60 mt-1">
                  Asking {friend.name} for <strong>{qty}×</strong> {foodName}…
                </p>
              </div>
              <div className="w-full pt-2 border-t border-dashed border-amber-300">
                <p className="text-[10px] font-700 text-amber-500 text-center mb-2 uppercase tracking-wide">⚙ Dev Simulate</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReqStatus(view.friendId, view.foodId, 'accepted')}
                    className="flex-1 py-2 rounded-xl text-xs font-800 text-white"
                    style={{ backgroundColor: '#5A9E3A', boxShadow: '0 3px 0 #3A7022' }}
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => setReqStatus(view.friendId, view.foodId, 'rejected')}
                    className="flex-1 py-2 rounded-xl text-xs font-800 text-white"
                    style={{ backgroundColor: '#E04040', boxShadow: '0 3px 0 #8B1A1A' }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Rejected ── */}
          {status === 'rejected' && (
            <div className="flex flex-col items-center gap-5 bg-white/80 rounded-3xl p-8 shadow-xl border-2 border-red-300 w-full max-w-xs">
              <span className="text-6xl">😔</span>
              <div className="text-center">
                <h2 className="font-display font-800 text-xl text-red-700">Request Declined</h2>
                <p className="text-sm font-600 text-red-600/70 mt-2">
                  {friend.name} couldn't share their {foodName} this time.
                </p>
              </div>
              <button
                onClick={() => goBack(true)}
                className="w-full py-3 rounded-2xl font-display font-800 text-base text-white"
                style={{ backgroundColor: '#C04040', boxShadow: '0 4px 0 #7A1A1A' }}
              >
                Back to Fridge
              </button>
            </div>
          )}

          {/* ── Accepted ── */}
          {status === 'accepted' && (
            <div className="flex flex-col items-center gap-4 bg-white/70 rounded-3xl p-8 shadow-xl border-2 border-green-300 w-full max-w-xs">
              <span className="text-6xl">🎉</span>
              <div className="text-center">
                <h2 className="font-display font-800 text-xl text-green-800">Request Accepted!</h2>
                <p className="text-sm font-600 text-green-700/70 mt-2">
                  {friend.name} agreed to share <strong>{qty}×</strong> {foodIcon} {foodName}. They'll drop it off soon!
                </p>
              </div>
              <button
                className="w-full py-2.5 rounded-2xl font-display font-700 text-sm text-green-900 border-2 border-green-400 bg-green-50 active:scale-95 transition-transform"
              >
                🔔 Remind {friend.name}
              </button>
              <div className="w-full pt-2 border-t border-dashed border-green-300">
                <p className="text-[10px] font-700 text-green-600 text-center mb-2 uppercase tracking-wide">⚙ Dev Simulate</p>
                <button
                  onClick={() => {
                    // Deduct qty from friend's fridge
                    setCurrentFriends(prev => prev.map(f => f.id !== view.friendId ? f : {
                      ...f,
                      fridge: f.fridge.map(item => item.id !== view.foodId ? item : {
                        ...item, count: Math.max(0, item.count - qty)
                      }).filter(item => item.count > 0)
                    }))
                    setReqStatus(view.friendId, view.foodId, 'fulfilled')
                  }}
                  className="w-full py-2 rounded-xl text-xs font-800 text-white"
                  style={{ backgroundColor: '#4A7ACC', boxShadow: '0 3px 0 #2A4A8C' }}
                >
                  📦 Mark as Delivered
                </button>
              </div>
            </div>
          )}

          {/* ── Fulfilled ── */}
          {status === 'fulfilled' && (
            <div className="flex flex-col items-center gap-4 bg-white/70 rounded-3xl p-8 shadow-xl border-2 border-blue-300 w-full max-w-xs">
              <span className="text-6xl">📦</span>
              <div className="text-center">
                <h2 className="font-display font-800 text-xl text-blue-900">{friend.name} came through!</h2>
                <p className="text-sm font-600 text-blue-700/70 mt-2">
                  <strong>{qty}×</strong> {foodIcon} {foodName} delivered. Don't forget to say thanks!
                </p>
              </div>
              <button
                onClick={() => setReqStatus(view.friendId, view.foodId, 'thanked')}
                className="btn-primary w-full py-3 rounded-2xl font-display font-800 text-lg text-white"
                style={{ backgroundColor: '#D4783A' }}
              >
                💌 Send Thank You
              </button>
            </div>
          )}

          {/* ── Thanked ── */}
          {status === 'thanked' && (
            <div className="flex flex-col items-center gap-5 bg-white/70 rounded-3xl p-8 shadow-xl border-2 border-amber-200 w-full max-w-xs">
              <span className="text-6xl">🌸</span>
              <div className="text-center">
                <h2 className="font-display font-800 text-xl text-amber-900">Thank you sent!</h2>
                <p className="text-sm font-600 text-amber-700/60 mt-2">
                  {friend.name} got your thank you note 💛
                </p>
              </div>
              <button
                onClick={() => goBack(true)}
                className="w-full py-3 rounded-2xl font-display font-800 text-base text-amber-900 border-2 border-amber-300 bg-amber-50 active:scale-95 transition-transform"
              >
                Back to Fridge
              </button>
            </div>
          )}
        </div>
      )
    }

    // My fridge
    if (view.type === 'my-fridge') {
      return (
        <FridgeShell
          title="My Fridge"
          subtitle={`${myFridge.length} items stocked`}
          onBack={() => setView({ type: 'home' })}
        >
          <div className="scrollable" style={{ maxHeight: 'calc(100vh - 220px)' }}>
            {myFridge.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-5xl">🌬️</span>
                <p className="font-display font-700 text-blue-900/50">Your fridge is empty!</p>
              </div>
            ) : (
              <FoodGrid
                items={myFridge}
                onSelect={(item) => setView({ type: 'food-manage', foodId: item.id })}
              />
            )}

            {/* Add food button */}
            <div className="flex justify-center py-4">
              <button
                onClick={() => setView({ type: 'add-food' })}
                className="btn-green w-14 h-14 rounded-full font-display font-800 text-2xl text-white flex items-center justify-center"
                style={{ backgroundColor: '#5A9E3A' }}
              >
                +
              </button>
            </div>
          </div>
        </FridgeShell>
      )
    }

    // Manage my food item
    if (view.type === 'food-manage') {
      const food = getMyFood(view.foodId)
      if (!food) { setView({ type: 'my-fridge' }); return null }
      return (
        <div className="fridge-view flex flex-col h-full items-center justify-center gap-6 px-8"
          style={{ background: 'linear-gradient(180deg, #C8EDBA 0%, #A8D890 100%)' }}>
          <button
            onClick={() => setView({ type: 'my-fridge' })}
            className="absolute top-6 left-4 w-9 h-9 rounded-full bg-white/70 border-2 border-amber-300 flex items-center justify-center text-amber-900 font-bold text-lg active:scale-90 transition-transform"
          >
            ←
          </button>

          <div className="flex flex-col items-center gap-5 bg-white/70 rounded-3xl p-8 shadow-xl border-2 border-amber-200 w-full max-w-xs">
            <div className="text-7xl">{food.icon}</div>
            <h2 className="font-display font-800 text-2xl text-amber-900">{food.name}</h2>

            {/* Count adjuster */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => adjustCount(food.id, -1)}
                disabled={food.count <= 0}
                className="btn-red w-12 h-12 rounded-2xl font-display font-800 text-xl text-white flex items-center justify-center disabled:opacity-30"
                style={{ backgroundColor: '#E04040' }}
              >
                −
              </button>
              <div className="flex flex-col items-center min-w-[56px]">
                <span className="font-display font-800 text-4xl text-amber-900">{food.count}</span>
                <span className="text-xs font-600 text-amber-600">/ 99</span>
              </div>
              <button
                onClick={() => adjustCount(food.id, 1)}
                disabled={food.count >= 99}
                className="btn-green w-12 h-12 rounded-2xl font-display font-800 text-xl text-white flex items-center justify-center disabled:opacity-30"
                style={{ backgroundColor: '#5A9E3A' }}
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                setMyFridge(prev => prev.filter(f => f.id !== food.id))
                setView({ type: 'my-fridge' })
              }}
              className="text-xs font-700 text-red-500/70 underline"
            >
              Remove from fridge
            </button>
          </div>
        </div>
      )
    }

    // Add food: pick icon
    if (view.type === 'add-food') {
      return (
        <div className="fridge-view flex flex-col h-full"
          style={{ background: 'linear-gradient(180deg, #C8EDBA 0%, #A8D890 100%)' }}>
          <div className="flex items-center gap-3 px-4 pt-6 pb-3">
            <button
              onClick={() => setView({ type: 'my-fridge' })}
              className="w-9 h-9 rounded-full bg-white/70 border-2 border-amber-300 flex items-center justify-center text-amber-900 font-bold text-lg active:scale-90 transition-transform"
            >
              ←
            </button>
            <div>
              <h2 className="font-display font-800 text-xl text-amber-900">Add Food</h2>
              <p className="text-xs font-600 text-green-800/70">Pick what you've got!</p>
            </div>
          </div>

          <div className="mx-4 flex-1 rounded-3xl overflow-hidden shadow-xl scrollable"
            style={{ background: 'linear-gradient(180deg, #E8F4FF 0%, #D0E8F8 100%)', border: '3px solid #B0CCDD' }}>
            <div className="h-4 rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #A0BFD0, #C0DCE8, #A0BFD0)' }} />
            <div className="grid grid-cols-4 gap-3 p-4 scrollable overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {FOOD_ICONS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setPendingFoodEmoji(emoji)
                    setFoodNameInput(label)
                    setView({ type: 'name-food', iconEmoji: emoji })
                  }}
                  className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/80 border-2 border-amber-200 shadow-sm flex items-center justify-center text-3xl hover:bg-amber-50 transition-colors">
                    {emoji}
                  </div>
                  <span className="text-[10px] font-700 text-amber-900 text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // Name the food
    if (view.type === 'name-food') {
      return (
        <div className="fridge-view flex flex-col h-full items-center justify-center gap-6 px-8"
          style={{ background: 'linear-gradient(180deg, #C8EDBA 0%, #A8D890 100%)' }}>
          <button
            onClick={() => setView({ type: 'add-food' })}
            className="absolute top-6 left-4 w-9 h-9 rounded-full bg-white/70 border-2 border-amber-300 flex items-center justify-center text-amber-900 font-bold text-lg active:scale-90 transition-transform"
          >
            ←
          </button>

          <div className="flex flex-col items-center gap-5 bg-white/70 rounded-3xl p-8 shadow-xl border-2 border-amber-200 w-full max-w-xs">
            <div className="text-7xl">{view.iconEmoji}</div>
            <h2 className="font-display font-800 text-xl text-amber-900">Name this food</h2>

            <input
              type="text"
              value={foodNameInput}
              onChange={e => setFoodNameInput(e.target.value)}
              placeholder="e.g. Organic Apple..."
              className="w-full rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 font-700 text-amber-900 text-center focus:outline-none focus:border-amber-500 placeholder:text-amber-300"
              style={{ fontFamily: 'Nunito, sans-serif' }}
              autoFocus
            />

            <button
              onClick={() => addFoodToFridge(view.iconEmoji, foodNameInput || 'Food')}
              disabled={!foodNameInput.trim()}
              className="btn-primary w-full py-3 rounded-2xl font-display font-800 text-lg text-white disabled:opacity-40"
              style={{ backgroundColor: '#D4783A' }}
            >
              Add to Fridge 🧺
            </button>
          </div>
        </div>
      )
    }

    if (view.type === 'friend-options') {
      const friend = getFriend(view.friendId)
      return (
        <div className="fridge-view flex flex-col h-full items-center justify-center gap-4 px-8 relative"
          style={{ background: 'linear-gradient(180deg, #C8EDBA 0%, #A8D890 100%)' }}>
          <button
            onClick={() => setView({ type: 'home' })}
            className="absolute top-6 left-4 w-9 h-9 rounded-full bg-white/70 border-2 border-amber-300 flex items-center justify-center text-amber-900 font-bold text-lg active:scale-90 transition-transform"
          >←</button>
          <div className="flex flex-col items-center gap-4 bg-white/70 rounded-3xl p-8 shadow-xl border-2 border-amber-200 w-full max-w-xs">
            <span className="text-6xl">🏡</span>
            <h2 className="font-display font-800 text-xl text-amber-900">{friend.name}</h2>
            <p className="text-sm font-600 text-amber-700/60">What would you like to do?</p>
            <button
              onClick={() => setView({ type: 'friend-fridge', friendId: view.friendId })}
              className="btn-primary w-full py-3 rounded-2xl font-display font-800 text-base text-white"
              style={{ backgroundColor: '#D4783A' }}
            >🧊 Enter Fridge</button>
            <button
              onClick={() => setView({ type: 'confirm-delete', friendId: view.friendId })}
              className="w-full py-3 rounded-2xl font-display font-800 text-base text-white"
              style={{ backgroundColor: '#E04040', boxShadow: '0 4px 0 #8B1A1A' }}
            >🗑 Delete Friend</button>
          </div>
        </div>
      )
    }

    if (view.type === 'confirm-delete') {
      const friend = getFriend(view.friendId)
      return (
        <div className="fridge-view flex flex-col h-full items-center justify-center gap-4 px-8 relative"
          style={{ background: 'linear-gradient(180deg, #F8C8C8 0%, #E8A0A0 100%)' }}>
          <button
            onClick={() => setView({ type: 'friend-options', friendId: view.friendId })}
            className="absolute top-6 left-4 w-9 h-9 rounded-full bg-white/70 border-2 border-red-300 flex items-center justify-center text-red-700 font-bold text-lg active:scale-90 transition-transform"
          >←</button>
          <div className="flex flex-col items-center gap-5 bg-white/80 rounded-3xl p-8 shadow-xl border-2 border-red-300 w-full max-w-xs">
            <span className="text-6xl">⚠️</span>
            <div className="text-center">
              <h2 className="font-display font-800 text-xl text-red-700">Delete Friend?</h2>
              <p className="text-sm font-600 text-red-600/70 mt-2">
                Are you sure you want to delete <strong>{friend.name}</strong> as a neighbor?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setView({ type: 'friend-options', friendId: view.friendId })}
                className="flex-1 py-3 rounded-2xl font-display font-800 text-base text-amber-900 border-2 border-amber-300 bg-amber-50"
              >No</button>
              <button
                onClick={() => deleteFriend(view.friendId)}
                className="flex-1 py-3 rounded-2xl font-display font-800 text-base text-white"
                style={{ backgroundColor: '#E04040', boxShadow: '0 4px 0 #8B1A1A' }}
              >Yes, Delete</button>
            </div>
          </div>
        </div>
      )
    }

    // Home view — top-down pixel art neighborhood
    // 5×5 grid, YOUR house at center (col 2, row 2). Viewport shows ~2×2 lots.
    const LOT = 172, ROAD = 14
    const GRID = 5            // 5×5 = 25 slots; 1 = YOU, 24 = friends (max 20 used)
    const YOUR_COL = 2, YOUR_ROW = 2
    const mapW = ROAD + GRID * (LOT + ROAD)   // total pixel width of map
    const mapH = ROAD + GRID * (LOT + ROAD)   // total pixel height of map

    // All 25 slot positions; assign friends in order, skipping YOU slot
    const slots: { row: number; col: number; isYou: boolean; friend: Friend | null }[] = []
    let fi = 0
    for (let row = 0; row < GRID; row++) {
      for (let col = 0; col < GRID; col++) {
        const isYou = row === YOUR_ROW && col === YOUR_COL
        slots.push({ row, col, isYou, friend: isYou ? null : (friends[fi++] ?? null) })
      }
    }

    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: '#2A6E14', imageRendering: 'pixelated' }}>

        {/* ── Title bar ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 z-10 relative shrink-0"
          style={{ backgroundColor: '#1A4008', borderBottom: '2px solid #0A2004' }}>

          {/* Chevron dropdown button */}
          <button
            onClick={() => villages.length > 1 && setVillageDropdownOpen(v => !v)}
            disabled={villages.length <= 1}
            className="flex items-center gap-1 active:opacity-70 transition-opacity"
          >
            <span style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 10,
              color: villages.length > 1 ? '#78E050' : '#3A5020',
              textShadow: villages.length > 1 ? '1px 1px 0 #0A2004' : 'none',
            }}>▼</span>
          </button>

          {/* Village name — centered */}
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: '#fff',
            textShadow: '2px 2px 0 #0A2004',
            textAlign: 'center',
            flex: 1,
            marginLeft: 8,
            marginRight: 8,
          }}>
            {currentVillage.name.toUpperCase()}
          </div>

          {/* Add Village button */}
          <button
            onClick={() => setAddVillageOpen(true)}
            className="active:brightness-75 transition-all"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 6,
              color: '#0A2004',
              backgroundColor: '#78E050',
              border: '2px solid #3A7022',
              boxShadow: '0 2px 0 #1E4A0A',
              padding: '4px 6px',
            }}
          >
            + VILLAGE
          </button>

          {/* Village dropdown */}
          {villageDropdownOpen && (
            <div
              className="absolute top-full left-2 z-50 village-dropdown"
              style={{
                // show exactly 3 rows; each row ≈ 32px
                maxHeight: 96,
                overflowY: villages.length > 3 ? 'scroll' : 'auto',
                backgroundColor: '#1A4008',
                border: '2px solid #78E050',
                boxShadow: '4px 4px 0 #0A2004',
                minWidth: 148,
              }}
            >
              {villages.map(v => (
                <button
                  key={v.id}
                  onClick={() => { setCurrentVillageId(v.id); setVillageDropdownOpen(false) }}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors"
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 7,
                    color: v.id === currentVillageId ? '#78E050' : '#C8F080',
                    borderBottom: '1px solid #0A2004',
                    lineHeight: '18px',
                  }}
                >
                  {v.id === currentVillageId ? '▶ ' : '   '}{v.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Pannable neighborhood map ── */}
        <div
          ref={mapRef}
          className="flex-1"
          style={{
            minHeight: 0,
            overflow: 'auto',
            // enable two-finger trackpad pan in all directions
            touchAction: 'pan-x pan-y',
            cursor: 'grab',
          }}
        >
          {/* The full map canvas — larger than the viewport */}
          <div style={{ position: 'relative', width: mapW, height: mapH, backgroundColor: '#7A7060', flexShrink: 0 }}>

            {/* Road dashes — horizontal roads */}
            {Array.from({ length: GRID + 1 }, (_, r) => (
              Array.from({ length: GRID * 3 }, (_, d) => (
                <div key={`hd-${r}-${d}`} style={{
                  position: 'absolute',
                  top: r * (LOT + ROAD) + ROAD / 2 - 1,
                  left: ROAD + d * 28,
                  width: 14, height: 2,
                  backgroundColor: '#FFEE50', opacity: 0.5,
                }} />
              ))
            ))}
            {/* Road dashes — vertical roads */}
            {Array.from({ length: GRID + 1 }, (_, c) => (
              Array.from({ length: GRID * 3 }, (_, d) => (
                <div key={`vd-${c}-${d}`} style={{
                  position: 'absolute',
                  left: c * (LOT + ROAD) + ROAD / 2 - 1,
                  top: ROAD + d * 28,
                  width: 2, height: 14,
                  backgroundColor: '#FFEE50', opacity: 0.5,
                }} />
              ))
            ))}

            {/* Lots */}
            {slots.map(({ row, col, isYou, friend }) => {
              const x = ROAD + col * (LOT + ROAD)
              const y = ROAD + row * (LOT + ROAD)
              return (
                <div key={`${row}-${col}`} style={{ position: 'absolute', left: x, top: y, width: LOT, height: LOT }}>
                  {isYou ? (
                    <Lot label="YOU" roofColor="#B05A1E" wallColor="#DCA67A" doorSide="bottom" star
                      trees={[{ top: 10, left: 10 }, { bottom: 20, right: 10 } as any]} />
                  ) : friend ? (
                    <Lot
                      label={friend.name}
                      roofColor={friend.roofColor}
                      wallColor={friend.hutColor}
                      doorSide="bottom"
                      onClick={() => setView({ type: 'friend-options', friendId: friend.id })}
                      trees={[(col + row) % 2 === 0 ? { top: 8, left: 8 } : { top: 8, right: 8 } as any]}
                    />
                  ) : (
                    <div className="w-full h-full" style={{ backgroundColor: '#3A8E22', opacity: 0.55 }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bottom nav bar ── */}
        <div className="flex items-center justify-around px-8 z-20 shrink-0"
          style={{ height: 60, backgroundColor: '#5A3010', borderTop: '3px solid #3A1A00' }}>
          <button
            onClick={openAddSheet}
            className="flex flex-col items-center gap-0.5 active:brightness-75 transition-all"
          >
            <div className="w-11 h-11 flex items-center justify-center text-xl font-800"
              style={{ backgroundColor: '#F5D090', border: '3px solid #C8780A', boxShadow: '0 3px 0 #8B5010', imageRendering: 'auto' }}>
              ＋
            </div>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: '#F5D090' }}>FRIENDS</span>
          </button>

          <div style={{ width: 3, height: 3, backgroundColor: '#8B5010' }} />

          <button
            onClick={() => setView({ type: 'my-fridge' })}
            className="flex flex-col items-center gap-0.5 active:brightness-75 transition-all"
          >
            {/* CSS fridge icon */}
            <div style={{ width: 44, height: 44, position: 'relative', imageRendering: 'auto' }}>
              {/* Fridge body */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundColor: '#D8F0FF',
                border: '2px solid #5090B8',
                borderRadius: 5,
                boxShadow: '0 3px 0 #3060A0',
              }}>
                {/* Freezer compartment (top ~35%) */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: '36%',
                  backgroundColor: '#B8E0FF',
                  borderBottom: '2px solid #5090B8',
                  borderRadius: '3px 3px 0 0',
                }}>
                  {/* Freezer handle */}
                  <div style={{
                    position: 'absolute', right: 5, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3, height: 9,
                    backgroundColor: '#5090B8',
                    borderRadius: 2,
                  }} />
                  {/* Ice crystals hint */}
                  <div style={{ position: 'absolute', left: 6, top: 3, fontSize: 7, lineHeight: 1 }}>❄</div>
                </div>
                {/* Fridge main compartment handle */}
                <div style={{
                  position: 'absolute', right: 5,
                  top: '50%', bottom: '15%',
                  width: 3,
                  backgroundColor: '#5090B8',
                  borderRadius: 2,
                }} />
                {/* Shelf line */}
                <div style={{
                  position: 'absolute', left: 4, right: 4,
                  top: '62%',
                  height: 1,
                  backgroundColor: '#90C0D8',
                }} />
                {/* Bottom vent strip */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: '10%',
                  backgroundColor: '#A8D0E8',
                  borderTop: '1px solid #5090B8',
                  borderRadius: '0 0 3px 3px',
                }} />
              </div>
            </div>
            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 5, color: '#A0D8FF' }}>FRIDGE</span>
          </button>
        </div>

        {/* ── Add Village modal ── */}
        {addVillageOpen && (
          <div className="absolute inset-0 z-40 flex items-center justify-center px-6"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => { setAddVillageOpen(false); setNewVillageName('') }}>
            <div
              className="w-full max-w-xs"
              style={{ backgroundColor: '#FDF3E3', border: '4px solid #8B5010', boxShadow: '6px 6px 0 #3A1A00', padding: 24 }}
              onClick={e => e.stopPropagation()}
            >
              <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#4A2800', marginBottom: 16, textAlign: 'center' }}>
                NEW VILLAGE
              </p>
              <div className="flex flex-col gap-1 mb-4">
                <label style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 7, color: '#6B4A20' }}>VILLAGE NAME</label>
                <input
                  type="text"
                  value={newVillageName}
                  onChange={e => setNewVillageName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addVillage()}
                  placeholder="e.g. Maplewood..."
                  autoFocus
                  className="w-full px-3 py-2 focus:outline-none"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, border: '2px solid #C4844A', backgroundColor: '#FFF8EE', color: '#3A1A00' }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setAddVillageOpen(false); setNewVillageName('') }}
                  className="flex-1 py-2.5"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, border: '2px solid #C4844A', backgroundColor: '#FFF8EE', color: '#4A2800', boxShadow: '0 3px 0 #8B5010' }}
                >CANCEL</button>
                <button
                  onClick={addVillage}
                  disabled={!newVillageName.trim()}
                  className="flex-1 py-2.5 disabled:opacity-40"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, backgroundColor: '#5A9E3A', color: '#fff', border: '2px solid #3A7022', boxShadow: '0 3px 0 #1E4A0A' }}
                >ADD</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ maxWidth: '430px', margin: '0 auto' }}>
      {renderView()}

      {/* Add Friend Bottom Sheet */}
      {addSheetOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="absolute inset-0 z-30"
          style={{ backgroundColor: 'rgba(40, 20, 0, 0.45)' }}
        >
          <div
            className={`bottom-sheet absolute left-0 right-0 bottom-0 rounded-t-3xl shadow-2xl ${addSheetOpen ? 'open' : ''}`}
            style={{
              height: '55%',
              background: 'linear-gradient(180deg, #FDF0DC 0%, #F5DEB0 100%)',
              border: '3px solid #D4A050',
              borderBottom: 'none',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-amber-400/50" />
            </div>

            <div className="px-5 scrollable overflow-y-auto h-full pb-8">
              {/* Incoming requests */}
              <h3 className="font-display font-800 text-base text-amber-900 mt-1 mb-3 flex items-center gap-2">
                📬 Incoming Requests
                {requests.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-800 flex items-center justify-center">
                    {requests.length}
                  </span>
                )}
              </h3>

              {requests.length === 0 ? (
                <p className="text-xs font-600 text-amber-700/50 mb-4">No pending requests 🌿</p>
              ) : (
                <div className="flex flex-col gap-2 mb-4">
                  {requests.map(req => (
                    <div key={req.id}
                      className="flex items-center gap-3 bg-white/60 rounded-2xl px-3 py-2 border border-amber-200">
                      <span className="text-2xl">{req.item.split(' ')[0]}</span>
                      <div className="flex-1">
                        <p className="font-700 text-amber-900 text-sm leading-tight">
                          <strong>{req.from}</strong> wants {req.item.split(' ').slice(1).join(' ')}
                        </p>
                        <p className="text-[10px] text-amber-600">{req.time}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => dismissRequest(req.id)}
                          className="text-xs font-700 text-green-700 bg-green-100 rounded-xl px-2 py-1"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => dismissRequest(req.id)}
                          className="text-xs font-700 text-red-500 bg-red-50 rounded-xl px-2 py-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-amber-300/50 mb-4" />

              {/* Add by username */}
              <h3 className="font-display font-800 text-base text-amber-900 mb-3 flex items-center gap-2">
                🏘️ Add a Neighbor
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="Enter username..."
                  className="flex-1 rounded-2xl border-2 border-amber-300 bg-white/60 px-4 py-2.5 font-700 text-amber-900 focus:outline-none focus:border-amber-500 placeholder:text-amber-300 text-sm"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  onKeyDown={e => e.key === 'Enter' && sendFriendRequest()}
                />
                <button
                  onClick={sendFriendRequest}
                  disabled={!usernameInput.trim()}
                  className="btn-primary rounded-2xl px-4 py-2.5 font-display font-800 text-white text-sm disabled:opacity-40"
                  style={{ backgroundColor: '#D4783A' }}
                >
                  Add
                </button>
              </div>
              <p className="text-[10px] font-600 text-amber-600/70 mt-2 text-center">
                Ask your friends for their Clayville username 🌿
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Neighbor request simulation overlay ── */}
      {pendingNeighbor && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center px-8"
          style={{ background: 'linear-gradient(180deg, #C8EDBA 0%, #A8D890 100%)' }}
        >
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            {/* Dev badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: '#4A7ACC', boxShadow: '0 3px 0 #2A4A8C' }}>
              <span className="text-white text-[10px] font-800 font-display uppercase tracking-wide">⚙ Dev Simulation</span>
            </div>

            {/* Card */}
            <div className="flex flex-col items-center gap-4 bg-white/70 rounded-3xl p-8 shadow-xl border-2 border-green-300 w-full">
              <span className="text-6xl">🏡</span>
              <div className="text-center">
                <h2 className="font-display font-800 text-xl text-amber-900">Neighbor Request</h2>
                <p className="text-sm font-600 text-amber-700/70 mt-2">
                  <strong>{pendingNeighbor}</strong> received your request to be neighbors!
                </p>
                <p className="text-xs font-600 text-amber-600/60 mt-1">
                  Simulating their response…
                </p>
              </div>

              <div className="w-full pt-2 border-t border-dashed border-green-300">
                <p className="text-[10px] font-700 text-green-700 text-center mb-3 uppercase tracking-wide">⚙ Dev Simulate Response</p>
                <div className="flex gap-3">
                  <button
                    onClick={acceptNeighbor}
                    className="flex-1 py-3 rounded-2xl font-display font-800 text-base text-white"
                    style={{ backgroundColor: '#5A9E3A', boxShadow: '0 4px 0 #3A7022' }}
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={rejectNeighbor}
                    className="flex-1 py-3 rounded-2xl font-display font-800 text-base text-white"
                    style={{ backgroundColor: '#E04040', boxShadow: '0 4px 0 #8B1A1A' }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Denied notification ── */}
      {deniedMsg && (
        <div className="absolute top-6 left-4 right-4 z-50 pointer-events-none">
          <div className="flex items-start gap-3 rounded-2xl px-4 py-3 shadow-xl border-2 border-red-300"
            style={{ backgroundColor: '#FFF0F0' }}>
            <span className="text-2xl shrink-0">😔</span>
            <p className="font-700 text-red-700 text-sm leading-snug">{deniedMsg}</p>
          </div>
        </div>
      )}

      {/* ── Village full notification ── */}
      {villageFullMsg && (
        <div className="absolute top-6 left-4 right-4 z-50 pointer-events-none">
          <div className="flex items-start gap-3 rounded-2xl px-4 py-3 shadow-xl border-2 border-amber-400"
            style={{ backgroundColor: '#FFFBE8' }}>
            <span className="text-2xl shrink-0">🏘️</span>
            <p className="font-700 text-amber-800 text-sm leading-snug">
              The village has reached capacity! Max 24 neighbors.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
