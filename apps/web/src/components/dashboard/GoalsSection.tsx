"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { api } from "../../lib/api";
import { celebrate } from "../../lib/celebrate";
import type { Goal } from "../../types";

function GoalCard({ goal, onUpdate }: { goal: Goal; onUpdate: () => void }) {
  const pct = Math.min(100, (goal.current_value / goal.target_value) * 100);
  const isComplete = pct >= 100;

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-colors ${
      isComplete ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-white/5"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-gray-200">{goal.title}</div>
          {goal.deadline && (
            <div className="text-xs text-gray-600 mt-0.5">Due: {goal.deadline}</div>
          )}
        </div>
        {isComplete && <span className="text-lg">🏆</span>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
          </span>
          <span className={isComplete ? "text-emerald-400 font-semibold" : "text-gray-500"}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? "bg-emerald-400" : "bg-blue-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={async () => {
            const val = prompt("Update current value:", String(goal.current_value));
            if (val === null) return;
            const newValue = parseFloat(val);
            const justCompleted = newValue >= goal.target_value && goal.current_value < goal.target_value;
            await api.goals.update(goal.id, {
              currentValue: newValue,
              ...(justCompleted ? { status: "completed" } : {}),
            } as Parameters<typeof api.goals.update>[1]);
            if (justCompleted) celebrate();
            onUpdate();
          }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Update
        </button>
        <span className="text-gray-700">·</span>
        <button
          onClick={async () => {
            if (!confirm("Delete this goal?")) return;
            await api.goals.delete(goal.id);
            onUpdate();
          }}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

const GOAL_TYPES = [
  { value: "leetcode_count", label: "LeetCode problems" },
  { value: "commit_count", label: "GitHub commits" },
  { value: "codeforces_count", label: "Codeforces problems" },
  { value: "study_hours", label: "Study sessions" },
  { value: "project_sessions", label: "Project sessions" },
  { value: "hackerrank_count", label: "HackerRank problems" },
];

export function GoalsSection() {
  const { mutate } = useSWRConfig();
  const { data: goals } = useSWR("goals", () => api.goals.list(), { revalidateOnFocus: false });

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ title: "", goalType: "leetcode_count", targetValue: 100, deadline: "" });

  const handleCreate = async () => {
    await api.goals.create({
      title: form.title,
      goal_type: form.goalType,
      target_value: form.targetValue,
      deadline: form.deadline || undefined,
    } as Parameters<typeof api.goals.create>[0]);
    await mutate("goals");
    setIsAdding(false);
    setForm({ title: "", goalType: "leetcode_count", targetValue: 100, deadline: "" });
  };

  const activeGoals = goals?.filter((g) => g.status === "active") ?? [];
  const completedGoals = goals?.filter((g) => g.status === "completed") ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Goals</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          {isAdding ? "Cancel" : "+ New Goal"}
        </button>
      </div>

      {isAdding && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <input
            type="text"
            placeholder="Goal title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.goalType}
              onChange={(e) => setForm({ ...form, goalType: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-gray-300 focus:outline-none"
            >
              {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              type="number"
              placeholder="Target"
              value={form.targetValue}
              onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
            />
          </div>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={!form.title || !form.targetValue}
            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
          >
            Create Goal
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {activeGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onUpdate={() => mutate("goals")} />
        ))}
        {activeGoals.length === 0 && !isAdding && (
          <div className="col-span-full text-center text-gray-600 py-6 text-sm">
            No active goals. Set one to track your progress.
          </div>
        )}
      </div>

      {completedGoals.length > 0 && (
        <details className="text-xs text-gray-600 cursor-pointer">
          <summary className="hover:text-gray-400 transition-colors">
            {completedGoals.length} completed goal{completedGoals.length > 1 ? "s" : ""}
          </summary>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdate={() => mutate("goals")} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
