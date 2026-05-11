"use client";

import { Timer, Scale, Waves, Wind } from "lucide-react";
import TestingPageView from "@/components/dashboard/testing/TestingPageView";

export default function TestingPage() {
  return (
    <TestingPageView
      benchmarks={[
        {
          id: "5km",
          title: "5km TT",
          icon: <Timer className="w-6 h-6" />,
          current: "24:32",
          previous: "25:45",
          change: -4.7,
          unit: "min",
          lastTested: "2 weeks ago",
          history: [
            { date: "Week 12", value: "24:32" },
            { date: "Week 8", value: "25:12" },
            { date: "Week 4", value: "25:45" },
            { date: "Baseline", value: "26:30" },
          ],
        },
        {
          id: "skierg",
          title: "1km SkiErg",
          icon: <Wind className="w-6 h-6" />,
          current: "3:52",
          previous: "4:05",
          change: -5.3,
          unit: "min",
          lastTested: "1 week ago",
          history: [
            { date: "Week 12", value: "3:52" },
            { date: "Week 8", value: "3:58" },
            { date: "Week 4", value: "4:05" },
            { date: "Baseline", value: "4:15" },
          ],
        },
        {
          id: "row",
          title: "1km Row",
          icon: <Waves className="w-6 h-6" />,
          current: "3:28",
          previous: "3:35",
          change: -3.3,
          unit: "min",
          lastTested: "1 week ago",
          history: [
            { date: "Week 12", value: "3:28" },
            { date: "Week 8", value: "3:32" },
            { date: "Week 4", value: "3:35" },
            { date: "Baseline", value: "3:45" },
          ],
        },
        {
          id: "bodyweight",
          title: "Bodyweight",
          icon: <Scale className="w-6 h-6" />,
          current: "78.5",
          previous: "80.2",
          change: -2.1,
          unit: "kg",
          lastTested: "Today",
          history: [
            { date: "Week 12", value: "78.5" },
            { date: "Week 8", value: "79.1" },
            { date: "Week 4", value: "80.2" },
            { date: "Baseline", value: "82.0" },
          ],
        },
      ]}
      retestTimeline={[
        { week: "Baseline", date: "Jan 15", completed: true },
        { week: "Week 4", date: "Feb 12", completed: true },
        { week: "Week 8", date: "Mar 12", completed: true },
        { week: "Week 12", date: "Apr 9", completed: false, current: true },
      ]}
      recentTests={[
        {
          id: "r1",
          test: "5km TT",
          result: "24:32",
          date: "Apr 2, 2026",
          improvement: true,
          icon: <Timer className="w-5 h-5 text-muted-foreground" />,
        },
        {
          id: "r2",
          test: "Bodyweight",
          result: "78.5 kg",
          date: "Apr 9, 2026",
          improvement: true,
          icon: <Scale className="w-5 h-5 text-muted-foreground" />,
        },
        {
          id: "r3",
          test: "1km Row",
          result: "3:28",
          date: "Apr 1, 2026",
          improvement: true,
          icon: <Waves className="w-5 h-5 text-muted-foreground" />,
        },
        {
          id: "r4",
          test: "1km SkiErg",
          result: "3:52",
          date: "Mar 28, 2026",
          improvement: true,
          icon: <Wind className="w-5 h-5 text-muted-foreground" />,
        },
      ]}
      testOptions={[
        { id: "5km", label: "5km Time Trial", icon: <Timer className="w-5 h-5" /> },
        { id: "skierg", label: "1km SkiErg", icon: <Wind className="w-5 h-5" /> },
        { id: "row", label: "1km Row", icon: <Waves className="w-5 h-5" /> },
        { id: "bodyweight", label: "Bodyweight", icon: <Scale className="w-5 h-5" /> },
      ]}
      onSaveTest={() => {}}
    />
  );
}
