/**
 * @module LandingPage
 * @description Immersive hero landing with 3D parallax depth effect
 * Inspired by WebDesign Master parallax tutorial
 * Uses CSS 3D perspective + mouse-driven transforms
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, ArrowRight, Users, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import parallaxBg from '@/assets/parallax-bg.jpg';
import parallaxMountains from '@/assets/parallax-mountains.png';
import parallaxTrees from '@/assets/parallax-trees.png';

const LandingPage = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!sceneRef.current) return;
    const { clientX, clientY, innerWidth, innerHeight } = { ...e, innerWidth: window.innerWidth, innerHeight: window.innerHeight };
    const x = (clientX - innerWidth / 2) / innerWidth;
    const y = (clientY - innerHeight / 2) / innerHeight;
    sceneRef.current.style.setProperty('--mouse-x', String(x));
    sceneRef.current.style.setProperty('--mouse-y', String(y));
  }, []);

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleMouseMove, handleScroll]);

  const features = [
    { icon: CalendarDays, title: 'Smart Scheduling', desc: 'Create and manage events with an intuitive calendar interface' },
    { icon: Users, title: 'Community Driven', desc: 'Join events, connect with participants, and grow your network' },
    { icon: Zap, title: 'Real-time Updates', desc: 'Instant notifications via WebSocket when events change' },
    { icon: Globe, title: 'Public & Private', desc: 'Host public events or create private gatherings for your team' },
  ];

  return (
    <div className="relative overflow-x-hidden bg-[#0a0f1a]">
      {/* Hero Section with 3D Parallax */}
      <section
        ref={sceneRef}
        className="parallax-scene relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}
      >
        {/* Background layer — farthest */}
        <div
          className="parallax-layer absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${parallaxBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateZ(-300px) scale(1.3) translateY(${scrollY * 0.3}px)`,
          }}
        />

        {/* Mountains — mid layer */}
        <div
          className="parallax-layer absolute inset-0 z-10"
          style={{
            backgroundImage: `url(${parallaxMountains})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            transform: `translateZ(-150px) scale(1.15) translateY(${scrollY * 0.15}px)`,
          }}
        />

        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-[#0a0f1a]/40 via-transparent to-[#0a0f1a]" />

        {/* Trees — foreground layer */}
        <div
          className="parallax-layer absolute inset-0 z-30 pointer-events-none"
          style={{
            backgroundImage: `url(${parallaxTrees})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'no-repeat',
            transform: `translateZ(0px) translateY(${scrollY * -0.1}px)`,
            mixBlendMode: 'multiply',
            opacity: 0.3,
          }}
        />

        {/* Content — topmost */}
        <div className="relative z-40 mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
              <CalendarDays className="h-8 w-8 text-white" />
            </div>

            <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl lg:text-8xl"
              style={{ fontFamily: 'var(--font-heading)', textShadow: '0 2px 40px rgba(0,0,0,0.5)' }}
            >
              EventHub
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80 md:text-xl"
              style={{ textShadow: '0 1px 20px rgba(0,0,0,0.4)' }}
            >
              Discover, create, and join unforgettable events. Your next great experience is just a click away.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/events">
                <Button size="lg" className="gradient-primary gap-2 px-8 py-6 text-base shadow-elevated hover:scale-105 transition-transform">
                  Explore Events <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2 px-8 py-6 text-base border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white backdrop-blur-sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="h-10 w-6 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
              <div className="h-2 w-1 rounded-full bg-white/60" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-50 bg-[#0a0f1a] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
              Everything you need to manage events
            </h2>
            <p className="mx-auto max-w-xl text-white/60">
              A full-featured platform built with modern technologies for seamless event management
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                  <feat.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feat.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-50 bg-[#0a0f1a] px-6 pb-24 pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl rounded-3xl gradient-primary p-12 text-center shadow-elevated"
        >
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
            Ready to get started?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-white/80">
            Join thousands of organizers and participants. Create your first event today.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90 gap-2 px-8 py-6 text-base font-semibold">
                Sign Up Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white px-8 py-6 text-base">
                Browse Events
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-50 border-t border-white/10 bg-[#0a0f1a] px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">EventHub</span>
          </div>
          <p className="text-xs text-white/40">© 2026 EventHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
