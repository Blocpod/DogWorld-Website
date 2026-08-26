"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type NetworkInformation = { saveData?: boolean };

export function RunestoneScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let model: THREE.Group | undefined;
    let pointerX = 0;
    let pointerY = 0;

    const disposeModel = (root: THREE.Object3D) => {
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) value.dispose();
          });
          material.dispose();
        });
      });
    };

    const initialize = async () => {
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
      if (motion.matches || connection?.saveData) return;
      const probe = document.createElement("canvas");
      if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return;

      const [{ GLTFLoader }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
      ]);
      if (disposed) return;

      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.tabIndex = -1;
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 50);
      camera.position.set(0, 0.05, 7.25);
      scene.add(new THREE.HemisphereLight(0xded7ff, 0x140e28, 2.1));
      const keyLight = new THREE.DirectionalLight(0xb9a7ff, 4.8);
      keyLight.position.set(-3.5, 4.5, 5);
      scene.add(keyLight);
      const edgeLight = new THREE.PointLight(0x6858ff, 18, 12, 1.7);
      edgeLight.position.set(3.2, 0.8, 2.8);
      scene.add(edgeLight);
      const bitcoinLight = new THREE.PointLight(0xf7931a, 9, 10, 2);
      bitcoinLight.position.set(-2.6, -2.4, 2.2);
      scene.add(bitcoinLight);

      const gltf = await new GLTFLoader().loadAsync("/models/original-runestone.glb").catch(() => null);
      if (!gltf) {
        renderer.dispose();
        renderer.domElement.remove();
        renderer = undefined;
        return;
      }
      if (disposed) {
        disposeModel(gltf.scene);
        return;
      }
      model = gltf.scene;
      const baseRotation = -Math.PI / 2;
      model.rotation.y = baseRotation;
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const material = object.material;
        if (material instanceof THREE.MeshStandardMaterial) {
          material.envMapIntensity = 1.35;
          material.roughness = 0.24;
          material.metalness = 0.22;
          material.needsUpdate = true;
        }
      });
      scene.add(model);
      mount.parentElement?.classList.add("has-live-runestone");

      const resize = () => {
        if (!renderer) return;
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();

      const startedAt = performance.now();
      const animate = (time: number) => {
        if (model && !document.hidden) {
          const elapsed = (time - startedAt) / 1000;
          model.rotation.y = baseRotation + Math.sin(elapsed * 0.48) * 0.16 + pointerX * 0.18;
          model.rotation.x = Math.sin(elapsed * 0.36) * 0.025 + pointerY * 0.06;
          model.position.y = Math.sin(elapsed * 0.72) * 0.08;
          renderer?.render(scene, camera);
        }
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = mount.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const onPointerLeave = () => { pointerX = 0; pointerY = 0; };
    mount.addEventListener("pointermove", onPointerMove, { passive: true });
    mount.addEventListener("pointerleave", onPointerLeave, { passive: true });

    const loadObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      loadObserver.disconnect();
      void initialize();
    }, { rootMargin: "320px" });
    loadObserver.observe(mount);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      loadObserver.disconnect();
      resizeObserver?.disconnect();
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerleave", onPointerLeave);
      mount.parentElement?.classList.remove("has-live-runestone");
      if (model) disposeModel(model);
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="runestone-scene" aria-hidden="true" />;
}
