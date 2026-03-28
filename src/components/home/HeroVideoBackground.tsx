import React from 'react';
import { motion } from 'framer-motion';

interface HeroVideoBackgroundProps {
  videoSrc: string;
  overlayOpacity?: number;
  blurAmount?: string;
}

export const HeroVideoBackground: React.FC<HeroVideoBackgroundProps> = ({
  videoSrc,
  overlayOpacity = 0.65,
  blurAmount = '2px'
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute inset-0 z-0 overflow-hidden"
    >
      {/* Video Element */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover"
        poster="/images/%ED%99%A9%EA%B8%88%EC%86%8C%EB%82%98%EB%AC%B4.jpg" // Fallback poster if available
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay Filter */}
      <div 
        className="absolute inset-0 bg-zinc-950" 
        style={{ opacity: overlayOpacity }}
      />

      {/* Backdrop Blur Layer */}
      <div 
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{ backdropFilter: `blur(${blurAmount})` }}
      />

      {/* Vignette / Gradient Overlays for smooth blending */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-zinc-950" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
    </motion.div>
  );
};
