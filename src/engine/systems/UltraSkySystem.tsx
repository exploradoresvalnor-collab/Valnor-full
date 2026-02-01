/**
 * Ultra Sky System - Cielo procedural con día/noche
 * Basado en el UltraSkySystem de la guía Angular
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sky, Stars } from '@react-three/drei';

interface SkyConfig {
  // Tiempo del día (0-24)
  timeOfDay: number;
  
  // Posición del sol
  sunPosition: THREE.Vector3;
  
  // Colores
  skyColor: THREE.Color;
  horizonColor: THREE.Color;
  groundColor: THREE.Color;
  
  // Parámetros del sol
  sunIntensity: number;
  sunColor: THREE.Color;
  
  // Estrellas
  starsVisibility: number;
  
  // Nubes
  cloudCoverage: number;
  cloudSpeed: number;
}

// Presets de tiempo
const TIME_PRESETS: Record<string, Partial<SkyConfig>> = {
  dawn: {
    timeOfDay: 6,
    skyColor: new THREE.Color(0xff9966),
    horizonColor: new THREE.Color(0xffcc99),
    sunIntensity: 0.5,
    sunColor: new THREE.Color(0xff6633),
    starsVisibility: 0.3,
  },
  morning: {
    timeOfDay: 9,
    skyColor: new THREE.Color(0x87ceeb),
    horizonColor: new THREE.Color(0xadd8e6),
    sunIntensity: 0.8,
    sunColor: new THREE.Color(0xffffcc),
    starsVisibility: 0,
  },
  noon: {
    timeOfDay: 12,
    skyColor: new THREE.Color(0x4a90d9),
    horizonColor: new THREE.Color(0x87ceeb),
    sunIntensity: 1,
    sunColor: new THREE.Color(0xffffff),
    starsVisibility: 0,
  },
  afternoon: {
    timeOfDay: 15,
    skyColor: new THREE.Color(0x6bb3f0),
    horizonColor: new THREE.Color(0xffcc99),
    sunIntensity: 0.9,
    sunColor: new THREE.Color(0xfff0cc),
    starsVisibility: 0,
  },
  sunset: {
    timeOfDay: 18,
    skyColor: new THREE.Color(0xff6633),
    horizonColor: new THREE.Color(0xff9966),
    sunIntensity: 0.4,
    sunColor: new THREE.Color(0xff3300),
    starsVisibility: 0.2,
  },
  dusk: {
    timeOfDay: 20,
    skyColor: new THREE.Color(0x333366),
    horizonColor: new THREE.Color(0x666699),
    sunIntensity: 0.1,
    sunColor: new THREE.Color(0xff6666),
    starsVisibility: 0.6,
  },
  night: {
    timeOfDay: 0,
    skyColor: new THREE.Color(0x0a0a20),
    horizonColor: new THREE.Color(0x1a1a40),
    sunIntensity: 0,
    sunColor: new THREE.Color(0x666688),
    starsVisibility: 1,
  },
};

export interface UltraSkySystemProps {
  timeOfDay?: number;        // 0-24
  initialTime?: number;      // Alias para timeOfDay (compatibilidad)
  autoProgress?: boolean;    // Avanzar tiempo automáticamente
  dayDuration?: number;      // Duración de un día en segundos (real)
  showStars?: boolean;
  showSun?: boolean;
  sunDistance?: number;
  turbidity?: number;
  rayleigh?: number;
  mieCoefficient?: number;
  mieDirectionalG?: number;
}

/**
 * Calcula la posición del sol basándose en la hora
 */
function calculateSunPosition(timeOfDay: number, distance: number = 100): THREE.Vector3 {
  // Normalizar a 0-1 (0 = medianoche, 0.5 = mediodía)
  const normalizedTime = timeOfDay / 24;
  
  // Ángulo de elevación (0° en horizonte, 90° en cenit)
  // El sol sale a las 6 (90°E), está en cenit a las 12, se pone a las 18 (90°W)
  const elevation = Math.sin((normalizedTime - 0.25) * Math.PI * 2) * 85;
  
  // Ángulo azimutal (rotación horizontal)
  const azimuth = (normalizedTime * 360 - 90) * (Math.PI / 180);
  
  // Convertir a coordenadas cartesianas
  const elevationRad = elevation * (Math.PI / 180);
  
  return new THREE.Vector3(
    Math.cos(elevationRad) * Math.sin(azimuth) * distance,
    Math.sin(elevationRad) * distance,
    Math.cos(elevationRad) * Math.cos(azimuth) * distance
  );
}

/**
 * UltraSkySystem - Componente principal del cielo
 */
export function UltraSkySystem({
  timeOfDay: timeOfDayProp = 12,
  initialTime,
  autoProgress = false,
  dayDuration = 600, // 10 minutos = 1 día
  showStars = true,
  showSun = true,
  sunDistance = 400,
  turbidity = 2,
  rayleigh = 1,
  mieCoefficient = 0.005,
  mieDirectionalG = 0.7,
}: UltraSkySystemProps) {
  const timeOfDay = initialTime ?? timeOfDayProp;
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const currentTime = useRef(timeOfDay);

  // Calcular configuración actual interpolada
  const skyConfig = useMemo(() => {
    const time = timeOfDay;
    
    // Encontrar presets más cercanos
    const presetKeys = Object.keys(TIME_PRESETS);
    let lowerPreset = TIME_PRESETS.night;
    let upperPreset = TIME_PRESETS.dawn;
    let t = 0;
    
    for (let i = 0; i < presetKeys.length; i++) {
      const preset = TIME_PRESETS[presetKeys[i]];
      const nextPreset = TIME_PRESETS[presetKeys[(i + 1) % presetKeys.length]];
      
      if (preset.timeOfDay! <= time && 
          (nextPreset.timeOfDay! > time || nextPreset.timeOfDay! < preset.timeOfDay!)) {
        lowerPreset = preset;
        upperPreset = nextPreset;
        
        const range = nextPreset.timeOfDay! > preset.timeOfDay! 
          ? nextPreset.timeOfDay! - preset.timeOfDay!
          : (24 - preset.timeOfDay!) + nextPreset.timeOfDay!;
        
        t = (time - preset.timeOfDay!) / range;
        if (t < 0) t += 1;
        break;
      }
    }
    
    // Interpolar valores
    return {
      sunPosition: calculateSunPosition(time, sunDistance),
      sunIntensity: THREE.MathUtils.lerp(lowerPreset.sunIntensity!, upperPreset.sunIntensity!, t),
      starsVisibility: THREE.MathUtils.lerp(lowerPreset.starsVisibility!, upperPreset.starsVisibility!, t),
      sunColor: new THREE.Color().lerpColors(lowerPreset.sunColor!, upperPreset.sunColor!, t),
    };
  }, [timeOfDay, sunDistance]);

  // Actualizar tiempo automáticamente
  useFrame((_, delta) => {
    if (autoProgress) {
      currentTime.current += (delta / dayDuration) * 24;
      if (currentTime.current >= 24) currentTime.current -= 24;
    }
    
    // Actualizar luz del sol
    if (sunRef.current) {
      sunRef.current.position.copy(skyConfig.sunPosition);
      sunRef.current.intensity = skyConfig.sunIntensity * 2;
      sunRef.current.color.copy(skyConfig.sunColor);
    }
  });

  return (
    <group>
      {/* Cielo con shader de Drei */}
      <Sky
        distance={450000}
        sunPosition={skyConfig.sunPosition.toArray()}
        inclination={0.5}
        azimuth={0.25}
        turbidity={turbidity}
        rayleigh={rayleigh}
        mieCoefficient={mieCoefficient}
        mieDirectionalG={mieDirectionalG}
      />
      
      {/* Estrellas */}
      {showStars && skyConfig.starsVisibility > 0 && (
        <Stars
          radius={300}
          depth={100}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />
      )}
      
      {/* Luz del sol */}
      {showSun && (
        <directionalLight
          ref={sunRef}
          position={skyConfig.sunPosition.toArray()}
          intensity={skyConfig.sunIntensity * 2}
          color={skyConfig.sunColor}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={200}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-bias={-0.0001}
        />
      )}
      
      {/* Luz ambiente */}
      <ambientLight 
        intensity={0.1 + skyConfig.sunIntensity * 0.4} 
        color={skyConfig.sunColor}
      />
      
      {/* Hemisferio para iluminación natural */}
      <hemisphereLight
        args={[0x87ceeb, 0x8b4513, 0.3 + skyConfig.sunIntensity * 0.3]}
      />
    </group>
  );
}

export default UltraSkySystem;
