import { Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Vector3 } from 'three';
import type { Point3, SceneQuality, SceneViewportProps } from '../types';
import '../scene.css';

type CameraAction = 'left' | 'right' | 'up' | 'down' | 'in' | 'out' | 'reset' | 'focus';
type CameraCommand = { id: number; action: CameraAction; distance?: number };

interface SceneEnvironment {
  quality: 'high' | 'low';
  reducedMotion: boolean;
  focusCamera: (distance: number) => void;
  htmlPortal: React.RefObject<HTMLDivElement | null> | null;
}

const EnvironmentContext = createContext<SceneEnvironment>({
  quality: 'low',
  reducedMotion: false,
  focusCamera: () => undefined,
  htmlPortal: null,
});
const DEFAULT_CAMERA_POSITION: Point3 = [0, 0, 7.5];

export function useSceneEnvironment(): SceneEnvironment {
  return useContext(EnvironmentContext);
}

/** Place labels in a viewport-owned DOM layer that survives Canvas teardown. */
export function SceneHtml(props: ComponentProps<typeof Html>) {
  const { htmlPortal } = useSceneEnvironment();
  // Canvas mounts only after the portal node exists; Drei's type omits the ref's transient null.
  return <Html {...props} portal={htmlPortal ? htmlPortal as React.RefObject<HTMLElement> : undefined} />;
}

function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  );
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
}

function chooseQuality(requested: SceneQuality, reducedMotion: boolean, width: number): 'high' | 'low' {
  if (requested !== 'auto') return requested;
  if (typeof window === 'undefined') return 'low';
  const narrow = width < 760;
  const highDensity = window.devicePixelRatio > 2;
  const cores = navigator.hardwareConcurrency || 4;
  return narrow || highDensity || cores <= 4 || reducedMotion ? 'low' : 'high';
}

class CanvasBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function CameraRig({ command, home }: { command: CameraCommand | null; home: Point3 }) {
  const controls = useRef<React.ElementRef<typeof OrbitControls>>(null);
  const focusDistance = useRef<number | null>(null);
  const { camera, invalidate } = useThree();
  const { reducedMotion } = useSceneEnvironment();
  const [homeX, homeY, homeZ] = home;

  useEffect(() => {
    const control = controls.current;
    if (!control || !command) return;

    switch (command.action) {
      case 'left':
        control.setAzimuthalAngle(control.getAzimuthalAngle() - Math.PI / 10);
        break;
      case 'right':
        control.setAzimuthalAngle(control.getAzimuthalAngle() + Math.PI / 10);
        break;
      case 'up':
        control.setPolarAngle(control.getPolarAngle() - Math.PI / 12);
        break;
      case 'down':
        control.setPolarAngle(control.getPolarAngle() + Math.PI / 12);
        break;
      case 'in':
        control.dollyIn(1.3);
        break;
      case 'out':
        control.dollyOut(1.3);
        break;
      case 'reset':
        focusDistance.current = null;
        camera.position.set(homeX, homeY, homeZ);
        control.target.set(0, 0, 0);
        break;
      case 'focus':
        focusDistance.current = Math.max(2.5, command.distance || 4);
        break;
    }
    control.update();
    invalidate();
  }, [camera, command, homeX, homeY, homeZ, invalidate]);

  useFrame((_state, delta) => {
    if (focusDistance.current === null || !controls.current) return;
    const target = controls.current.target;
    const direction = camera.position.clone().sub(target).normalize();
    const desired = new Vector3().copy(target).addScaledVector(direction, focusDistance.current);
    camera.position.lerp(desired, Math.min(1, delta * 5));
    controls.current.update();
    if (camera.position.distanceTo(desired) < 0.025) {
      focusDistance.current = null;
    } else {
      invalidate();
    }
  });

  return <OrbitControls ref={controls} enablePan={false} enableDamping={!reducedMotion} dampingFactor={0.08} rotateSpeed={1.3} minDistance={2.5} maxDistance={17} />;
}

function ContextLossWatcher({ onLoss }: { onLoss: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onLoss();
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onLoss]);
  return null;
}

const BUTTONS: { action: CameraAction; label: string; glyph: string }[] = [
  { action: 'left', label: 'Rotate 3D model left', glyph: '↶' },
  { action: 'right', label: 'Rotate 3D model right', glyph: '↷' },
  { action: 'up', label: 'Tilt 3D model up', glyph: '↑' },
  { action: 'down', label: 'Tilt 3D model down', glyph: '↓' },
  { action: 'in', label: 'Zoom in on 3D model', glyph: '+' },
  { action: 'out', label: 'Zoom out from 3D model', glyph: '−' },
  { action: 'reset', label: 'Reset 3D camera', glyph: '⌂' },
];

export function SceneViewport({
  label,
  children,
  fallback,
  className = '',
  cameraPosition = DEFAULT_CAMERA_POSITION,
  quality = 'auto',
  reducedMotion: reducedMotionOverride,
  onQualityChange,
  showQualitySelector = false,
  showControls = true,
}: SceneViewportProps) {
  const [supported] = useState(detectWebGL);
  const [failed, setFailed] = useState(false);
  const [localQuality, setLocalQuality] = useState<SceneQuality>(quality);
  const [command, setCommand] = useState<CameraCommand | null>(null);
  const htmlPortal = useRef<HTMLDivElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [screenWidth, setScreenWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth,
  );
  const visible = usePageVisible();
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = reducedMotionOverride ?? systemReducedMotion;

  useLayoutEffect(() => setPortalReady(true), []);

  useEffect(() => setLocalQuality(quality), [quality]);
  useEffect(() => {
    const update = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const effectiveQuality = useMemo(
    () => chooseQuality(localQuality, reducedMotion, screenWidth),
    [localQuality, reducedMotion, screenWidth],
  );
  const issue = useCallback((action: CameraAction, distance?: number) => {
    setCommand((previous) => ({ id: (previous?.id || 0) + 1, action, distance }));
  }, []);
  const environment = useMemo<SceneEnvironment>(
    () => ({
      quality: effectiveQuality,
      reducedMotion,
      focusCamera: (distance) => issue('focus', distance),
      htmlPortal,
    }),
    [effectiveQuality, issue, reducedMotion],
  );

  const unavailable = !supported || failed;
  return (
    <section className={`scene-viewport ${className}`} aria-label={label}>
      {unavailable ? (
        <div className="scene-fallback" role="img" aria-label={`${label}, simplified diagram`}>
          <div className="scene-fallback-content">{fallback || <strong>{label}</strong>}</div>
          <p>Interactive 3D is unavailable on this device, so this lesson is using a simplified labeled view.</p>
        </div>
      ) : (
        <EnvironmentContext.Provider value={environment}>
          <div className="scene-html-layer" ref={htmlPortal} />
          {portalReady && <CanvasBoundary onFailure={() => setFailed(true)}>
            <Canvas
              aria-label={label}
              dpr={effectiveQuality === 'high' ? [1, 2] : [1, 1.25]}
              frameloop={visible ? (reducedMotion ? 'demand' : 'always') : 'never'}
              shadows={effectiveQuality === 'high'}
              camera={{ position: [...cameraPosition], fov: 45, near: 0.1, far: 100 }}
              gl={{ antialias: true, alpha: true, powerPreference: effectiveQuality === 'high' ? 'high-performance' : 'low-power' }}
            >
              <ambientLight intensity={1.5} />
              <directionalLight position={[4, 6, 5]} intensity={2.1} castShadow={effectiveQuality === 'high'} />
              <pointLight position={[-5, -3, 2]} color="#62d9ef" intensity={12} distance={14} />
              <CameraRig command={command} home={cameraPosition} />
              <ContextLossWatcher onLoss={() => setFailed(true)} />
              {children}
            </Canvas>
          </CanvasBoundary>}
          {showControls && (
            <div className="scene-controls" aria-label="3D model controls">
              {BUTTONS.map(({ action, label: buttonLabel, glyph }) => (
                <button key={action} type="button" aria-label={buttonLabel} title={buttonLabel} onClick={() => issue(action)}>
                  {glyph}
                </button>
              ))}
            </div>
          )}
        </EnvironmentContext.Provider>
      )}
      {showQualitySelector && !unavailable && (
        <label className="scene-quality">
          <span>Graphics</span>
          <select
            aria-label="3D graphics quality"
            value={localQuality}
            onChange={(event) => {
              const next = event.target.value as SceneQuality;
              setLocalQuality(next);
              onQualityChange?.(next);
            }}
          >
            <option value="auto">Auto</option>
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </label>
      )}
      <span className="scene-screen-reader-note">Drag or use the labeled controls to rotate and zoom the model.</span>
    </section>
  );
}
