"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ShieldCheck, Zap, Globe } from "lucide-react";

export default function SignIn() {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left Side: Brand Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex relative bg-ahia-text overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 space-y-8"
        >
          <div className="w-20 h-20 bg-ahia-grad rounded-2xl rotate-12 flex items-center justify-center shadow-2xl">
            <span className="text-white text-4xl font-bold italic">A</span>
          </div>
          <h1 className="text-5xl font-heading font-bold text-white leading-tight">
            The safest way to <br />
            <span className="text-ahia-sunset">trade on campus.</span>
          </h1>

          <div className="space-y-6">
            <FeatureItem
              icon={<ShieldCheck className="text-ahia-success" />}
              text="Safety-Lock Escrow Protection"
            />
            <FeatureItem
              icon={<Zap className="text-ahia-gold" />}
              text="Instant RLUSD Settlements"
            />
            <FeatureItem
              icon={<Globe className="text-ahia-trust" />}
              text="Multi-Campus Verified Network"
            />
          </div>
        </motion.div>
        {/* Animated Background Blur */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-ahia-sunset/20 blur-[120px] rounded-full" />
      </div>

      {/* Right Side: Sign In Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-gray-50/50">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-2">
            <motion.div variants={itemVariants}>
              <Link
                href="/"
                className="lg:hidden inline-block text-3xl font-heading font-bold text-ahia-sunset mb-4"
              >
                ahia
              </Link>
              <h2 className="text-3xl font-heading font-bold tracking-tight text-ahia-text">
                Sign In
              </h2>
              <p className="text-gray-500">
                Enter your campus credentials to continue.
              </p>
            </motion.div>
          </div>

          <motion.form
            variants={itemVariants}
            className="space-y-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                University Email
              </label>
              <input
                type="email"
                placeholder="student@uniben.edu"
                className="w-full px-5 py-4 rounded-ahia border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-ahia-sunset/10 focus:border-ahia-sunset outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-[10px] font-bold text-ahia-sunset uppercase hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-ahia border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-ahia-sunset/10 focus:border-ahia-sunset outline-none transition-all placeholder:text-gray-300"
              />
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="primary"
                className="w-full py-4 text-lg shadow-xl shadow-ahia-sunset/20"
              >
                Access Marketplace
              </Button>
            </motion.div>
          </motion.form>

          <motion.div variants={itemVariants} className="text-center pt-6">
            <p className="text-sm text-gray-500">
              New to Ahia?{" "}
              <Link
                href="/signup"
                className="text-ahia-sunset font-bold hover:text-ahia-red transition-colors"
              >
                Create student account
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-4 text-white/80">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center backdrop-blur-sm border border-white/10">
        {icon}
      </div>
      <span className="font-medium">{text}</span>
    </div>
  );
}
