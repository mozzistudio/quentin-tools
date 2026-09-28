'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ROOMS, VIEWPOINTS, type RoomKey, type ViewKey } from './geometry'
import { createPlanoScene, type CameraPreset, type PlanoScene, type WallMode } from './scene'

const CAMERAS: Array<{ id: CameraPreset; label: string }> = [
  { id: 'persp', label: 'Perspectiva' },
  { id: 'iso', label: 'Isométrica' },
  { id: 'plan', label: 'Planta' },
]

const WALLS: Array<{ id: WallMode; label: string }> = [
  { id: 'full', label: 'Muros' },
  { id: 'cut', label: 'Corte 1,10' },
  { id: 'none', label: 'Sin muros' },
]

const subscribeNever = () => () => {}
const hasTouch = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0

function hex(n: number) {
  return `#${n.toString(16).padStart(6, '0')}`
}

function Segmented({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {children}
    </div>
  )
}

function Seg({
  active, onClick, children, disabled,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`border-r border-gray-200 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors last:border-r-0 disabled:opacity-40 ${
        active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

export default function PlanoViewer() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<PlanoScene | null>(null)
  const joyRef = useRef<HTMLDivElement | null>(null)
  const knobRef = useRef<HTMLSpanElement | null>(null)

  const [camera, setCamera] = useState<CameraPreset>('persp')
  const [view, setView] = useState<ViewKey | null>(null)
  const [walls, setWalls] = useState<WallMode>('cut')
  const [furnished, setFurnished] = useState(true)
  const [dims, setDims] = useState(true)
  const [labels, setLabels] = useState(true)
  const [walking, setWalking] = useState(false)
  const [locked, setLocked] = useState(false)
  const touch = useSyncExternalStore(subscribeNever, hasTouch, () => false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const scene = createPlanoScene(
      host,
      () => {
        setWalking(false)
        setWalls('cut')
        setCamera('persp')
        setView(null)
      },
      setLocked,
    )
    sceneRef.current = scene
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  const pickView = (id: ViewKey) => {
    setView(id)
    sceneRef.current?.setViewpoint(id)
  }
  const pickCamera = (id: CameraPreset) => {
    setView(null)
    setCamera(id)
    sceneRef.current?.setCamera(id)
    if (id === 'plan') {
      setWalls('cut')
      sceneRef.current?.setWalls('cut')
    }
  }
  const pickWalls = (id: WallMode) => {
    setWalls(id)
    sceneRef.current?.setWalls(id)
  }
  const toggleFurnished = (on: boolean) => {
    setFurnished(on)
    sceneRef.current?.setFurnished(on)
  }
  const enterWalk = (on: boolean) => {
    setView(null)
    setWalking(on)
    sceneRef.current?.setWalking(on)
    if (!on) {
      setWalls('cut')
      setCamera('persp')
    }
  }

  /* ------------------------------------------------ joystick táctil */
  const joyMove = useCallback((e: React.TouchEvent) => {
    const el = joyRef.current
    const t = e.touches[0]
    if (!el || !t) return
    const r = el.getBoundingClientRect()
    const dx = t.clientX - (r.left + r.width / 2)
    const dy = t.clientY - (r.top + r.height / 2)
    const d = Math.min(1, Math.hypot(dx, dy) / (r.width / 2))
    const a = Math.atan2(dy, dx)
    const x = Math.cos(a) * d
    const y = Math.sin(a) * d
    sceneRef.current?.setJoy(x, y)
    if (knobRef.current) knobRef.current.style.transform = `translate(${x * 30}px, ${y * 30}px)`
  }, [])

  const joyStop = useCallback(() => {
    sceneRef.current?.setJoy(0, 0)
    if (knobRef.current) knobRef.current.style.transform = ''
  }, [])

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm h-[min(66vh,620px)] min-h-[390px]">
      <div className="absolute inset-0 grid place-items-center font-mono text-xs tracking-widest text-gray-400">
        CARGANDO MODELO…
      </div>
      <div ref={hostRef} className="absolute inset-0 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full [&>canvas]:touch-none" />

      {/* Barra de herramientas */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-wrap gap-2 p-3">
        <div className="pointer-events-auto">
          <Segmented>
            {CAMERAS.map((c) => (
              <Seg key={c.id} active={camera === c.id && !walking && !view} disabled={walking} onClick={() => pickCamera(c.id)}>
                {c.label}
              </Seg>
            ))}
          </Segmented>
        </div>
        <div className="pointer-events-auto">
          <Segmented>
            {VIEWPOINTS.map((v) => (
              <Seg key={v.key} active={view === v.key} disabled={walking} onClick={() => pickView(v.key)}>
                {v.label}
              </Seg>
            ))}
          </Segmented>
        </div>
        <div className="pointer-events-auto">
          <Segmented>
            {WALLS.map((w) => (
              <Seg key={w.id} active={walls === w.id && !view} disabled={walking || !!view} onClick={() => pickWalls(w.id)}>
                {w.label}
              </Seg>
            ))}
          </Segmented>
        </div>
        <div className="pointer-events-auto">
          <Segmented>
            <Seg active={!walking} onClick={() => enterWalk(false)}>Órbita</Seg>
            <Seg active={walking} onClick={() => enterWalk(true)}>Recorrido</Seg>
          </Segmented>
        </div>
        <div className="pointer-events-auto">
          <Segmented>
            <Seg active={furnished} onClick={() => toggleFurnished(true)}>Amueblado</Seg>
            <Seg active={!furnished} onClick={() => toggleFurnished(false)}>Obra bruta</Seg>
          </Segmented>
        </div>
        <div className="pointer-events-auto">
          <Segmented>
            <Seg active={dims && !view} disabled={walking || !!view} onClick={() => { setDims(!dims); sceneRef.current?.setDims(!dims) }}>
              Cotas
            </Seg>
            <Seg active={labels && !view} disabled={walking || !!view} onClick={() => { setLabels(!labels); sceneRef.current?.setLabels(!labels) }}>
              Rótulos
            </Seg>
          </Segmented>
        </div>
      </div>

      {/* Leyenda */}
      {!walking && !view && (
        <div className="absolute bottom-3 left-3 z-30 grid max-w-[190px] gap-1 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-sm">
          <h3 className="font-mono text-[10px] font-medium uppercase tracking-widest text-gray-400">Ambientes</h3>
          {ROOMS.map((r) => (
            <button
              key={r.key}
              type="button"
              onMouseEnter={() => sceneRef.current?.highlight(r.key as RoomKey, true)}
              onMouseLeave={() => sceneRef.current?.highlight(r.key as RoomKey, false)}
              onClick={() => { setView(null); sceneRef.current?.focusRoom(r.key as RoomKey) }}
              className="flex items-center gap-2 text-left text-xs text-gray-700 hover:text-gray-950"
            >
              <span
                className="h-3 w-3 flex-none rounded-sm ring-1 ring-black/15"
                style={{ backgroundColor: hex(furnished ? r.finish : r.plan) }}
              />
              <span className="font-medium">{r.name}</span>
              <span className="ml-auto font-mono text-[11px] tabular-nums text-gray-400">
                {r.a.toFixed(2).replace('.', ',')}
              </span>
            </button>
          ))}
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="h-3 w-3 flex-none rounded-sm bg-[#c23b1e] ring-1 ring-black/15" />
            <span className="font-medium">Nueva ventana</span>
            <span className="ml-auto font-mono text-[11px] tabular-nums text-gray-400">1,99 m</span>
          </div>
        </div>
      )}

      {/* Ayuda del recorrido */}
      {walking && !locked && (
        <div className="absolute inset-0 z-20 grid cursor-pointer place-items-center bg-slate-900/60 p-4 text-center backdrop-blur-[2px]">
          <div className="max-w-md">
            <b className="mb-1.5 block text-lg font-semibold text-white">Recorrido a pie</b>
            <p className="text-sm leading-relaxed text-slate-200">
              Haz clic en la escena para entrar. <Key>W</Key><Key>A</Key><Key>S</Key><Key>D</Key> o las
              flechas para andar, <Key>Maj</Key> para correr, el ratón para mirar y <Key>Esc</Key> para
              soltar el puntero. Ojo a 1,62 m del suelo; los muros y los muebles frenan de verdad.
            </p>
          </div>
        </div>
      )}

      {/* Joystick táctil */}
      {walking && touch && (
        <div
          ref={joyRef}
          onTouchStart={joyMove}
          onTouchMove={joyMove}
          onTouchEnd={joyStop}
          onTouchCancel={joyStop}
          className="absolute bottom-4 left-4 z-40 h-26 w-26 touch-none rounded-full border border-white/40 bg-slate-900/30"
          style={{ height: 104, width: 104 }}
        >
          <span
            ref={knobRef}
            className="absolute left-1/2 top-1/2 -ml-[21px] -mt-[21px] h-[42px] w-[42px] rounded-full bg-white/85"
          />
        </div>
      )}

      {!walking && !view && (
        <div className="absolute bottom-3 right-3 z-30 hidden rounded-lg border border-gray-200 bg-white/95 px-2.5 py-1.5 font-mono text-[10px] text-gray-500 sm:block">
          arrastrar · girar &nbsp;|&nbsp; rueda · zoom &nbsp;|&nbsp; ⇧+arrastrar · desplazar
        </div>
      )}
    </div>
  )
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded border border-white/30 bg-white/15 px-1.5 py-0.5 font-mono text-[11px] text-white">
      {children}
    </kbd>
  )
}
