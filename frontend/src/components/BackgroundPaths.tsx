import React from 'react';
import { motion } from "framer-motion";

const IMAGE_URL = "https://chatgpt.com/backend-api/estuary/public_content/enc/eyJpZCI6Im1fNmE1M2QxOTg3ZjIwODE5MWI4ZGFlMWQxMDU5ZTkwYzc6ZmlsZV8wMDAwMDAwMDEyY2M3MjA3ODJkZDUzNzkzMTQ5Mjg2YSIsImdpem1vX2lkIjpudWxsLCJ0cyI6IjIwNjQ2IiwicCI6InB5aSIsImNpZCI6IjEiLCJzaWciOiI1NDNjMDg5YjJlNjZlY2Q2ZmYxMjc5NDZmZGU5ZmI1MGYxMjcxODk1ZTNjYjcwMWQ1Y2FkNzAxZTNlMWUzZjAwIiwidiI6IjAiLCJjcyI6bnVsbCwiY2RuIjpudWxsLCJmbiI6bnVsbCwiY2QiOm51bGwsImNwIjpudWxsLCJtYSI6bnVsbH0=";

function FloatingLogo() {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.15 // Subtle background opacity
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                    opacity: 1, 
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0]
                }}
                transition={{
                    duration: 10,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut"
                }}
                style={{
                    width: '600px',
                    height: '600px',
                    overflow: 'hidden', // To crop the text at the bottom
                    display: 'flex',
                    alignItems: 'flex-start', // Align image to top to crop bottom
                    justifyContent: 'center',
                    borderRadius: '50%', // Assuming a circular logo
                    boxShadow: '0 0 100px rgba(99, 102, 241, 0.3)'
                }}
            >
                <img 
                    src={IMAGE_URL} 
                    alt="CoreVision Logo" 
                    style={{
                        width: '100%',
                        height: '120%', // Make image taller to push text out of bounds
                        objectFit: 'cover',
                        objectPosition: 'center top'
                    }} 
                />
            </motion.div>
        </div>
    );
}

export function BackgroundPaths({
    title = "CoreVision Studio",
    titleBackground = false,
    backgroundStyle = "glass", 
    subtitle = "Develop, Analyze and Optimize Computer Vision Models",
    showGradientOrb = true,
}) {
    const words = title.split(" ");

    const getBackgroundStyles = () => {
        switch (backgroundStyle) {
            case "glass":
                return {
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                };
            case "gradient":
                return {
                    background: 'linear-gradient(to bottom right, rgba(255,255,255,0.1), transparent)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                };
            case "solid":
                return {
                    background: 'rgba(10, 15, 30, 0.9)',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                };
            case "glow":
                return {
                    background: 'rgba(255, 255, 255, 0.02)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 0 40px rgba(255, 255, 255, 0.1)'
                };
            default:
                return {};
        }
    };

    return (
        <div style={{
            position: 'relative',
            minHeight: '400px', // Adjusted to not take full screen if used as hero
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            // Removed solid backgrounds to keep project's NeuralBackground visible
            background: 'transparent' 
        }}>
            {/* Animated gradient orb (kept subtle to match theme) */}
            {showGradientOrb && (
                <motion.div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '600px',
                        height: '600px',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 50%, transparent 70%)',
                        filter: 'blur(40px)',
                        zIndex: 0
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                    }}
                />
            )}

            <FloatingLogo />

            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 20px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                >
                    <motion.div
                        style={{
                            display: 'inline-block',
                            position: 'relative',
                            padding: titleBackground ? '3rem 4rem' : '0',
                            borderRadius: '1.5rem',
                            ...(titleBackground ? getBackgroundStyles() : {})
                        }}
                        whileHover={titleBackground ? { scale: 1.02 } : {}}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {/* Main title */}
                        <h1 style={{ 
                            fontSize: 'clamp(3rem, 8vw, 6rem)', 
                            fontWeight: 'bold', 
                            letterSpacing: '-0.05em',
                            margin: 0,
                            lineHeight: 1.1
                        }}>
                            {words.map((word, wordIndex) => (
                                <span key={wordIndex} style={{ display: 'inline-block', marginRight: '1rem' }}>
                                    {word.split("").map((letter, letterIndex) => (
                                        <motion.span
                                            key={`${wordIndex}-${letterIndex}`}
                                            initial={{ y: 100, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{
                                                delay: wordIndex * 0.1 + letterIndex * 0.03,
                                                type: "spring",
                                                stiffness: 150,
                                                damping: 25,
                                            }}
                                            style={{
                                                display: 'inline-block',
                                                color: 'transparent',
                                                backgroundImage: 'linear-gradient(to bottom right, #ffffff, #a3a3a3, #737373)',
                                                WebkitBackgroundClip: 'text',
                                                backgroundClip: 'text',
                                                filter: 'drop-shadow(0 20px 13px rgba(0,0,0,0.5))'
                                            }}
                                        >
                                            {letter}
                                        </motion.span>
                                    ))}
                                </span>
                            ))}
                        </h1>

                        {/* Subtitle */}
                        {subtitle && (
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.8 }}
                                style={{
                                    marginTop: '1.5rem',
                                    fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 300
                                }}
                            >
                                {subtitle}
                            </motion.p>
                        )}

                        {/* Animated underline */}
                        <motion.div
                            style={{
                                marginTop: '2rem',
                                marginLeft: 'auto',
                                marginRight: 'auto',
                                height: '4px',
                                background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                        />
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
