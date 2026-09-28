import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  BDZ0, BDZ1, CX, CZ, DOOR_H, DW, H, OBRA, ROOMS, VIEWPOINTS, WHEAD, WSILL, WZ0, WZ1,
  X0, X1, XH1, XH2, XI0, XI1, Z0, Z1, ZB1, ZB2, ZC1, ZI0, ZK2, ZP, ZS2,
  type RoomKey, type ViewKey,
} from './geometry'

export type CameraPreset = 'persp' | 'iso' | 'plan'
export type WallMode = 'full' | 'cut' | 'none'

export interface PlanoScene {
  setCamera(preset: CameraPreset): void
  /** Cámara de render: ojo a 1,55 m dentro de la coca, muros completos. */
  setViewpoint(key: ViewKey): void
  setWalls(mode: WallMode): void
  setFurnished(on: boolean): void
  setDims(on: boolean): void
  setLabels(on: boolean): void
  setWalking(on: boolean): void
  /** Empujón del joystick táctil, cada eje en el rango [-1, 1]. */
  setJoy(x: number, y: number): void
  focusRoom(key: RoomKey): void
  highlight(key: RoomKey, on: boolean): void
  dispose(): void
}

interface CutData {
  h0: number
  h1: number
  onlyRaw?: boolean
}

/** Marca una pieza como cortable a la altura del plano de corte. */
function tagCut<T extends THREE.Object3D>(m: T, y0: number, y1: number): T {
  m.userData.h0 = y0
  m.userData.h1 = y1
  return m
}

function readCut(m: THREE.Object3D): CutData | null {
  const u = m.userData as Partial<CutData>
  return typeof u.h0 === 'number' && typeof u.h1 === 'number' ? (u as CutData) : null
}

const CUT_HEIGHT = 1.1
const EYE = 1.62
const RADIUS = 0.3
const SPEED = 1.75

/** Tinta de los muros: maqueta vs. blanco cal del proyecto. */
const W_PLAN = 0xe9e6e0
const WI_PLAN = 0xdedad2
const W_CAL = 0xe9e4da
const WI_CAL = 0xe2ddd2

export function createPlanoScene(
  host: HTMLElement,
  onWalkExit: () => void,
  onPointerLock: (locked: boolean) => void,
): PlanoScene {
  /* ---------------------------------------------------------------- escena */
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xe9ecf0)
  scene.fog = new THREE.Fog(0xe9ecf0, 26, 52)

  // preserveDrawingBuffer: permite exportar los puntos de vista con toDataURL,
  // que es como se sacan los renders de ambiente a partir del modelo.
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(host.clientWidth, host.clientHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  host.appendChild(renderer.domElement)

  const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.1, 200)
  camera.position.set(CX + 5.4, 6.5, Z1 + 3.6)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(CX, 0.9, CZ)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.maxPolarAngle = Math.PI / 2 - 0.02
  controls.minDistance = 2.2
  controls.maxDistance = 34
  controls.update()

  scene.add(new THREE.HemisphereLight(0xe3ecf5, 0x9a9287, 0.95))

  const sun = new THREE.DirectionalLight(0xffffff, 1.6)
  sun.position.set(CX + 7, 12, CZ - 8)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  const sc = sun.shadow.camera
  sc.left = -10
  sc.right = 10
  sc.top = 12
  sc.bottom = -12
  sc.near = 1
  sc.far = 40
  sun.shadow.bias = -0.0008
  sun.target.position.set(CX, 0, CZ)
  scene.add(sun, sun.target)

  const fill = new THREE.DirectionalLight(0xffffff, 0.35)
  fill.position.set(CX - 8, 6, CZ + 10)
  scene.add(fill)

  /* --------------------------------------------------------------- helpers */
  const disposables: Array<THREE.BufferGeometry | THREE.Material | THREE.Texture> = []

  function mat(color: number, opts: THREE.MeshStandardMaterialParameters = {}) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02, ...opts })
    disposables.push(m)
    return m
  }

  function box<M extends THREE.Material>(
    x0: number, x1: number, z0: number, z1: number,
    y0: number, y1: number, material: M,
  ): THREE.Mesh<THREE.BoxGeometry, M> {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)
    disposables.push(g)
    const m = new THREE.Mesh(g, material)
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    m.castShadow = true
    m.receiveShadow = true
    return m
  }

  const gWalls = new THREE.Group()
  const gFloors = new THREE.Group()
  const gFurn = new THREE.Group()
  const gDims = new THREE.Group()
  const gLabels = new THREE.Group()
  const gDoors = new THREE.Group()
  scene.add(gWalls, gFloors, gFurn, gDims, gLabels, gDoors)

  const wallMat = mat(W_PLAN, { roughness: 0.95 })
  const wallMatIn = mat(WI_PLAN, { roughness: 0.95 })

  function wall(
    x0: number, x1: number, z0: number, z1: number,
    y0: number, y1: number, inner = false,
  ) {
    const m = tagCut(box(x0, x1, z0, z1, y0, y1, inner ? wallMatIn : wallMat), y0, y1)
    gWalls.add(m)
    return m
  }

  /* ------------------------------------------------------ muros exteriores */
  wall(X0, X1, Z0, ZI0, 0, H) // norte
  wall(X0, X1, ZK2, Z1, 0, H) // sur
  wall(X0, XI0, Z0, Z1, 0, H) // oeste
  wall(XI1, X1, Z0, WZ0, 0, H) // este, tramo norte
  wall(XI1, X1, WZ1, Z1, 0, H) // este, tramo sur
  wall(XI1, X1, WZ0, WZ1, 0, WSILL) // antepecho de la nueva ventana
  wall(XI1, X1, WZ0, WZ1, WHEAD, H) // dintel de la nueva ventana

  /* ------------------------------------- tabique cuarto / pasillo con vano */
  wall(XI0 + DW, XI1, ZC1, ZP, 0, H, true)
  wall(XI0, XI0 + DW, ZC1, ZP, DOOR_H, H, true)

  /* ------------------------------------------------------ tabiques del baño */
  wall(XH1, XH2, ZP, BDZ0, 0, H, true)
  wall(XH1, XH2, BDZ1, ZB2, 0, H, true)
  wall(XH1, XH2, BDZ0, BDZ1, DOOR_H, H, true)
  const fillPanel = wall(XH1, XH2, BDZ0, BDZ1, 0, DOOR_H, true)
  fillPanel.userData.onlyRaw = true // en obra bruta el tabique es ciego
  wall(XH1, XI1, ZB1, ZB2, 0, H, true)

  /* ------------------------------------- hoja y arco de la puerta dibujada */
  const doorMat = mat(0xb08a62, { roughness: 0.7 })
  const arcMat = new THREE.MeshBasicMaterial({
    color: 0x8b97a3, side: THREE.DoubleSide, transparent: true, opacity: 0.85,
  })
  disposables.push(arcMat)

  {
    const g = new THREE.Group()
    g.position.set(XI0, 0, ZC1)
    g.add(box(0, DW, -0.02, 0.02, 0, DOOR_H, doorMat))
    g.rotation.y = (76 * Math.PI) / 180
    gDoors.add(g)

    const rg = new THREE.RingGeometry(DW - 0.015, DW, 48, 1, 0, (76 * Math.PI) / 180)
    disposables.push(rg)
    const ring = new THREE.Mesh(rg, arcMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(XI0, 0.012, ZC1)
    gDoors.add(ring)
  }

  /* -------------------------------------------------------------- solados */
  const slab = box(X0, X1, Z0, Z1, -0.16, -0.06, mat(0xc6ccd3, { roughness: 1 }))
  slab.castShadow = false
  gFloors.add(slab)

  const floorMeshes = {} as Record<RoomKey, THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>>
  const floorBounds: Record<RoomKey, [number, number, number, number]> = {
    cuarto: [XI0, XI1, ZI0, ZC1],
    pasillo: [XI0, XH1, ZP, ZB2],
    bano: [XH2, XI1, ZP, ZB1],
    sala: [XI0, XI1, ZB2, ZS2],
    cocina: [XI0, XI1, ZS2, ZK2],
  }
  for (const room of ROOMS) {
    const [x0, x1, z0, z1] = floorBounds[room.key]
    const m = box(x0, x1, z0, z1, -0.06, 0, mat(room.finish, { roughness: 0.92 }))
    m.castShadow = false
    gFloors.add(m)
    floorMeshes[room.key] = m
  }

  /* -------------------------------------------- nueva ventana (obra nueva) */
  const frameMat = mat(0x2c2f31, { roughness: 0.55 })
  const glassMat = mat(0xbcd6e0, { roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.26 })

  function winPart(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, m: THREE.Material) {
    gWalls.add(tagCut(box(x0, x1, z0, z1, y0, y1, m), y0, y1))
  }
  const FT = 0.06
  winPart(XI1, X1, WZ0, WZ1, WSILL, WSILL + FT, frameMat)
  winPart(XI1, X1, WZ0, WZ1, WHEAD - FT, WHEAD, frameMat)
  winPart(XI1, X1, WZ0, WZ0 + FT, WSILL, WHEAD, frameMat)
  winPart(XI1, X1, WZ1 - FT, WZ1, WSILL, WHEAD, frameMat)
  winPart(XI1 + 0.05, X1 - 0.05, WZ0 + FT, WZ1 - FT, WSILL + FT, WHEAD - FT, glassMat)

  /* ============================ PROYECTO DE INTERIORISMO ==================
     Todo cabe dentro de la geometría del croquis: ningún muro, tabique,
     puerta ni la nueva ventana se han movido.                              */
  const M = {
    roble: mat(0x9c7238, { roughness: 0.72 }),
    oliva: mat(0x47513c, { roughness: 0.55 }),
    olivaCl: mat(0x515c44, { roughness: 0.55 }),
    piedra: mat(0xd8d3c6, { roughness: 0.45 }),
    lino: mat(0x6e8190, { roughness: 0.95 }),
    linoCl: mat(0x7d8f9c, { roughness: 0.95 }),
    ropa: mat(0xe6e1d6, { roughness: 0.95 }),
    ocre: mat(0xb5813a, { roughness: 1 }),
    laton: mat(0xb08d4f, { roughness: 0.3, metalness: 0.65 }),
    negro: mat(0x2c2f31, { roughness: 0.5 }),
    acero: mat(0xb4bcc2, { roughness: 0.28, metalness: 0.55 }),
    porc: mat(0xf2f1ee, { roughness: 0.25 }),
    azulejo: mat(0x2f5b66, { roughness: 0.22 }),
    vidrio: mat(0xc3dbe4, { roughness: 0.06, transparent: true, opacity: 0.22 }),
  }

  function F(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, m: THREE.Material) {
    const b = tagCut(box(x0, x1, z0, z1, y0, y1, m), y0, y1)
    gFurn.add(b)
    return b
  }

  // Cuarto 3,32 × 2,93 — cama al oeste, armario a techo al este, 0,85 m de paso.
  F(XI0, XI0 + 1.4, ZI0, ZI0 + 0.055, 0.3, 1.05, M.roble)
  F(XI0, XI0 + 1.4, ZI0, ZI0 + 1.9, 0.1, 0.36, M.roble)
  F(XI0, XI0 + 1.4, ZI0, ZI0 + 1.9, 0.36, 0.58, M.ropa)
  F(XI0 + 0.08, XI0 + 0.66, ZI0 + 0.1, ZI0 + 0.48, 0.58, 0.7, M.porc)
  F(XI0 + 0.74, XI0 + 1.32, ZI0 + 0.1, ZI0 + 0.48, 0.58, 0.7, M.porc)
  F(XI0 + 0.2, XI0 + 1.4, ZI0 + 1.2, ZI0 + 1.9, 0.58, 0.62, M.lino)
  F(XI0 + 1.47, XI0 + 1.87, ZI0, ZI0 + 0.4, 0, 0.14, M.roble)
  F(XI0 + 1.47, XI0 + 1.87, ZI0, ZI0 + 0.4, 0.4, 0.48, M.roble)
  F(XI0 + 1.5, XI0 + 1.55, ZI0 + 0.03, ZI0 + 0.08, 0.14, 0.4, M.roble)
  F(XI0 + 1.79, XI0 + 1.84, ZI0 + 0.32, ZI0 + 0.37, 0.14, 0.4, M.roble)
  F(XI1 - 0.6, XI1, ZI0, ZI0 + 2.3, 0, 2.3, M.oliva)
  F(XI1 - 0.62, XI1 - 0.58, ZI0 + 0.02, ZI0 + 1.14, 0.02, 2.28, M.olivaCl)
  F(XI1 - 0.62, XI1 - 0.58, ZI0 + 1.16, ZI0 + 2.28, 0.02, 2.28, M.olivaCl)
  F(XI1 - 0.63, XI1 - 0.6, ZI0 + 1.06, ZI0 + 1.1, 1, 1.6, M.laton)
  F(XI1 - 0.63, XI1 - 0.6, ZI0 + 1.2, ZI0 + 1.24, 1, 1.6, M.laton)

  // Baño 2,14 × 1,28 — ducha a toda la profundidad, lavabo e inodoro al norte.
  F(XI1 - 0.9, XI1, ZP, ZB1, 0, 0.035, M.porc)
  F(XI1 - 0.025, XI1, ZP, ZB1, 0, 2.05, M.azulejo)
  F(XI1 - 0.9, XI1, ZP, ZP + 0.025, 0, 2.05, M.azulejo)
  F(XI1 - 0.9, XI1, ZB1 - 0.025, ZB1, 0, 2.05, M.azulejo)
  F(XI1 - 0.92, XI1 - 0.88, ZP + 0.02, ZP + 0.92, 0.035, 2, M.vidrio)
  F(XI1 - 0.93, XI1 - 0.87, ZP + 0.9, ZP + 0.94, 0.035, 2, M.laton)
  F(XI1 - 0.3, XI1 - 0.04, ZP + 0.6, ZP + 0.66, 1.95, 2, M.laton)
  F(XH2 + 0.08, XH2 + 0.63, ZP, ZP + 0.42, 0.55, 0.78, M.roble)
  F(XH2 + 0.06, XH2 + 0.65, ZP, ZP + 0.44, 0.78, 0.86, M.porc)
  F(XH2 + 0.3, XH2 + 0.38, ZP + 0.04, ZP + 0.1, 0.86, 1.12, M.laton)
  F(XH2 + 0.1, XH2 + 0.61, ZP, ZP + 0.025, 1.05, 1.7, M.negro)
  F(XH2 + 0.78, XH2 + 1.16, ZP, ZP + 0.2, 0.3, 0.85, M.porc)
  F(XH2 + 0.78, XH2 + 1.16, ZP + 0.2, ZP + 0.78, 0, 0.42, M.porc)
  F(XH2 + 0.78, XH2 + 1.16, ZP + 0.18, ZP + 0.76, 0.4, 0.44, M.negro)

  // Puerta del baño: abate hacia el pasillo, que está libre.
  {
    const g = new THREE.Group()
    g.position.set(XH1, 0, BDZ1)
    g.add(tagCut(box(-0.021, 0.021, -0.7, 0, 0, DOOR_H, M.roble), 0, DOOR_H))
    g.rotation.y = (74 * Math.PI) / 180
    gFurn.add(g)

    const rg = new THREE.RingGeometry(0.685, 0.7, 40, 1, Math.PI / 2, (74 * Math.PI) / 180)
    disposables.push(rg)
    const r = new THREE.Mesh(rg, arcMat)
    r.rotation.x = -Math.PI / 2
    r.position.set(XH1, 0.012, BDZ1)
    gFurn.add(r)
  }

  // Pasillo 1,08 × 1,38 — columna de 0,28 m: conserva 0,80 m de paso.
  F(XI0, XI0 + 0.28, ZP, ZB2, 0, 2.3, M.oliva)
  F(XI0 + 0.28, XI0 + 0.3, ZP + 0.02, ZB2 - 0.02, 0.02, 2.28, M.olivaCl)

  // Sala 3,32 × 3,19 — sofá 0,88 + paso 1,14 + mesa 0,80 bajo la nueva ventana.
  const SFZ = 4.88
  F(XI0, XI0 + 0.88, SFZ, SFZ + 2, 0.12, 0.4, M.lino)
  F(XI0, XI0 + 0.22, SFZ, SFZ + 2, 0.4, 0.82, M.lino)
  F(XI0, XI0 + 0.88, SFZ, SFZ + 0.14, 0.4, 0.6, M.lino)
  F(XI0, XI0 + 0.88, SFZ + 1.86, SFZ + 2, 0.4, 0.6, M.lino)
  F(XI0 + 0.22, XI0 + 0.86, SFZ + 0.16, SFZ + 1.06, 0.4, 0.52, M.linoCl)
  F(XI0 + 0.22, XI0 + 0.86, SFZ + 1.08, SFZ + 1.84, 0.4, 0.52, M.linoCl)
  F(XI0 + 0.24, XI0 + 0.5, SFZ + 0.2, SFZ + 0.52, 0.52, 0.66, M.ocre)
  F(XI0 + 0.24, XI0 + 0.5, SFZ + 1.48, SFZ + 1.8, 0.52, 0.66, M.ocre)
  F(XI0 + 0.98, XI0 + 1.42, SFZ - 0.02, SFZ + 0.42, 0.46, 0.52, M.roble)
  F(XI0 + 1.16, XI0 + 1.24, SFZ + 0.16, SFZ + 0.24, 0, 0.46, M.negro)
  F(XI0 + 1.05, XI0 + 2.55, ZB2 + 0.85, ZB2 + 2.55, 0.001, 0.014, M.ocre)

  const DTX = XI1 - 0.8
  const DTZ = 5.52
  F(DTX, XI1, DTZ, DTZ + 1.4, 0.71, 0.75, M.roble)
  F(DTX + 0.04, DTX + 0.1, DTZ + 0.04, DTZ + 0.1, 0, 0.71, M.negro)
  F(DTX + 0.04, DTX + 0.1, DTZ + 1.3, DTZ + 1.36, 0, 0.71, M.negro)
  F(XI1 - 0.1, XI1 - 0.04, DTZ + 0.04, DTZ + 0.1, 0, 0.71, M.negro)
  F(XI1 - 0.1, XI1 - 0.04, DTZ + 1.3, DTZ + 1.36, 0, 0.71, M.negro)

  function chair(x: number, z: number) {
    F(x, x + 0.44, z, z + 0.44, 0.44, 0.48, M.roble)
    F(x, x + 0.05, z, z + 0.44, 0.48, 0.88, M.roble)
    const legs: Array<[number, number]> = [
      [x + 0.02, z + 0.02], [x + 0.37, z + 0.02],
      [x + 0.02, z + 0.37], [x + 0.37, z + 0.37],
    ]
    for (const [lx, lz] of legs) F(lx, lx + 0.05, lz, lz + 0.05, 0, 0.44, M.negro)
  }
  chair(DTX - 0.52, DTZ + 0.14)
  chair(DTX - 0.52, DTZ + 0.82)
  F(DTX + 0.3, DTX + 0.54, DTZ + 0.58, DTZ + 0.82, 0.75, 0.9, M.azulejo)

  // Cocina abierta 3,32 × 0,68 — frente único, sin península posible.
  F(XI0, XI0 + 0.62, ZS2, ZK2, 0, 1.9, M.oliva) // nevera integrada
  F(XI0 + 0.62, XI1, ZS2, ZK2, 0, 0.86, M.oliva)
  F(XI0 + 0.62, XI1, ZS2 - 0.03, ZK2, 0.86, 0.9, M.piedra)
  F(XI0 + 0.9, XI0 + 1.5, ZS2 + 0.1, ZK2 - 0.1, 0.87, 0.9, M.acero)
  F(XI0 + 1.14, XI0 + 1.2, ZS2 + 0.14, ZS2 + 0.2, 0.9, 1.18, M.laton)
  F(XI0 + 2.1, XI0 + 2.7, ZS2 + 0.1, ZK2 - 0.1, 0.9, 0.93, M.negro)
  F(XI0 + 0.62, XI1, ZK2 - 0.03, ZK2, 0.9, 1.44, M.azulejo)
  F(XI0 + 1.95, XI1, ZK2 - 0.35, ZK2, 1.44, 2.3, M.oliva)
  F(XI0 + 0.72, XI0 + 1.85, ZK2 - 0.24, ZK2, 1.52, 1.56, M.roble)
  F(XI0 + 0.72, XI0 + 1.85, ZK2 - 0.24, ZK2, 1.92, 1.96, M.roble)

  function pendant(x: number, z: number, y: number) {
    F(x - 0.005, x + 0.005, z - 0.005, z + 0.005, y, H, M.negro)
    F(x - 0.13, x + 0.13, z - 0.13, z + 0.13, y - 0.1, y, M.laton)
    const pl = new THREE.PointLight(0xffd7a8, 6, 6.5, 2)
    pl.position.set(x, y - 0.14, z)
    gFurn.add(pl)
  }
  pendant(DTX + 0.4, DTZ + 0.7, 1.62)
  pendant(XI0 + 1.2, ZI0 + 1.6, 1.95)
  pendant(XI0 + 1.6, ZB2 + 1.1, 2.05)

  /* -------------------------------------------------------------- rótulos */
  function sprite(title: string, sub: string, accent?: string) {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 170
    const g = c.getContext('2d')
    if (g) {
      g.textAlign = 'center'
      g.fillStyle = accent ?? '#141c25'
      g.font = '600 62px Archivo, system-ui, sans-serif'
      g.fillText(title, 256, 70)
      g.fillStyle = '#5c6876'
      g.font = '500 40px ui-monospace, monospace'
      g.fillText(sub, 256, 126)
    }
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    disposables.push(tex)
    const sm = new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true })
    disposables.push(sm)
    const sp = new THREE.Sprite(sm)
    sp.scale.set(1.72, 0.571, 1)
    return sp
  }

  for (const room of ROOMS) {
    const s = sprite(room.name, `${room.a.toFixed(2).replace('.', ',')} m²`)
    s.position.set(room.cx, 1.35, room.cz)
    gLabels.add(s)
  }
  {
    const t = sprite('Nueva ventana', '1,99 m', '#c23b1e')
    t.scale.set(1.9, 0.63, 1)
    t.position.set(X1 + 0.55, (WSILL + WHEAD) / 2, (WZ0 + WZ1) / 2)
    gLabels.add(t)
  }

  /* ---------------------------------------------------- cotas del croquis */
  const dimMat = new THREE.MeshBasicMaterial({ color: 0x4a5661 })
  disposables.push(dimMat)

  function dimLabel(text: string) {
    const c = document.createElement('canvas')
    c.width = 360
    c.height = 110
    const g = c.getContext('2d')
    if (g) {
      g.textAlign = 'center'
      g.fillStyle = '#2a343d'
      g.font = '500 58px ui-monospace, monospace'
      g.fillText(text, 180, 74)
    }
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    disposables.push(tex)
    const sm = new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true })
    disposables.push(sm)
    const sp = new THREE.Sprite(sm)
    sp.scale.set(1.25, 0.382, 1)
    return sp
  }

  function dimension(axis: 'x' | 'z', a: number, b: number, off: number, text: string) {
    const t = 0.022
    const y = 0.02
    const cone = new THREE.ConeGeometry(0.055, 0.17, 10)
    disposables.push(cone)
    let line: THREE.Mesh
    let mid: THREE.Vector3
    const c0 = new THREE.Mesh(cone, dimMat)
    const c1 = new THREE.Mesh(cone, dimMat)
    if (axis === 'x') {
      line = box(a, b, off - t, off + t, y, y + t, dimMat)
      mid = new THREE.Vector3((a + b) / 2, 0.02, off)
      c0.position.set(a + 0.085, y, off)
      c0.rotation.z = Math.PI / 2
      c1.position.set(b - 0.085, y, off)
      c1.rotation.z = -Math.PI / 2
    } else {
      line = box(off - t, off + t, a, b, y, y + t, dimMat)
      mid = new THREE.Vector3(off, 0.02, (a + b) / 2)
      c0.position.set(off, y, a + 0.085)
      c0.rotation.x = -Math.PI / 2
      c1.position.set(off, y, b - 0.085)
      c1.rotation.x = Math.PI / 2
    }
    line.castShadow = false
    c0.castShadow = false
    c1.castShadow = false
    gDims.add(line, c0, c1)
    const sp = dimLabel(text)
    sp.position.copy(mid).setY(0.32)
    gDims.add(sp)
  }

  dimension('x', XI0, XI1, -0.75, '3,32 m')
  dimension('x', X0, X1, Z1 + 0.75, '3,61 m')
  dimension('z', ZI0, ZC1, X1 + 0.75, '2,93 m')
  dimension('z', ZP, ZK2, X0 - 0.75, '5,25 m')

  /* ------------------------------------------------------ recorrido a pie */
  const ceiling = box(X0, X1, Z0, Z1, H, H + 0.05, mat(0xe8e4dc, { roughness: 1 }))
  ceiling.castShadow = false
  ceiling.visible = false
  scene.add(ceiling)

  const skyGeo = new THREE.PlaneGeometry(30, 16)
  disposables.push(skyGeo)
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xcadcea })
  disposables.push(skyMat)
  const sky = new THREE.Mesh(skyGeo, skyMat)
  sky.position.set(X1 + 7, 3, CZ)
  sky.rotation.y = -Math.PI / 2
  scene.add(sky)

  const walkAmb = new THREE.AmbientLight(0xffffff, 0.26)
  walkAmb.visible = false
  scene.add(walkAmb)

  /* ------------------------------------------------------------- estado */
  let currentCut = CUT_HEIGHT
  let furnished = true
  let walking = false
  let locked = false
  let wx = 1.9
  let wz = 5.0
  let wyaw = 3.0
  let wpitch = -0.05
  const keys: Record<string, boolean> = {}
  const joy = { x: 0, y: 0 }
  let colliders: Array<{ x0: number; x1: number; z0: number; z1: number }> = []
  let savedDims = true
  let savedLabels = true

  function applyCut(m: THREE.Object3D, cut: CutData, cutY: number) {
    const { h0, h1 } = cut
    const top = Math.min(h1, cutY)
    if (top <= h0 + 0.001) {
      m.visible = false
      return
    }
    m.visible = true
    m.scale.y = (top - h0) / (h1 - h0)
    m.position.y = (h0 + top) / 2
  }

  function applyCutAll(cutY: number) {
    currentCut = cutY
    for (const m of gWalls.children) {
      const u = readCut(m)
      if (!u) continue
      if (u.onlyRaw && furnished) {
        m.visible = false
        continue
      }
      applyCut(m, u, cutY)
    }
    gFurn.traverse((m) => {
      const u = readCut(m)
      if (u) applyCut(m, u, cutY === 0 ? H : cutY)
    })
    for (const o of gDoors.children) {
      if (o.type === 'Group') o.visible = cutY >= 2.4
    }
    if (walking) buildColliders()
  }

  function buildColliders() {
    colliders = []
    const bb = new THREE.Box3()
    const roots = furnished ? [gWalls, gFurn] : [gWalls]
    for (const root of roots) {
      root.traverse((m) => {
        const u = readCut(m)
        if (!(m as THREE.Mesh).isMesh || !u) return
        if (u.onlyRaw && furnished) return
        if (u.h0 > 1.3 || u.h1 < 0.32) return // dinteles arriba, alfombras abajo
        bb.setFromObject(m)
        colliders.push({ x0: bb.min.x, x1: bb.max.x, z0: bb.min.z, z1: bb.max.z })
      })
    }
  }

  function bumped(x: number, z: number) {
    for (const c of colliders) {
      if (x > c.x0 - RADIUS && x < c.x1 + RADIUS && z > c.z0 - RADIUS && z < c.z1 + RADIUS) return true
    }
    return false
  }

  function stepWalk(dt: number) {
    let f = 0
    let r = 0
    if (keys.KeyW || keys.ArrowUp) f += 1
    if (keys.KeyS || keys.ArrowDown) f -= 1
    if (keys.KeyD || keys.ArrowRight) r += 1
    if (keys.KeyA || keys.ArrowLeft) r -= 1
    f -= joy.y
    r += joy.x
    const len = Math.sqrt(f * f + r * r)
    if (len < 0.001) return
    if (len > 1) {
      f /= len
      r /= len
    }
    const sp = SPEED * dt * (keys.ShiftLeft || keys.ShiftRight ? 1.8 : 1)
    const nx = wx + (-Math.sin(wyaw) * f + Math.cos(wyaw) * r) * sp
    const nz = wz + (-Math.cos(wyaw) * f - Math.sin(wyaw) * r) * sp
    if (!bumped(nx, wz)) wx = nx
    if (!bumped(wx, nz)) wz = nz
  }

  /* ------------------------------------------------------------ eventos */
  const el = renderer.domElement

  const onMouseMove = (e: MouseEvent) => {
    if (!locked) return
    wyaw -= e.movementX * 0.0023
    wpitch -= e.movementY * 0.0023
    wpitch = Math.max(-1.35, Math.min(1.35, wpitch))
  }
  const onLockChange = () => {
    locked = document.pointerLockElement === el
    onPointerLock(locked)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (!walking) return
    keys[e.code] = true
    if (e.code.startsWith('Arrow')) e.preventDefault()
  }
  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.code] = false
  }

  let tPrev: { x: number; y: number } | null = null
  const onTouchStart = (e: TouchEvent) => {
    if (walking && e.touches.length) tPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchMove = (e: TouchEvent) => {
    if (!walking || !tPrev || !e.touches.length) return
    const t = e.touches[0]
    wyaw -= (t.clientX - tPrev.x) * 0.005
    wpitch -= (t.clientY - tPrev.y) * 0.005
    wpitch = Math.max(-1.35, Math.min(1.35, wpitch))
    tPrev = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = () => {
    tPrev = null
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('pointerlockchange', onLockChange)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: true })
  el.addEventListener('touchend', onTouchEnd, { passive: true })

  const onResize = () => {
    const w = host.clientWidth
    const h = host.clientHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', onResize)

  /* -------------------------------------------------------------- cámara */
  let inViewpoint = false

  /** Devuelve la cámara a su estado de maqueta al salir de un punto de vista. */
  function leaveViewpoint() {
    if (!inViewpoint) return
    inViewpoint = false
    ceiling.visible = false
    walkAmb.visible = false
    controls.minDistance = 2.2
    camera.fov = 42
    camera.updateProjectionMatrix()
    gDims.visible = savedDims
    gLabels.visible = savedLabels
  }

  let tween: { p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3; s: number } | null = null
  function flyTo(p: [number, number, number], t: [number, number, number]) {
    tween = {
      p0: camera.position.clone(),
      p1: new THREE.Vector3(...p),
      t0: controls.target.clone(),
      t1: new THREE.Vector3(...t),
      s: performance.now(),
    }
  }

  /* --------------------------------------------------------------- bucle */
  let raf = 0
  let lastT = 0
  function tick(now: number) {
    raf = requestAnimationFrame(tick)
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016
    lastT = now

    if (walking) {
      stepWalk(dt)
      camera.rotation.set(wpitch, wyaw, 0)
      camera.position.set(wx, EYE, wz)
      renderer.render(scene, camera)
      return
    }
    if (tween) {
      const k = Math.min(1, (now - tween.s) / 620)
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2
      camera.position.lerpVectors(tween.p0, tween.p1, e)
      controls.target.lerpVectors(tween.t0, tween.t1, e)
      if (k >= 1) tween = null
    }
    controls.update()
    renderer.render(scene, camera)
  }

  applyCutAll(CUT_HEIGHT)
  onResize()
  raf = requestAnimationFrame(tick)

  /* ----------------------------------------------------------------- API */
  return {
    setCamera(preset) {
      if (walking) return
      leaveViewpoint()
      if (preset === 'persp') {
        controls.maxPolarAngle = Math.PI / 2 - 0.02
        flyTo([CX + 5.4, 6.5, Z1 + 3.6], [CX, 0.9, CZ])
      } else if (preset === 'iso') {
        controls.maxPolarAngle = Math.PI / 2 - 0.02
        flyTo([CX + 7, 7.4, CZ + 7], [CX, 0.6, CZ])
      } else {
        controls.maxPolarAngle = Math.PI
        flyTo([CX, 12.6, CZ + 0.02], [CX, 0, CZ])
      }
    },
    setViewpoint(key) {
      if (walking) return
      const v = VIEWPOINTS.find((p) => p.key === key)
      if (!v) return
      inViewpoint = true
      gDims.visible = false
      gLabels.visible = false
      ceiling.visible = true
      walkAmb.visible = true
      controls.minDistance = 0.05
      controls.maxPolarAngle = Math.PI / 2 - 0.02
      camera.fov = v.fov
      camera.updateProjectionMatrix()
      applyCutAll(H + 0.01)
      flyTo(v.eye, v.look)
    },
    setWalls(mode) {
      applyCutAll(mode === 'full' ? H + 0.01 : mode === 'cut' ? CUT_HEIGHT : 0)
    },
    setFurnished(on) {
      furnished = on
      gFurn.visible = on
      wallMat.color.setHex(on ? W_CAL : W_PLAN)
      wallMatIn.color.setHex(on ? WI_CAL : WI_PLAN)
      frameMat.color.setHex(on ? 0x2c2f31 : OBRA)
      for (const room of ROOMS) {
        floorMeshes[room.key].material.color.setHex(on ? room.finish : room.plan)
      }
      applyCutAll(currentCut)
    },
    setDims(on) {
      gDims.visible = on && !inViewpoint
      if (!walking) savedDims = on
    },
    setLabels(on) {
      gLabels.visible = on && !inViewpoint
      if (!walking) savedLabels = on
    },
    setWalking(on) {
      leaveViewpoint()
      walking = on
      controls.enabled = !on
      ceiling.visible = on
      walkAmb.visible = on
      if (on) {
        savedDims = gDims.visible
        savedLabels = gLabels.visible
        gDims.visible = false
        gLabels.visible = false
        applyCutAll(H + 0.01)
        buildColliders()
        wx = 1.9
        wz = 5.0
        wyaw = 3.0
        wpitch = -0.05
        camera.rotation.order = 'YXZ'
        camera.fov = 62
        camera.updateProjectionMatrix()
        el.addEventListener('click', requestLock)
      } else {
        el.removeEventListener('click', requestLock)
        if (document.exitPointerLock) document.exitPointerLock()
        gDims.visible = savedDims
        gLabels.visible = savedLabels
        applyCutAll(CUT_HEIGHT)
        camera.rotation.order = 'XYZ'
        camera.fov = 42
        camera.updateProjectionMatrix()
        camera.position.set(CX + 5.4, 6.5, Z1 + 3.6)
        controls.target.set(CX, 0.9, CZ)
        controls.update()
        onWalkExit()
      }
    },
    setJoy(x, y) {
      joy.x = x
      joy.y = y
    },
    focusRoom(key) {
      if (walking) return
      leaveViewpoint()
      const room = ROOMS.find((r) => r.key === key)
      if (!room) return
      flyTo([room.cx + 3.4, 4.6, room.cz + 4.2], [room.cx, 0.6, room.cz])
    },
    highlight(key, on) {
      const m = floorMeshes[key]
      const room = ROOMS.find((r) => r.key === key)
      if (!m || !room) return
      m.material.emissive.setHex(on ? 0x2a2418 : 0x000000)
      m.material.color.setHex(furnished ? room.finish : room.plan)
      if (on) m.material.color.offsetHSL(0, 0.1, 0.07)
    },
    dispose() {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onLockChange)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('click', requestLock)
      controls.dispose()
      for (const d of disposables) d.dispose()
      renderer.dispose()
      if (el.parentNode) el.parentNode.removeChild(el)
    },
  }

  function requestLock() {
    if (walking && el.requestPointerLock) el.requestPointerLock()
  }
}
