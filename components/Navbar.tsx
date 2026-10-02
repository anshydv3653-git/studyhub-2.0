'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Navbar() {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg px-3 py-1.5 text-sm font-extrabold shadow-lg">
            SH
          </div>
          <span>StudyHub <span className="text-purple-400 text-sm font-semibold">2.0</span></span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link href="#materials" className="text-gray-400 hover:text-white transition">
            Notes
          </Link>
          <Link href="#pyqs" className="text-gray-400 hover:text-white transition">
            Question Banks
          </Link>
          <Link href="#syllabus" className="text-gray-400 hover:text-white transition">
            Syllabus
          </Link>
        </nav>

        {/* CTA Button */}
        <motion.button
          className="relative px-5 py-2 rounded-full font-semibold text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition group overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-lg opacity-0 group-hover:opacity-40 transition -z-10" />
          Start Now
        </motion.button>
      </div>
    </motion.header>
  );
}
