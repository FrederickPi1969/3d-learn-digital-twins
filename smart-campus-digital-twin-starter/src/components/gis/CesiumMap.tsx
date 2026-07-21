import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BoundingSphere,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  CustomDataSource,
  EllipsoidTerrainProvider,
  Entity,
  GeoJsonDataSource,
  GridImageryProvider,
  HeadingPitchRange,
  HeadingPitchRoll,
  HorizontalOrigin,
  ImageryLayer,
  Ion,
  JulianDate,
  LabelStyle,
  Math as CesiumMath,
  Matrix4,
  NearFarScalar,
  PointPrimitiveCollection,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Transforms,
  VerticalOrigin,
  Viewer,
  createOsmBuildingsAsync,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { campusBuildings, campusRoads, getBuildingById } from '@/data/campus'
import {
  CAMPUS_GIS_ANCHOR,
  campusZones,
  campusZonesGeoJson,
} from '@/data/gis'
import { vegetationInstances } from '@/data/environment'
import { useDigitalTwinStore } from '@/store/useDigitalTwinStore'
import type { Vec2, WeatherKind } from '@/types/digitalTwin'
import { DAY_PHASE_LABELS, resolveDayPhase, WEATHER_LABELS } from '@/utils/environment'

const BUILDING_ENTITY_PREFIX = 'campus-building:'

interface CameraReadout {
  longitude: number
  latitude: number
  height: number
}

interface PickResult {
  id?: Entity
}

function createEnuTransform(): Matrix4 {
  return Transforms.eastNorthUpToFixedFrame(
    Cartesian3.fromDegrees(
      CAMPUS_GIS_ANCHOR.longitude,
      CAMPUS_GIS_ANCHOR.latitude,
      CAMPUS_GIS_ANCHOR.height,
    ),
  )
}

function localToFixedFrame(enuTransform: Matrix4, [east, north]: Vec2, up = 0): Cartesian3 {
  return Matrix4.multiplyByPoint(
    enuTransform,
    new Cartesian3(east, north, up),
    new Cartesian3(),
  )
}

function getBuildingIdFromEntity(entity: Entity | undefined): string | null {
  if (!entity?.id.startsWith(BUILDING_ENTITY_PREFIX)) return null
  return entity.id.slice(BUILDING_ENTITY_PREFIX.length)
}

function addCampusEntities(
  viewer: Viewer,
  enuTransform: Matrix4,
): { dataSource: CustomDataSource; treePoints: PointPrimitiveCollection } {
  const dataSource = new CustomDataSource('smart-campus-local-enu')

  const campusCorners: readonly Vec2[] = [
    [-22, -15],
    [22, -15],
    [22, 15],
    [-22, 15],
  ]
  dataSource.entities.add({
    id: 'campus-footprint',
    polygon: {
      hierarchy: new PolygonHierarchy(
        campusCorners.map((point) => localToFixedFrame(enuTransform, point, 0.08)),
      ),
      perPositionHeight: true,
      material: new ColorMaterialProperty(Color.fromCssColorString('#061a29').withAlpha(0.82)),
      outline: true,
      outlineColor: Color.fromCssColorString('#38cfff').withAlpha(0.76),
    },
  })

  campusRoads.forEach((road) => {
    dataSource.entities.add({
      id: `campus-road:${road.id}`,
      polyline: {
        positions: road.points.map((point) => localToFixedFrame(enuTransform, point, 0.26)),
        width: road.glow ? 5 : 3,
        material: Color.fromCssColorString(road.glow ? '#ffc35a' : '#24bfe8').withAlpha(
          road.glow ? 0.86 : 0.64,
        ),
      },
    })
  })

  campusBuildings.forEach((building) => {
    const [width, height, depth] = building.size
    const position = localToFixedFrame(enuTransform, building.position, height / 2 + 0.16)
    const orientation = Transforms.headingPitchRollQuaternion(
      position,
      new HeadingPitchRoll(-(building.rotation ?? 0), 0, 0),
    )
    const accent = Color.fromCssColorString(building.accent)

    dataSource.entities.add({
      id: `${BUILDING_ENTITY_PREFIX}${building.id}`,
      name: building.name,
      position,
      orientation,
      box: {
        dimensions: new Cartesian3(width, depth, height),
        material: new ColorMaterialProperty(accent.withAlpha(0.54)),
        outline: true,
        outlineColor: accent.brighten(0.28, new Color()).withAlpha(0.96),
      },
      label: {
        text: `${building.code} · ${building.name}`,
        font: '600 13px Microsoft YaHei, sans-serif',
        fillColor: Color.fromCssColorString('#ddf8ff'),
        outlineColor: Color.fromCssColorString('#03101b'),
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Color.fromCssColorString('#041522').withAlpha(0.78),
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, -8),
        scaleByDistance: new NearFarScalar(35, 1.0, 340, 0.26),
      },
      description: building.description,
    })
  })

  void viewer.dataSources.add(dataSource)

  const treePoints = viewer.scene.primitives.add(new PointPrimitiveCollection())
  vegetationInstances.slice(0, 190).forEach((instance) => {
    treePoints.add({
      position: localToFixedFrame(enuTransform, instance.position, 0.72 * instance.scale),
      color: Color.fromCssColorString(
        instance.species === 'conifer' ? '#1bb58b' : instance.species === 'shrub' ? '#22cb97' : '#29d39b',
      ).withAlpha(0.9),
      outlineColor: Color.fromCssColorString('#063f36'),
      outlineWidth: 1,
      pixelSize: instance.species === 'shrub' ? 3 : 5,
      scaleByDistance: new NearFarScalar(20, 1.5, 450, 0.2),
    })
  })

  return { dataSource, treePoints }
}

async function addZoneDataSource(viewer: Viewer): Promise<GeoJsonDataSource> {
  const dataSource = await GeoJsonDataSource.load(campusZonesGeoJson, {
    clampToGround: true,
    stroke: Color.fromCssColorString('#5fdfff').withAlpha(0.82),
    strokeWidth: 2,
    fill: Color.fromCssColorString('#0a5070').withAlpha(0.1),
  })

  dataSource.name = 'campus-functional-zones'
  dataSource.entities.values.forEach((entity) => {
    const zone = campusZones.find((candidate) => candidate.id === entity.id)
    if (!zone || !entity.polygon) return
    entity.polygon.material = new ColorMaterialProperty(
      Color.fromCssColorString(zone.color).withAlpha(0.11),
    )
    entity.polygon.outline = new ConstantProperty(true)
    entity.polygon.outlineColor = new ConstantProperty(
      Color.fromCssColorString(zone.color).withAlpha(0.74),
    )
  })
  await viewer.dataSources.add(dataSource)
  return dataSource
}

function applyDayPhase(viewer: Viewer, phase: ReturnType<typeof resolveDayPhase>) {
  const date = new Date()
  const utcHour = phase === 'day' ? 4 : phase === 'dusk' ? 10 : 14
  date.setUTCHours(utcHour, phase === 'dusk' ? 35 : 20, 0, 0)
  viewer.clock.currentTime = JulianDate.fromDate(date)
  viewer.scene.globe.enableLighting = true
  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.brightnessShift =
      phase === 'night' ? -0.48 : phase === 'dusk' ? -0.18 : 0.04
    viewer.scene.skyAtmosphere.saturationShift =
      phase === 'night' ? -0.2 : phase === 'dusk' ? 0.08 : 0
  }
  viewer.scene.fog.density = phase === 'night' ? 0.00022 : 0.00015
}

interface OverlayParticle {
  x: number
  y: number
  depth: number
  velocity: number
  phase: number
}

function GisWeatherOverlay({ kind, intensity, wind }: { kind: WeatherKind; intensity: number; wind: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || kind === 'clear') return
    const context = canvas.getContext('2d')
    if (!context) return

    let animationFrame = 0
    let width = 1
    let height = 1
    const count = Math.round((kind === 'rain' ? 680 : kind === 'snow' ? 280 : 520) * intensity)
    const particles: OverlayParticle[] = Array.from({ length: count }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      depth: 0.25 + Math.random() * 0.75,
      velocity: 0.35 + Math.random() * 0.9,
      phase: index * 0.73 + Math.random() * Math.PI,
    }))

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio, 1.6)
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const render = (time: number) => {
      context.clearRect(0, 0, width, height)
      const seconds = time * 0.001
      particles.forEach((particle) => {
        if (kind === 'rain') {
          particle.y += 0.008 * particle.velocity * particle.depth
          particle.x += 0.0016 * wind * particle.depth
          if (particle.y > 1.08) {
            particle.y = -0.08
            particle.x = Math.random()
          }
          const x = particle.x * width
          const y = particle.y * height
          context.strokeStyle = `rgba(164, 224, 255, ${0.12 + particle.depth * 0.33})`
          context.lineWidth = 0.45 + particle.depth * 0.75
          context.beginPath()
          context.moveTo(x, y)
          context.lineTo(x + wind * 8, y + 12 + particle.depth * 14)
          context.stroke()
        } else if (kind === 'snow') {
          particle.y += 0.0013 * particle.velocity * particle.depth
          particle.x += Math.sin(seconds * 0.8 + particle.phase) * 0.00015 + wind * 0.00025
          if (particle.y > 1.03) particle.y = -0.03
          const radius = 0.7 + particle.depth * 2.2
          context.fillStyle = `rgba(238, 248, 255, ${0.28 + particle.depth * 0.48})`
          context.beginPath()
          context.arc(particle.x * width, particle.y * height, radius, 0, Math.PI * 2)
          context.fill()
        } else {
          particle.x += 0.0012 * particle.velocity * (0.4 + wind)
          particle.y += Math.sin(seconds * 0.55 + particle.phase) * 0.00022
          if (particle.x > 1.08) particle.x = -0.08
          const radius = 5 + particle.depth * 18
          const gradient = context.createRadialGradient(
            particle.x * width,
            particle.y * height,
            0,
            particle.x * width,
            particle.y * height,
            radius,
          )
          gradient.addColorStop(0, `rgba(185, 115, 52, ${0.025 + particle.depth * 0.05})`)
          gradient.addColorStop(1, 'rgba(151, 83, 31, 0)')
          context.fillStyle = gradient
          context.beginPath()
          context.arc(particle.x * width, particle.y * height, radius, 0, Math.PI * 2)
          context.fill()
        }
      })
      animationFrame = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener('resize', resize)
    animationFrame = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      context.clearRect(0, 0, width, height)
    }
  }, [intensity, kind, wind])

  return <canvas ref={canvasRef} className="gis-weather-canvas" aria-hidden="true" />
}

export default function CesiumMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const campusDataSourceRef = useRef<CustomDataSource | null>(null)
  const zoneDataSourceRef = useRef<GeoJsonDataSource | null>(null)
  const treePointsRef = useRef<PointPrimitiveCollection | null>(null)
  const externalTilesetRef = useRef<Cesium3DTileset | null>(null)
  const osmTilesetRef = useRef<Cesium3DTileset | null>(null)
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('正在初始化离线地理底座')
  const [cameraReadout, setCameraReadout] = useState<CameraReadout>({
    longitude: CAMPUS_GIS_ANCHOR.longitude,
    latitude: CAMPUS_GIS_ANCHOR.latitude,
    height: 110,
  })

  const selectedBuildingId = useDigitalTwinStore((state) => state.selectedBuildingId)
  const selectBuilding = useDigitalTwinStore((state) => state.selectBuilding)
  const enterBuilding = useDigitalTwinStore((state) => state.enterBuilding)
  const showCampusLayer = useDigitalTwinStore((state) => state.showGisCampusLayer)
  const showZonesLayer = useDigitalTwinStore((state) => state.showGisZonesLayer)
  const showOsmBuildings = useDigitalTwinStore((state) => state.showGisOsmBuildings)
  const showExternalTileset = useDigitalTwinStore((state) => state.showGisExternalTileset)
  const externalSource = useDigitalTwinStore((state) => state.gisExternalSource)
  const dayPhase = useDigitalTwinStore((state) => state.dayPhase)
  const weatherKind = useDigitalTwinStore((state) => state.weatherKind)
  const weatherIntensity = useDigitalTwinStore((state) => state.weatherIntensity)
  const windSpeed = useDigitalTwinStore((state) => state.windSpeed)
  const showLabels = useDigitalTwinStore((state) => state.showLabels)
  const cameraResetNonce = useDigitalTwinStore((state) => state.cameraResetNonce)
  const selectedBuilding = getBuildingById(selectedBuildingId)
  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN?.trim() ?? ''
  const initialDayPhaseRef = useRef(dayPhase)
  const lastCameraResetRef = useRef(cameraResetNonce)

  const anchorSphere = useMemo(
    () =>
      new BoundingSphere(
        Cartesian3.fromDegrees(
          CAMPUS_GIS_ANCHOR.longitude,
          CAMPUS_GIS_ANCHOR.latitude,
          CAMPUS_GIS_ANCHOR.height,
        ),
        48,
      ),
    [],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    let handler: ScreenSpaceEventHandler | null = null
    let removeCameraListener: (() => void) | null = null

    const initialize = async () => {
      if (ionToken) Ion.defaultAccessToken = ionToken

      const baseLayer = new ImageryLayer(
        new GridImageryProvider({
          cells: 16,
          color: Color.fromCssColorString('#245c78').withAlpha(0.56),
          glowColor: Color.fromCssColorString('#061b2a').withAlpha(0.9),
          backgroundColor: Color.fromCssColorString('#020a12'),
        }),
      )

      const viewer = new Viewer(container, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        shouldAnimate: true,
        scene3DOnly: true,
        baseLayer,
        terrainProvider: new EllipsoidTerrainProvider(),
        requestRenderMode: false,
        useBrowserRecommendedResolution: true,
      })
      if (cancelled) {
        viewer.destroy()
        return
      }

      viewerRef.current = viewer
      viewer.scene.highDynamicRange = true
      viewer.scene.postProcessStages.fxaa.enabled = true
      viewer.scene.globe.depthTestAgainstTerrain = true
      viewer.scene.globe.baseColor = Color.fromCssColorString('#020912')
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 12
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 2_000_000
      viewer.camera.percentageChanged = 0.02
      applyDayPhase(viewer, resolveDayPhase(initialDayPhaseRef.current))

      const enuTransform = createEnuTransform()
      const campusLayer = addCampusEntities(viewer, enuTransform)
      campusDataSourceRef.current = campusLayer.dataSource
      treePointsRef.current = campusLayer.treePoints
      zoneDataSourceRef.current = await addZoneDataSource(viewer)

      await viewer.camera.flyToBoundingSphere(anchorSphere, {
        duration: 1.25,
        offset: new HeadingPitchRange(
          CesiumMath.toRadians(28),
          CesiumMath.toRadians(-42),
          112,
        ),
      })

      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
      )
      handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
      handler.setInputAction((movement: { position: Cartesian2 }) => {
        const picked = viewer.scene.pick(movement.position) as PickResult | undefined
        const buildingId = getBuildingIdFromEntity(picked?.id)
        selectBuilding(buildingId)
        viewer.selectedEntity = buildingId ? picked?.id : undefined
      }, ScreenSpaceEventType.LEFT_CLICK)
      handler.setInputAction((movement: { position: Cartesian2 }) => {
        const picked = viewer.scene.pick(movement.position) as PickResult | undefined
        const buildingId = getBuildingIdFromEntity(picked?.id)
        if (!buildingId) return
        const building = getBuildingById(buildingId)
        enterBuilding(buildingId, building ? Math.max(1, Math.ceil(building.floors / 2)) : 1)
      }, ScreenSpaceEventType.LEFT_DOUBLE_CLICK)

      let lastCameraUpdate = 0
      removeCameraListener = viewer.camera.changed.addEventListener(() => {
        const now = performance.now()
        if (now - lastCameraUpdate < 180) return
        lastCameraUpdate = now
        const cartographic = Cartographic.fromCartesian(viewer.camera.positionWC)
        setCameraReadout({
          longitude: CesiumMath.toDegrees(cartographic.longitude),
          latitude: CesiumMath.toDegrees(cartographic.latitude),
          height: cartographic.height,
        })
      })

      setStatus('离线地理底座就绪 · 双击楼宇进入数字孪生')
      setReady(true)
    }

    void initialize().catch((error: unknown) => {
      console.error(error)
      setStatus(error instanceof Error ? `GIS 初始化失败：${error.message}` : 'GIS 初始化失败')
    })

    return () => {
      cancelled = true
      handler?.destroy()
      removeCameraListener?.()
      const viewer = viewerRef.current
      if (viewer && !viewer.isDestroyed()) viewer.destroy()
      viewerRef.current = null
      campusDataSourceRef.current = null
      zoneDataSourceRef.current = null
      treePointsRef.current = null
      externalTilesetRef.current = null
      osmTilesetRef.current = null
      setReady(false)
    }
  }, [anchorSphere, enterBuilding, ionToken, selectBuilding])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready) return
    applyDayPhase(viewer, resolveDayPhase(dayPhase))
  }, [dayPhase, ready])

  useEffect(() => {
    if (!ready || !campusDataSourceRef.current) return
    campusDataSourceRef.current.entities.values.forEach((entity) => {
      if (entity.id.startsWith(BUILDING_ENTITY_PREFIX) && entity.label) {
        entity.label.show = new ConstantProperty(showLabels)
      }
    })
  }, [ready, showLabels])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready || cameraResetNonce === lastCameraResetRef.current) return
    lastCameraResetRef.current = cameraResetNonce
    viewer.camera.flyToBoundingSphere(anchorSphere, {
      duration: 0.82,
      offset: new HeadingPitchRange(
        CesiumMath.toRadians(28),
        CesiumMath.toRadians(-42),
        112,
      ),
    })
  }, [anchorSphere, cameraResetNonce, ready])

  useEffect(() => {
    if (!ready) return
    if (campusDataSourceRef.current) campusDataSourceRef.current.show = showCampusLayer
    if (treePointsRef.current) treePointsRef.current.show = showCampusLayer
  }, [ready, showCampusLayer])

  useEffect(() => {
    if (!ready || !zoneDataSourceRef.current) return
    zoneDataSourceRef.current.show = showZonesLayer
  }, [ready, showZonesLayer])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready) return
    let cancelled = false

    const updateExternalTileset = async () => {
      if (externalTilesetRef.current) {
        viewer.scene.primitives.remove(externalTilesetRef.current)
        externalTilesetRef.current = null
      }
      if (!showExternalTileset) return

      const url = externalSource.tilesetUrl.trim()
      const assetIdText = externalSource.ionAssetId.trim()
      const assetId = Number(assetIdText)
      const hasValidAssetId = assetIdText.length > 0 && Number.isFinite(assetId) && assetId > 0
      if (!url && !hasValidAssetId) {
        setStatus('外部 3D Tiles 未配置：请填写 URL 或有效的 Cesium ion Asset ID')
        return
      }
      if (!url && !ionToken) {
        setStatus('加载 Cesium ion 资产需要在 .env 中配置 VITE_CESIUM_ION_TOKEN')
        return
      }

      setStatus('正在加载外部 3D Tiles')
      const options = {
        maximumScreenSpaceError: 12,
        dynamicScreenSpaceError: true,
        skipLevelOfDetail: true,
      }
      const tileset = url
        ? await Cesium3DTileset.fromUrl(url, options)
        : await Cesium3DTileset.fromIonAssetId(assetId, options)
      if (cancelled) {
        tileset.destroy()
        return
      }
      externalTilesetRef.current = viewer.scene.primitives.add(tileset)
      setStatus('外部 3D Tiles 已接入')
    }

    void updateExternalTileset().catch((error: unknown) => {
      console.error(error)
      setStatus(error instanceof Error ? `3D Tiles 加载失败：${error.message}` : '3D Tiles 加载失败')
    })

    return () => {
      cancelled = true
    }
  }, [externalSource, ionToken, ready, showExternalTileset])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready) return
    let cancelled = false

    const updateOsmBuildings = async () => {
      if (osmTilesetRef.current) {
        viewer.scene.primitives.remove(osmTilesetRef.current)
        osmTilesetRef.current = null
      }
      if (!showOsmBuildings) return
      if (!ionToken) {
        setStatus('Cesium OSM Buildings 需要 VITE_CESIUM_ION_TOKEN')
        return
      }

      setStatus('正在加载 Cesium OSM Buildings')
      const tileset = await createOsmBuildingsAsync()
      if (cancelled) {
        tileset.destroy()
        return
      }
      osmTilesetRef.current = viewer.scene.primitives.add(tileset)
      setStatus('Cesium OSM Buildings 已接入')
    }

    void updateOsmBuildings().catch((error: unknown) => {
      console.error(error)
      setStatus(error instanceof Error ? `OSM Buildings 加载失败：${error.message}` : 'OSM Buildings 加载失败')
    })

    return () => {
      cancelled = true
    }
  }, [ionToken, ready, showOsmBuildings])

  return (
    <div className="cesium-map-shell">
      <div ref={containerRef} className="cesium-map-container" />
      <GisWeatherOverlay kind={weatherKind} intensity={weatherIntensity} wind={windSpeed} />

      <section className="gis-runtime-card" aria-label="GIS 运行状态">
        <div className="gis-runtime-card__eyebrow">CESIUM · WGS84 / LOCAL ENU BRIDGE</div>
        <div className="gis-runtime-card__status">{status}</div>
        <div className="gis-runtime-card__grid">
          <span>锚点</span>
          <strong>{CAMPUS_GIS_ANCHOR.label}</strong>
          <span>经纬度</span>
          <strong>
            {cameraReadout.longitude.toFixed(5)}°, {cameraReadout.latitude.toFixed(5)}°
          </strong>
          <span>相机高度</span>
          <strong>{Math.max(0, cameraReadout.height).toFixed(1)} m</strong>
          <span>环境状态</span>
          <strong>
            {DAY_PHASE_LABELS[dayPhase]} · {WEATHER_LABELS[weatherKind]}
          </strong>
        </div>
        {selectedBuilding && (
          <div className="gis-runtime-card__selection">
            <span>{selectedBuilding.code}</span>
            <div>
              <strong>{selectedBuilding.name}</strong>
              <small>双击三维体进入楼宇剖析</small>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
