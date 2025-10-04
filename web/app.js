import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js?module";

const container = document.getElementById("viewport");
const loadingOverlay = document.getElementById("loading");
const surveySelect = document.getElementById("survey");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const resetBtn = document.getElementById("reset");
const surveyLabel = document.getElementById("surveyLabel");
const centerLabel = document.getElementById("centerLabel");
const zoomLabel = document.getElementById("zoomLabel");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 0, 0.01);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.rotateSpeed = 0.4;
controls.addEventListener("end", () => scheduleTextureUpdate());

const sphereGeometry = new THREE.SphereGeometry(50, 128, 128);
sphereGeometry.scale(-1, 1, 1);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const ambient = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambient);

const state = {
  width: 20,
  height: 20,
  pixels: 1024,
  survey: "DSS2 Red",
  loading: false,
  pendingTimer: null,
};

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

surveySelect.addEventListener("change", () => {
  state.survey = surveySelect.value;
  surveyLabel.textContent = `Survey: ${state.survey}`;
  scheduleTextureUpdate(true);
});

zoomInBtn.addEventListener("click", () => {
  state.width = Math.max(state.width / 1.6, 0.5);
  state.height = state.width;
  state.pixels = Math.min(state.pixels * 1.3, 2048);
  scheduleTextureUpdate();
});

zoomOutBtn.addEventListener("click", () => {
  state.width = Math.min(state.width * 1.6, 360);
  state.height = state.width;
  state.pixels = Math.max(Math.floor(state.pixels / 1.3), 384);
  scheduleTextureUpdate();
});

resetBtn.addEventListener("click", () => {
  state.width = 20;
  state.height = 20;
  state.pixels = 1024;
  controls.reset();
  scheduleTextureUpdate(true);
});

function scheduleTextureUpdate(force = false) {
  if (state.pendingTimer) {
    clearTimeout(state.pendingTimer);
  }
  const delay = force ? 0 : 450;
  state.pendingTimer = window.setTimeout(() => {
    state.pendingTimer = null;
    updateSkyTexture();
  }, delay);
}

function getCameraDirection() {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  dir.normalize();
  return dir;
}

function directionToRaDec(vec) {
  const raRad = Math.atan2(vec.z, -vec.x);
  let ra = THREE.MathUtils.radToDeg(raRad);
  if (ra < 0) ra += 360;
  const dec = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(vec.y, -1, 1)));
  return { ra, dec };
}

function formatAngle(value) {
  return `${value.toFixed(2)}°`;
}

function setLoading(next) {
  state.loading = next;
  loadingOverlay.classList.toggle("hidden", !next);
  zoomInBtn.disabled = next;
  zoomOutBtn.disabled = next;
  resetBtn.disabled = next;
  surveySelect.disabled = next;
}

async function updateSkyTexture() {
  if (state.loading) return;

  setLoading(true);

  const dir = getCameraDirection();
  const { ra, dec } = directionToRaDec(dir);

  console.info(
    "Requesting SkyView tile",
    JSON.stringify({ survey: state.survey, ra, dec, width: state.width, pixels: state.pixels })
  );

  const params = new URLSearchParams({
    ra: ra.toFixed(6),
    dec: dec.toFixed(6),
    width: state.width.toFixed(4),
    height: state.height.toFixed(4),
    pixels: String(state.pixels),
    survey: state.survey,
    projection: "Car",
  });

  const url = new URL(`/tile?${params.toString()}`, window.location.origin);

      console.time("skyview-tile");
  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`SkyView request failed (${response.status})`);
    }
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const texture = new THREE.Texture(bitmap);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    if (sphereMaterial.map) {
      sphereMaterial.map.dispose();
    }

    sphereMaterial.map = texture;
    sphereMaterial.needsUpdate = true;

    centerLabel.textContent = `Center RA/Dec: ${formatAngle(ra)}, ${formatAngle(dec)}`;
    zoomLabel.textContent = `FoV: ${formatAngle(state.width)}`;
    console.timeEnd("skyview-tile");
  } catch (error) {
    console.error(error);
    window.alert(
      "Could not retrieve imagery from NASA SkyView. Check your network connection and that the backend server is running."
    );
  } finally {
    setLoading(false);
  }
}

// kick off first load
scheduleTextureUpdate(true);
