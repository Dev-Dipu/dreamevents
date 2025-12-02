import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function DreamParallax() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        camera.position.set(0, 0, 35);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // --- 1. NEW ADVANCED SHADER MATERIAL: Gradient + PBR Lighting + Rim Light ---
        const createAdvancedGradientMaterial = () => {
            return new THREE.ShaderMaterial({
                uniforms: {
                    // Lights will be passed to shader
                    uAmbientColor: { value: new THREE.Color(0xffffff) },
                    uAmbientIntensity: { value: 0.5 },

                    uPointLightPositions: {
                        value: [
                            new THREE.Vector3(10, 0, 8), // Orange Light 1
                            new THREE.Vector3(-10, 5, 8), // Purple Light 2
                            new THREE.Vector3(0, -5, 5), // Pink Light 3
                        ],
                    },
                    uPointLightColors: {
                        value: [
                            new THREE.Color(0xff5733), // Orange
                            new THREE.Color(0x6b46c1), // Purple
                            new THREE.Color(0xff1493), // Pink
                        ],
                    },
                    uPointLightIntensities: { value: [5.0, 5.0, 4.5] },
                    uNumLights: { value: 3 },

                    uCameraPosition: { value: camera.position },
                    uTime: { value: 0 }, // For any time-based effects if needed
                },
                vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vViewDir; // Camera to fragment
          
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vPosition = worldPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(cameraPosition - worldPosition.xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
                fragmentShader: `
          uniform vec3 uAmbientColor;
          uniform float uAmbientIntensity;
          uniform vec3 uPointLightPositions[MAX_LIGHTS];
          uniform vec3 uPointLightColors[MAX_LIGHTS];
          uniform float uPointLightIntensities[MAX_LIGHTS];
          uniform int uNumLights;
          uniform vec3 uCameraPosition; // Not used directly but good for context
          uniform float uTime;

          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec3 vViewDir;

          const float METALNESS = 0.8;
          const float ROUGHNESS = 0.1;
          const float SHININESS = 64.0; // Increased for sharper crystal highlights

          void main() {
            // --- Base Gradient Color (from first version) ---
            vec3 topColor = vec3(0.18, 0.11, 0.31);     // Dark purple
            vec3 middleColor = vec3(0.55, 0.23, 0.39);    // Pink
            vec3 bottomColor = vec3(1.0, 0.34, 0.2);      // Orange
            
            // Normalize position for gradient (adjust range as needed for spread letters)
            float gradientFactor = (vPosition.y + 7.0) / 14.0; // Adjusted range
            gradientFactor = clamp(gradientFactor, 0.0, 1.0);
            
            vec3 baseGradientColor;
            if (gradientFactor < 0.5) {
              baseGradientColor = mix(bottomColor, middleColor, gradientFactor * 2.0);
            } else {
              baseGradientColor = mix(middleColor, topColor, (gradientFactor - 0.5) * 2.0);
            }
            
            // --- Combined Lighting (PBR-like) ---
            vec3 finalColor = vec3(0.0);

            // Ambient light contribution
            finalColor += uAmbientColor * uAmbientIntensity * baseGradientColor;

            float totalSpecular = 0.0;

            // Point lights contribution
            for (int i = 0; i < MAX_LIGHTS; i++) {
                if (i >= uNumLights) break;

                vec3 lightDir = normalize(uPointLightPositions[i] - vPosition);
                float dist = length(uPointLightPositions[i] - vPosition);
                // Inverse square falloff + a small offset to prevent division by zero
                float attenuation = uPointLightIntensities[i] / (dist * dist + 1.0); 

                // Diffuse (base color affected by light color)
                float diff = max(dot(vNormal, lightDir), 0.0);
                vec3 diffuse = uPointLightColors[i] * diff * attenuation * (1.0 - METALNESS); // Less diffuse for metallic

                // Specular (reflects light color, not object color, more for metallic)
                vec3 reflectDir = reflect(-lightDir, vNormal);
                float spec = pow(max(dot(vViewDir, reflectDir), 0.0), SHININESS);
                vec3 specular = uPointLightColors[i] * spec * attenuation * METALNESS;
                
                totalSpecular += spec;

                finalColor += (diffuse + specular) * baseGradientColor; // Multiply by gradient
            }

            // --- Rim Light (white/soft for highlight effect) ---
            float rimFactor = 1.0 - dot(vViewDir, vNormal); // Closer to 1 at edges
            rimFactor = smoothstep(0.0, 1.0, rimFactor); // Smooth transition
            rimFactor = pow(rimFactor, 1.5); // Sharpen the rim
            vec3 rimLightColor = vec3(1.0, 1.0, 1.0) * rimFactor * 0.8; // Bright white rim
            finalColor += rimLightColor;

            // --- Glass/Crystal Alpha ---
            // Base transparency + Fresnel (more opaque at angles) + Specular (opaque highlights)
            float alpha = 0.15 + 0.6 * rimFactor; 
            alpha = clamp(alpha + totalSpecular * 0.5, 0.0, 1.0); // Highlights make it opaque

            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
                // MAX_LIGHTS is a placeholder in the shader; GLSL requires a fixed size array
                defines: {
                    MAX_LIGHTS: 3,
                },
                side: THREE.DoubleSide,
                transparent: true,
                depthWrite: false,
            });
        };

        // Extrude settings (unchanged)
        const extrudeSettings = {
            depth: 2,
            bevelEnabled: true,
            bevelThickness: 0.3,
            bevelSize: 0.2,
            bevelSegments: 10,
            curveSegments: 20,
        };

        // Create letter shapes
        const createLetter = (letter) => {
            let shape;
            // ... [Aapke D, R, E, A, M ke 'if' statements yahan] ...
            if (letter === "D") {
                shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.lineTo(0, 5);
                shape.lineTo(2, 5);
                shape.bezierCurveTo(4.2, 5, 4.8, 4, 4.8, 2.5);
                shape.bezierCurveTo(4.8, 1, 4.2, 0, 2, 0);
                shape.lineTo(0, 0);
                const hole = new THREE.Path();
                hole.moveTo(0.9, 0.8);
                hole.lineTo(2, 0.8);
                hole.bezierCurveTo(3.2, 0.8, 3.8, 1.5, 3.8, 2.5);
                hole.bezierCurveTo(3.8, 3.5, 3.2, 4.2, 2, 4.2);
                hole.lineTo(0.9, 4.2);
                hole.lineTo(0.9, 0.8);
                shape.holes.push(hole);
            } else if (letter === "R") {
                shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.lineTo(0, 5);
                shape.lineTo(2.5, 5);
                shape.bezierCurveTo(4.2, 5, 4.8, 4.2, 4.8, 3.5);
                shape.bezierCurveTo(4.8, 2.8, 4.2, 2.3, 3, 2.2);
                shape.lineTo(5, 0);
                shape.lineTo(3.5, 0);
                shape.lineTo(1.8, 2);
                shape.lineTo(0.9, 2);
                shape.lineTo(0.9, 0);
                shape.lineTo(0, 0);
                const hole = new THREE.Path();
                hole.moveTo(0.9, 2.9);
                hole.lineTo(2.5, 2.9);
                hole.bezierCurveTo(3.3, 2.9, 3.8, 3.3, 3.8, 3.7);
                hole.bezierCurveTo(3.8, 4.1, 3.3, 4.2, 2.5, 4.2);
                hole.lineTo(0.9, 4.2);
                hole.lineTo(0.9, 2.9);
                shape.holes.push(hole);
            } else if (letter === "E") {
                shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.lineTo(0, 5);
                shape.lineTo(4.2, 5);
                shape.lineTo(4.2, 4.2);
                shape.lineTo(0.9, 4.2);
                shape.lineTo(0.9, 2.9);
                shape.lineTo(3.8, 2.9);
                shape.lineTo(3.8, 2.1);
                shape.lineTo(0.9, 2.1);
                shape.lineTo(0.9, 0.8);
                shape.lineTo(4.2, 0.8);
                shape.lineTo(4.2, 0);
                shape.lineTo(0, 0);
            } else if (letter === "A") {
                shape = new THREE.Shape();
                shape.moveTo(2, 5);
                shape.lineTo(3, 5);
                shape.lineTo(5.2, 0);
                shape.lineTo(4.1, 0);
                shape.lineTo(3.6, 1.3);
                shape.lineTo(1.4, 1.3);
                shape.lineTo(0.9, 0);
                shape.lineTo(-0.2, 0);
                shape.lineTo(2, 5);
                const hole = new THREE.Path();
                hole.moveTo(1.8, 2.1);
                hole.lineTo(3.2, 2.1);
                hole.lineTo(2.5, 4.1);
                hole.lineTo(1.8, 2.1);
                shape.holes.push(hole);
            } else if (letter === "M") {
                shape = new THREE.Shape();
                shape.moveTo(0, 0);
                shape.lineTo(0, 5);
                shape.lineTo(0.9, 5);
                shape.lineTo(0.9, 1.5);
                shape.lineTo(2.5, 4.7);
                shape.lineTo(3.5, 4.7);
                shape.lineTo(5.1, 1.5);
                shape.lineTo(5.1, 5);
                shape.lineTo(6, 5);
                shape.lineTo(6, 0);
                shape.lineTo(4.8, 0);
                shape.lineTo(3, 3.5);
                shape.lineTo(1.2, 0);
                shape.lineTo(0, 0);
            }

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            const material = createAdvancedGradientMaterial(); // Naya shader material
            const mesh = new THREE.Mesh(geometry, material);

            geometry.computeBoundingBox();
            const centerX =
                (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
            const centerY =
                (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
            mesh.position.set(-centerX, -centerY, 0);

            const group = new THREE.Group();
            group.add(mesh);

            return { group, material }; // Material bhi return karna hai uniforms update ke liye
        };

        // Spread out layout & size
        const letters = ["D", "R", "E", "A", "M"];
        const letterData = [];
        const positions = [
            { x: -19, y: 4 }, // D (a bit further left)
            { x: -10, y: -5 }, // R (slightly left)
            { x: 2, y: 5 }, // E (almost same, slight adjust)
            { x: 12, y: -2 }, // A (moved right)
            { x: 22, y: 3 }, // M (a bit further right)
        ];

        letters.forEach((char, i) => {
            const { group, material } = createLetter(char);

            group.position.x = 0;
            group.position.y = -20;
            group.position.z = -i * 2;

            group.scale.set(1.25, 1.25, 1.25);
            scene.add(group);

            letterData.push({
                group,
                material,
                index: i,
                targetX: positions[i].x,
                targetY: positions[i].y,
                baseZ: -i * 2,
                randomRotX: (Math.random() - 0.5) * Math.PI,
                randomRotY: (Math.random() - 0.5) * Math.PI,
                randomRotZ: (Math.random() - 0.5) * Math.PI,
            });
        });

        // --- 2. NO LIGHTS IN SCENE, ALL IN SHADER ---
        // Scene mein sirf helper lights ya debugging ke liye rakh sakte hain
        // Ya phir point lights add karein aur unki properties shader mein paas karein
        // Yahan humne lights ki properties uniform mein hardcode ki hain (upar shader mein)
        // agar dynamic lights chahiye toh unhe scene mein add karke unki position aur color uniform mein update karna hoga.

        // Scroll handling
        let scrollProgress = 0;
        let targetScroll = 0;

        const handleScroll = () => {
            const maxScroll =
                document.documentElement.scrollHeight - window.innerHeight;
            targetScroll = window.scrollY / maxScroll;
        };
        window.addEventListener("scroll", handleScroll, { passive: true });

        // Animation loop
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);
            const elapsedTime = clock.getElapsedTime();

            scrollProgress += (targetScroll - scrollProgress) * 0.08;

            const animationProgress = THREE.MathUtils.smoothstep(
                scrollProgress,
                0.1,
                0.5
            );

            letterData.forEach(
                ({
                    group,
                    material,
                    index,
                    targetX,
                    targetY,
                    baseZ,
                    randomRotX,
                    randomRotY,
                    randomRotZ,
                }) => {
                    group.position.y = THREE.MathUtils.lerp(
                        -20,
                        targetY,
                        animationProgress
                    );
                    group.position.x = THREE.MathUtils.lerp(
                        0,
                        targetX,
                        animationProgress
                    );
                    group.position.z = THREE.MathUtils.lerp(
                        -10,
                        baseZ,
                        animationProgress
                    );

                    group.rotation.x = randomRotX + scrollProgress * 6.0;
                    group.rotation.y = randomRotY + scrollProgress * 7.0;
                    group.rotation.z = randomRotZ + scrollProgress * 5.0;

                    // Shader uniforms update (time & camera position)
                    material.uniforms.uTime.value = elapsedTime;
                    material.uniforms.uCameraPosition.value.copy(
                        camera.position
                    ); // Ensure camera position is updated
                }
            );

            renderer.render(scene, camera);
        }
        animate();

        // Handle resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
            letterData.forEach(({ group }) => {
                group.children.forEach((child) => {
                    child.geometry.dispose();
                    child.material.dispose();
                });
                scene.remove(group);
            });
            renderer.dispose();
        };
    }, []);

    // --- JSX LAYOUT (Saath mein scroll & Layering Correct) ---
    return (
        <div
            ref={containerRef}
            className="relative w-full bg-[#171717] overflow-x-hidden"
            style={{ height: "340vh" }}
        >
            {/* Yeh main content block hai jo text aur canvas ko hold karta hai.
          Yeh 'absolute' hai aur '150vh' neeche hai, isliye yeh scroll karta hai. */}
            <div className="absolute w-full h-screen" style={{ top: "150vh" }}>
                {/* Text (z-10, peeche) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center w-3/5 pointer-events-none">
                    <h2 className=" text-3xl md:text-4xl lg:text-5xl text-white leading-normal font-['eight']">
                        We are a creative and passionate team of corporate event
                        planners delivering exceptional experiences across
                        India. From concept to execution, we ensure every event
                        is innovative, seamless and memorable.
                    </h2>
                </div>

                {/* Canvas (z-20, upar) */}
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full z-20"
                />
            </div>
        </div>
    );
}
