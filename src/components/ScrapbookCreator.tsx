import React, { useState, useEffect, useMemo } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Layers, 
  RotateCw, 
  Type, 
  Image as ImageIcon, 
  Download, 
  Layout, 
  Check, 
  HelpCircle,
  Pin,
  Heart
} from "lucide-react";

import { useSyncedState } from '../lib/useSyncedState';

// Types for elements on the scrapbook board
export interface ScrapElement {
  id: string;
  type: 'doodle' | 'text' | 'banner' | 'arrow' | 'speech_bubble' | 'tape' | 'polaroid';
  doodleId?: string;
  content?: string;
  x: number; // grid percentage 0-100
  y: number; // grid percentage 0-100
  scale: number;
  rotation: number;
  color?: string;
  isLocked?: boolean;
}

export interface Scrapbook {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  paperStyle: 'lined' | 'grid' | 'dotted' | 'blank';
  elements: ScrapElement[];
}

interface ScrapbookCreatorProps {
  currentDate: string;
  onClose?: () => void;
  onSaveToJournal?: (summaryMarkdown: string) => void;
}

// 1. EMBEDDED HAND-DRAWN BLACK-MARKER SVG STICKERS DEFINITION
const DOODLE_STAMP_LIBRARY = {
  canned_tomatoes: {
    name: "Cà chua đóng hộp (Divella)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 100 110" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Can outline */}
        <path d="M20 30 C 20 20, 80 20, 80 30 L 80 90 C 80 100, 20 100, 20 90 Z" />
        <path d="M20 30 C 20 40, 80 40, 80 30" />
        {/* Can top lid circles */}
        <ellipse cx="50" cy="30" rx="30" ry="8" />
        <ellipse cx="50" cy="30" rx="22" ry="5" />
        {/* Pull tab */}
        <path d="M48 28 L 52 26 L 55 31" />
        <circle cx="55" cy="31" r="2" />
        {/* Label borders */}
        <path d="M20 45 C 20 52, 80 52, 80 45" />
        <path d="M20 80 C 20 87, 80 87, 80 80" />
        {/* Label details */}
        <path d="M30 55 H 70" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Brand name */}
        <text x="50" y="66" textAnchor="middle" fontSize="10" fontWeight="900" fill={color} stroke="none" className="font-mono tracking-tight">DIVELLA</text>
        <text x="50" y="74" textAnchor="middle" fontSize="6" fontWeight="bold" fill={color} stroke="none" className="font-sans uppercase">Pomodori</text>
        {/* Little decorative stars inside */}
        <path d="M 32 58 L 34 60 L 32 62" strokeWidth="1" />
        <path d="M 68 58 L 70 60 L 68 62" strokeWidth="1" />
        <ellipse cx="50" cy="90" rx="30" ry="8" />
      </svg>
    )
  },
  tomato_puree: {
    name: "Chai Sốt Cà chua",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 90 120" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Jar bottle outlines */}
        <path d="M35 20 Q 35 15, 45 15 Q 55 15, 55 20 L 55 28 Q 65 35, 65 50 L 65 100 Q 65 108, 55 110 L 35 110 Q 25 108, 25 100 L 25 50 Q 25 35, 35 28 Z" />
        {/* Cap lid details */}
        <path d="M33 20 H 57 L 55 26 H 35 Z" fill={color === "#1A1A1A" ? "#f5f5f5" : "transparent"} />
        <path d="M35 15 H 55" strokeWidth="1.5" />
        {/* Label area */}
        <path d="M26 55 Q 45 59, 64 55" />
        <path d="M26 85 Q 45 89, 64 85" strokeWidth="2" />
        {/* Label text */}
        <text x="45" y="72" textAnchor="middle" fontSize="9" fontWeight="bold" fill={color} stroke="none" className="font-sans italic uppercase">TOMATO</text>
        <text x="45" y="80" textAnchor="middle" fontSize="7" fill={color} stroke="none" className="font-hand">purée</text>
        {/* Content reflection curves */}
        <path d="M30 95 C 32 102, 58 102, 60 95" strokeWidth="1" />
        <path d="M29 38 Q 31 34, 38 31" strokeWidth="1.5" />
      </svg>
    )
  },
  white_onion: {
    name: "Củ Hành Tây (Onion)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Onion onion contours */}
        <path d="M50 15 C30 15, 20 45, 20 65 C20 82, 35 90, 50 90 C65 90, 80 82, 80 65 C80 45, 70 15, 50 15 Z" />
        {/* Onion tip top sprouting */}
        <path d="M50 15 C 47 10, 48 4, 45 3 M 50 15 C 53 10, 52 4, 55 2 M 50 15 L 50 6" />
        {/* Vertical stripes / layers inside */}
        <path d="M40 18 C 30 35, 30 70, 42 88" strokeWidth="1.5" strokeDasharray="1 1" />
        <path d="M60 18 C 70 35, 70 70, 58 88" strokeWidth="1.5" strokeDasharray="1 1" />
        <path d="M48 16 C 36 32, 34 72, 50 90" strokeWidth="1.5" />
        <path d="M52 16 C 64 32, 66 72, 50 90" strokeWidth="1.5" />
        {/* Hairy root lines */}
        <path d="M45 90 L 42 96" />
        <path d="M48 90 L 47 98" />
        <path d="M52 90 L 53 99" />
        <path d="M55 90 L 58 97" />
        <path d="M50 90 L 51 95" />
      </svg>
    )
  },
  bay_leaf: {
    name: "Lá nguyệt quế (Bay Leaf)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 100 80" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Leaf outline centered diagonally */}
        <path d="M15 65 Q 40 45, 85 15 Q 65 50, 15 65 Z" />
        {/* Midrib stem */}
        <path d="M10 70 L 80 20" strokeWidth="2" />
        {/* Secondary diagonal veins */}
        <path d="M35 50 Q 42 45, 52 47" strokeWidth="1.5" />
        <path d="M48 41 Q 56 36, 68 39" strokeWidth="1.5" />
        <path d="M28 58 Q 33 55, 38 57" strokeWidth="1.5" />
        <path d="M40 45 Q 35 38, 25 35 M 55 35 Q 48 28, 38 25 M 68 26 Q 60 20, 52 18" strokeWidth="1.5" />
      </svg>
    )
  },
  butter: {
    name: "Khối Bơ (Butter Block)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 100 90" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Main large slab 3D isometric */}
        {/* Top face */}
        <path d="M20 40 L 50 25 L 85 35 L 55 52 Z" />
        {/* Left vertical wrapper */}
        <path d="M20 40 L 20 65 L 55 77 L 55 52 Z" />
        {/* Right vertical wrapper */}
        <path d="M55 52 L 55 77 L 85 60 L 85 35 Z" />
        {/* Small slab of butter on top */}
        <path d="M38 31 L 52 24 L 68 28 L 54 35 Z" fill={color === "#1A1A1A" ? "#fafafa" : "transparent"} />
        <path d="M38 31 L 38 38 L 54 42 L 54 35" />
        <path d="M54 35 L 54 42 L 68 35 L 68 28" />
        {/* Spreading line accents */}
        <path d="M15 52 C 22 49, 11 44, 18 42" strokeWidth="1" />
        <path d="M50 64 C 58 60, 48 57, 56 55" strokeWidth="1" />
      </svg>
    )
  },
  ground_meat: {
    name: "Tô thịt băm/xay (Ground Meat)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 110 90" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Bowl Outline */}
        <path d="M20 45 Q 15 45, 20 50 C 25 78, 85 78, 90 50 Q 95 45, 90 45 Z" />
        {/* Bowl food line */}
        <path d="M20 45 C 30 46, 80 46, 90 45" strokeWidth="2.5" />
        <path d="M35 73 H 75" strokeWidth="2" />
        {/* Ground meat crumb pile (represented by sketchy organic squiggles/dots) */}
        <path d="M18 45 C 16 35, 25 32, 32 36 C 35 28, 48 22, 55 28 C 58 20, 72 20, 78 27 C 82 25, 92 28, 91 38 C 94 42, 88 48, 90 45" />
        {/* Meat details - texture crumbles */}
        <circle cx="28" cy="38" r="1.5" fill={color} stroke="none" />
        <circle cx="38" cy="32" r="1.5" fill={color} stroke="none" />
        <circle cx="48" cy="27" r="1.5" fill={color} stroke="none" />
        <circle cx="62" cy="24" r="1.5" fill={color} stroke="none" />
        <circle cx="53" cy="36" r="1.5" fill={color} stroke="none" />
        <circle cx="68" cy="33" r="1.5" fill={color} stroke="none" />
        <circle cx="76" cy="26" r="1.5" fill={color} stroke="none" />
        <circle cx="83" cy="34" r="1.5" fill={color} stroke="none" />
        {/* Bowl details */}
        <path d="M24 54 Q 55 64, 86 54" strokeWidth="1" />
        <path d="M28 62 Q 55 70, 82 62" strokeWidth="1" strokeDasharray="3 3" />
      </svg>
    )
  },
  mushrooms: {
    name: "Nấm mỡ bò (Mushrooms)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 100 80" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Left standing mushroom */}
        <path d="M15 45 C 10 30, 40 30, 35 45 Z" />
        <path d="M22 45 C 22 55, 28 55, 28 45" />
        <ellipse cx="25" cy="45" rx="10" ry="3" />
        {/* Middle main mushroom cap */}
        <path d="M35 40 C 30 18, 70 18, 65 40 Z" />
        {/* Stem */}
        <path d="M45 40 C 45 58, 55 58, 55 40" fill={color === "#1A1A1A" ? "#fafafa" : "transparent"} />
        <ellipse cx="50" cy="40" rx="15" ry="4" strokeWidth="2" />
        {/* Right laying mushroom cut */}
        <path d="M68 45 C 64 36, 88 34, 84 45 Z" />
        <path d="M72 45 C 72 52, 78 52, 78 45" />
        <ellipse cx="76" cy="45" rx="8" ry="2.5" />
        {/* Organic ground speckles */}
        <path d="M10 60 Q 50 58, 90 60" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    )
  },
  bacon: {
    name: "Dải Thịt Ba Chỉ (Bacon)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 120 70" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Wavy Bacon strip boundaries */}
        <path d="M10 35 Q 22 20, 35 35 T 60 35 T 85 35 T 110 35 L 108 50 Q 96 50, 83 35 T 58 35 T 33 35 T 8 50 Z" />
        {/* Marbling fat stripes running inside */}
        <path d="M11 40 Q 22 28, 34 40 T 59 40 T 84 40 T 109 40" strokeWidth="1.5" />
        <path d="M13 45 Q 23 35, 33 45 T 58 45 T 83 45 T 107 45" strokeWidth="1.5" />
        {/* Edge crinkles */}
        <path d="M35 35 Q 35 25, 42 27" strokeWidth="1" />
        <path d="M85 35 Q 85 25, 92 27" strokeWidth="1" />
      </svg>
    )
  },
  salt_pepper: {
    name: "Gia vị & Tiêu (Salt & Pepper)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Pepper Shaker Left */}
        <path d="M25 45 C 23 41, 37 41, 35 45 L 38 80 C 38 85, 22 85, 22 80 Z" />
        <ellipse cx="30" cy="45" rx="6" ry="2" />
        <path d="M26 45 V 41 H 34 V 45" />
        <text x="30" y="65" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color} stroke="none" className="font-sans italic">P</text>
        {/* Salt Shaker Right */}
        <path d="M65 50 C 63 46, 77 46, 75 50 L 78 85 C 78 90, 62 90, 62 85 Z" />
        <ellipse cx="70" cy="50" rx="6" ry="2" />
        <path d="M66 50 V 46 H 74 V 50" strokeWidth="2" />
        <text x="70" y="70" textAnchor="middle" fontSize="14" fontWeight="bold" fill={color} stroke="none" className="font-sans italic">S</text>
        {/* Scattered grains */}
        <circle cx="45" cy="74" r="1.2" fill={color} stroke="none" />
        <circle cx="49" cy="78" r="1.2" fill={color} stroke="none" />
        <circle cx="53" cy="82" r="1.2" fill={color} stroke="none" />
        <circle cx="42" cy="85" r="1.2" fill={color} stroke="none" />
        <circle cx="51" cy="65" r="1" fill={color} stroke="none" />
        <circle cx="56" cy="70" r="1" fill={color} stroke="none" />
      </svg>
    )
  },
  cooking_pot: {
    name: "Nồi Hầm (Cooking Pot)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 120 100" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Pot Body */}
        <path d="M25 40 L 25 82 C 25 92, 95 92, 95 82 L 95 40 Z" />
        {/* Pot lip */}
        <ellipse cx="60" cy="40" rx="35" ry="5" strokeWidth="3" />
        {/* Left ear handle */}
        <path d="M25 50 C 12 50, 12 65, 25 65" strokeWidth="2.5" />
        {/* Right ear handle */}
        <path d="M95 50 C 108 50, 108 65, 95 65" strokeWidth="2.5" />
        {/* Heat lines / burner style below */}
        <path d="M35 96 Q 40 91, 45 96 T 55 96 T 65 96 T 75 96 T 85 96" strokeWidth="1.5" />
        {/* Steam waves rising */}
        <path d="M48 28 Q 50 20, 48 11" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M60 25 Q 63 18, 60 8" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M72 28 Q 74 20, 72 11" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    )
  },
  scroll_banner: {
    name: "Dải ruy băng vintage",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 150 50" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Banner middle rectangle */}
        <path d="M30 15 L 120 15 L 120 35 L 30 35 Z" fill={color === "#1A1A1A" ? "#ffffff" : "transparent"} />
        {/* Fold back left */}
        <path d="M30 15 L 12 10 L 12 30 L 30 35" />
        <path d="M12 30 L 22 25 L 30 35" />
        {/* Fold back right */}
        <path d="M120 15 L 138 10 L 138 30 L 120 35" />
        <path d="M138 30 L 128 25 L 120 35" />
        {/* Notch details for tails */}
        <path d="M12 10 L 22 20 L 12 30" />
        <path d="M138 10 L 128 20 L 138 30" />
        {/* Tiny stitch details */}
        <path d="M35 18 H 115" strokeWidth="1" strokeDasharray="4 4" />
        <path d="M35 32 H 115" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    )
  },
  arrow: {
    name: "Mũi tên chỉ dẫn tay",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 80 40" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Curved swirly arrow */}
        <path d="M10 30 Q 30 5, 60 15" strokeDasharray="2 2" />
        <path d="M50 8 L 60 15 L 53 23" />
      </svg>
    )
  },
  speech_bubble: {
    name: "Bong bóng thoại (Speech)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 120 90" className="w-full h-full" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Bubble contour */}
        <path d="M20 15 C 10 15, 10 70, 45 70 L 40 85 L 60 70 C 110 70, 110 15, 20 15 Z" fill={color === "#1A1A1A" ? "#ffffff" : "transparent"} />
        {/* Accent lines */}
        <path d="M13 32 Q 18 30, 15 38" strokeWidth="1" />
      </svg>
    )
  },
  spoon: {
    name: "Thìa gỗ vẽ tay (Spoon)",
    svg: (color = "#1A1A1A") => (
      <svg viewBox="0 0 80 30" className="w-full h-full" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 15 C 15 8, 30 8, 30 15 C 30 22, 15 22, 15 15 Z" />
        <path d="M30 15 L 68 15" strokeWidth="3" />
        <circle cx="68" cy="15" r="2.5" fill={color} />
        <path d="M22 11 Q 26 15, 22 19" strokeWidth="1" />
      </svg>
    )
  },
  washi_tape: {
    name: "Băng dính trang trí (Washi)",
    svg: (color = "#af1e2d") => (
      <svg viewBox="0 0 80 25" className="w-full h-full" fill={`${color}1a`} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Jagged ends box tape */}
        <path d="M 5 5 L 8 10 L 4 15 L 7 20 L 75 20 L 72 15 L 76 10 L 73 5 Z" fill={`${color}22`} />
        {/* Decorative pattern stripes */}
        <path d="M 15 20 L 25 5 M 25 20 L 35 5 M 35 20 L 45 5 M 45 20 L 55 5 M 55 20 L 65 5" strokeWidth="1" opacity="0.6" />
      </svg>
    )
  },
  stars: {
    name: "Sao lấp lánh (Twinkles)",
    svg: (color = "#eab308") => (
      <svg viewBox="0 0 60 60" className="w-full h-full" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Hand drawn starry cross */}
        <path d="M 30 5 Q 30 30, 5 30 Q 30 30, 30 55 Q 30 30, 55 30 Q 30 30, 30 5" fill={`${color}33`} />
        <circle cx="15" cy="15" r="1.5" fill={color} stroke="none" />
        <circle cx="45" cy="45" r="1.5" fill={color} stroke="none" />
      </svg>
    )
  }
};

// 2. PRELOADED THEMATIC SCRAPBOOK PRESETS (including exact Ragu Bolognese)
const SCRAPBOOK_PRESETS: { [key: string]: { title: string, desc: string, elements: ScrapElement[] } } = {
  ragu_bolognese: {
    title: "Ragù alla Bolognese",
    desc: "Đúng chuẩn công thức phác thảo Ragu Bolognese vẽ tay từ ảnh mẫu của bạn!",
    elements: [
      // Banner
      { id: "e-banner", type: "banner", x: 10, y: 50, scale: 1.15, rotation: -3 },
      { id: "e-banner-txt", type: "text", x: 19, y: 53, scale: 1.1, rotation: -3, content: "* ingredients" },

      // Main header
      { id: "e-title-brand", type: "text", x: 2, y: 30, scale: 2.15, rotation: -8, content: "Ragu" },
      { id: "e-korean-subtitle-1", type: "text", x: 18, y: 28, scale: 0.9, rotation: -8, content: "라구" },
      { id: "e-korean-subtitle-2", type: "text", x: 19, y: 34, scale: 0.9, rotation: -8, content: "소스" },
      { id: "e-title-italy", type: "text", x: 4, y: 41, scale: 1.15, rotation: -6, content: "Ragù alla Bolognese" },

      // Spoons decoration
      { id: "e-spoon-1", type: "doodle", doodleId: "spoon", x: 23, y: 39, scale: 0.9, rotation: -30 },

      // Ingredients listed in row/column exactly like the Korean photo
      { id: "e-canned-tomato", type: "doodle", doodleId: "canned_tomatoes", x: 12, y: 64, scale: 1.35, rotation: 10 },
      { id: "e-canned-lbl-1", type: "text", x: 19, y: 59, scale: 0.75, rotation: -5, content: "Canned" },
      { id: "e-canned-lbl-2", type: "text", x: 19, y: 62, scale: 0.75, rotation: -5, content: "whole" },
      { id: "e-canned-lbl-3", type: "text", x: 19, y: 65, scale: 0.75, rotation: -5, content: "toma-" },
      { id: "e-canned-lbl-4", type: "text", x: 19, y: 68, scale: 0.75, rotation: -5, content: "toes (1 hộp)" },

      { id: "e-tomato-puree", type: "doodle", doodleId: "tomato_puree", x: 28, y: 55, scale: 1.35, rotation: 8 },
      { id: "e-puree-lbl-1", type: "text", x: 34, y: 52, scale: 0.75, rotation: 3, content: "tomato" },
      { id: "e-puree-lbl-2", type: "text", x: 34, y: 55, scale: 0.75, rotation: 3, content: "purée (2 muỗng)" },

      { id: "e-meat-bowl", type: "doodle", doodleId: "ground_meat", x: 16, y: 81, scale: 1.38, rotation: -4 },
      { id: "e-meat-lbl-1", type: "text", x: 26, y: 79, scale: 0.75, rotation: -2, content: "Ground" },
      { id: "e-meat-lbl-2", type: "text", x: 26, y: 82, scale: 0.75, rotation: -2, content: "beef or pork (300g)" },

      { id: "e-butter", type: "doodle", doodleId: "butter", x: 45, y: 46, scale: 1.05, rotation: 6 },
      { id: "e-butter-lbl", type: "text", x: 50, y: 49, scale: 0.8, rotation: 4, content: "Butter (30g)" },

      { id: "e-bay-leaf", type: "doodle", doodleId: "bay_leaf", x: 43, y: 52, scale: 1.05, rotation: -45 },
      { id: "e-leaf-lbl-1", type: "text", x: 48, y: 56, scale: 0.75, rotation: -5, content: "Bay" },
      { id: "e-leaf-lbl-2", type: "text", x: 49, y: 59, scale: 0.75, rotation: -5, content: "leaf (2 lá)" },

      { id: "e-onion", type: "doodle", doodleId: "white_onion", x: 45, y: 64, scale: 1.25, rotation: -3 },
      { id: "e-onion-lbl-1", type: "text", x: 41, y: 63, scale: 0.75, rotation: -6, content: "Onion" },
      { id: "e-onion-lbl-2", type: "text", x: 41, y: 66, scale: 0.75, rotation: -6, content: "(1 củ lớn)" },

      { id: "e-mushroom", type: "doodle", doodleId: "mushrooms", x: 41, y: 77, scale: 1.15, rotation: 4 },
      { id: "e-mush-lbl-1", type: "text", x: 51, y: 79, scale: 0.75, rotation: -2, content: "white" },
      { id: "e-mush-lbl-2", type: "text", x: 51, y: 82, scale: 0.75, rotation: -2, content: "mushroom (5 cái)" },

      { id: "e-bacon", type: "doodle", doodleId: "bacon", x: 38, y: 89, scale: 1.45, rotation: -12 },
      { id: "e-bacon-lbl", type: "text", x: 28, y: 89, scale: 0.8, rotation: -12, content: "Bacon" },

      { id: "e-salt", type: "doodle", doodleId: "salt_pepper", x: 58, y: 62, scale: 1.1, rotation: 5 },
      { id: "e-salt-lbl-1", type: "text", x: 60, y: 74, scale: 0.75, rotation: 10, content: "black pepper &" },
      { id: "e-salt-lbl-2", type: "text", x: 62, y: 77, scale: 0.75, rotation: 10, content: "salt (vừa đủ)" },

      { id: "e-stock-lbl-1", type: "text", x: 58, y: 53, scale: 0.75, rotation: -4, content: "Liquid chicken" },
      { id: "e-stock-lbl-2", type: "text", x: 66, y: 56, scale: 0.75, rotation: -4, content: "stock (60ml)" },

      // How to section (right column)
      { id: "e-arrow-puree", type: "doodle", doodleId: "arrow", x: 32, y: 58, scale: 0.8, rotation: 80 },
      { id: "e-arrow-bacon", type: "doodle", doodleId: "arrow", x: 31, y: 89, scale: 0.6, rotation: 40 },

      { id: "e-bubble", type: "speech_bubble", x: 33, y: 28, scale: 1.6, rotation: 5 },
      { id: "e-bubble-txt-1", type: "text", x: 36, y: 22, scale: 0.7, rotation: 4, content: "Thật ra tớ múc đại" },
      { id: "e-bubble-txt-2", type: "text", x: 36, y: 25, scale: 0.7, rotation: 4, content: "có sẵn nguyên liệu," },
      { id: "e-bubble-txt-3", type: "text", x: 36, y: 28, scale: 0.7, rotation: 4, content: "nếm vừa miệng là" },
      { id: "e-bubble-txt-4", type: "text", x: 36, y: 31, scale: 0.7, rotation: 4, content: "ngon xuất sắc!" },

      { id: "e-howto-banner", type: "text", x: 45, y: 12, scale: 1.7, rotation: -11, content: "how to?" },
      { id: "e-pot", type: "doodle", doodleId: "cooking_pot", x: 52, y: 17, scale: 1.45, rotation: 2 },

      // Steps lists directly laid out
      { id: "e-step-korean", type: "text", x: 32, y: 39, scale: 0.75, rotation: -2, content: "홀토마토, 토마토퓨레, 버터, 월계수잎..." },
      { id: "e-step-korean-2", type: "text", x: 32, y: 42, scale: 0.75, rotation: -2, content: "다진마늘, 소금, 후추" },

      { id: "e-tape-t1", type: "tape", x: 1, y: 24, scale: 1.0, rotation: -15 },
      { id: "e-stars-s1", type: "doodle", doodleId: "stars", x: 2, y: 39, scale: 0.9, rotation: 0 },
      { id: "e-stars-s2", type: "doodle", doodleId: "stars", x: 64, y: 15, scale: 0.8, rotation: 35 },
    ]
  },
  healthy_meal: {
    title: "Thực Đơn Healthy Nhật Ký",
    desc: "Bố cục dán nhãn bữa ăn cân đối đầy đủ chất xơ, vitamin và nước uống.",
    elements: [
      { id: "hm-banner", type: "banner", x: 20, y: 15, scale: 1.2, rotation: 2 },
      { id: "hm-banner-txt", type: "text", x: 26, y: 18, scale: 1.1, rotation: 2, content: "DAILY MEAL DIARY" },
      
      { id: "hm-pot", type: "doodle", doodleId: "cooking_pot", x: 15, y: 40, scale: 1.3, rotation: -2 },
      { id: "hm-pot-txt", type: "text", x: 15, y: 55, scale: 0.9, rotation: 0, content: "Súp rau củ hầm ấm bụng" },

      { id: "hm-onion", type: "doodle", doodleId: "white_onion", x: 45, y: 40, scale: 1.1, rotation: 15 },
      { id: "hm-mush", type: "doodle", doodleId: "mushrooms", x: 55, y: 40, scale: 1.0, rotation: -10 },
      { id: "hm-spices", type: "doodle", doodleId: "salt_pepper", x: 50, y: 60, scale: 1.1, rotation: 0 },
      { id: "hm-txt-low", type: "text", x: 38, y: 55, scale: 0.8, rotation: -5, content: "Gia vị tối giản, thanh đạm" },

      { id: "hm-bubble", type: "speech_bubble", x: 40, y: 15, scale: 1.2, rotation: -10 },
      { id: "hm-bubble-txt", type: "text", x: 43, y: 13, scale: 0.8, rotation: -10, content: "Hôm nay ăn nhiều rau xanh!" },

      { id: "hm-tape", type: "tape", x: 5, y: 5, scale: 1.0, rotation: 10 },
      { id: "hm-stars", type: "doodle", doodleId: "stars", x: 62, y: 18, scale: 1.0, rotation: 15 },
    ]
  },
  shopping_list: {
    title: "Đi Chợ Cuối Tuần (Doodle Market)",
    desc: "Bảng ghi chú các món gia vị, thực phẩm tươi sống cần chuẩn bị.",
    elements: [
      { id: "sl-banner", type: "banner", x: 15, y: 15, scale: 1.25, rotation: -4 },
      { id: "sl-banner-txt", type: "text", x: 25, y: 18, scale: 1.1, rotation: -4, content: "DANH SÁCH ĐI CHỢ" },

      { id: "sl-canned", type: "doodle", doodleId: "canned_tomatoes", x: 15, y: 45, scale: 1.2, rotation: 8 },
      { id: "sl-puree", type: "doodle", doodleId: "tomato_puree", x: 25, y: 42, scale: 1.2, rotation: -5 },
      { id: "sl-bottles-lbl", type: "text", x: 16, y: 60, scale: 0.85, rotation: 0, content: "Đồ khô đóng hộp trữ sắn" },

      { id: "sl-meat", type: "doodle", doodleId: "ground_meat", x: 45, y: 45, scale: 1.25, rotation: 5 },
      { id: "sl-bacon", type: "doodle", doodleId: "bacon", x: 48, y: 62, scale: 1.3, rotation: -10 },
      { id: "sl-meat-lbl", type: "text", x: 46, y: 72, scale: 0.85, rotation: 0, content: "Thịt tươi & bacon xông khói" },

      { id: "sl-tape1", type: "tape", x: 5, y: 5, scale: 0.9, rotation: -12 },
      { id: "sl-tape2", type: "tape", x: 50, y: 10, scale: 0.9, rotation: 15 },
    ]
  }
};

export function ScrapbookCreator({ currentDate, onClose, onSaveToJournal }: ScrapbookCreatorProps) {
  // Use synced state for cross-device loading
  const [scrapbooks, setScrapbooks] = useSyncedState<Scrapbook[]>("studyHub_scrapbooks_global", [
    {
      id: "scrap-ragu",
      title: "Ragu alla Bolognese (Mẫu)",
      date: currentDate,
      paperStyle: "blank",
      elements: [...SCRAPBOOK_PRESETS.ragu_bolognese.elements]
    }
  ]);

  // Migrate old localstorage items
  useEffect(() => {
    try {
      const saved = localStorage.getItem("studyHub_scrapbooks");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && scrapbooks.length === 1 && scrapbooks[0].id === 'scrap-ragu') {
          setScrapbooks(parsed);
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeScrapId, setActiveScrapId] = useState<string>("scrap-ragu");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Custom text input states
  const [inputTextVal, setInputTextVal] = useState("");
  const [inputFontSize, setInputFontSize] = useState<number>(14);

  const activeScrapbook = useMemo(() => {
    return scrapbooks.find(s => s.id === activeScrapId) || scrapbooks[0];
  }, [scrapbooks, activeScrapId]);

  // Sync to current date
  const handleCreateNewScrap = (presetKey?: string) => {
    const now = Date.now();
    let label = `Trang nháp vẽ tay #${scrapbooks.length + 1}`;
    let elementsArr: ScrapElement[] = [];
    
    if (presetKey && SCRAPBOOK_PRESETS[presetKey]) {
      label = SCRAPBOOK_PRESETS[presetKey].title;
      elementsArr = [...SCRAPBOOK_PRESETS[presetKey].elements.map(el => ({ ...el, id: `${el.id}-${now}` }))];
    } else {
      // blank paper, default a small header
      elementsArr = [
        { id: `text-h-${now}`, type: "text", x: 10, y: 15, scale: 1.5, rotation: -3, content: "Trang nhật ký mới" }
      ];
    }

    const newScrap: Scrapbook = {
      id: `scrap-${now}`,
      title: label,
      date: currentDate,
      paperStyle: "blank",
      elements: elementsArr
    };

    setScrapbooks([newScrap, ...scrapbooks]);
    setActiveScrapId(newScrap.id);
    setSelectedElementId(null);
    setIsAddingNew(false);
  };

  const handleUpdateElement = (id: string, updates: Partial<ScrapElement>) => {
    setScrapbooks(prev => prev.map(sb => {
      if (sb.id !== activeScrapbook.id) return sb;
      return {
        ...sb,
        elements: sb.elements.map(el => el.id === id ? { ...el, ...updates } : el)
      };
    }));
  };

  const handleDeleteElement = (id: string) => {
    setScrapbooks(prev => prev.map(sb => {
      if (sb.id !== activeScrapbook.id) return sb;
      return {
        ...sb,
        elements: sb.elements.filter(el => el.id !== id)
      };
    }));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Drag element helper (simulating simple interactive offsets with controls or mouse movement)
  const moveElement = (direction: 'up' | 'down' | 'left' | 'right', amount = 3) => {
    if (!selectedElementId) return;
    const el = activeScrapbook.elements.find(e => e.id === selectedElementId);
    if (!el) return;

    let newX = el.x;
    let newY = el.y;

    if (direction === 'left') newX = Math.max(0, el.x - amount);
    if (direction === 'right') newX = Math.min(100, el.x + amount);
    if (direction === 'up') newY = Math.max(0, el.y - amount);
    if (direction === 'down') newY = Math.min(100, el.y + amount);

    handleUpdateElement(selectedElementId, { x: newX, y: newY });
  };

  // Quick edit of text
  const handleEditTextElement = (el: ScrapElement) => {
    if (el.type !== 'text') return;
    const newContent = prompt("Nhập nội dung chữ viết tay mới:", el.content || "");
    if (newContent !== null) {
      handleUpdateElement(el.id, { content: newContent });
    }
  };

  // Adding basic shapes
  const handleAddDoodle = (doodleId: string) => {
    const now = Date.now();
    const newEl: ScrapElement = {
      id: `doodle-${now}`,
      type: "doodle",
      doodleId: doodleId,
      x: 35,
      y: 35,
      scale: 1,
      rotation: 0
    };
    
    setScrapbooks(prev => prev.map(sb => {
      if (sb.id !== activeScrapbook.id) return sb;
      return { ...sb, elements: [...sb.elements, newEl] };
    }));
    setSelectedElementId(newEl.id);
  };

  const handleAddText = () => {
    const text = prompt("Nhập từ/câu viết tay của bạn:", "Viết chữ...");
    if (!text) return;
    const now = Date.now();
    const newEl: ScrapElement = {
      id: `text-${now}`,
      type: "text",
      content: text,
      x: 30,
      y: 40,
      scale: 1.0,
      rotation: 0
    };

    setScrapbooks(prev => prev.map(sb => {
      if (sb.id !== activeScrapbook.id) return sb;
      return { ...sb, elements: [...sb.elements, newEl] };
    }));
    setSelectedElementId(newEl.id);
  };

  const handleAddWashiTape = () => {
    const now = Date.now();
    const newEl: ScrapElement = {
      id: `tape-${now}`,
      type: "tape",
      x: 40,
      y: 20,
      scale: 1.0,
      rotation: -5
    };

    setScrapbooks(prev => prev.map(sb => {
      if (sb.id !== activeScrapbook.id) return sb;
      return { ...sb, elements: [...sb.elements, newEl] };
    }));
    setSelectedElementId(newEl.id);
  };

  const handleAddSpeechBubble = () => {
    const textStr = prompt("Nhập nội dung đối thoại:", "Lời nhắn ngọt ngào...");
    if (!textStr) return;
    const now = Date.now();
    
    const elementsToInsert: ScrapElement[] = [
      {
        id: `bubble-${now}`,
        type: "speech_bubble",
        x: 35,
        y: 35,
        scale: 1.3,
        rotation: 0
      },
      {
        id: `bubble-txt-${now}`,
        type: "text",
        content: textStr,
        x: 39,
        y: 31,
        scale: 0.8,
        rotation: 0
      }
    ];

    setScrapbooks(prev => prev.map(sb => {
      if (sb.id !== activeScrapbook.id) return sb;
      return { ...sb, elements: [...sb.elements, ...elementsToInsert] };
    }));
    setSelectedElementId(`bubble-txt-${now}`);
  };

  // Convert elements list into a clean printable recipe summary for the digital journal text entry!
  const handleExportToJournalText = () => {
    if (!onSaveToJournal) return;
    
    // Find all text elements to compile
    const texts = activeScrapbook.elements
      .filter(el => el.type === 'text')
      .map(el => el.content)
      .filter(Boolean);

    const noodles = activeScrapbook.elements
      .filter(el => el.type === 'doodle')
      .map(el => {
        const dInfo = (DOODLE_STAMP_LIBRARY as any)[el.doodleId || ""];
        return dInfo ? `✓ [Sticker: ${dInfo.name}]` : null;
      })
      .filter(Boolean);

    const summaryText = `### 🎨 SKETCHBOOK SCRAPBOOK DIARY: ${activeScrapbook.title}\n` +
      `*Trang trí phong cách Journal tay tỉ mỉ giống ảnh mẫu*\n\n` +
      `**Chữ viết tay trong trang:**\n` +
      texts.map(t => `- "${t}"`).join("\n") + `\n\n` +
      `**Nhãn dán Doodle minh họa:**\n` +
      noodles.map(n => n).join("\n") + `\n\n` +
      `*Dữ liệu trang nháp được lưu trữ tự động trong Nhật ký tổng thành công.*`;

    onSaveToJournal(summaryText);
    alert("Đã lưu nội dung chữ của Scrapbook này vào nhật ký trang ngày chính!");
  };

  const handleDeleteScrapbook = (idToDelete: string) => {
    if (scrapbooks.length <= 1) {
      alert("Bạn phải giữ lại ít nhất một trang Scrapbook!");
      return;
    }
    if (confirm("Bạn có chắc muốn xóa trang nhật ký vẽ tay này?")) {
      const remaining = scrapbooks.filter(s => s.id !== idToDelete);
      setScrapbooks(remaining);
      setActiveScrapId(remaining[0].id);
      setSelectedElementId(null);
    }
  };

  const activeElement = activeScrapbook.elements.find(e => e.id === selectedElementId);

  return (
    <div className="bg-white rounded-2xl border-4 border-ink p-4 md:p-6 shadow-[6px_6px_0_var(--color-ink)] space-y-6 text-left relative mt-4">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-ink pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-[#af1e2d] text-white font-black text-xs uppercase tracking-wider rounded border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] flex items-center gap-1">
              <Sparkles size={12} /> Bảng Vẽ Tay Doodles
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest text-[#af1e2d]">Bullet Scrapbook Creator</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-ink uppercase tracking-tight mt-1 flex items-center gap-2 font-logo">
            🎨 Nhật Ký Doodle &amp; Vẽ Sơ Đồ Thiết Kế
          </h2>
          <p className="text-[11px] font-bold text-ink/50 uppercase tracking-widest">Tương tác kéo thả, gõ chữ viết tay, chèn sticker chuẩn như ảnh phác thảo</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {onClose && (
            <button 
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-ink text-xs font-black uppercase rounded-lg border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] cursor-pointer"
            >
              Đóng nháp
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLLAGE CONTROL PANEL & PRESET TEMPLATE BUILDER (LEFT COLUMN) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* SELECT WORKSPACE */}
          <div className="bg-[#fffbeb] p-3 rounded-xl border-2 border-ink space-y-3 shadow-[2px_2px_0_var(--color-ink)]">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <span className="text-xs uppercase font-black text-ink flex items-center gap-1">
                <Layout size={12} /> Trang Scrapbook ({scrapbooks.length})
              </span>
              <button 
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="text-[10px] bg-[#af1e2d] text-white font-black border border-ink py-0.5 px-2 rounded hover:translate-x-0.5 transition-transform flex items-center gap-1 cursor-pointer"
              >
                <Plus size={10} /> Tạo trang mới
              </button>
            </div>

            {isAddingNew && (
              <div className="p-2.5 bg-white rounded-lg border border-dashed border-ink/30 space-y-2 animate-in slide-in-from-top duration-200">
                <span className="text-[9px] uppercase font-black text-ink/50 block">Chọn mẫu thiết kế nhanh:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button 
                    onClick={() => handleCreateNewScrap("ragu_bolognese")}
                    className="w-full text-left p-1.5 hover:bg-[#fffbeb] rounded border border-ink/10 text-[10px] font-bold transition-all flex items-center gap-2 cursor-pointer text-indigo-700"
                  >
                    <span>🍛</span>
                    <div>
                      <span className="block font-black">Mẫu Ragu Bolognese</span>
                      <span className="text-[8px] text-ink/40 font-normal block">Vẽ tay giống hệt ảnh của bạn</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleCreateNewScrap("healthy_meal")}
                    className="w-full text-left p-1.5 hover:bg-[#fffbeb] rounded border border-ink/10 text-[10px] font-bold transition-all flex items-center gap-2 cursor-pointer text-emerald-700"
                  >
                    <span>🥑</span>
                    <div>
                      <span className="block font-black">Mẫu Bữa Ăn Healthy</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleCreateNewScrap("shopping_list")}
                    className="w-full text-left p-1.5 hover:bg-[#fffbeb] rounded border border-ink/10 text-[10px] font-bold transition-all flex items-center gap-2 cursor-pointer text-amber-700"
                  >
                    <span>🛒</span>
                    <div>
                      <span className="block font-black">Mẫu Bảng Đi Chợ Cuc Cơn</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => handleCreateNewScrap()}
                    className="w-full text-left p-1.5 hover:bg-[#fffbeb] rounded border-2 border-dashed border-ink/20 text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-neutral-600"
                  >
                    <span>✨</span>
                    <span className="font-black">Tạo trang trắng</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {scrapbooks.map(sb => {
                const isActive = activeScrapId === sb.id;
                return (
                  <div key={sb.id} className="flex gap-1 items-center">
                    <button
                      onClick={() => {
                        setActiveScrapId(sb.id);
                        setSelectedElementId(null);
                      }}
                      className={`flex-1 text-left p-2 rounded-lg text-xs font-black transition-all flex items-center justify-between border-2 ${
                        isActive 
                          ? "bg-white border-ink text-ink shadow-[2px_2px_0_var(--color-ink)]" 
                          : "bg-transparent border-transparent hover:border-ink/20 text-ink/75"
                      }`}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        {sb.id === "scrap-ragu" ? "🍛 " : "📔 "} {sb.title}
                      </span>
                      <span className="text-[8px] font-normal text-ink/40">({sb.elements.length} mục)</span>
                    </button>
                    {sb.id !== "scrap-ragu" && (
                      <button 
                        onClick={() => handleDeleteScrapbook(sb.id)}
                        className="p-1 hover:bg-red-50 text-[#af1e2d] rounded"
                        title="Xóa trang"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ADD ELEMENTS TOOLBOX */}
          <div className="bg-white p-3 rounded-xl border-2 border-ink space-y-3">
            <span className="text-xs uppercase font-black text-ink block border-b pb-1.5 border-ink/10">
              🛠️ Hộp Công Cụ Dán Nhãn
            </span>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleAddText}
                className="p-2 bg-neutral-50 hover:bg-[#fffbeb] border border-ink/25 text-[10px] font-black uppercase text-ink/80 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Type size={11} /> + Gõ Chữ viết
              </button>
              <button 
                onClick={handleAddSpeechBubble}
                className="p-2 bg-neutral-50 hover:bg-[#fffbeb] border border-ink/25 text-[10px] font-black uppercase text-ink/80 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>💬</span> + Bong bóng thoại
              </button>
              <button 
                onClick={handleAddWashiTape}
                className="p-2 bg-neutral-50 hover:bg-[#fffbeb] border border-ink/25 text-[10px] font-black uppercase text-ink/80 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>🎀</span> + Băng dán washi
              </button>
              <button 
                onClick={() => {
                  const title = prompt("Nhập nhãn ruy-băng đầu mục:", "ingredients");
                  if (!title) return;
                  const now = Date.now();
                  const els: ScrapElement[] = [
                    { id: `banner-${now}`, type: "banner", x: 30, y: 30, scale: 1.1, rotation: 0 },
                    { id: `banner-txt-${now}`, type: "text", content: title, x: 39, y: 33, scale: 0.9, rotation: 0 }
                  ];
                  setScrapbooks(prev => prev.map(sb => {
                    if (sb.id !== activeScrapbook.id) return sb;
                    return { ...sb, elements: [...sb.elements, ...els] };
                  }));
                }}
                className="p-2 bg-neutral-50 hover:bg-[#fffbeb] border border-ink/25 text-[10px] font-black uppercase text-ink/80 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>🎗️</span> + Ruy-băng đề mục
              </button>
            </div>

            <span className="text-[10px] uppercase font-black text-ink/40 block pt-1.5">Bộ sticker vẽ tay black-marker:</span>
            <div className="grid grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {Object.entries(DOODLE_STAMP_LIBRARY).map(([id, item]) => {
                return (
                  <button
                    key={id}
                    onClick={() => handleAddDoodle(id)}
                    className="p-1 px-1 bg-slate-50 hover:bg-slate-100 hover:scale-105 active:scale-95 border border-ink/10 rounded-lg text-[9px] font-bold text-center block transition-all"
                    title={item.name}
                  >
                    <div className="h-9 w-9 mx-auto mb-0.5">
                      {item.svg()}
                    </div>
                    <span className="block truncate text-[8px] text-ink/60">{item.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE SELECTED ITEM CONTROLS */}
          {activeElement && (
            <div className="bg-indigo-50/50 p-4 rounded-xl border-2 border-indigo-400/80 space-y-3 animate-in fade-in duration-200 text-xs">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-1.5">
                <span className="font-black text-indigo-900 uppercase text-[10px] tracking-wide flex items-center gap-1">
                  <Layers size={11} /> Tùy biến mục đang chọn
                </span>
                <span className="text-[9px] text-[#af1e2d] font-bold uppercase bg-[#af1e2d]/5 px-1.5 py-0.5 rounded border border-[#af1e2d]/20">
                  {activeElement.type === "doodle" ? `NHÃN: ${(DOODLE_STAMP_LIBRARY as any)[activeElement.doodleId || ""]?.name || "Doodle"}` : "VĂN BẢN TRÊN SỔ"}
                </span>
              </div>

              {/* Text specific config */}
              {activeElement.type === "text" && (
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-indigo-950/50 block">Sửa nội dung chữ:</span>
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      value={activeElement.content || ""} 
                      onChange={(e) => handleUpdateElement(activeElement.id, { content: e.target.value })}
                      className="flex-1 bg-white border border-indigo-300 rounded px-2 py-1 text-xs outline-none focus:border-indigo-600 font-sans"
                    />
                    <button 
                      onClick={() => handleEditTextElement(activeElement)}
                      className="px-2 py-1 bg-ink text-white rounded text-[10px]"
                    >
                      Mở rộng
                    </button>
                  </div>
                </div>
              )}

              {/* Size and rotation controls */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-indigo-950/50">Tỷ lệ (Size):</span>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-indigo-200">
                    <button 
                      onClick={() => handleUpdateElement(activeElement.id, { scale: Math.max(0.4, activeElement.scale - 0.15) })}
                      className="px-1.5 py-0.5 bg-neutral-100 rounded font-black hover:bg-neutral-200 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold flex-1 text-center select-none text-[10px]">{Math.round(activeElement.scale * 100)}%</span>
                    <button 
                      onClick={() => handleUpdateElement(activeElement.id, { scale: Math.min(3.0, activeElement.scale + 0.15) })}
                      className="px-1.5 py-0.5 bg-neutral-100 rounded font-black hover:bg-neutral-200 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-indigo-950/50">Xoay nghiêng:</span>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-indigo-200">
                    <button 
                      onClick={() => handleUpdateElement(activeElement.id, { rotation: activeElement.rotation - 5 })}
                      className="px-1 py-0.5 bg-neutral-100 rounded hover:bg-neutral-200 cursor-pointer"
                    >
                      ↺
                    </button>
                    <span className="font-bold text-[10px] flex-1 text-center select-none">{activeElement.rotation}°</span>
                    <button 
                      onClick={() => handleUpdateElement(activeElement.id, { rotation: activeElement.rotation + 5 })}
                      className="px-1 py-0.5 bg-neutral-100 rounded hover:bg-neutral-200 cursor-pointer"
                    >
                      ↻
                    </button>
                  </div>
                </div>
              </div>

              {/* Position direction pad offsets */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-indigo-950/50 block">Xê dịch vị trí (Phím điều hướng):</span>
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => moveElement('up')}
                    className="w-10 py-1 bg-white hover:bg-indigo-100 border border-indigo-300 rounded font-black cursor-pointer text-[10px]"
                  >
                    ▲
                  </button>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => moveElement('left')}
                      className="w-10 py-1 bg-white hover:bg-indigo-100 border border-indigo-300 rounded font-black cursor-pointer text-[10px]"
                    >
                      ◀
                    </button>
                    <button 
                      onClick={() => moveElement('down')}
                      className="w-10 py-1 bg-white hover:bg-indigo-100 border border-indigo-300 rounded font-black cursor-pointer text-[10px]"
                    >
                      ▼
                    </button>
                    <button 
                      onClick={() => moveElement('right')}
                      className="w-10 py-1 bg-white hover:bg-indigo-100 border border-indigo-300 rounded font-black cursor-pointer text-[10px]"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>

              {/* Action: Z-index layer arrange or delete */}
              <div className="flex items-center justify-between pt-2 border-t border-indigo-200/50">
                <button 
                  onClick={() => {
                    const sorted = [...activeScrapbook.elements];
                    const idx = sorted.findIndex(el => el.id === activeElement.id);
                    if (idx > -1) {
                      const item = sorted.splice(idx, 1)[0];
                      // push to end (front layer)
                      sorted.push(item);
                      setScrapbooks(prev => prev.map(sb => {
                        if (sb.id !== activeScrapbook.id) return sb;
                        return { ...sb, elements: sorted };
                      }));
                    }
                  }}
                  className="text-[9px] font-black text-indigo-700 bg-white hover:bg-indigo-100/40 border border-indigo-300 px-2 py-1 rounded cursor-pointer"
                >
                  Bring to Front (Lên trước)
                </button>
                <button 
                  onClick={() => handleDeleteElement(activeElement.id)}
                  className="bg-red-50 hover:bg-red-100 text-[#af1e2d] border border-red-200 rounded px-2 py-1 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Trash2 size={10} /> Xóa khỏi trang
                </button>
              </div>
            </div>
          )}

          {/* SYSTEM RECAP CAPTION METHOD */}
          {onSaveToJournal && (
            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] font-black text-emerald-800 uppercase block mb-1">Gom thông tin vào Nhật ký:</span>
              <p className="text-[9px] text-emerald-950/60 leading-relaxed mb-2.5">Bấm nút bên dưới để chuyển văn bản trong trang phác thảo này dán thẳng vào nhật ký chính hôm nay.</p>
              <button
                onClick={handleExportToJournalText}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded border border-emerald-700 uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Pin size={10} /> Pinned Scrapbook to Digital Notes
              </button>
            </div>
          )}

        </div>

        {/* INTERACTIVE WORKSPACE/BOARD CANVAS (RIGHT COLUMN - 8 COLUMNS LARGE) */}
        <div className="lg:col-span-8 space-y-3">
          
          <div className="flex items-center justify-between px-1.5">
            <span className="text-xs uppercase font-black text-ink/60 flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Đang chỉnh sửa: <strong className="text-ink font-sans uppercase font-black">{activeScrapbook.title}</strong>
            </span>
            <div className="flex gap-1">
              {(['lined', 'grid', 'dotted', 'blank'] as const).map(pStyle => (
                <button
                  key={pStyle}
                  onClick={() => {
                    setScrapbooks(prev => prev.map(sb => sb.id === activeScrapbook.id ? { ...sb, paperStyle: pStyle } : sb));
                  }}
                  className={`text-[8px] px-2 py-0.5 rounded border ${
                    activeScrapbook.paperStyle === pStyle ? "bg-ink text-white border-ink font-bold" : "bg-white border-ink/10 text-ink/70"
                  }`}
                >
                  {pStyle === "lined" ? "Kẻ ngang" : pStyle === "grid" ? "Ô ly" : pStyle === "dotted" ? "Duy chấm" : "Trơn"}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN ILLUSTRATION BOOK WRAPPER */}
          <div className="bg-[#FAF8F5] select-none shadow-md rounded-2xl border-4 border-ink p-4 md:p-8 relative min-h-[580px] w-full overflow-hidden">
            
            {/* RED MARGIN LINE */}
            <div className="absolute left-[36px] top-0 bottom-0 w-[1.5px] bg-rose-400 opacity-40 z-10 pointer-events-none" />

            {/* PAPER DESIGN OVERLAY PATTERNS */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.22] z-0"
              style={
                activeScrapbook.paperStyle === 'lined' ? {
                  backgroundImage: "linear-gradient(transparent 95%, rgba(0,0,0,0.18) 100%)",
                  backgroundSize: "100% 28px"
                } : activeScrapbook.paperStyle === 'grid' ? {
                  backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)",
                  backgroundSize: "24px 24px"
                } : activeScrapbook.paperStyle === 'dotted' ? {
                  backgroundImage: "radial-gradient(rgba(0,0,0,0.25) 1.5px, transparent 1.5px)",
                  backgroundSize: "20px 20px"
                } : {
                  backgroundImage: "none"
                }
              }
            />

            {/* IN-SITE HELPFUL WATERMARK */}
            <div className="absolute top-3 right-4 transform rotate-12 select-none pointer-events-none text-red-700/10 font-black tracking-widest text-[9px] uppercase border-4 border-dashed border-red-700/10 p-1.5 rounded-xl">
              Ragu alla Bolognese • 100% Hand-built
            </div>

            {/* STAMP LAYOUT CANVAS ROOT */}
            <div className="relative w-full h-[540px] z-10 font-hand-written">
              {activeScrapbook.elements.map((el) => {
                const isSelected = selectedElementId === el.id;
                
                // Position calculations
                const styleObj: React.CSSProperties = {
                  position: "absolute",
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
                  cursor: "move",
                  userSelect: "none"
                };

                return (
                  <div
                    key={el.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                    }}
                    onDoubleClick={() => handleEditTextElement(el)}
                    style={styleObj}
                    className={`transition-shadow duration-150 p-1 group/item rounded-md ${
                      isSelected ? "border-2 border-indigo-600 ring-2 ring-indigo-300 shadow-md bg-indigo-50/10" : "hover:border-2 hover:border-black/20"
                    }`}
                  >
                    
                    {/* Render according to elements structure */}
                    {el.type === 'doodle' && el.doodleId && (
                      <div className="w-14 h-14 min-w-[56px] min-h-[56px]">
                        {(DOODLE_STAMP_LIBRARY as any)[el.doodleId]?.svg(isSelected ? "#4f46e5" : "#1A1A1A")}
                      </div>
                    )}

                    {el.type === 'text' && (
                      <span className="font-hand text-[15px] md:text-[18px] text-ink whitespace-nowrap select-none font-bold tracking-tight">
                        {el.content || "Nội dung..."}
                      </span>
                    )}

                    {el.type === 'banner' && (
                      <div className="w-36 h-12">
                        {DOODLE_STAMP_LIBRARY.scroll_banner.svg(isSelected ? "#4f46e5" : "#1A1A1A")}
                      </div>
                    )}

                    {el.type === 'speech_bubble' && (
                      <div className="w-28 h-20">
                        {DOODLE_STAMP_LIBRARY.speech_bubble.svg(isSelected ? "#4f46e5" : "#1A1A1A")}
                      </div>
                    )}

                    {el.type === 'tape' && (
                      <div className="w-[84px] h-[26px]">
                        {DOODLE_STAMP_LIBRARY.washi_tape.svg()}
                      </div>
                    )}

                    {/* Quick selection handle visuals inside iframe */}
                    {isSelected && (
                      <div className="absolute -top-4 -right-4 flex gap-1 pointer-events-auto z-50">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateElement(el.id, { rotation: el.rotation + 15 });
                          }}
                          className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[8px]"
                          title="Xoay nhanh"
                        >
                          ↻
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteElement(el.id);
                          }}
                          className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[8px]"
                          title="Xóa nhanh"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 text-[10px] text-indigo-950 font-sans flex items-start gap-2">
            <HelpCircle size={14} className="text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">💡 Hướng dẫn phác thảo:</p>
              <p className="mt-0.5">Click để chọn sticker hoặc chữ viết tay trên trang giấy vẽ. Bạn có thể kéo lệch vị trí, gõ chữ tự do, chèn ruy-băng hoặc xoay/kích cỡ sticker nấm, thịt băm, lon súp, bơ lát, tỏi tùy ý cho giống hệt mẫu nghệ thuật!</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
