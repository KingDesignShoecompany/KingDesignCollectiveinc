/* ==========================================================================
   KingDesignCollectiveINC Quantum Wearables — Cinematic Hero (Three.js)
   Renders a luxury wearable ring over a 3D hero scene with:
     - Slow floating/rotating device
     - Orbiting energy fields (3 orbital rings)
     - Thousands of gold particles
     - Mouse/parallax response (device subtly tracks cursor)
     - Background atmosphere: dark bronze → gold plasma, subtle atmosphere
   Licensed under KingDesignCollectiveINC UI v2.0
   ========================================================================== */

(function() {
  "use strict";

  const container = document.getElementById("qc-hero-canvas-container");
  if (!container) return;

  // --- Scene setup ----------------------------------------------------------
  const scene = new THREE.Scene();

  // Camera: positioned to show the device floating in the center
  const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // --- Controls -------------------------------------------------------------
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.25;
  controls.zoomSpeed = 0.8;
  controls.minDistance = 4;
  controls.maxDistance = 12;
  controls.target.set(0, 0, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.8;

  // --- Lights ---------------------------------------------------------------
  const ambient = new THREE.AmbientLight(0x444466, 0.5);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xd8b05a, 1.6);
  keyLight.position.set(0, 4, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xd8b05a, 0.8);
  rimLight.position.set(-4, 1, -3);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0x444466, 0.4);
  fillLight.position.set(0, -2, -4);
  scene.add(fillLight);

  // Background atmosphere
  const bgLight = new THREE.AmbientLight(0x222244, 0.6);
  scene.add(bgLight);

  // --- Helper functions -----------------------------------------------------

  function makeRing(radius, tube, color, emissive, speed) {
    const group = new THREE.Group();
    const geo = new THREE.TorusGeometry(radius, tube, 32, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      emissiveIntensity: 0.05,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0;
    mesh.rotateX(Math.PI / 2);
    mesh.castShadow = true;
    group.add(mesh);

    // Inner glow ring
    const geoInner = new THREE.TorusGeometry(radius * 0.92, tube * 0.35, 32, 48);
    const matInner = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      metalness: 0.1,
      roughness: 0.4,
      transparent: true,
      opacity: 0.15,
    });
    const meshInner = new THREE.Mesh(geoInner, matInner);
    meshInner.rotateX(Math.PI / 2);
    group.add(meshInner);

    group.userData = { speed: speed || 1 };
    return group;
  }

  // --- Build the hero 3D scene -----------------------------------------------

  // 1. Planetary background atmosphere sphere (deep bronze -> gold)
  const planetGeo = new THREE.SphereGeometry(3.2, 32, 32);
  const planetMat = new THREE.MeshStandardMaterial({
    color: 0x08080a,
    emissive: 0x1a1a2a,
    emissiveIntensity: 0.08,
    metalness: 0.3,
    roughness: 0.9,
  });
  const planet = new THREE.Mesh(planetGeo, planetMat);
  scene.add(planet);

  // Atmosphere glow (the "space-like environment")
  const atmosGeo = new THREE.SphereGeometry(3.4, 32, 32);
  const atmosMat = new THREE.MeshBasicMaterial({
    color: 0x0d0a0a,
    transparent: true,
    opacity: 0.3,
  });
  const atmos = new THREE.Mesh(atmosGeo, atmosMat);
  scene.add(atmos);

  // 2. The wearable ring (luxury smart ring)
  const ringGroup = new THREE.Group();
  const ringMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.18, 32, 64),
    new THREE.MeshStandardMaterial({
      color: 0x111118,
      metalness: 0.7,
      roughness: 0.2,
    })
  );
  ringMesh.position.y = 0;
  ringMesh.rotateX(Math.PI / 2);
  ringMesh.castShadow = true;
  ringGroup.add(ringMesh);

  // Inner gold illumination ring
  const ringInner = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.06, 32, 64),
    new THREE.MeshStandardMaterial({
      color: 0xd8b05a,
      emissive: 0xd8b05a,
      emissiveIntensity: 0.35,
      metalness: 0.4,
      roughness: 0.1,
    })
  );
  ringInner.position.y = 0;
  ringInner.rotateX(Math.PI / 2);
  ringGroup.add(ringInner);

  // Sensor nodes on the ring
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const sensor = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xd8b05a,
        emissive: 0xd8b05a,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.2,
      })
    );
    sensor.position.set(Math.cos(angle) * 1.4, 0, Math.sin(angle) * 1.4);
    ringGroup.add(sensor);
  }

  // Crown emblem (engraved)
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xd8b05a,
      emissive: 0xd8b05a,
      emissiveIntensity: 0.25,
      metalness: 0.5,
      roughness: 0.4,
    })
  );
  crown.position.set(0, 0, 0);
  ringGroup.add(crown);

  // Crown glow ring
  const crownGlow = new THREE.Mesh(
    new THREE.TorusGeometry(1.65, 0.04, 16, 32),
    new THREE.MeshStandardMaterial({
      color: 0xd8b05a,
      emissive: 0xd8b05a,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.3,
      metalness: 0.1,
      roughness: 0.5,
    })
  );
  crownGlow.position.y = 0;
  crownGlow.rotateX(Math.PI / 2);
  ringGroup.add(crownGlow);

  // 3. Orbital energy fields (3 orbiting rings)
  const orbitalRings = [];
  const fields = [
    { radius: 2.4, color: 0xd8b05a, emissive: 0xd8b05a, tube: 0.04 },
    { radius: 3.2, color: 0x00b4d8, emissive: 0x00b4d8, tube: 0.03 },
    { radius: 4.0, color: 0xd8b05a, emissive: 0xd8b05a, tube: 0.02 },
  ];

  fields.forEach((f, i) => {
    const group = new THREE.Group();
    const geo = new THREE.TorusGeometry(f.radius, f.tube, 24, 48);
    const mat = new THREE.MeshStandardMaterial({
      color: f.color,
      emissive: f.emissive,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.5,
      metalness: 0.1,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotateX(Math.PI / 2);
    group.add(mesh);

    // Inner glow
    const geoInner = new THREE.TorusGeometry(f.radius * 0.92, f.tube * 0.3, 24, 48);
    const matInner = new THREE.MeshStandardMaterial({
      color: f.color,
      emissive: f.emissive,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.2,
      metalness: 0.1,
      roughness: 0.4,
    });
    const meshInner = new THREE.Mesh(geoInner, matInner);
    meshInner.rotateX(Math.PI / 2);
    group.add(meshInner);

    group.userData = { speed: 0.3 + i * 0.15 };
    orbitalRings.push(group);
    scene.add(group);
  });

  // 4. Gold particles (thousands orbiting)
  const particleGeo = new THREE.BufferGeometry();
  const particleCount = 2500;
  const pPos = new Float32Array(particleCount * 3);
  const pColor = new Float32Array(particleCount * 3);
  const pSize = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 2.2 + Math.random() * 2.5;
    pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pPos[i * 3 + 1] = Math.random() * 2 - 1;
    pPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const intensity = 0.4 + Math.random() * 0.6;
    pColor[i * 3] = 0.84 * intensity;
    pColor[i * 3 + 1] = 0.69 * intensity;
    pColor[i * 3 + 2] = 0.35 * intensity;

    pSize[i] = 0.02 + Math.random() * 0.04;
  }

  particleGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(pColor, 3));
  particleGeo.setAttribute("size", new THREE.BufferAttribute(pSize, 1));

  const particleMat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // 5. Signal waveforms (particle trails around the ring)
  const waveformCount = 4;
  const waveformGeo = new THREE.BufferGeometry();
  const waveformCountPts = 80;
  const wPos = new Float32Array(waveformCountPts * waveformCount * 3);
  const wColor = new Float32Array(waveformCountPts * waveformCount * 3);

  for (let wf = 0; wf < waveformCount; wf++) {
    const baseRadius = 1.4 + wf * 0.25;
    for (let p = 0; p < waveformCountPts; p++) {
      const t = p / waveformCountPts;
      const angle = t * Math.PI * 2;
      const r = baseRadius + Math.sin(t * Math.PI * 4) * 0.15;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = Math.sin(t * Math.PI * 8) * 0.2;

      const idx = (wf * waveformCountPts + p) * 3;
      wPos[idx] = x;
      wPos[idx + 1] = y;
      wPos[idx + 2] = z;

      const intensity = 0.5 + Math.sin(t * Math.PI * 6) * 0.3;
      wColor[idx] = 0.84 * intensity;
      wColor[idx + 1] = 0.69 * intensity;
      wColor[idx + 2] = 0.35 * intensity;
    }
  }

  const waveformGeo2 = new THREE.BufferGeometry();
  waveformGeo2.setAttribute("position", new THREE.BufferAttribute(wPos, 3));
  waveformGeo2.setAttribute("color", new THREE.BufferAttribute(wColor, 3));
  const waveformMat = new THREE.PointsMaterial({
    size: 0.015,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const waveforms = new THREE.Points(waveformGeo2, waveformMat);
  scene.add(waveforms);

  // --- Animation state ------------------------------------------------------

  const state = {
    time: 0,
    mouseX: 0,
    mouseY: 0,
    targetRotation: 0,
    targetFloat: 0,
  };

  // --- Event listeners ------------------------------------------------------

  // Mouse parallax (device subtly tracks cursor)
  document.addEventListener("mousemove", (e) => {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    state.mouseX = x * 0.04;
    state.mouseY = -y * 0.04;
  });

  // Resize
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", onResize);

  // --- Animation loop -------------------------------------------------------
  function animate() {
    requestAnimationFrame(animate);
    state.time += 0.016;

    // Device rotation + floating + breathing
    state.targetRotation += (0.004 - state.targetRotation) * 0.05;
    state.targetFloat += (Math.sin(state.time * 1.3) * 0.06 - state.targetFloat) * 0.05;

    ringGroup.rotation.y += state.targetRotation;
    ringGroup.position.y = state.targetFloat;

    // Ring ring rotation (the gold inner ring pulses)
    const ringMesh2 = ringGroup.children.find(c => c.geometry.type === "TorusGeometry");
    if (ringMesh2) {
      ringMesh2.material.emissiveIntensity = 0.25 + Math.sin(state.time * 2) * 0.15;
    }

    // Orbital rings rotation
    for (let i = 0; i < orbitalRings.length; i++) {
      const group = orbitalRings[i];
      group.rotation.z += 0.008 + i * 0.003;
      const mat = group.children[0].material;
      if (mat) {
        mat.emissiveIntensity = 0.3 + Math.sin(state.time * (1 + i) * 0.7) * 0.2;
      }
    }

    // Particles orbit
    particles.rotation.y += 0.002;

    // Waveforms
    waveforms.rotation.y += 0.003;

    // Parallax: device subtly tracks cursor
    const currentX = state.mouseX * 0.2;
    const currentY = state.mouseY * 0.2;
    ringGroup.position.x += (currentX - ringGroup.position.x) * 0.05;
    ringGroup.position.y += (currentY - ringGroup.position.y) * 0.05;

    // Apply same for camera target to create parallax
    controls.target.x += (state.mouseX * 0.2 - controls.target.x) * 0.05;
    controls.target.y += (state.mouseY * 0.2 - controls.target.y) * 0.05;

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // --- Handle visibility (pause when tab hidden) ----------------------------
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      renderer.setAnimationLoop(null);
    } else {
      renderer.setAnimationLoop(animate);
    }
  });
})();
