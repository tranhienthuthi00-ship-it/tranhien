import { useState, FormEvent } from "react";
import { Plus, Trash2, CheckCircle2, Circle, ExternalLink, Video, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentIdea } from "@/types";

export function ContentManager({ ideas, setIdeas }: { 
  ideas: ContentIdea[]; 
  setIdeas: (i: ContentIdea[]) => void 
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPlatform, setNewPlatform] = useState("TikTok");
  const [newLink, setNewLink] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Done'>('All');

  const addIdea = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingId) {
      setIdeas(ideas.map(i => i.id === editingId ? {
        ...i,
        title: newTitle,
        description: newDesc,
        platform: newPlatform,
        link: newLink,
      } : i));
      setEditingId(null);
    } else {
      const idea: ContentIdea = {
        id: Date.now().toString(),
        title: newTitle,
        description: newDesc,
        platform: newPlatform,
        link: newLink,
        status: 'Pending',
        createdAt: Date.now(),
      };
      setIdeas([idea, ...ideas]);
    }

    setNewTitle("");
    setNewDesc("");
    setNewLink("");
  };

  const startEdit = (idea: ContentIdea) => {
    setEditingId(idea.id);
    setNewTitle(idea.title);
    setNewDesc(idea.description || "");
    setNewPlatform(idea.platform);
    setNewLink(idea.link || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleStatus = (id: string) => {
    setIdeas(ideas.map(i => 
      i.id === id ? { ...i, status: i.status === 'Pending' ? 'Done' : 'Pending' } : i
    ));
  };

  const removeIdea = (id: string) => {
    if (window.confirm("Xóa ý tưởng này?")) {
      setIdeas(ideas.filter(i => i.id !== id));
    }
  };

  const filteredIdeas = ideas.filter(i => {
    if (filter === 'All') return true;
    return i.status === filter;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 font-sans pb-10">
      <div className="mb-8 text-center">
         <h1 className="text-4xl font-black font-logo tracking-wide mb-2 uppercase">Content & Trends</h1>
         <p className="text-ink/60 font-medium">Lưu lại các ý tưởng, trend hay để quay video</p>
      </div>

      <form onSubmit={addIdea} className="bg-paper p-5 sketch-border border-dashed border-ink/30 mb-8 space-y-4 relative">
        <div className="absolute -top-3 -left-3 rotate-[-5deg]">
          <span className="bg-ink text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider sketch-border">💡 New Idea</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Tiêu đề ý tưởng / Trend</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ví dụ: Daily vlog đi làm cruise ship..."
                className="sketch-input bg-white/50 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Nền tảng</label>
                <select 
                  value={newPlatform} 
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="sketch-input bg-white/50 cursor-pointer py-2"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="Reels">Reels</option>
                  <option value="Shorts">YouTube Shorts</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Link tham khảo (nếu có)</label>
                <input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://..."
                  className="sketch-input bg-white/50 py-2"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5 h-full">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/50 ml-1">Mô tả chi tiết kịch bản</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Ghi chú các cảnh cần quay, nhạc nền, text overlay..."
                className="sketch-input bg-white/50 w-full flex-1 min-h-[80px] resize-none py-2"
              />
              <div className="flex justify-end mt-2 gap-2">
                 {editingId && (
                   <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setNewTitle("");
                      setNewDesc("");
                      setNewLink("");
                    }} 
                    className="sketch-button bg-paper py-2 px-6 text-sm"
                   >
                     Hủy
                   </button>
                 )}
                 <button type="submit" className="sketch-button sketch-button-primary bg-ink text-paper text-sm py-2 px-8 flex items-center gap-2">
                    <Plus size={16} /> {editingId ? "Cập Nhật" : "Lưu Ý Tưởng"}
                 </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="flex gap-4 mb-8 justify-center">
        {(['All', 'Pending', 'Done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "font-sans font-bold text-xs transition-colors px-3 py-1 uppercase tracking-widest",
              filter === f ? "text-crimson border-b-2 border-crimson" : "text-ink/40 hover:text-ink/70"
            )}
          >
            {f === 'All' ? 'Tất cả' : f === 'Pending' ? 'Chưa quay' : 'Đã xong'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin content-start">
        {filteredIdeas.map(idea => (
          <div key={idea.id} className={cn(
            "p-5 sketch-border transition-all hover:translate-y-[-2px] relative group flex flex-col justify-between",
            idea.status === 'Done' ? "bg-emerald-50/30 opacity-70" : "bg-white/60"
          )}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStatus(idea.id)} className="text-ink/40 hover:text-ink transition-colors">
                    {idea.status === 'Done' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <Circle size={20} />}
                  </button>
                  <h3 className={cn(
                    "font-bold text-lg leading-tight",
                    idea.status === 'Done' && "line-through text-ink/40"
                  )}>
                    {idea.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => startEdit(idea)}
                    className="p-1 hover:bg-ink/5 rounded text-ink/40 hover:text-ink transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-ink/10 bg-ink/5">
                    {idea.platform}
                  </span>
                  {idea.link && (
                    <a href={idea.link} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-ink/5 rounded">
                      <ExternalLink size={14} className="text-crimson" />
                    </a>
                  )}
                </div>
              </div>

              {idea.description && (
                <div className="bg-paper/50 p-3 rounded border border-dashed border-ink/10 text-sm font-hand text-ink/70 leading-relaxed mb-4">
                  {idea.description}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-[8px] font-mono opacity-30">
                Lưu ngày: {new Date(idea.createdAt).toLocaleDateString()}
              </span>
              <button 
                onClick={() => removeIdea(idea.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-crimson hover:text-white rounded-lg border border-ink/10"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {filteredIdeas.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <div className="text-ink/20 mb-4 flex justify-center">
              <Video size={64} strokeWidth={1} />
            </div>
            <p className="hand-text text-2xl text-ink/40">Ghi lại ý tưởng quay phim đầu tiên của bạn nào!</p>
          </div>
        )}
      </div>
    </div>
  );
}
