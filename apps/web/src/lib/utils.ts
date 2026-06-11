import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Platform } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PLATFORM_META: Record<Platform, { label: string; color: string; icon: string }> = {
  github:     { label: "GitHub",     color: "#6e7681", icon: "⑂" },
  leetcode:   { label: "LeetCode",   color: "#ffa116", icon: "🧩" },
  codeforces: { label: "Codeforces", color: "#1f8acb", icon: "⚙" },
  hackerrank: { label: "HackerRank", color: "#2ec866", icon: "✦" },
  manual:     { label: "Manual",     color: "#a855f7", icon: "📝" },
};

export const STREAK_META: Record<string, { label: string; icon: string; color: string }> = {
  overall: { label: "Overall",  icon: "🔥", color: "text-orange-400" },
  coding:  { label: "Coding",   icon: "⑂",  color: "text-gray-300" },
  dsa:     { label: "DSA",      icon: "🧩", color: "text-yellow-400" },
  learning:{ label: "Learning", icon: "📚", color: "text-purple-400" },
  project: { label: "Projects", icon: "🏗",  color: "text-blue-400" },
};

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86_400_000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

export function activityLabel(type: string): string {
  const labels: Record<string, string> = {
    commit: "commit",
    pr_merged: "PR merged",
    problem_solved: "problem solved",
    contest_participated: "contest",
    study_session: "study session",
    project_work: "project session",
    article_read: "article read",
    course_progress: "course progress",
  };
  return labels[type] ?? type;
}

export const HEATMAP_COLORS: Record<number, string> = {
  0: "bg-[#161b22]",
  1: "bg-[#0e4429]",
  2: "bg-[#006d32]",
  3: "bg-[#26a641]",
  4: "bg-[#39d353]",
};
