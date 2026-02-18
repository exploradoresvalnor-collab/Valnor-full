import './ProStats.css';
import { GiRuneSword, GiShieldBash, GiHearts } from 'react-icons/gi';

export function ProStatsPanel({ character, totalPower }: { character: any; totalPower: number }) {
  if (!character) return null;
  const getPercent = (val: number | undefined, max = 500) => Math.min(((val || 0) / max) * 100, 100);

  return (
    <div className="pro-stats-container">
      <div className="pro-power-level">
        <span className="pro-power-label">Poder de Combate</span>
        <span className="pro-power-value">{totalPower?.toLocaleString?.() ?? totalPower}</span>
      </div>

      <div className="pro-stats-list">
        <div className="pro-stat-row">
          <div className="pro-stat-header atk">
            <span><GiRuneSword style={{ verticalAlign: 'middle', marginRight: 6 }} /> Ataque (ATK)</span>
            <span>{character.stats?.atk || 0}</span>
          </div>
          <div className="pro-stat-bar-bg">
            <div className="pro-stat-bar-fill atk" style={{ width: `${getPercent(character.stats?.atk)}%` }} />
          </div>
        </div>

        <div className="pro-stat-row">
          <div className="pro-stat-header def">
            <span><GiShieldBash style={{ verticalAlign: 'middle', marginRight: 6 }} /> Defensa (DEF)</span>
            <span>{character.stats?.defensa || 0}</span>
          </div>
          <div className="pro-stat-bar-bg">
            <div className="pro-stat-bar-fill def" style={{ width: `${getPercent(character.stats?.defensa)}%` }} />
          </div>
        </div>

        <div className="pro-stat-row">
          <div className="pro-stat-header hp">
            <span><GiHearts style={{ verticalAlign: 'middle', marginRight: 6 }} /> Salud (HP)</span>
            <span>{character.saludActual} / {character.saludMaxima}</span>
          </div>
          <div className="pro-stat-bar-bg">
            <div className="pro-stat-bar-fill hp" style={{ width: `${(character.saludActual / Math.max(character.saludMaxima, 1)) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
