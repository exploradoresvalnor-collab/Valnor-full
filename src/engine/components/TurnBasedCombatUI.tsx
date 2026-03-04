import React, { useEffect, useRef, useState } from 'react';
import { useCombatModeStore } from '../stores/combatModeStore';
import './TurnBasedCombatUI.css';

export const TurnBasedCombatUI: React.FC = () => {
    const { isActive, enemy, player, turn, log, actions } = useCombatModeStore();
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Local state for UI animations/blocking
    const [isProcessing, setIsProcessing] = useState(false);

    // Auto-scroll combat log
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [log]);

    if (!isActive || !enemy || !player) return null;

    const enemyHealthPercent = Math.max(0, (enemy.currentHealth / enemy.maxHealth) * 100);
    const playerHealthPercent = Math.max(0, (player.currentHealth / player.maxHealth) * 100);

    // --- Mock Combat Logic (Phase 1) ---
    const handleAttack = () => {
        if (turn !== 'player' || isProcessing) return;
        setIsProcessing(true);

        // Player attacks
        let damage = player.stats.attack * (100 / (100 + enemy.stats.defense));
        const isCrit = Math.random() * 100 < player.stats.critRate;
        if (isCrit) damage *= (player.stats.critDamage / 100);

        // Variance
        damage = Math.max(1, Math.round(damage * (1 + (Math.random() * 0.2 - 0.1))));

        actions.addLog(`⚔️ ¡Atacas a ${enemy.name} por ${damage} de daño! ${isCrit ? '(¡CRÍTICO!)' : ''}`);
        const newEnemyHealth = enemy.currentHealth - damage;
        actions.updateHealth(enemy.id, newEnemyHealth);

        if (newEnemyHealth <= 0) {
            setTimeout(() => {
                actions.endCombat('victory');
                setIsProcessing(false);
            }, 1500);
            return;
        }

        // Pass turn to enemy
        actions.setTurn('enemy');

        // Enemy attacks after delay
        setTimeout(() => {
            let eDamage = enemy.stats.attack * (100 / (100 + player.stats.defense));
            const eCrit = Math.random() * 100 < enemy.stats.critRate;
            if (eCrit) eDamage *= (enemy.stats.critDamage / 100);
            eDamage = Math.max(1, Math.round(eDamage * (1 + (Math.random() * 0.2 - 0.1))));

            actions.addLog(`🛡️ ${enemy.name} te ataca por ${eDamage} de daño. ${eCrit ? '(¡CRÍTICO!)' : ''}`);
            const newPlayerHealth = player.currentHealth - eDamage;
            actions.updateHealth(player.id, newPlayerHealth);

            if (newPlayerHealth <= 0) {
                setTimeout(() => {
                    actions.endCombat('defeat');
                    setIsProcessing(false);
                }, 1500);
                return;
            }

            actions.setTurn('player');
            setIsProcessing(false);
        }, 1500);
    };

    const handleDefend = () => {
        if (turn !== 'player' || isProcessing) return;
        setIsProcessing(true);

        actions.addLog(`🛡️ Te preparas para defender el próximo ataque.`);
        actions.setTurn('enemy');

        // Enemy attacks with reduced damage
        setTimeout(() => {
            let eDamage = enemy.stats.attack * (100 / (100 + (player.stats.defense * 2))); // Double defense
            eDamage = Math.max(1, Math.round(eDamage * (1 + (Math.random() * 0.2 - 0.1))));

            actions.addLog(`🛡️ Bloqueas a ${enemy.name} recibiendo solo ${eDamage} de daño.`);
            const newPlayerHealth = player.currentHealth - eDamage;
            actions.updateHealth(player.id, newPlayerHealth);

            if (newPlayerHealth <= 0) {
                setTimeout(() => {
                    actions.endCombat('defeat');
                    setIsProcessing(false);
                }, 1500);
                return;
            }

            actions.setTurn('player');
            setIsProcessing(false);
        }, 1500);
    };

    const handleFlee = () => {
        if (turn !== 'player' || isProcessing) return;
        actions.addLog(`🏃 Intentas huir del combate...`);
        setIsProcessing(true);

        setTimeout(() => {
            if (Math.random() > 0.5) {
                actions.addLog(`✅ ¡Has escapado con éxito!`);
                setTimeout(() => actions.endCombat('fled'), 1000);
            } else {
                actions.addLog(`❌ No pudiste escapar.`);
                actions.setTurn('enemy');

                setTimeout(() => {
                    let eDamage = enemy.stats.attack * (100 / (100 + player.stats.defense));
                    eDamage = Math.max(1, Math.round(eDamage * (1 + (Math.random() * 0.2 - 0.1))));
                    actions.addLog(`💥 ${enemy.name} aprovecha tu distracción por ${eDamage} de daño.`);
                    const newPlayerHealth = player.currentHealth - eDamage;
                    actions.updateHealth(player.id, newPlayerHealth);

                    if (newPlayerHealth <= 0) {
                        setTimeout(() => {
                            actions.endCombat('defeat');
                            setIsProcessing(false);
                        }, 1500);
                        return;
                    }

                    actions.setTurn('player');
                    setIsProcessing(false);
                }, 1500);
            }
        }, 1000);
    };

    return (
        <div className="combat-ui-container">
            {/* Enemy Stats (Top Right) */}
            <div className="combat-entity-panel enemy-panel-container">
                <div className="combat-entity-header">
                    <span className="combat-entity-name">{enemy.name}</span>
                    <span className="combat-entity-level">Nvl {enemy.level}</span>
                </div>
                <div className="combat-health-bar-bg">
                    <div
                        className="combat-health-bar-fill"
                        style={{ width: `${enemyHealthPercent}%` }}
                    />
                </div>
                <div className="combat-health-numbers">
                    {Math.floor(enemy.currentHealth)} / {enemy.maxHealth}
                </div>
            </div>

            {/* Combat Log (Center Left) */}
            <div className="combat-log-container" ref={logContainerRef}>
                {log.map((entry, idx) => (
                    <div key={idx} className="combat-log-entry">
                        {entry}
                    </div>
                ))}
                {turn === 'enemy' && (
                    <div className="combat-log-entry" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                        El enemigo está pensando...
                    </div>
                )}
            </div>

            {/* Player Stats (Bottom Left) */}
            <div className="combat-entity-panel player-panel-container">
                <div className="combat-entity-header">
                    <span className="combat-entity-name">{player.name}</span>
                    <span className="combat-entity-level">Nvl {player.level}</span>
                </div>
                <div className="combat-health-bar-bg">
                    <div
                        className="combat-health-bar-fill"
                        style={{ width: `${playerHealthPercent}%`, background: 'linear-gradient(90deg, #00b33c, #4cff88)', boxShadow: '0 0 10px rgba(0, 255, 0, 0.5)' }}
                    />
                </div>
                <div className="combat-health-numbers">
                    {Math.floor(player.currentHealth)} / {player.maxHealth}
                </div>
            </div>

            {/* Action Menu (Bottom Right) */}
            <div className="combat-action-menu">
                <button
                    className="combat-action-btn"
                    onClick={handleAttack}
                    disabled={turn !== 'player' || isProcessing}
                >
                    Atacar
                </button>
                <button
                    className="combat-action-btn"
                    onClick={handleDefend}
                    disabled={turn !== 'player' || isProcessing}
                >
                    Defender
                </button>
                <button
                    className="combat-action-btn"
                    onClick={handleFlee}
                    disabled={turn !== 'player' || isProcessing}
                >
                    Huir
                </button>
            </div>
        </div>
    );
};
