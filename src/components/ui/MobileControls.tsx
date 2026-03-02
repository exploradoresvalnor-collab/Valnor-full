import React, { useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { motion } from 'framer-motion';
import { useInputStore } from '../../stores/inputStore';
import './MobileControls.css';

export const MobileControls: React.FC = () => {
    const setMove = useInputStore(s => s.setMove);
    const setJump = useInputStore(s => s.setJump);
    const setAttack = useInputStore(s => s.setAttack);
    const setSprint = useInputStore(s => s.setSprint);

    const [sprintPressed, setSprintPressed] = useState(false);
    const joystickRef = useRef<HTMLDivElement>(null);
    const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

    const MAX_RADIUS = 50;

    const bindJoystick = useDrag(({ offset: [x, y], active }) => {
        if (!active) {
            setKnobPos({ x: 0, y: 0 });
            setMove(0, 0);
            return;
        }

        // Calculate distance from center
        const distance = Math.sqrt(x * x + y * y);
        let finalX = x;
        let finalY = y;

        if (distance > MAX_RADIUS) {
            const ratio = MAX_RADIUS / distance;
            finalX = x * ratio;
            finalY = y * ratio;
        }

        setKnobPos({ x: finalX, y: finalY });

        // Normalize for input store (-1 to 1)
        // Note: Joystick Y is inverted for 3D Z movement logic in FortalezaPlayer
        setMove(finalX / MAX_RADIUS, -finalY / MAX_RADIUS);
    }, {
        from: () => [knobPos.x, knobPos.y],
    });

    return (
        <div className="mobile-controls-container">
            {/* Left Side: Joystick */}
            <div className="joystick-area">
                <div className="joystick-base" ref={joystickRef}>
                    <motion.div
                        className="joystick-knob"
                        {...(bindJoystick() as any)}
                        animate={{ x: knobPos.x, y: knobPos.y }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.5 }}
                    />
                </div>
            </div>

            {/* Right Side: Action Buttons */}
            <div className="action-buttons-area">
                <div className="secondary-buttons">
                    {/* Sprint Toggle */}
                    <button
                        className={`action-btn sprint-btn ${sprintPressed ? 'active' : ''}`}
                        onTouchStart={() => {
                            const newState = !sprintPressed;
                            setSprintPressed(newState);
                            setSprint(newState);
                        }}
                    >
                        <span className="btn-icon">🏃</span>
                    </button>

                    {/* Attack Button */}
                    <button
                        className="action-btn attack-btn"
                        onTouchStart={() => setAttack(true)}
                        onTouchEnd={() => setAttack(false)}
                    >
                        <span className="btn-icon">⚔️</span>
                    </button>
                </div>

                {/* Main Jump Button */}
                <button
                    className="action-btn jump-btn"
                    onTouchStart={() => setJump(true)}
                    onTouchEnd={() => setJump(false)}
                >
                    <span className="btn-icon">⬆️</span>
                </button>
            </div>
        </div>
    );
};
