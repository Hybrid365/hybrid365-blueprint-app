"use client";

import { useState } from "react";
import AssessmentPageView, { type AssessmentViewForm } from "@/components/dashboard/assessment/AssessmentPageView";

export default function AssessmentPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>("goal");
  const [formData, setFormData] = useState<AssessmentViewForm>({
    goal: "",
    event: "",
    daysPerWeek: "",
    sessionLength: "",
    fiveKm: "",
    rowing: "",
    skiErg: "",
    weight: "",
    height: "",
    experience: "",
    equipment: [] as string[],
    limitations: "",
    priorities: [],
  });

  return (
    <AssessmentPageView
      formData={formData}
      expandedSection={expandedSection}
      onToggleSection={(section) =>
        setExpandedSection((prev) => (prev === section ? null : section))
      }
      onSetField={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
      onToggleMulti={(field, value) =>
        setFormData((prev) => ({
          ...prev,
          [field]: prev[field].includes(value)
            ? prev[field].filter((item) => item !== value)
            : [...prev[field], value],
        }))
      }
      onSave={() => {}}
      saveLabel="Save Assessment"
    />
  );
}
