import React, { useState, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion } from 'framer-motion';
import { useInputStore } from '../../stores/inputStore';
import './MobileControls.css';

export const MobileControls: React.FC = () => {
    const setMove = useInputStore(s => s.setMove);
    const setLook = useInputStore(s => s.setLook);
    const setJump = useInputStore(s => s.setJump);
    const setAttack = useInputStore(s => s.setAttack);
    const setSprint = useInputStore(s => s.setSprint);

    const [sprintPressed, setSprintPressed] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    // Joystick States
    const [movePos, setMovePos] = useState({ x: 0, y: 0 });
    const [lookPos, setLookPos] = useState({ x: 0, y: 0 });

    const MAX_RADIUS = 50;

    // Monitor fullscreen state
    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        }
    };

    // Left Joystick: Movement
    const bindMove = useDrag(({ offset: [x, y], active }) => {
        if (!active) {
            setMovePos({ x: 0, y: 0 });
            setMove(0, 0, 0);
            return;
        }
        const distance = Math.sqrt(x * x + y * y);
        let finalX = x;
        let finalY = y;
        if (distance > MAX_RADIUS) {
            const ratio = MAX_RADIUS / distance;
            finalX = x * ratio;
            finalY = y * ratio;
        }
        setMovePos({ x: finalX, y: finalY });
        const magnitude = Math.min(1, distance / MAX_RADIUS);
        setMove(finalX / MAX_RADIUS, -finalY / MAX_RADIUS, magnitude);
    }, { from: () => [movePos.x, movePos.y] });

    // Right Joystick: Camera Look
    const bindLook = useDrag(({ offset: [x, y], active }) => {
        if (!active) {
            setLookPos({ x: 0, y: 0 });
            setLook(0, 0);
            return;
        }
        const distance = Math.sqrt(x * x + y * y);
        let finalX = x;
        let finalY = y;
        if (distance > MAX_RADIUS) {
            const ratio = MAX_RADIUS / distance;
            finalX = x * ratio;
            finalY = y * ratio;
        }
        setLookPos({ x: finalX, y: finalY });
        // Scale sensitivity for better feel
        setLook(finalX / MAX_RADIUS, finalY / MAX_RADIUS);
    }, { from: () => [lookPos.x, lookPos.y] });

    return (
        <div className="mobile-controls-container" style={{ touchAction: 'none' }}>
            {/* Fullscreen Prompt Overlay */}
            {!isFullscreen && (
                <div className="fullscreen-prompt" onClick={toggleFullscreen}>
                    <div className="prompt-content">
                        <span className="prompt-icon">📱</span>
                        <p>Toca para Pantalla Completa</p>
                        <small>(Optimiza los controles táctiles)</small>
                    </div>
                </div>
            )}

            {/* Left Side: Movement Joystick */}
            <div className="joystick-area left">
                <div className="joystick-base">
                    <motion.div
                        className="joystick-knob move-knob"
                        {...(bindMove() as any)}
                        animate={{ x: movePos.x, y: movePos.y }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400, mass: 0.5 }}
                    />
                </div>
            </div>

            {/* Right Side: Camera Joystick & Action Buttons */}
            <div className="right-controls-area">
                {/* Secondary Actions (Floating above look joystick) */}
                <div className="floating-actions">
                    <button
                        className={`action-btn sprint-btn ${sprintPressed ? 'active' : ''}`}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            const newState = !sprintPressed;
                            setSprintPressed(newState);
                            setSprint(newState);
                        }}
                    >
                        <span className="btn-icon">🏃</span>
                    </button>
                </div>

                {/* Camera Joystick */}
                <div className="joystick-area right">
                    <div className="joystick-base">
                        <motion.div
                            className="joystick-knob look-knob"
                            {...(bindLook() as any)}
                            animate={{ x: lookPos.x, y: lookPos.y }}
                            transition={{ type: 'spring', damping: 25, stiffness: 400, mass: 0.5 }}
                        />
                    </div>
                </div>

                {/* Primary Actions (Arranged for thumb access) */}
                <div className="primary-actions">
                    <button
                        className="action-btn attack-btn"
                        onTouchStart={(e) => { e.preventDefault(); setAttack(true); }}
                        onTouchEnd={(e) => { e.preventDefault(); setAttack(false); }}
                    >
                        <span className="btn-icon">⚔️</span>
                    </button>

                    <button
                        className="action-btn jump-btn"
                        onTouchStart={(e) => { e.preventDefault(); setJump(true); }}
                        onTouchEnd={(e) => { e.preventDefault(); setJump(false); }}
                    >
                        <span className="btn-icon">⬆️</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
