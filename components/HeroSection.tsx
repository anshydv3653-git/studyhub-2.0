'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Dark Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-black pointer-events-none" />
      
      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-purple-600/30 to-pink-600/20 rounded-full blur-3xl"
        animate={{
          y: [0, 40, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-blue-600/30 to-cyan-600/20 rounded-full blur-3xl"
        animate={{
          y: [0, -40, 0],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Grid Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,white,transparent)]" />

      {/* Main Content */}
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 flex flex-col items-center justify-center min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div
          className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-sm hover:border-purple-400/50 transition-colors"
          variants={badgeVariants}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-purple-200">
            Class 10 CBSE 2026–2027 Live
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.div className="text-center space-y-6" variants={itemVariants}>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              Your Complete Hub for
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
              Board Prep.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Curated high-yield formulas, NCERT breakdown, and solved previous years' questions structured to maximize your exam score.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="mt-12 flex flex-col sm:flex-row gap-4 items-center justify-center"
          variants={itemVariants}
        >
          {/* Primary Button with Glow */}
          <motion.button
            className="relative px-8 py-4 rounded-lg font-semibold text-black bg-gradient-to-r from-purple-400 to-pink-400 overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10" />

            <div className="relative flex items-center gap-2">
              <span>Browse Notes</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* Secondary Button with Glow */}
          <motion.button
            className="relative px-8 py-4 rounded-lg font-semibold text-white border border-cyan-400/50 bg-cyan-950/30 backdrop-blur-sm hover:bg-cyan-900/50 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Subtle Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10" />

            <span>Question Bank</span>
          </motion.button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
          variants={containerVariants}
        >
          {[
            {
              number: '01',
              title: 'Mathematics',
              description: 'Real Numbers, Trigonometry proofs, Surface Areas & Statistics.',
              color: 'from-red-500/40 to-pink-500/20',
              borderColor: 'border-red-500/30',
            },
            {
              number: '02',
              title: 'Science',
              description: 'Light reflection/refraction, Magnetic Effects, Chemistry reactions.',
              color: 'from-cyan-500/40 to-blue-500/20',
              borderColor: 'border-cyan-500/30',
            },
            {
              number: '03',
              title: 'Question Banks',
              description: '10-year topic-wise solved CBSE board questions with marking.',
              color: 'from-emerald-500/40 to-green-500/20',
              borderColor: 'border-emerald-500/30',
            },
          ].map((card, index) => (
            <motion.div
              key={index}
              className={`group relative p-6 rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.color} backdrop-blur-sm hover:border-opacity-100 transition-all duration-300`}
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              {/* Hover Glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300 -z-10`} />

              <div className="relative">
                <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {card.number}
                </div>
                <h3 className="font-bold text-xl text-white mb-2">{card.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-1/4 left-5 w-2 h-2 bg-purple-400 rounded-full opacity-60"
        animate={{
          y: [0, 30, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
      />

      <motion.div
        className="absolute bottom-1/3 right-10 w-3 h-3 bg-cyan-400 rounded-full opacity-60"
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          delay: 1,
        }}
      />
    </div>
  );
}
