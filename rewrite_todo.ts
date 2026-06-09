import fs from 'fs';

let content = fs.readFileSync('src/components/DigitalJournal.tsx', 'utf8');

const startMarker = '{/* To Do List */}';
const startIndex = content.indexOf(startMarker);

const endMarker = '{/* Events */}';
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found");
    process.exit(1);
}

const replacement = `{/* To Do List */}
                <div className="space-y-4">
                   <div className="flex items-center gap-6 mb-4">
                     <h3 className="font-hand font-black text-xl text-[#3A1412] tracking-wider uppercase m-0">TODAY TO DO LIST:</h3>
                     
                     {/* Mascot */}
                     <div className="w-16 h-16 pointer-events-none relative -mt-4">
                        {(() => {
                            const allDisplayTasks = [
                              ...tasks.map(t => ({ id: t.id, text: t.content, done: t.completed, isReal: true })),
                              ...localInteractiveTasks
                            ].slice(0, 9);
                            
                            const completedCount = allDisplayTasks.filter(t => t.done).length;
                            const totalDisplayTasks = allDisplayTasks.length;
                            const ratio = totalDisplayTasks === 0 ? 1 : completedCount / totalDisplayTasks;
                            const controlY = 45 + ratio * 30;

                            return (
                              <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#8A1E2B] fill-[#FAF3EB] stroke-[3]" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
                                 {/* Body */}
                                 <motion.path 
                                    d="M20 30 Q 20 15 35 15 L 65 15 Q 80 15 80 30 L 85 80 Q 85 90 75 90 L 25 90 Q 15 90 15 80 Z" 
                                    animate={{ 
                                      rotate: ratio === 1 ? [0, -5, 5, -5, 0] : 0,
                                      y: ratio === 1 ? [0, -5, 0] : 0 
                                    }}
                                    transition={{ duration: 0.5, repeat: ratio === 1 ? Infinity : 0, repeatDelay: 2 }}
                                 />
                                 {/* Blush */}
                                 <ellipse cx="25" cy="50" rx="5" ry="3" fill="#E59FB0" stroke="none" opacity="0.8"/>
                                 <ellipse cx="75" cy="50" rx="5" ry="3" fill="#E59FB0" stroke="none" opacity="0.8"/>
                                 
                                 {/* Eyes */}
                                 <motion.circle cx="35" cy="45" r="4.5" fill="#8A1E2B" stroke="none" />
                                 <motion.circle cx="65" cy="45" r="4.5" fill="#8A1E2B" stroke="none" />
                                 
                                 {/* Mouth */}
                                 <motion.path 
                                    d={\`M 40 60 Q 50 \${controlY} 60 60\`} 
                                    fill="none" 
                                    stroke="#8A1E2B" 
                                    strokeWidth="3.5"
                                    initial={false}
                                    animate={{ d: \`M 40 60 Q 50 \${controlY} 60 60\` }}
                                    transition={{ type: "spring", stiffness: 100, damping: 10 }}
                                 />
                                 
                                 {/* Sparkles if Happy */}
                                 <AnimatePresence>
                                  {ratio === 1 && (
                                     <motion.g
                                       initial={{ opacity: 0, scale: 0 }}
                                       animate={{ opacity: 1, scale: 1 }}
                                       exit={{ opacity: 0, scale: 0 }}
                                     >
                                        <path d="M 5 20 L 10 10 L 15 20 L 25 25 L 15 30 L 10 40 L 5 30 L -5 25 Z" fill="#E59FB0" stroke="none" transform="scale(0.5) translate(0, -20)"/>
                                        <path d="M 85 20 L 90 10 L 95 20 L 105 25 L 95 30 L 90 40 L 85 30 L 75 25 Z" fill="#EAB308" stroke="none" transform="scale(0.5) translate(80, -10)"/>
                                     </motion.g>
                                  )}
                                 </AnimatePresence>
                              </svg>
                            );
                        })()}
                     </div>
                   </div>

                   {(() => {
                      const allDisplayTasks = [
                        ...tasks.map(t => ({ id: t.id, text: t.content, done: t.completed, isReal: true })),
                        ...localInteractiveTasks
                      ].slice(0, 9);

                      return allDisplayTasks.map((t, idx) => (
                          <div key={t.id + idx} className="flex items-center gap-4 cursor-pointer group" onClick={() => {
                             if (t.isReal) {
                                handleToggleTask(t.id);
                             } else {
                                setLocalInteractiveTasks(prev => prev.map(item => item.id === t.id ? { ...item, done: !item.done } : item));
                             }
                          }}>
                              <div className="w-8 h-8 border-[2.5px] border-[#8A1E2B] rounded-[4px] shrink-0 flex items-center justify-center transition-all group-hover:scale-105 bg-white shadow-sm overflow-hidden relative">
                                  <AnimatePresence>
                                    {t.done && (
                                      <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="w-full h-full bg-transparent flex items-center justify-center"
                                      >
                                        <svg className="text-[#8A1E2B] w-6 h-6 stroke-[4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <motion.path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            d="M5 13l4 4L19 7"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.2 }}
                                          />
                                        </svg>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                              </div>
                              <span className={\`font-hand font-black text-xl md:text-2xl transition-all select-none \${t.done ? "text-[#8A1E2B]/50 line-through decoration-[#8A1E2B] decoration-[2px]" : "text-[#8A1E2B] group-hover:text-red-700"}\`}>{t.text}</span>
                          </div>
                      ));
                   })()}
                   
                   <form onSubmit={handleAddTask} className="flex items-center gap-3 mt-4 pt-4 border-t-[1.5px] border-[#8A1E2B]/20 border-dashed">
                     <span className="text-[#8A1E2B] font-black text-2xl">+</span>
                     <input type="text" placeholder="Add new task..." value={newTaskContent} onChange={e => setNewTaskContent(e.target.value)} className="bg-transparent outline-none font-hand font-bold text-xl text-[#8A1E2B] placeholder-[#8A1E2B]/50 w-full uppercase" />
                   </form>
                </div>

                {/* Events */}`;

fs.writeFileSync('src/components/DigitalJournal.tsx', content.substring(0, startIndex) + replacement + content.substring(endIndex + endMarker.length));
console.log('Replaced To Do List layout');
