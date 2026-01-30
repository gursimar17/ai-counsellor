"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { profile as profileApi } from "@/lib/api";
import type { Profile } from "@/lib/api";
import Nav from "@/components/Nav";

const COUNTRIES = "United States,United Kingdom,Canada,Australia,Germany,Netherlands,Ireland,Singapore".split(",");
const EDUCATION_LEVELS = ["High School", "Bachelor's", "Master's", "PhD"];
const DEGREES = ["Bachelor's", "Master's", "PhD"];
const FUNDING = ["Self-funded", "Scholarship", "Loan"];
const SOP_STATUS_OPTIONS = ["Not started", "In progress", "Draft", "Ready"];
const EXAM_SUGGESTIONS = ["IELTS", "TOEFL", "GRE", "GMAT", "SAT", "Duolingo English Test", "PTE Academic"];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    current_education_level: "",
    degree_major: "",
    graduation_year: "",
    gpa: "",
    intended_degree: "",
    field_of_study: "",
    target_intake_year: "",
    preferred_countries: [] as string[],
    budget_min: "",
    budget_max: "",
    funding_plan: "",
    exams: [] as { name: string; status: string }[],
    sop_status: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;
    profileApi
      .get()
        .then((p) => {
          setProfile(p);
          setForm({
            current_education_level: p.current_education_level || "",
            degree_major: p.degree_major || "",
            graduation_year: p.graduation_year ? String(p.graduation_year) : "",
            gpa: p.gpa || "",
            intended_degree: p.intended_degree || "",
            field_of_study: p.field_of_study || "",
            target_intake_year: p.target_intake_year ? String(p.target_intake_year) : "",
            preferred_countries: p.preferred_countries || [],
            budget_min: p.budget_min ? String(p.budget_min) : "",
            budget_max: p.budget_max ? String(p.budget_max) : "",
            funding_plan: p.funding_plan || "",
            exams: p.exams || [],
            sop_status: p.sop_status || "",
          });
        })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const toggleCountry = (c: string) => {
    setForm((prev) => ({
      ...prev,
      preferred_countries: prev.preferred_countries.includes(c)
        ? prev.preferred_countries.filter((x) => x !== c)
        : [...prev.preferred_countries, c],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Prepare payload: convert numeric fields to numbers
      const payload: any = {
        ...form,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : undefined,
        target_intake_year: form.target_intake_year ? Number(form.target_intake_year) : undefined,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
        exams: form.exams && form.exams.length > 0 ? form.exams.map((x) => ({ name: x.name, status: x.status })) : undefined,
      };

      const updated = await profileApi.update(payload);
      setProfile(updated);
    } catch {}
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile</h1>
        <p className="text-slate-600 mb-6">Edits will update recommendations and tasks.</p>
        <form onSubmit={handleSave} className="card space-y-6">
          <section>
            <h2 className="font-semibold text-slate-800 mb-3">Academic background</h2>
            <div className="grid gap-3">
              <div>
                <label htmlFor="current_education_level" className="text-sm text-slate-600 mb-1 block">Current education level</label>
                <select
                  id="current_education_level"
                  className="input"
                  value={form.current_education_level}
                  onChange={(e) => setForm({ ...form, current_education_level: e.target.value })}
                >
                  {EDUCATION_LEVELS.map((lv) => (
                    <option key={lv} value={lv}>{lv}</option>
                  ))}
                </select>
              </div>
              <input
                className="input"
                placeholder="Degree / major"
                value={form.degree_major}
                onChange={(e) => setForm({ ...form, degree_major: e.target.value })}
              />
              <input
                className="input"
                placeholder="Graduation year"
                value={form.graduation_year}
                onChange={(e) => setForm({ ...form, graduation_year: e.target.value })}
              />
              <input
                className="input"
                placeholder="GPA or % (optional)"
                value={form.gpa}
                onChange={(e) => setForm({ ...form, gpa: e.target.value })}
              />
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-3">Study goal</h2>
            <div className="grid gap-3">
              <div>
                <label htmlFor="intended_degree" className="text-sm text-slate-600 mb-1 block">Intended degree</label>
                <select
                  id="intended_degree"
                  className="input"
                  value={form.intended_degree}
                  onChange={(e) => setForm({ ...form, intended_degree: e.target.value })}
                >
                  {EDUCATION_LEVELS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <input
                className="input"
                placeholder="Field of study"
                value={form.field_of_study}
                onChange={(e) => setForm({ ...form, field_of_study: e.target.value })}
              />
              <div>
                <label htmlFor="target_intake_year" className="text-sm text-slate-600 mb-1 block">Target intake year</label>
                <select
                  id="target_intake_year"
                  className="input"
                  value={form.target_intake_year}
                  onChange={(e) => setForm({ ...form, target_intake_year: e.target.value })}
                >
                  {Array.from({ length: 4 }).map((_, i) => {
                    const y = new Date().getFullYear() + i;
                    return (
                      <option key={y} value={String(y)}>{y}</option>
                    );
                  })}
                </select>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">Preferred countries</p>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((c) => (
                    <label key={c} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={form.preferred_countries.includes(c)}
                        onChange={() => toggleCountry(c)}
                      />
                      <span className="text-sm">{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-3">Budget</h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Min"
                value={form.budget_min}
                onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
              />
              <input
                className="input"
                placeholder="Max"
                value={form.budget_max}
                onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
              />
              <div className="col-span-2">
                <label htmlFor="funding_plan" className="text-sm text-slate-600 mb-1 block">Funding plan</label>
                <select
                  id="funding_plan"
                  className="input"
                  value={form.funding_plan}
                  onChange={(e) => setForm({ ...form, funding_plan: e.target.value })}
                >
                  {FUNDING.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-slate-800 mb-3">Exams & readiness</h2>
            <div className="grid gap-3">
              {/* Dynamic exams list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Exams</p>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, exams: [...form.exams, { name: "", status: "Not started" }] })}
                    className="text-sm text-teal-600"
                  >
                    + Add exam
                  </button>
                </div>
                <div className="space-y-2">
                  <datalist id="exam-suggestions">
                    {EXAM_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  {form.exams.map((ex, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        list="exam-suggestions"
                        placeholder="Exam name"
                        className="input flex-1"
                        value={ex.name}
                        onChange={(e) => {
                          const copy = [...form.exams];
                          copy[idx] = { ...copy[idx], name: e.target.value };
                          setForm({ ...form, exams: copy });
                        }}
                      />
                      <select
                        className="input w-36"
                        value={ex.status}
                        onChange={(e) => {
                          const copy = [...form.exams];
                          copy[idx] = { ...copy[idx], status: e.target.value };
                          setForm({ ...form, exams: copy });
                        }}
                      >
                        {SOP_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const copy = form.exams.filter((_, i) => i !== idx);
                          setForm({ ...form, exams: copy });
                        }}
                        className="text-red-600"
                        aria-label={`Remove exam ${ex.name || idx}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm block mb-1">SOP status</label>
                <select
                  className="input"
                  value={form.sop_status}
                  onChange={(e) => setForm({ ...form, sop_status: e.target.value })}
                >
                  <option value="">SOP status</option>
                  {SOP_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
