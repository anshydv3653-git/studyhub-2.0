'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6 },
    },
  };

  const features = [
    {
      number: '01',
      title: 'Mathematics',
      description: 'Real Numbers, Trigonometry proofs, Surface Areas & Statistics cheat sheets.',
      icon: '📐',
      color: 'from-red-500/40 to-pink-500/20',
      borderColor: 'border-red-500/30',
      hoverColor: 'hover:border-red-500/60',
    },
    {
      number: '02',
      title: 'Science',
      description: 'Light reflection/refraction ray diagrams, Magnetic Effects, Chemistry reactions.',
      icon: '🔬',
      color: 'from-cyan-500/40 to-blue-500/20',
      borderColor: 'border-cyan-500/30',
      hoverColor: 'hover:border-cyan-500/60',
    },
    {
      number: '03',
      title: 'Question Banks',
      description: '10-year topic-wise solved CBSE board questions with step-marking schemes.',
      icon: '📚',
      color: 'from-emerald-500/40 to-green-500/20',
      borderColor: 'border-emerald-500/30',
      hoverColor: 'hover:border-emerald-500/60',
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black pt-20">
      {/* Animated Background Orbs */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-600/30 to-pink-600/20 rounded-full blur-3xl"
        animate={{
          y: [0, 50, 0],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-600/30 to-cyan-600/20 rounded-full blur-3xl"
        animate={{
          y: [0, -50, 0],
          x: [0, -30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,white,transparent)]" />

      {/* Main Content */}
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div
          className="mb-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm hover:border-purple-400/50 transition-colors cursor-pointer"
          variants={badgeVariants}
          whileHover={{ scale: 1.05 }}
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-sm font-semibold text-purple-200">
            Class 10 CBSE 2026–2027 Live
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.div className="space-y-6 mb-12" variants={itemVariants}>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Your Complete Hub for
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg text-5xl sm:text-6xl lg:text-7xl">
              Board Prep.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
            Curated high-yield formulas, NCERT breakdown, and solved previous years' question sets structured to maximize your exam score.
          </p>
        </motion.div>

        {/* Highlight Stats */}
        <motion.div
          className="mb-12 flex flex-col sm:flex-row gap-6 items-center justify-center text-sm"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <span className="text-gray-300">100% FREE NOTES & SOLUTIONS</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-gradient-to-b from-transparent via-purple-500 to-transparent" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span className="text-gray-300">AI-POWERED STUDY TUTOR</span>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="mb-20 flex flex-col sm:flex-row gap-4 items-center justify-center"
          variants={itemVariants}
        >
          {/* Primary Button */}
          <motion.button
            className="relative px-8 py-4 rounded-lg font-semibold text-black bg-gradient-to-r from-purple-400 to-pink-400 overflow-hidden group whitespace-nowrap"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10" />

            <div className="relative flex items-center gap-2 justify-center">
              <span>Browse Notes</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* Secondary Button */}
          <motion.button
            className="relative px-8 py-4 rounded-lg font-semibold text-white border border-cyan-400/50 bg-cyan-950/30 backdrop-blur-sm hover:bg-cyan-900/50 group whitespace-nowrap"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Subtle Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10" />
            <span>Question Bank</span>
          </motion.button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          variants={containerVariants}
        >
          {features.map((card, index) => (
            <motion.div
              key={index}
              className={`group relative p-8 rounded-2xl border ${card.borderColor} ${card.hoverColor} bg-gradient-to-br ${card.color} backdrop-blur-sm transition-all duration-300 overflow-hidden cursor-pointer`}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              {/* Hover Glow Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10`} />

              <div className="relative space-y-4">
                <div className="flex items-start justify-between">
                  <div className="text-4xl">{card.icon}</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent opacity-50">
                    {card.number}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white mb-2 text-left">{card.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed text-left">{card.description}</p>
                </div>
              </div>

              {/* Bottom gradient line */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Floating Particles */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-2 h-2 bg-purple-400 rounded-full opacity-60"
        animate={{
          y: [0, 40, 0],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      />

      <motion.div
        className="absolute top-1/2 right-1/4 w-3 h-3 bg-cyan-400 rounded-full opacity-60"
        animate={{
          y: [0, -40, 0],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          delay: 1,
        }}
      />

      <motion.div
        className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-pink-400 rounded-full opacity-50"
        animate={{
          y: [0, 30, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          delay: 2,
        }}
      />
    </div>
  );
}
