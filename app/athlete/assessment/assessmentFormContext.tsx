"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AssessmentFormValues } from "@/app/lib/hyroxAssessmentPayload";

export const emptyAssessmentValues = (): AssessmentFormValues => ({
  fullName: "",
  email: "",
  phone: "",
  trainingDays: [] as string[],
  equipmentAccess: [] as string[],
  stationRatings: {} as Record<string, number>,
  additionalConsent: [] as string[],
});

type Ctx = {
  values: AssessmentFormValues;
  setField: (key: string, value: unknown) => void;
  setFields: (patch: AssessmentFormValues) => void;
};

const AssessmentFormContext = createContext<Ctx | null>(null);

export function AssessmentFormProvider({
  children,
  initialValues,
}: {
  children: ReactNode;
  initialValues?: AssessmentFormValues;
}) {
  const [values, setValues] = useState<AssessmentFormValues>(
    () => initialValues ?? emptyAssessmentValues()
  );

  const setField = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFields = useCallback((patch: AssessmentFormValues) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const ctx = useMemo(() => ({ values, setField, setFields }), [values, setField, setFields]);

  return (
    <AssessmentFormContext.Provider value={ctx}>{children}</AssessmentFormContext.Provider>
  );
}

export function useAssessmentForm() {
  const ctx = useContext(AssessmentFormContext);
  if (!ctx) {
    throw new Error("useAssessmentForm must be used within AssessmentFormProvider");
  }
  return ctx;
}
