import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Flame,
  Target,
  TrendingUp,
  Play,
  CheckCircle2,
  Circle,
  UserCheck,
  ChevronRight,
  Zap,
  Award,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useMyPhysio, useLinkToPhysio } from "@/hooks/usePhysioLink";
import { useAssignedExercises } from "@/hooks/useExercises";
import { useTodaySessionLogs } from "@/hooks/useSessionLogs";

// ── Shared card style ────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: "24px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
};

// ── Stat card colours ────────────────────────────────────────────────────────
const statThemes = [
  { bg: "#eafff9", icon: "#00c9a7", text: "#00a084" },
  { bg: "#e8f0fe", icon: "#4285f4", text: "#2b6cb0" },
  { bg: "#fef3e8", icon: "#f59e0b", text: "#b45309" },
  { bg: "#f0f9ff", icon: "#0ea5e9", text: "#0369a1" },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultCode, setConsultCode] = useState("");

  const { data: myPhysio, isLoading: physioLoading } = useMyPhysio();
  const linkMutation = useLinkToPhysio();
  const { data: assignedExercises = [] } = useAssignedExercises();
  const { data: todayLogs = [] } = useTodaySessionLogs();

  const linkPhysio = async () => {
    if (consultCode.length < 4) { toast.error("Please enter a valid consultation code"); return; }
    try {
      await linkMutation.mutateAsync(consultCode);
      toast.success("Linked to physiotherapist!");
      setConsultCode("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to link");
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const setsDoneMap: Record<string, number> = {};
  todayLogs.forEach(log => {
    setsDoneMap[log.assigned_exercise_id] = (setsDoneMap[log.assigned_exercise_id] || 0) + 1;
  });

  const exercisesWithStatus = assignedExercises.map(ae => {
    const setsDone = setsDoneMap[ae.id] || 0;
    const completed = setsDone >= ae.sets;
    const logs = todayLogs.filter(l => l.assigned_exercise_id === ae.id);
    const avgScore = logs.length > 0
      ? Math.round(logs.reduce((a, l) => a + (l.average_form_score || 0), 0) / logs.length)
      : null;
    return { ...ae, completed, setsDone, avgScore };
  });

  const completedCount = exercisesWithStatus.filter(e => e.completed).length;
  const totalCount = exercisesWithStatus.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalCorrect = todayLogs.reduce((a, l) => a + l.correct_reps, 0);
  const totalReps = todayLogs.reduce((a, l) => a + l.total_reps, 0);
  const avgFormScore = todayLogs.length > 0
    ? Math.round(todayLogs.reduce((a, l) => a + (l.average_form_score || 0), 0) / todayLogs.length)
    : 0;

  const stats = [
    { label: "Today's Progress", value: `${progress}%`, sub: `${completedCount}/${totalCount} exercises` },
    { label: "Sessions Today", value: String(todayLogs.length), sub: "sets logged" },
    { label: "Avg Form Score", value: avgFormScore ? `${avgFormScore}%` : "—", sub: "form quality" },
    { label: "Rep Accuracy", value: totalReps > 0 ? `${Math.round((totalCorrect / totalReps) * 100)}%` : "—", sub: `${totalCorrect}/${totalReps} correct` },
  ];

  const nextExercise = exercisesWithStatus.find(e => !e.completed);

  return (
    <DashboardLayout>
      {/* ── Page title row ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, marginTop: 2 }}>Here's your recovery status today</p>
        </div>

        {nextExercise && (
          <button
            onClick={() => navigate(`/session?assignmentId=${nextExercise.id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 12,
              background: "linear-gradient(135deg, #00c9a7 0%, #0074e4 100%)",
              color: "#fff", fontWeight: 600, fontSize: 14,
              border: "none", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,201,167,0.35)",
            }}
          >
            <Play size={15} />
            Start Next Exercise
          </button>
        )}
      </div>

      {/* ── Physio link banner ──────────────────────────────────────────── */}
      {!physioLoading && !myPhysio && (
        <div style={{ ...card, marginBottom: 24, borderLeft: "4px solid #00c9a7", borderRadius: "0 16px 16px 0", padding: "16px 20px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 10 }}>
            Link to your Physiotherapist
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              value={consultCode}
              onChange={e => setConsultCode(e.target.value.toUpperCase())}
              placeholder="Enter consultation code"
              maxLength={8}
              style={{ flex: 1, borderRadius: 8 }}
            />
            <button
              onClick={linkPhysio}
              disabled={linkMutation.isPending}
              style={{
                padding: "8px 18px", borderRadius: 8,
                background: "#00c9a7", color: "#fff",
                fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer",
              }}
            >
              {linkMutation.isPending ? "Linking…" : "Link"}
            </button>
          </div>
        </div>
      )}

      {myPhysio && (
        <div style={{ ...card, marginBottom: 24, display: "flex", alignItems: "center", gap: 12, padding: "14px 20px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eafff9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserCheck size={18} color="#00c9a7" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Your Physiotherapist</p>
            <p style={{ fontSize: 12, color: "#6b7280" }}>{myPhysio.name}</p>
          </div>
          <span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 20, background: "#eafff9", color: "#00a084", fontSize: 12, fontWeight: 600 }}>
            Active
          </span>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((stat, i) => {
          const theme = statThemes[i];
          return (
            <div key={stat.label} style={{ ...card, padding: "20px 22px" }}>
              <div
                style={{
                  width: 42, height: 42, borderRadius: 12,
                  backgroundColor: theme.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                {i === 0 && <Target size={20} color={theme.icon} />}
                {i === 1 && <Flame size={20} color={theme.icon} />}
                {i === 2 && <TrendingUp size={20} color={theme.icon} />}
                {i === 3 && <Activity size={20} color={theme.icon} />}
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px", lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{stat.label}</p>
              <p style={{ fontSize: 11, color: theme.text, marginTop: 2, fontWeight: 500 }}>{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Two-column bottom section ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>

        {/* Today's Exercises */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Today's Exercises</h2>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{completedCount}/{totalCount} completed</span>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div style={{ height: 6, borderRadius: 3, backgroundColor: "#f3f4f6", marginBottom: 18, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%", borderRadius: 3,
                  background: "linear-gradient(90deg, #00c9a7, #0074e4)",
                  width: `${progress}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          )}

          {exercisesWithStatus.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Zap size={32} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13, color: "#9ca3af" }}>
                {myPhysio ? "No exercises assigned yet." : "Link to your physiotherapist to get started."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {exercisesWithStatus.map(ex => (
                <div
                  key={ex.id}
                  onClick={() => !ex.completed && navigate(`/session?assignmentId=${ex.id}`)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px", borderRadius: 12,
                    backgroundColor: ex.completed ? "#f0fdf4" : "#fafafa",
                    border: `1px solid ${ex.completed ? "#bbf7d0" : "#f3f4f6"}`,
                    cursor: ex.completed ? "default" : "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!ex.completed) (e.currentTarget as HTMLElement).style.backgroundColor = "#f0f9ff"; }}
                  onMouseLeave={e => { if (!ex.completed) (e.currentTarget as HTMLElement).style.backgroundColor = "#fafafa"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {ex.completed
                      ? <CheckCircle2 size={20} color="#22c55e" />
                      : <Circle size={20} color="#d1d5db" />}
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{ex.exercises.name}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                        {ex.sets} sets · {ex.reps} reps
                        {ex.setsDone > 0 && !ex.completed ? ` · ${ex.setsDone}/${ex.sets} done` : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {ex.completed && ex.avgScore ? (
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>{ex.avgScore}%</span>
                    ) : !ex.completed ? (
                      <ChevronRight size={16} color="#9ca3af" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Quick Actions + Progress summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Quick Actions */}
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Start Next Exercise", desc: nextExercise?.exercises?.name ?? "All done!", icon: Play, color: "#00c9a7", bg: "#eafff9", to: nextExercise ? `/session?assignmentId=${nextExercise.id}` : null },
                { label: "View Progress", desc: "Charts & trends", icon: TrendingUp, color: "#4285f4", bg: "#e8f0fe", to: "/progress" },
                { label: "My Plans", desc: "Recovery roadmap", icon: Award, color: "#f59e0b", bg: "#fef3e8", to: "/plans" },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => action.to && navigate(action.to)}
                  disabled={!action.to}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 12,
                    border: "1px solid #f3f4f6", backgroundColor: "#fafafa",
                    cursor: action.to ? "pointer" : "default",
                    textAlign: "left", width: "100%", transition: "all 0.12s",
                  }}
                  onMouseEnter={e => { if (action.to) (e.currentTarget as HTMLElement).style.backgroundColor = action.bg; }}
                  onMouseLeave={e => { if (action.to) (e.currentTarget as HTMLElement).style.backgroundColor = "#fafafa"; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: action.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <action.icon size={17} color={action.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{action.label}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>{action.desc}</p>
                  </div>
                  <ChevronRight size={14} color="#d1d5db" style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Today's summary mini card */}
          <div style={{ ...card, background: "linear-gradient(135deg, #0d1117 0%, #1a2334 100%)", padding: "22px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Today's Score</p>
            <p style={{ fontSize: 40, fontWeight: 800, color: "#00c9a7", lineHeight: 1, letterSpacing: "-1px" }}>
              {avgFormScore || 0}<span style={{ fontSize: 20, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>%</span>
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>average form score</p>

            {/* Mini bar chart - sets per exercise */}
            {exercisesWithStatus.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginTop: 16, alignItems: "flex-end", height: 40 }}>
                {exercisesWithStatus.map(ex => {
                  const pct = ex.sets > 0 ? Math.min((ex.setsDone / ex.sets), 1) : 0;
                  return (
                    <div key={ex.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", height: 30, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
                        <div
                          style={{
                            position: "absolute", bottom: 0, left: 0, right: 0,
                            height: `${pct * 100}%`,
                            background: pct >= 1 ? "#00c9a7" : "rgba(0,201,167,0.4)",
                            borderRadius: 4, transition: "height 0.4s ease",
                          }}
                        />
                      </div>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1 }}>
                        {ex.exercises.name.split(" ")[0]}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
