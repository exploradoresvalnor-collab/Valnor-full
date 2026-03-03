import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { OpenPackageResult } from '../../../services/shop.service';
import { ItemRarity, RARITY_COLORS } from '../../../types/item.types';
import './PackageOpener.css';

interface PackageOpenerProps {
    packageName: string;
    onOpen: () => Promise<OpenPackageResult>;
    onClose: () => void;
}

type OpenerPhase = 'intro' | 'suspense' | 'flash' | 'reveal' | 'summary';

// Framer Motion Variants
const cardVariants = {
    hidden: { opacity: 0, y: 120, rotateY: 90, scale: 0.6 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        rotateY: 0,
        scale: 1,
        transition: {
            delay: i * 0.25,
            type: 'spring' as const,
            stiffness: 120,
            damping: 14,
            mass: 0.8,
        },
    }),
    hover: {
        y: -15,
        scale: 1.08,
        rotateY: 8,
        transition: { type: 'spring' as const, stiffness: 300, damping: 15 },
    },
};

const titleVariants = {
    hidden: { opacity: 0, scale: 0.3, filter: 'blur(20px)' },
    visible: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: { type: 'spring' as const, stiffness: 80, damping: 12, delay: 0.1 },
    },
};

const buttonVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { delay: 1.5, duration: 0.6 } },
};

export const PackageOpener: React.FC<PackageOpenerProps> = ({ packageName, onOpen, onClose }) => {
    const [phase, setPhase] = useState<OpenerPhase>('intro');
    const [result, setResult] = useState<OpenPackageResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const boxRef = useRef<HTMLDivElement>(null);
    const auraRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const suspenseTl = useRef<gsap.core.Timeline | null>(null);

    // ─── GOLDEN CONFETTI BURST ───
    const fireConfetti = useCallback(() => {
        const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 10000 };
        const colors = ['#ffd700', '#ffA500', '#fff', '#f59e0b', '#b8860b'];

        // Center burst
        confetti({ ...defaults, particleCount: 80, origin: { x: 0.5, y: 0.4 }, colors });
        // Sides
        setTimeout(() => {
            confetti({ ...defaults, particleCount: 50, origin: { x: 0.3, y: 0.5 }, colors });
            confetti({ ...defaults, particleCount: 50, origin: { x: 0.7, y: 0.5 }, colors });
        }, 200);
        // Lingering sparkles
        setTimeout(() => {
            confetti({ ...defaults, particleCount: 30, origin: { x: 0.5, y: 0.3 }, colors, startVelocity: 15 });
        }, 500);
    }, []);

    // ─── GSAP SUSPENSE TIMELINE ───
    useEffect(() => {
        if (phase === 'suspense' && boxRef.current && auraRef.current) {
            const tl = gsap.timeline();
            suspenseTl.current = tl;

            // Stage 1: Gentle rumble (0-0.8s)
            tl.to(boxRef.current, {
                x: 'random(-3, 3)',
                y: 'random(-2, 2)',
                rotation: 'random(-1, 1)',
                duration: 0.08,
                repeat: 10,
                yoyo: true,
                ease: 'none',
            });

            // Stage 2: Violent shake + scale buildup (0.8-1.6s)
            tl.to(boxRef.current, {
                x: 'random(-8, 8)',
                y: 'random(-5, 5)',
                rotation: 'random(-3, 3)',
                scale: 1.15,
                duration: 0.05,
                repeat: 20,
                yoyo: true,
                ease: 'power2.inOut',
            });

            // Stage 3: EXTREME shake + aura explosion (1.6-2s)
            tl.to(boxRef.current, {
                x: 'random(-15, 15)',
                y: 'random(-10, 10)',
                rotation: 'random(-5, 5)',
                scale: 1.3,
                duration: 0.03,
                repeat: 15,
                yoyo: true,
                ease: 'power4.inOut',
            });

            // Aura grows simultaneously
            tl.to(auraRef.current, {
                scale: 4,
                opacity: 1,
                filter: 'brightness(4) blur(10px)',
                duration: 2,
                ease: 'power2.in',
            }, 0); // starts at time 0

            return () => { tl.kill(); };
        }
    }, [phase]);

    // ─── GSAP FLASH TRANSITION ───
    useEffect(() => {
        if (phase === 'flash' && overlayRef.current) {
            const tl = gsap.timeline();

            // White-out
            tl.to(overlayRef.current, {
                opacity: 1,
                duration: 0.15,
                ease: 'power4.in',
            });

            // Hold white
            tl.to(overlayRef.current, { duration: 0.3 });

            // Fade to transparent and transition
            tl.to(overlayRef.current, {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    fireConfetti();
                    setPhase('reveal');
                },
            });
        }
    }, [phase, fireConfetti]);

    const handleOpenClick = async () => {
        if (phase !== 'intro') return;
        setPhase('suspense');
        setError(null);

        try {
            const [, res] = await Promise.all([
                new Promise(resolve => setTimeout(resolve, 2200)),
                onOpen()
            ]);
            setResult(res);
            setPhase('flash');
        } catch (err: any) {
            setError(err.message || 'Error al abrir el paquete mágico.');
            setPhase('intro');
        }
    };

    const getRewardCards = () => {
        if (!result) return [];
        const cards: Array<{ type: string; name: string; qty: number; rarity: ItemRarity }> = [];
        const { summary } = result;

        if (summary.charactersReceived > 0) {
            cards.push({ type: 'personaje', name: 'Héroe Invocado', qty: summary.charactersReceived, rarity: 'epic' });
        }
        if (summary.itemsReceived > 0) {
            cards.push({ type: 'item', name: 'Equipamiento', qty: summary.itemsReceived, rarity: 'rare' });
        }
        if (summary.consumablesReceived > 0) {
            cards.push({ type: 'consumible', name: 'Pociones', qty: summary.consumablesReceived, rarity: 'uncommon' });
        }
        if (summary.valReceived > 0) {
            cards.push({ type: 'val', name: 'Cristales VAL', qty: summary.valReceived, rarity: 'legendary' });
        }
        if (cards.length === 0) {
            cards.push({ type: 'item', name: 'Polvo Mágico', qty: 1, rarity: 'common' });
        }
        return cards;
    };

    const getIcon = (type: string) => {
        const icons: Record<string, string> = {
            personaje: '🧙‍♂️', item: '⚔️', consumible: '🧪', val: '💎', evo: '⚡'
        };
        return icons[type] || '✨';
    };

    return (
        <div className={`package-opener-overlay phase-${phase}`}>
            {/* Background Particles */}
            <div className="particles-container">
                {[...Array(25)].map((_, i) => (
                    <div key={i} className="magical-particle" style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${3 + Math.random() * 4}s`,
                        animationDelay: `${Math.random() * 2}s`
                    }} />
                ))}
            </div>

            <div className="opener-content">

                {/* PHASE: INTRO */}
                <AnimatePresence mode="wait">
                    {phase === 'intro' && (
                        <motion.div
                            key="intro"
                            className="intro-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                        >
                            <motion.h2
                                className="opener-title"
                                initial={{ opacity: 0, y: -30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 100 }}
                            >
                                Altar de Invocación
                            </motion.h2>
                            <div className="package-box idle" ref={boxRef}>
                                <span className="box-icon">📦</span>
                                <div className="box-aura" ref={auraRef} />
                            </div>
                            <motion.p
                                className="package-name"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                {packageName}
                            </motion.p>
                            {error && <p className="opener-error">{error}</p>}
                            <motion.button
                                className="btn-invoke"
                                onClick={handleOpenClick}
                                whileHover={{ scale: 1.08, boxShadow: '0 0 40px rgba(255,215,0,0.8)' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                ABRIR PAQUETE
                            </motion.button>
                            <button className="btn-cancel" onClick={onClose}>
                                Volver al Inventario
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PHASE: SUSPENSE (GSAP-driven) */}
                {phase === 'suspense' && (
                    <div className="suspense-state">
                        <div className="package-box" ref={boxRef}>
                            <span className="box-icon">📦</span>
                            <div className="box-aura" ref={auraRef} />
                        </div>
                        <motion.p
                            className="suspense-text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            Invocando energías...
                        </motion.p>
                    </div>
                )}

                {/* PHASE: FLASH (GSAP-driven white overlay) */}
                {phase === 'flash' && (
                    <div
                        ref={overlayRef}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: '#fff',
                            zIndex: 100,
                            opacity: 0,
                            pointerEvents: 'none',
                        }}
                    />
                )}

                {/* PHASE: REVEAL (Framer Motion cards) */}
                {(phase === 'reveal' || phase === 'summary') && (
                    <motion.div className="reveal-state">
                        <motion.h2
                            className="reveal-title shimmer-text"
                            variants={titleVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            ¡Invocación Exitosa!
                        </motion.h2>

                        <div className="rewards-grid">
                            {getRewardCards().map((card, i) => (
                                <motion.div
                                    key={`${card.type}-${i}`}
                                    className={`reward-card rarity-${card.rarity}`}
                                    custom={i}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover="hover"
                                    style={{ perspective: 1000 }}
                                >
                                    <div className="reward-card-inner">
                                        <div className="reward-card-front" style={{ borderColor: RARITY_COLORS[card.rarity] }}>
                                            <div className="reward-glow" style={{ background: RARITY_COLORS[card.rarity] }} />
                                            <div className="reward-icon">{getIcon(card.type)}</div>
                                            <div className="reward-qty">x{card.qty}</div>
                                            <div className="reward-name">{card.name}</div>
                                            <div className="reward-rarity" style={{ color: RARITY_COLORS[card.rarity] }}>
                                                {card.rarity.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            className="reveal-actions"
                            variants={buttonVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.button
                                className="btn-continue"
                                onClick={() => { setPhase('summary'); onClose(); }}
                                whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(255,215,0,0.5)' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Aceptar Recompensas
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default PackageOpener;
