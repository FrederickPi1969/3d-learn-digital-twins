import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

const canvas = document.querySelector('#warehouse')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setSize(innerWidth, innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = .64

const scene = new THREE.Scene()
scene.fog = new THREE.Fog('#06111c', 35, 96)
const camera = new THREE.PerspectiveCamera(44, innerWidth / innerHeight, .1, 180)
camera.position.set(31, 35, 42)
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 2, 0)
controls.enableDamping = true
controls.maxPolarAngle = 1.42
controls.minDistance = 20
controls.maxDistance = 76
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .16, .24, .92)
composer.addPass(bloom)
composer.addPass(new OutputPass())

const pmrem = new THREE.PMREMGenerator(renderer)
new RGBELoader().load('./public/assets/lighting/studio_small_09_1k.hdr', (texture) => {
  const environment = pmrem.fromEquirectangular(texture).texture
  scene.environment = environment
  scene.environmentIntensity = .42
  texture.dispose(); pmrem.dispose()
})

scene.add(new THREE.HemisphereLight('#9ce8ff', '#031019', .92))
const key = new THREE.DirectionalLight('#c5f5ff', 3.4)
key.position.set(18, 34, 18); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -35; key.shadow.camera.right = 35; key.shadow.camera.top = 35; key.shadow.camera.bottom = -35
scene.add(key)
key.intensity = 1.35
const blue = new THREE.PointLight('#10b9ff', 22, 42); blue.position.set(-21, 9, -4); scene.add(blue)
const cyan = new THREE.PointLight('#20f1dc', 17, 35); cyan.position.set(17, 8, 10); scene.add(cyan)

const mat = (color, emissive = '#000000', intensity = 0) => new THREE.MeshStandardMaterial({ color, roughness: .66, metalness: .24, emissive, emissiveIntensity: intensity })
const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 64), new THREE.MeshPhysicalMaterial({ color:'#0b2631', metalness:.22, roughness:.48, clearcoat:.18, clearcoatRoughness:.46 }))
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)
const grid = new THREE.GridHelper(76, 38, '#1d8aa1', '#104357'); grid.position.y = .015; grid.material.transparent = true; grid.material.opacity = .36; scene.add(grid)

function mesh(geometry, material, position, scale = [1, 1, 1]) { const object = new THREE.Mesh(geometry, material); object.position.set(...position); object.scale.set(...scale); object.castShadow = object.receiveShadow = true; scene.add(object); return object }
function worldLabel(title, subtitle, position) {
  const labelCanvas = document.createElement('canvas'); labelCanvas.width = 512; labelCanvas.height = 128
  const context = labelCanvas.getContext('2d'); context.fillStyle = 'rgba(4, 22, 35, .9)'; context.fillRect(0, 0, 512, 128)
  context.fillStyle = '#5feaff'; context.fillRect(0, 0, 10, 128)
  context.strokeStyle = 'rgba(91, 227, 255, .75)'; context.strokeRect(.5, .5, 511, 127)
  context.font = '600 30px sans-serif'; context.fillStyle = '#e7fbff'; context.fillText(title, 28, 52)
  context.font = '18px sans-serif'; context.fillStyle = '#82b7c7'; context.fillText(subtitle, 28, 88)
  const texture = new THREE.CanvasTexture(labelCanvas); texture.colorSpace = THREE.SRGBColorSpace
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map:texture, transparent:true, depthTest:false, depthWrite:false }))
  label.position.set(...position); label.scale.set(5.5, 1.38, 1); scene.add(label)
  return label
}
function beam(a, b, width, material) { const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(.5); const length = a.distanceTo(b); const object = mesh(new THREE.BoxGeometry(width, length, width), material, mid); object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(b, a).normalize()); return object }
for (const x of [-24,-8,8,24]) for (const z of [-16,4,20]) {
  const panel = mesh(new THREE.BoxGeometry(6,.08,1.15), new THREE.MeshStandardMaterial({ color:'#d7f8ff', emissive:'#a6edff', emissiveIntensity:.8 }), [x,14.5,z])
  const light = new THREE.PointLight('#b8f4ff', 9, 18, 2); light.position.set(x,13.8,z); scene.add(light)
  panel.receiveShadow=false
}

// Warehouse shell and zones
const steel = mat('#164c60', '#0a3650', .22), rail = mat('#2c7790'), amber = mat('#f3a64b', '#f27818', .45), dark = mat('#09202b'), white = mat('#d7edf0')
const conveyorRollers = []
const beltMarkers = []
for (const x of [-35, 35]) beam(new THREE.Vector3(x, 0, -26), new THREE.Vector3(x, 15, -26), .48, steel)
for (const x of [-35, 35]) beam(new THREE.Vector3(x, 0, 26), new THREE.Vector3(x, 15, 26), .48, steel)
for (const z of [-26, 26]) beam(new THREE.Vector3(-35, 15, z), new THREE.Vector3(35, 15, z), .38, steel)
for (let x = -32; x <= 32; x += 8) mesh(new THREE.BoxGeometry(.12, .03, 48), mat('#1b6b80', '#0b7a95', .5), [x, .04, 0])

function rack(x, z, length, label) {
  const group = new THREE.Group(); group.position.set(x, 0, z); scene.add(group)
  const rackSteel = mat('#376f83'), shelfMat = mat('#163d4d')
  for (const side of [-1, 1]) for (let n = 0; n <= length; n++) { const upright = new THREE.Mesh(new THREE.BoxGeometry(.18, 7.2, .18), rackSteel); upright.position.set(side * 1.35, 3.6, n * 2.7 - length * 1.35); upright.castShadow = true; group.add(upright) }
  for (let level = 1.25; level < 7; level += 1.85) for (let n = 0; n < length; n++) { const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.8, .13, 2.58), shelfMat); shelf.position.set(0, level, n * 2.7 - (length - 1) * 1.35); group.add(shelf) }
  const skuColors = ['#efb34f', '#42c8e9', '#ff765d', '#8d80ec', '#65c995']
  for (let level = 0; level < 3; level++) for (let n = 0; n < length; n++) for (let slot = -1; slot <= 1; slot++) {
    if ((n + level + slot + Math.round(x)) % 5 === 0) continue
    const carton = new THREE.Mesh(new THREE.BoxGeometry(.7, .55, .72), mat(skuColors[(n + level + slot + 9) % skuColors.length]))
    carton.position.set(slot * .83, 1.62 + level * 1.85, n * 2.7 - (length - 1) * 1.35)
    carton.castShadow = carton.receiveShadow = true; group.add(carton)
    const labelFace = new THREE.Mesh(new THREE.PlaneGeometry(.33,.12), white); labelFace.position.set(slot * .83, 1.62 + level * 1.85, n * 2.7 - (length - 1) * 1.35 + .365); group.add(labelFace)
  }
  const tag = document.createElement('div'); tag.className = 'rack-tag'; tag.textContent = label
  return group
}
for (const x of [-14, -9.2, -4.4, 4.4, 9.2, 14]) rack(x, -2, 7, x < 0 ? 'A 区' : 'B 区')

function conveyor(x, z, length, axis = 'x') {
  const group = new THREE.Group(); group.position.set(x, .72, z); scene.add(group)
  const railMat = mat('#245f70'), beltMat = mat('#0f2630')
  const belt = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? length : 1.8, .24, axis === 'x' ? 1.8 : length), beltMat); belt.castShadow = belt.receiveShadow = true; group.add(belt)
  for (const side of [-1, 1]) { const sideRail = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? length : .12, .42, axis === 'x' ? .1 : length), railMat); sideRail.position.set(axis === 'x' ? 0 : side * .88, .28, axis === 'x' ? side * .88 : 0); group.add(sideRail) }
  for (let n = -length / 2 + .3; n < length / 2; n += .65) { const roller = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.5, 10), railMat); roller.rotation.x = Math.PI / 2; if (axis === 'z') roller.rotation.z = Math.PI / 2; if(axis === 'x') roller.position.x=n; else roller.position.z=n; roller.position.y=.14; roller.userData.axis=axis; conveyorRollers.push(roller); group.add(roller) }
  for (let n = -length / 2 + .7; n < length / 2; n += 3.2) { const marker = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? .72 : .11, .035, axis === 'x' ? .11 : .72), new THREE.MeshStandardMaterial({ color:'#46def4', emissive:'#159fbd', emissiveIntensity:.65 })); if(axis === 'x') marker.position.set(n,.275,0); else marker.position.set(0,.275,n); marker.userData={axis,length}; beltMarkers.push(marker); group.add(marker) }
}
conveyor(-22, 11, 18); conveyor(-3, 11, 17); conveyor(14, 11, 16); conveyor(22, -1, 24, 'z'); conveyor(22, -13, 12); conveyor(9, -13, 14); conveyor(-5, -13, 14)
for (const pos of [[-26,11],[-10,11],[5,11],[21,7],[21,-5],[17,-13],[3,-13]]) mesh(new THREE.CylinderGeometry(.42,.42,.12,16), amber, [pos[0], .22, pos[1]])

// Picking cells, scanner gates, outbound cages
for (const x of [-24, -19]) { mesh(new THREE.BoxGeometry(3.6, .16, 4.8), mat('#0b4251'), [x,.1,-15]); mesh(new THREE.BoxGeometry(.28,4,.28), amber,[x-1.55,2,-16.9]); mesh(new THREE.BoxGeometry(.28,4,.28),amber,[x+1.55,2,-16.9]) }
for (const x of [16, 22, 28]) { mesh(new THREE.BoxGeometry(4.2,.1,4.4), dark,[x,.08,-13]); for (const side of [-1,1]) mesh(new THREE.BoxGeometry(.14,2.6,4.2),rail,[x+side*2.05,1.3,-13]) }
for (const x of [17, 27]) { mesh(new THREE.BoxGeometry(.22,4.5,.22), amber,[x,2.25,4.3]); mesh(new THREE.BoxGeometry(3.2,.24,.24), amber,[x+1.5,4.4,4.3]) }

const orders = [
  { id:'SO-85192', sku:'冷链试剂 × 6', lane:'S-01', color:'#55e8ff', route:[[-24,11],[-3,11],[14,11],[22,11],[22,-13]] },
  { id:'SO-85193', sku:'医疗耗材 × 12', lane:'S-03', color:'#ad83ff', route:[[-16,11],[-3,11],[14,11],[22,11],[22,-13],[10,-13]] },
  { id:'SO-85194', sku:'精密组件 × 3', lane:'QC-02', color:'#ffab55', route:[[-9,11],[-3,11],[14,11],[22,11],[22,-13],[-5,-13]] },
]
let activeOrder = 0
const moving = []
function createParcel(order, offset) {
  const parcel = mesh(new THREE.BoxGeometry(1.1,.8,1.1), mat(order.color, order.color, .28), [order.route[0][0],1.28,order.route[0][1]])
  parcel.userData = { order, progress: offset, speed: .032 + offset * .002 }
  moving.push(parcel)
}
orders.forEach((order, index) => { createParcel(order, index * .9); createParcel(order, index * .9 + 2.7) })

const loader = new GLTFLoader()
function placeModel(model, x, surfaceY, z, maxDimension, rotation = 0) {
  model.rotation.y = rotation
  model.updateMatrixWorld(true)
  let box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const factor = maxDimension / Math.max(size.x, size.y, size.z, .001)
  model.scale.multiplyScalar(factor)
  model.updateMatrixWorld(true)
  box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  model.position.add(new THREE.Vector3(x - center.x, surfaceY - box.min.y, z - center.z))
  model.updateMatrixWorld(true)
}
const assets = [
  ['robot-arm-a.glb', [-21, .12, -15], [1.35,1.35,1.35], 0],
  ['robot-arm-a.glb', [-24, .12, -15], [1.35,1.35,1.35], Math.PI],
  ['scanner-high.glb', [17, .1, 4], [1.2,1.2,1.2], 0],
  ['scanner-high.glb', [27, .1, 4], [1.2,1.2,1.2], 0],
  ['box-large.glb', [-29, 1, 13], [1.4,1.4,1.4], .25],
  ['box-small.glb', [-31, .72, 10], [1,1,1], -.2],
  ['indicator-special-arrow.glb', [12, .2, 13], [1,1,1], 0],
  ['../assets/vehicles/truck.glb', [29, .1, -12], [3.2,3.2,3.2], Math.PI / 2],
]
let truckRig
assets.forEach(([file, pos, scale, rotation]) => {
  const url = file.startsWith('..') ? `./public/${file.slice(3)}` : `./public/assets/kenney/${file}`
  loader.load(url, ({ scene: model }) => { model.position.set(...pos); model.scale.set(...scale); model.rotation.y = rotation; model.traverse((part) => { if (part.isMesh) { part.castShadow = part.receiveShadow = true } }); if (file.includes('truck.glb')) truckRig = model; scene.add(model) })
})

const foodModels = ['carton.glb','carton-small.glb','bag.glb','can.glb','bottle-oil.glb','apple.glb','banana.glb','bread.glb']
const shelfSpots = []
for (const x of [-14,-9.2,-4.4,4.4,9.2,14]) for (let level = 0; level < 3; level++) for (let n = 0; n < 6; n += 2) shelfSpots.push([x + ((n + level) % 2 ? .45 : -.45), 1.34 + level * 1.85, -9.5 + n * 2.7])
foodModels.forEach((file, type) => loader.load(`./public/assets/food/${file}`, ({ scene: model }) => {
  model.traverse((part) => { if(part.isMesh) { part.castShadow = part.receiveShadow = true } })
  shelfSpots.filter((_, index) => index % foodModels.length === type).forEach((spot, index) => { const item = model.clone(true); placeModel(item, spot[0], spot[1], spot[2], .64, (index % 3) * .65); scene.add(item) })
}))

// Deliberately prominent merchandise at the picking/packing bench: these are not hidden inside the rack grid.
mesh(new THREE.BoxGeometry(7.6,.35,3.2), new THREE.MeshPhysicalMaterial({ color:'#163b49', metalness:.68, roughness:.22, clearcoat:.35 }), [-20,1.25,-18.2])
mesh(new THREE.BoxGeometry(7.9,.14,3.5), amber, [-20,1.02,-18.2])
const heroGoods = [
  ['apple.glb',[-22.7,1.7,-18.2],1.35], ['banana.glb',[-21.4,1.67,-18.2],1.45], ['can.glb',[-20.1,1.75,-18.2],1.25],
  ['bottle-oil.glb',[-18.8,1.85,-18.2],1.25], ['bread.glb',[-17.4,1.72,-18.2],1.35], ['bag.glb',[-16.1,1.76,-18.2],1.3],
]
heroGoods.forEach(([file, position, scale]) => loader.load(`./public/assets/food/${file}`, ({ scene: model }) => { model.traverse((part)=>{if(part.isMesh){part.castShadow=part.receiveShadow=true}}); placeModel(model, position[0], 1.45, position[2], scale * .62, .35); scene.add(model) }))

// Higher-detail CC0 merchandise from Poly Haven: visible on shelves and at the pack bench.
const polyAssets = [
  ['wooden_crate_01', [[-15.1,1.34,-7.2], [14.9,3.19,3.6]], .00145],
  ['industrial_pastic_container', [[-10.1,1.34,-4.5], [9.9,3.19,-1.8]], .00155],
  ['brass_goblets', [[-20.5,1.45,-18.2]], .0024],
  ['rubber_duck_toy', [[-19.25,1.45,-18.2]], .003],
  ['life_jacket', [[-18.0,1.45,-18.2]], .0018],
  ['WoodenTable_01', [[-20,.1,-15]], .002],
]
polyAssets.forEach(([id, positions, scale]) => loader.load(`./public/assets/polyhaven/${id}/model.gltf`, ({ scene: model }) => {
  model.traverse((part) => { if (part.isMesh) { part.castShadow = part.receiveShadow = true } })
  positions.forEach((position, index) => { const item=model.clone(true); placeModel(item, position[0], position[1], position[2], id === 'WoodenTable_01' ? 3.1 : .9, index*.8); scene.add(item) })
}))

// A deliberately dense, mixed-SKU receiving pile. Each item is a CC0 mesh, snapped to a pallet layer.
mesh(new THREE.BoxGeometry(9.2,.28,7.2), new THREE.MeshPhysicalMaterial({ color:'#173945', metalness:.48, roughness:.3 }), [-26,.18,-4.8])
mesh(new THREE.BoxGeometry(9.5,.12,7.5), amber, [-26,.04,-4.8])
const pileDefinitions = [
  ['old_military_crate', .92], ['plastic_container', .82], ['all_purpose_cleaner', .68], ['boombox', .76],
  ['chess_set', .78], ['tea_set_01', .76], ['WoodenChair_01', .98], ['industrial_storage_cart', 1.05],
]
const pileSlots = []
for (let layer = 0; layer < 4; layer += 1) {
  const count = 15 - layer * 3, spread = 3.65 - layer * .58
  for (let index = 0; index < count; index += 1) {
    const column = index % 5, row = Math.floor(index / 5)
    pileSlots.push([-26 + (column - 2) * (spread / 2.2) + ((row + layer) % 2) * .18, .34 + layer * .72, -4.8 + (row - 1) * (spread / 1.65), layer, index])
  }
}
pileDefinitions.forEach(([id, dimension], type) => loader.load(`./public/assets/polyhaven/${id}/model.gltf`, ({ scene: model }) => {
  model.traverse((part) => { if (part.isMesh) { part.castShadow = part.receiveShadow = true } })
  pileSlots.filter((_, index) => index % pileDefinitions.length === type).forEach((slot) => {
    const item = model.clone(true); placeModel(item, slot[0], slot[1], slot[2], dimension * (slot[3] === 3 ? .82 : 1), (slot[4] % 4) * .7); scene.add(item)
  })
}))

const arms = []
function createPackingArm(x, z, mirror = 1) {
  const root = new THREE.Group(); root.position.set(x, .15, z); scene.add(root)
  root.add(new THREE.Mesh(new THREE.CylinderGeometry(.8,1,.45,18), amber))
  const shoulder = new THREE.Group(); shoulder.position.y=.35; root.add(shoulder)
  const upper = new THREE.Mesh(new THREE.BoxGeometry(.48,3.9,.52), rail); upper.position.y=1.85; upper.castShadow=true; shoulder.add(upper)
  const elbow = new THREE.Group(); elbow.position.y=3.7; shoulder.add(elbow)
  const lower = new THREE.Mesh(new THREE.BoxGeometry(.42,3.1,.45), steel); lower.position.y=1.48; lower.castShadow=true; elbow.add(lower)
  const claw = new THREE.Mesh(new THREE.BoxGeometry(1.45,.32,.6), amber); claw.position.y=2.96; elbow.add(claw)
  const parcel = new THREE.Mesh(new THREE.BoxGeometry(.85,.65,.85), mat('#ffbf55','#ff9f2c',.3)); parcel.position.set(0,3.55,0); parcel.visible=false; elbow.add(parcel)
  arms.push({ shoulder, elbow, parcel, mirror, phase:0, loading:false })
}
createPackingArm(-22,-8,1); createPackingArm(-17.8,-8,-1)
// Two Carrier robots collect sorted totes and each place them into a real rack slot.
function createShelfAgv(x, z, tint) {
  const agv = new THREE.Group(); agv.position.set(x,-.01,z); scene.add(agv)
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7,.5,1.25), mat(tint,'#0d5266',.35)); body.position.y=.48; agv.add(body)
  const mast = new THREE.Mesh(new THREE.BoxGeometry(.16,2.2,.16), steel); mast.position.set(.62,1.35,0); agv.add(mast)
  const fork = new THREE.Mesh(new THREE.BoxGeometry(1.1,.12,.72), amber); fork.position.set(.95,.82,0); agv.add(fork)
  for (const z of [-.48,.48]) { const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.16,12), dark); wheel.rotation.z=Math.PI/2; wheel.position.set(-.55,.28,z); agv.add(wheel) }
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.16,12), new THREE.MeshStandardMaterial({color:'#aaffff',emissive:'#42dcff',emissiveIntensity:2})); beacon.position.y=.84; agv.add(beacon)
  const cargoAnchor = new THREE.Group(); cargoAnchor.position.set(.45,1.25,0); agv.add(cargoAnchor)
  return { agv, cargoAnchor, state:'idle', cargo:null, rackIndex:0 }
}
const shelfAgvs = [createShelfAgv(-13.4,-7.6,'#2b96ad'), createShelfAgv(-10.7,-7.6,'#9b7be8')]
shelfAgvs[1].rackIndex = 1
const replenishmentQueue = []
const rackDropSlots = [[14,1.34,-4.5],[14,3.19,-1.8],[9.2,1.34,3.6],[-9.2,3.19,-4.5],[-14,1.34,1.0]]
function moveAgvTo(robot, target, delta) { const point = new THREE.Vector3(target[0],0,target[2]); const offset = point.clone().sub(robot.agv.position); const distance = offset.length(); if (distance > .05) { offset.normalize(); robot.agv.position.addScaledVector(offset, Math.min(distance, delta*4.1)); robot.agv.rotation.y = Math.atan2(offset.x, offset.z) } return distance < .12 }
function updateShelfAgvs(delta) {
  shelfAgvs.forEach((robot) => {
    if (robot.state === 'idle' && replenishmentQueue.length) { robot.cargo = replenishmentQueue.shift(); robot.state='pickup' }
    if (robot.state === 'pickup' && moveAgvTo(robot, [robot.cargo.position.x,0,robot.cargo.position.z],delta)) { robot.cargoAnchor.attach(robot.cargo); robot.cargo.position.set(.32,.05,0); robot.state='shelve' }
    if (robot.state === 'shelve') { const slot=rackDropSlots[robot.rackIndex % rackDropSlots.length]; if(moveAgvTo(robot, slot,delta)) { scene.attach(robot.cargo); robot.cargo.position.set(slot[0],slot[1]+.36,slot[2]); robot.cargo.rotation.y=0; robot.cargo=null; robot.rackIndex += shelfAgvs.length; robot.state='idle' } }
  })
}
let loadedCages = 0, dispatching = false, autoSorted = 0, autoSortClock = 0
const loadButton = document.querySelector('#run-arm'), dispatchButton = document.querySelector('#dispatch'), loadState = document.querySelector('#load-state')
const boxButton = document.querySelector('#box-products'), sealButton = document.querySelector('#seal-box')
const packingCarton = mesh(new THREE.BoxGeometry(1.5,.92,1.25), mat('#b87834'), [-20,1.05,-14.5])
const tape = mesh(new THREE.BoxGeometry(.22,.025,1.28), mat('#f0d384'), [-20,1.52,-14.5]); tape.visible=false
const looseGoods = [
  mesh(new THREE.SphereGeometry(.28,14,10), mat('#ef5b48'), [-18.7,1.66,-14.5]),
  mesh(new THREE.CylinderGeometry(.2,.2,.65,12), mat('#53cbe9'), [-19.35,1.75,-14.5]),
  mesh(new THREE.BoxGeometry(.52,.38,.45), mat('#ffbd4e'), [-18.2,1.64,-14.5]),
]
let packingProgress = 0, packingBoxed = false, packingSealed = false
boxButton.addEventListener('click', () => { if (packingBoxed) return; packingProgress=0.001; boxButton.disabled=true; loadState.textContent='步骤 1 · 正在把玩具、餐具和家具 SKU 装入纸箱…' })
sealButton.addEventListener('click', () => { if (!packingBoxed) return; packingSealed=true; tape.visible=true; sealButton.disabled=true; loadButton.disabled=false; loadState.textContent='步骤 2 · 封箱完成，等待机械臂上车' })
loadButton.addEventListener('click', () => { if (!packingSealed || loadedCages >= 8 || arms.some((arm) => arm.loading)) return; arms[loadedCages % arms.length].loading = true; loadButton.disabled = true; loadState.textContent = '步骤 3 · 机械臂抓取并装载中…' })
dispatchButton.addEventListener('click', () => { dispatching = true; dispatchButton.disabled = true; loadState.textContent = '货车已放行，驶向出库月台'; loadButton.disabled = true })
function updatePackingLine(delta) {
  if (packingProgress > 0 && !packingBoxed) { packingProgress += delta*.72; looseGoods.forEach((good, index) => { good.position.lerp(new THREE.Vector3(-20 + (index-1)*.18,1.47,-14.5), delta*2.6); good.scale.multiplyScalar(.985) }); if (packingProgress >= 1) { packingBoxed=true; looseGoods.forEach((good) => good.visible=false); sealButton.disabled=false; loadState.textContent='步骤 1 · 装箱完成，请封箱打包' } }
  autoSortClock += delta
  if (autoSortClock > 1.35 && autoSorted < 24 && !arms.some((arm) => arm.loading)) { const arm = arms[autoSorted % arms.length]; arm.loading = true; arm.auto = true; autoSortClock = 0 }
  arms.forEach((arm) => {
    if (!arm.loading) { arm.shoulder.rotation.z = Math.sin(performance.now()*.0007 + arm.mirror) * .08; arm.elbow.rotation.z = -.35; return }
    arm.phase += delta * .36; const p = Math.min(arm.phase, 1); arm.shoulder.rotation.z = arm.mirror * (-.7 + Math.sin(p*Math.PI)*.75); arm.elbow.rotation.z = arm.mirror * (.55 - Math.sin(p*Math.PI)*.9); arm.parcel.visible = p > .22 && p < .9
    if (p >= 1) { arm.loading=false; arm.phase=0; arm.parcel.visible=false; if (arm.auto) { autoSorted++; arm.auto=false; const tote=mesh(new THREE.BoxGeometry(.72,.56,.72), mat(['#55e8ff','#ad83ff','#ffab55'][autoSorted%3]), [-14.2+(autoSorted%4)*.82, 1.02+Math.floor((autoSorted%8)/4)*.62, -7.6]); tote.userData.sortedBin=true; replenishmentQueue.push(tote); return } loadedCages++; mesh(new THREE.BoxGeometry(.9,.7,.9), mat(['#55e8ff','#ad83ff','#ffab55'][loadedCages%3]), [28.5+(loadedCages%3)*.95, 1.1+Math.floor(loadedCages/3)*.76, -11.2]).userData.truckCargo=true; loadState.textContent=`步骤 3 · 已装车 ${loadedCages} / 8 笼`; loadButton.disabled=loadedCages>=8; dispatchButton.disabled=loadedCages<8 }
  })
  if (dispatching && truckRig) { truckRig.position.x += delta * 5.4; scene.traverse((object) => { if (object.userData.truckCargo) object.position.x += delta*5.4 }) }
}

function sampleRoute(points, progress, target) {
  const segmentCount = points.length - 1; const phase = progress % segmentCount; const segment = Math.floor(phase); const local = phase - segment
  const a = points[segment], b = points[segment + 1]; target.set(THREE.MathUtils.lerp(a[0],b[0],local),1.32,THREE.MathUtils.lerp(a[1],b[1],local))
}
function renderOrders() {
  document.querySelector('#orders').innerHTML = orders.map((order, index) => `<button class="order ${index === activeOrder ? 'selected':''}" style="--accent:${order.color}" data-index="${index}"><i></i><span><strong>${order.id}</strong><small>${order.sku}</small></span><em>${order.lane}</em></button>`).join('')
  document.querySelectorAll('.order').forEach((button) => button.addEventListener('click', () => { activeOrder = Number(button.dataset.index); renderOrders() }))
}
renderOrders()
setInterval(() => { const d=new Date(); document.querySelector('#clock').textContent=d.toLocaleTimeString('zh-CN',{hour12:false}); document.querySelector('#throughput').textContent=(1250+Math.floor(Math.random()*76)).toLocaleString(); document.querySelector('#pending').textContent=String(21+Math.floor(Math.random()*7)) }, 1000)

const target = new THREE.Vector3()
let previousTime = performance.now()
function tick(time) {
  const delta = Math.min((time - previousTime) / 1000, .05); previousTime = time
  conveyorRollers.forEach((roller) => { roller.rotateY(delta * 8.5) })
  beltMarkers.forEach((marker) => { const axis=marker.userData.axis; marker.position[axis] += delta*3.2; if (marker.position[axis] > marker.userData.length/2-.35) marker.position[axis] = -marker.userData.length/2+.35 })
  moving.forEach((parcel) => { parcel.userData.progress += parcel.userData.speed * .55; sampleRoute(parcel.userData.order.route, parcel.userData.progress, target); parcel.position.copy(target); parcel.rotation.y += .025; parcel.material.emissiveIntensity = parcel.userData.order === orders[activeOrder] ? .95 : .22 })
  updatePackingLine(delta)
  updateShelfAgvs(delta)
  controls.update(); composer.render(); requestAnimationFrame(tick)
}
worldLabel('混装收货货堆', 'CC0 SKU PILE · 42 件', [-26, 5.0, -4.8])
worldLabel('双臂自动拣选', 'PICK / SORT CELL', [-20, 6.2, -8])
worldLabel('Carrier 01 · 02', '自动取箱 / 补货上架', [-12, 3.5, -7.6])
worldLabel('高位货架 A / B', 'LIVE REPLENISHMENT', [0, 8.8, -2])
worldLabel('出库复核', 'OUTBOUND QC', [22, 5.5, -13])
addEventListener('resize', () => { camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight) })
tick(0)
