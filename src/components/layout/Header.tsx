"use client";
// src/components/layout/Header.tsx
// Original header + notification bell link + push teardown on logout

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "../ui/Button";
import { Bell, Wallet, LogOut, ChevronDown, Menu, X, ShoppingBag, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationService from "@/services/notification.service";

const Header = () => {
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const doLogout = async () => {
    if (user?.id) await NotificationService.teardown(user.id).catch(console.warn);
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 active:scale-95 transition-transform z-50">
          <div className="relative w-9 h-9">
            <Image src="/logo.png" alt="Ahia" fill className="object-contain" priority />
          </div>
          <span className="font-fredoka font-bold text-2xl tracking-tight text-ahia-sunset">ahia</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {!user ? (
            <div className="flex items-center gap-6">
              <Link href="/how-it-works" className="text-sm font-fredoka font-medium text-gray-500 hover:text-ahia-sunset transition-colors">Safety-Lock</Link>
              <Link href="/campuses" className="text-sm font-fredoka font-medium text-gray-500 hover:text-ahia-sunset transition-colors">Campuses</Link>
              <div className="flex items-center gap-3 border-l pl-6 border-gray-100">
                <Link href="/signin"><Button variant="ghost" className="font-fredoka">Sign In</Button></Link>
                <Link href="/signup"><Button variant="default" className="font-fredoka px-6 bg-ahia-sunset text-white hover:opacity-90">Join</Button></Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/user/wallet">
                <motion.div whileHover={{ scale: 1.05 }} className="bg-ahia-sunset text-white flex items-center gap-2 px-4 py-2 rounded-full shadow-md">
                  <Wallet size={16} />
                  <span className="text-xs font-fredoka font-bold">Wallet</span>
                </motion.div>
              </Link>

              {/* Notification bell → /user/notifications */}
              <Link href="/user/notifications" className="p-2 text-gray-400 hover:text-ahia-sunset relative">
                <Bell size={22} />
              </Link>

              <div className="group relative cursor-pointer flex items-center gap-2 ml-2">
                <div className="w-10 h-10 rounded-full border-2 border-ahia-sunset/20 p-0.5 group-hover:border-ahia-sunset">
                  <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="User" className="w-full h-full rounded-full object-cover" />
                </div>
                <ChevronDown size={14} className="text-gray-400" />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0 overflow-hidden">
                  <Link href="/user/dashboard" className="block px-4 py-3 text-sm font-fredoka text-gray-600 hover:bg-gray-50">Dashboard</Link>
                  <Link href="/user/orders" className="block px-4 py-3 text-sm font-fredoka text-gray-600 hover:bg-gray-50">My Orders</Link>
                  <Link href="/user/chat" className="block px-4 py-3 text-sm font-fredoka text-gray-600 hover:bg-gray-50">Messages</Link>
                  <Link href="/user/settings" className="block px-4 py-3 text-sm font-fredoka text-gray-600 hover:bg-gray-50">Settings</Link>
                  <button onClick={doLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-fredoka text-ahia-red hover:bg-red-50 border-t border-gray-50">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Mobile toggle */}
        <div className="flex md:hidden items-center gap-4">
          {user && <Link href="/user/wallet" className="p-2 bg-ahia-sunset/10 rounded-full text-ahia-sunset"><Wallet size={20} /></Link>}
          <button onClick={toggleMenu} className="p-2 text-gray-700 z-50">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-40 bg-white flex flex-col p-6 pt-24 md:hidden">
            <div className="flex flex-col gap-6">
              {!user ? (
                <>
                  <Link onClick={toggleMenu} href="/how-it-works" className="text-2xl font-fredoka font-bold text-gray-800 flex items-center gap-3"><ShieldCheck className="text-ahia-sunset" /> How it Works</Link>
                  <Link onClick={toggleMenu} href="/campuses" className="text-2xl font-fredoka font-bold text-gray-800 flex items-center gap-3"><ShoppingBag className="text-ahia-sunset" /> Marketplaces</Link>
                  <hr className="border-gray-100" />
                  <Link onClick={toggleMenu} href="/signin"><Button variant="ghost" className="w-full text-xl font-fredoka py-4">Sign In</Button></Link>
                  <Link onClick={toggleMenu} href="/signup"><Button variant="default" className="w-full text-xl font-fredoka py-4 bg-ahia-sunset text-white hover:opacity-90">Join Ahia</Button></Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="Profile" className="w-16 h-16 rounded-full border-2 border-ahia-sunset" />
                    <div>
                      <p className="text-xl font-fredoka font-bold">{user.name}</p>
                      <p className="text-ahia-sunset font-bold text-sm uppercase">{user.campus}</p>
                    </div>
                  </div>
                  <Link onClick={toggleMenu} href="/user/dashboard" className="text-xl font-fredoka font-bold py-2">My Dashboard</Link>
                  <Link onClick={toggleMenu} href="/user/orders" className="text-xl font-fredoka font-bold py-2">My Orders</Link>
                  <Link onClick={toggleMenu} href="/user/chat" className="text-xl font-fredoka font-bold py-2">Messages</Link>
                  <Link onClick={toggleMenu} href="/user/wallet" className="text-xl font-fredoka font-bold py-2">My Wallet</Link>
                  <Link onClick={toggleMenu} href="/user/notifications" className="text-xl font-fredoka font-bold py-2">Notifications</Link>
                  <Link onClick={toggleMenu} href="/user/settings" className="text-xl font-fredoka font-bold py-2">Settings</Link>
                  <button onClick={() => { doLogout(); toggleMenu(); }} className="text-xl font-fredoka font-bold py-4 text-ahia-red text-left border-t border-gray-100 mt-4 flex items-center gap-2">
                    <LogOut /> Sign Out
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
