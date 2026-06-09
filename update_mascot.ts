import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

// Replace Mascot Mascot with long curly hair
const mascotOld = `                                 {/* Back Hair (Curly) */}
                                 <path d="M 30 20 Q 10 30 15 50 Q 10 60 20 70 Q 15 80 25 90 Q 30 95 40 90 L 60 90 Q 70 95 75 90 Q 85 80 80 70 Q 90 60 85 50 Q 90 30 70 20 Z" fill="#3A1412" stroke="none" />
                                 {/* Body/Face */}
                                 <motion.path 
                                    d="M25 40 Q 25 20 50 20 Q 75 20 75 40 L 80 80 Q 80 90 70 90 L 30 90 Q 20 90 20 80 Z" 
                                    fill="#FAF3EB"
                                    animate={{ 
                                      rotate: ratio === 1 ? [0, -5, 5, -5, 0] : 0,
                                      y: ratio === 1 ? [0, -5, 0] : 0 
                                    }}
                                    transition={{ duration: 0.5, repeat: ratio === 1 ? Infinity : 0, repeatDelay: 2 }}
                                 />
                                 {/* Front Hair Bangs */}
                                 <path d="M 25 40 Q 35 25 50 25 Q 65 25 75 40 Q 65 20 50 20 Q 35 20 25 40 Z" fill="#3A1412" stroke="none" />`;

const mascotNew = `                                 {/* Back Hair (Long Curly) */}
                                 <motion.path 
                                   d="M 25 30 
                                      C 10 35, 0 50, 15 65 
                                      C 5 75, 15 90, 25 95 
                                      C 20 105, 35 110, 45 105 
                                      C 60 110, 75 105, 75 95 
                                      C 85 90, 95 75, 85 65 
                                      C 100 50, 90 35, 75 30 Z" 
                                   fill="#3A1412" stroke="none" 
                                   animate={{ 
                                      rotate: ratio === 1 ? [0, -2, 2, -2, 0] : 0,
                                      y: ratio === 1 ? [0, -2, 0] : 0 
                                    }}
                                 />
                                 
                                 {/* Face/Body */}
                                 <motion.path 
                                    d="M25 45 Q 25 25 50 25 Q 75 25 75 45 L 80 85 Q 80 95 70 95 L 30 95 Q 20 95 20 85 Z" 
                                    fill="#FAF3EB" stroke="#8A1E2B" strokeWidth="2"
                                    animate={{ 
                                      rotate: ratio === 1 ? [0, -5, 5, -5, 0] : 0,
                                      y: ratio === 1 ? [0, -5, 0] : 0 
                                    }}
                                    transition={{ duration: 0.5, repeat: ratio === 1 ? Infinity : 0, repeatDelay: 2 }}
                                 />
                                 
                                 {/* Fluffy Front Bangs */}
                                 <motion.path 
                                    d="M 22 45 
                                       C 25 35, 35 25, 50 25 
                                       C 65 25, 75 35, 78 45 
                                       C 65 20, 35 20, 22 45 Z" 
                                    fill="#3A1412" stroke="none" 
                                    animate={{ 
                                      rotate: ratio === 1 ? [0, -5, 5, -5, 0] : 0,
                                      y: ratio === 1 ? [0, -5, 0] : 0 
                                    }}
                                 />
                                 <motion.path 
                                    d="M 40 25 C 45 35, 50 35, 55 25" fill="none" stroke="#FAF3EB" strokeWidth="2"
                                 />`;

content = content.replace(mascotOld, mascotNew);

fs.writeFileSync('src/components/DigitalJournal.tsx', content);
console.log("Updated Mascot");
