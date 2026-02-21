import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const formData = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 78 },
  { day: "Wed", score: 75 },
  { day: "Thu", score: 82 },
  { day: "Fri", score: 88 },
  { day: "Sat", score: 85 },
  { day: "Sun", score: 91 },
];

const repData = [
  { day: "Mon", correct: 10, incorrect: 2 },
  { day: "Tue", correct: 11, incorrect: 1 },
  { day: "Wed", correct: 9, incorrect: 3 },
  { day: "Thu", correct: 12, incorrect: 0 },
  { day: "Fri", correct: 11, incorrect: 1 },
  { day: "Sat", correct: 12, incorrect: 0 },
  { day: "Sun", correct: 12, incorrect: 0 },
];

const errorTypes = [
  { type: "Insufficient Depth", count: 8 },
  { type: "Knee Misalignment", count: 5 },
  { type: "Instability", count: 3 },
  { type: "Speed Too Fast", count: 2 },
];

export default function Progress() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-2">
          Your <span className="text-gradient-teal">Progress</span>
        </h1>
        <p className="text-muted-foreground mb-8">Weekly recovery analytics</p>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Form score trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="font-display font-semibold mb-4">Form Score Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={formData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
                <XAxis dataKey="day" stroke="hsl(220 10% 55%)" fontSize={12} />
                <YAxis domain={[60, 100]} stroke="hsl(220 10% 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220 18% 10%)",
                    border: "1px solid hsl(220 16% 18%)",
                    borderRadius: "8px",
                    color: "hsl(180 10% 92%)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(174 72% 50%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(174 72% 50%)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Rep accuracy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="font-display font-semibold mb-4">Rep Accuracy</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={repData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
                <XAxis dataKey="day" stroke="hsl(220 10% 55%)" fontSize={12} />
                <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220 18% 10%)",
                    border: "1px solid hsl(220 16% 18%)",
                    borderRadius: "8px",
                    color: "hsl(180 10% 92%)",
                  }}
                />
                <Bar dataKey="correct" stackId="a" fill="hsl(155 72% 45%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="incorrect" stackId="a" fill="hsl(0 72% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Error breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="font-display font-semibold mb-4">Error Breakdown</h3>
            <div className="space-y-3">
              {errorTypes.map((err) => (
                <div key={err.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{err.type}</span>
                    <span className="font-semibold">{err.count}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(err.count / 12) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weekly summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="font-display font-semibold mb-4">AI Weekly Summary</h3>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Great progress this week! Your form score improved from <span className="text-foreground font-medium">72 to 91</span>,
                a <span className="text-success font-medium">26% improvement</span>.
                Knee alignment errors dropped significantly. Focus on maintaining depth
                consistency in later reps when fatigue sets in. Consider adding a brief
                rest between sets 2 and 3.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="font-display text-xl font-bold text-primary">7</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Total Reps</p>
                <p className="font-display text-xl font-bold">252</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="font-display text-xl font-bold text-success">93%</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
