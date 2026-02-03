/**
 * EnergyBar - Barra de energía con timer de regeneración
 * Muestra energía actual y tiempo hasta próxima regeneración
 */

import { useState, useEffect } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { EnergyIcon } from '../icons/GameIcons';
import './EnergyBar.css';

export function EnergyBar() {
  const energy = usePlayerStore((s) => s.energy);
  const maxEnergy = usePlayerStore((s) => s.maxEnergy);
  const updateEnergyRegen = usePlayerStore((s) => s.updateEnergyRegen);
  
  const [timeToNext, setTimeToNext] = useState<string>('');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Actualizar regeneración al montar
    updateEnergyRegen();
    
    const interval = setInterval(() => {
      // Actualizar regeneración cada segundo
      updateEnergyRegen();
      
      // Calcular tiempo hasta próxima energía
      const currentEnergy = usePlayerStore.getState().energy;
      const currentMaxEnergy = usePlayerStore.getState().maxEnergy;
      const currentLastUpdate = usePlayerStore.getState().lastEnergyUpdate;
      const currentRegenMinutes = usePlayerStore.getState().energyRegenMinutes;
      
      if (currentEnergy >= currentMaxEnergy) {
        setTimeToNext('LLENO');
        setProgress(100);
        return;
      }
      
      const now = Date.now();
      const elapsed = now - currentLastUpdate;
      const regenInterval = currentRegenMinutes * 60 * 1000;
      const remaining = regenInterval - (elapsed % regenInterval);
      
      // Progreso hacia la siguiente energía (0-100)
      const progressPercent = ((regenInterval - remaining) / regenInterval) * 100;
      setProgress(progressPercent);
      
      // Formatear tiempo restante
      const totalSeconds = Math.ceil(remaining / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setTimeToNext(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      
    }, 1000);
    
    return () => clearInterval(interval);
  }, []); // Sin dependencias para evitar re-creación del interval
  
  const isFull = energy >= maxEnergy;
  const percentage = (energy / maxEnergy) * 100;
  
  return (
    <div className={`energy-bar-container ${isFull ? 'full' : ''}`}>
      <div className="energy-bar-main">
        <div className="energy-icon">
          <EnergyIcon size={20} />
        </div>
        <div className="energy-info">
          <div className="energy-values">
            <span className="energy-current">{energy}</span>
            <span className="energy-separator">/</span>
            <span className="energy-max">{maxEnergy}</span>
          </div>
          <div className="energy-bar-track">
            <div 
              className="energy-bar-fill" 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      
      {!isFull && (
        <div className="energy-regen">
          <div className="regen-progress">
            <div 
              className="regen-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="regen-timer">+1 en {timeToNext}</span>
        </div>
      )}
      
      {isFull && (
        <div className="energy-full-badge">
          <span>✓ LLENO</span>
        </div>
      )}
    </div>
  );
}

export default EnergyBar;
