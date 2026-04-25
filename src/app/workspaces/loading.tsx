export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fafbfc] animate-in fade-in duration-300">
            <div className="relative mb-6">
                <img 
                    src="/logo.png" 
                    alt="Loading..." 
                    className="w-20 h-20 object-contain animate-opti-catch mix-blend-multiply"
                />
            </div>
            <div className="flex flex-col items-center space-y-2">
                <h2 className="text-2xl font-bold text-[#8CE065] tracking-tight">Loading...</h2>
                <p className="text-sm font-bold text-[#8CE065] uppercase tracking-widest animate-pulse">Opti is catching data</p>
            </div>
        </div>
    );
}
