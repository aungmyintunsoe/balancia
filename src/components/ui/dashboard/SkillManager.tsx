'use client';

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Award, Save, Loader2 } from "lucide-react";
import { syncSkills } from "@/app/actions/taskActions";

interface Skill {
    skill_name: string;
    proficiency_level: number;
}

export function SkillManager({ initialSkills }: { initialSkills: Skill[] }) {
    const [skills, setSkills] = useState<Skill[]>(initialSkills);
    const [newSkill, setNewSkill] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    function addSkill() {
        if (!newSkill.trim()) return;
        if (skills.some(s => s.skill_name.toLowerCase() === newSkill.toLowerCase())) return;
        setSkills([...skills, { skill_name: newSkill, proficiency_level: 3 }]);
        setNewSkill("");
    }

    function removeSkill(name: string) {
        setSkills(skills.filter(s => s.skill_name !== name));
    }

    async function handleSave() {
        setLoading(true);
        setError(null);
        setSaved(false);
        try {
            const result = await syncSkills(skills);
            if (!result.success) {
                setError(result.error || "Unable to save skills.");
                return;
            }
            setSaved(true);
        } catch (error) {
            console.error(error);
            setError("Unable to save skills.");
        } finally {
            setLoading(false);
        }
    }

    const hasChanges = JSON.stringify(skills) !== JSON.stringify(initialSkills);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#22c55e]" /> My Technical Profile
                </h3>
                {hasChanges && (
                    <Button size="sm" variant="ghost" onClick={handleSave} disabled={loading} className="text-[#22c55e] hover:bg-green-50 h-7 text-xs font-bold gap-1.5 animate-in fade-in zoom-in duration-300">
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save Profile
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                    <Badge 
                        key={skill.skill_name} 
                        variant="secondary" 
                        className="bg-slate-100 text-slate-600 border-slate-200 py-1.5 px-3 rounded-xl flex items-center gap-2 group transition-all hover:bg-slate-200"
                    >
                        {skill.skill_name}
                        <button onClick={() => removeSkill(skill.skill_name)} className="hover:text-red-500 transition-colors">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                <div className="flex items-center gap-2">
                    <Input 
                        placeholder="Add skill (e.g. React, Python)" 
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                        className="h-8 text-xs w-48 rounded-xl border-dashed bg-transparent"
                    />
                    <Button size="icon" variant="ghost" onClick={addSkill} className="h-8 w-8 rounded-xl hover:bg-slate-100">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            
            <p className="text-[10px] text-slate-400 font-medium italic">
                * Opti uses these skills to decide which tasks to assign to you. Keep your profile updated for better orchestration.
            </p>
            {error && <p className="text-xs text-red-500">{error}</p>}
            {saved && !error && <p className="text-xs text-emerald-600">Skills saved.</p>}
        </div>
    );
}
