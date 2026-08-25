"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type NetworkInformation = { saveData?: boolean };

export function OrbitScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    if (connection?.saveData) return;
    const probe = document.createElement("canvas");
    const supportsWebGL = Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
    if (!supportsWebGL) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.tabIndex = -1;
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x171715, wireframe: true, transparent: true, opacity: 0.17 });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.72, 3), coreMaterial);
    root.add(core);

    const points: THREE.Vector3[] = [];
    const count = 88;
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      points.push(new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius).multiplyScalar(1.82));
    }
    const dotGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const dotMaterial = new THREE.PointsMaterial({ color: 0xf7931a, size: 0.055, transparent: true, opacity: 0.92, sizeAttenuation: true });
    root.add(new THREE.Points(dotGeometry, dotMaterial));

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xf7931a, transparent: true, opacity: 0.16 });
    const lineGeometries: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 24; i++) {
      const geometry = new THREE.BufferGeometry().setFromPoints([points[(i * 7) % count], points[(i * 13 + 9) % count]]);
      lineGeometries.push(geometry);
      root.add(new THREE.Line(geometry, lineMaterial));
    }

    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffd45a, transparent: true, opacity: 0.36 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.48, 0.008, 8, 180), ringMaterial);
    ring.rotation.x = 1.17;
    ring.rotation.y = 0.25;
    root.add(ring);

    let frame = 0;
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.05 });
    observer.observe(mount);
    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const onContextLost = (event: Event) => { event.preventDefault(); renderer.domElement.style.display = "none"; };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const animate = () => {
      if (visible && !document.hidden) {
        root.rotation.y += 0.0018;
        root.rotation.x = Math.sin(performance.now() * 0.00018) * 0.08;
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      dotGeometry.dispose(); dotMaterial.dispose(); lineMaterial.dispose(); lineGeometries.forEach((geometry) => geometry.dispose());
      core.geometry.dispose(); coreMaterial.dispose(); ring.geometry.dispose(); ringMaterial.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="orbit-scene" aria-hidden="true"><div className="orbit-fallback" /></div>;
}
