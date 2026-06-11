"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { api } from "../../lib/api";

const ACTIVITY_TYPES = [
  { value: "study_session", label: "Study Session" },
  { value: "project_work", label: "Project Work" },
  { value: "article_read", label: "Article Read" },
  { value: "course_progress", label: "Course Progress" },
];

interface Props {
  onClose: () => void;
}

export function LogActivityModal({ onClose }: Props) {
  const { mutate } = useSWRConfig();
  const [form, setForm] = useState({
    activityType: "study_session",
    date: new Date().toISOString().slice(0, 10),
    durationMinutes: 60,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.activities.logManual(form);
      await mutate(() => true, undefined, { revalidate: true });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c2128] p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Log Activity</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Activity Type</label>
            <select
              value={form.activityType}
              onChange={(e) => setForm({ ...form, activityType: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="What did you work on?"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
          >
            {submitting ? "Logging…" : "Log Activity"}
          </button>
        </div>
      </div>
    </div>
  );
}
