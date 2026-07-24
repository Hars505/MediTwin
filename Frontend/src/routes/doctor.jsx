import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/Layout";
import { Reveal } from "@/hooks/use-site-motion";
import { useAuth } from "@/context/AuthContext";
import { reportsAPI, doctorAPI, patientAPI } from "@/lib/api";
import { toast } from "sonner";
import { Stethoscope, Users, FileText, Plus, Settings, Save, Clock, Award, AlertTriangle, Info, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/doctor")({
  beforeLoad: () => {
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: DoctorPanel,
});

function DoctorPanel() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState("");
  const [reportType, setReportType] = useState("full");
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    specialization: '',
    license_number: '',
    department: '',
    years_of_experience: 0,
    consultation_fee: 0,
    bio: '',
  });

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      setLoading(true);
      try {
        const [rRes, dpRes, pRes] = await Promise.allSettled([
          reportsAPI.list(),
          doctorAPI.getProfile(),
          doctorAPI.getPatients(),
        ]);
        if (!ignore) {
          if (rRes.status === "fulfilled") setReports(rRes.value || []);
          if (dpRes.status === "fulfilled" && dpRes.value) {
            setDoctorProfile(dpRes.value);
            setProfileForm({
              specialization: dpRes.value.specialization || '',
              license_number: dpRes.value.license_number || '',
              department: dpRes.value.department || '',
              years_of_experience: dpRes.value.years_of_experience || 0,
              consultation_fee: dpRes.value.consultation_fee || 0,
              bio: dpRes.value.bio || '',
            });
          }
          if (pRes.status === "fulfilled" && pRes.value) {
            setPatients(pRes.value);
          }
        }
      } catch {
        if (!ignore) toast.error("Failed to load data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchData();
    return () => { ignore = true; };
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      await reportsAPI.generate({ report_type: reportType, patient_id: selectedPatient || undefined });
      const data = await reportsAPI.list();
      setReports(data || []);
      toast.success("Report generated successfully!");
    } catch (err) {
      toast.error(err.data?.detail || "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      const result = await doctorAPI.updateProfile(profileForm);
      setDoctorProfile(result.profile || result);
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile.");
    }
  }

  return (
    <AppShell active="/doctor">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Reveal>
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-2">— doctor</p>
            <h1 className="text-4xl md:text-5xl font-semibold">Doctor Panel</h1>
            <p className="mt-2 text-ink/70 text-sm">Manage your profile, patients, and reports.</p>
          </div>
        </Reveal>

        {/* Doctor Profile Card */}
        <Reveal>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Settings size={18} className="text-green" /> My Doctor Profile
          </h2>
          <div className="ticket p-6 mb-10">
            {editMode ? (
              <form onSubmit={handleSaveProfile} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">Specialization</label>
                  <input
                    type="text"
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                    placeholder="e.g., Cardiology"
                    className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">License Number</label>
                  <input
                    type="text"
                    value={profileForm.license_number}
                    onChange={(e) => setProfileForm({ ...profileForm, license_number: e.target.value })}
                    placeholder="MED-XXXXXX"
                    className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">Department</label>
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    placeholder="e.g., Internal Medicine"
                    className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">Years of Experience</label>
                  <input
                    type="number"
                    value={profileForm.years_of_experience}
                    onChange={(e) => setProfileForm({ ...profileForm, years_of_experience: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={profileForm.consultation_fee}
                    onChange={(e) => setProfileForm({ ...profileForm, consultation_fee: parseFloat(e.target.value) || 0 })}
                    min="0"
                    className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">Bio</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Brief professional bio..."
                    rows={3}
                    className="w-full bg-white border border-line rounded-2xl px-5 py-3 outline-none text-sm focus:border-green resize-none"
                  />
                </div>
                <div className="sm:col-span-2 flex gap-3">
                  <button type="submit" className="a-button">
                    <span className="a-button__mask">
                      <span className="a-button__text" data-text="Save Profile"><Save size={14} className="inline mr-1" />Save Profile</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setEditMode(false)} className="a-button a-button--ghost">
                    <span className="a-button__mask">
                      <span className="a-button__text" data-text="Cancel">Cancel</span>
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start gap-6 flex-wrap">
                <div className="w-16 h-16 rounded-full bg-green text-white grid place-items-center text-2xl font-bold shrink-0">
                  {(user?.first_name?.[0] || user?.username?.[0] || 'D').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold">
                    Dr. {user?.first_name} {user?.last_name}
                  </h3>
                  <div className="mt-2 grid sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-green" />
                      <span className="text-ink/70">{doctorProfile?.specialization || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope size={14} className="text-green" />
                      <span className="text-ink/70">{doctorProfile?.department || 'Not set'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-green" />
                      <span className="text-ink/70">{doctorProfile?.years_of_experience || 0} years exp.</span>
                    </div>
                  </div>
                  {doctorProfile?.bio && (
                    <p className="mt-2 text-sm text-ink/60">{doctorProfile.bio}</p>
                  )}
                  <p className="mt-1 text-xs text-ink/40">License: {doctorProfile?.license_number || 'Not set'}</p>
                </div>
                <button onClick={() => setEditMode(true)} className="a-button a-button--ghost">
                  <span className="a-button__mask">
                    <span className="a-button__text" data-text="Edit Profile">Edit Profile</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {/* Assigned Patients */}
        <Reveal>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Users size={18} className="text-green" /> Assigned patients & Clinical Decision Support</h2>
          {patients?.length > 0 ? (
            <div className="grid gap-4 mb-10">
              {patients.map((p) => (
                <div key={p.patient_id} className="ticket p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-soft text-green grid place-items-center font-bold text-lg">
                        {p.first_name?.[0] || 'P'}
                      </div>
                      <div>
                        <h3 className="font-semibold">{p.first_name} {p.last_name} (ID: {p.patient_id})</h3>
                        <p className="text-xs text-ink/60">Age: {p.profile?.demographics?.age || 'N/A'} | Blood: {p.profile?.demographics?.blood_type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Vitals summary */}
                    <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-line">
                      <h4 className="text-[10px] uppercase tracking-widest text-green font-semibold mb-2 flex items-center gap-1"><HeartPulse size={12}/> Latest Vitals</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>BP: <span className="font-medium">{p.latest_vitals?.systolic_bp || '--'}/{p.latest_vitals?.diastolic_bp || '--'}</span></div>
                        <div>HR: <span className="font-medium">{p.latest_vitals?.heart_rate || '--'} bpm</span></div>
                        <div>SpO2: <span className="font-medium">{p.latest_vitals?.spo2 || '--'}%</span></div>
                        <div>Glucose: <span className="font-medium">{p.latest_vitals?.blood_glucose || '--'} mg/dL</span></div>
                      </div>
                    </div>
                    
                    {/* CDS Alerts */}
                    <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 border border-line">
                      <h4 className="text-[10px] uppercase tracking-widest text-green font-semibold mb-2 flex items-center gap-1"><AlertTriangle size={12}/> CDS Alerts</h4>
                      {p.cds_alerts?.length > 0 ? (
                        <div className="space-y-2">
                          {p.cds_alerts.map((alert, idx) => (
                            <div key={idx} className={`p-2 rounded-md text-xs border ${alert.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900' : alert.severity === 'warning' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900'}`}>
                               <div className="font-semibold">{alert.category}</div>
                               <div>{alert.message}</div>
                               <div className="mt-1 opacity-80 italic">Action: {alert.recommendation}</div>
                               <div className="mt-1 text-[9px] opacity-60 flex items-center gap-1"><Info size={10}/> Ref: {alert.reference}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-ink/50">No active alerts. Patient metrics are within normal parameters.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ticket p-10 text-center text-ink/50 mb-10">
              <Users size={28} className="mx-auto mb-2" />
              <p className="text-sm">No patients assigned yet.</p>
            </div>
          )}
        </Reveal>

        {/* Generate Report */}
        <Reveal>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Plus size={18} className="text-green" /> Generate report</h2>
          <form onSubmit={handleGenerate} className="ticket p-6 grid sm:grid-cols-3 gap-4 mb-10">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">Patient ID (optional)</label>
              <input type="text" value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} placeholder="Leave blank for self" className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-green font-semibold mb-1.5">Report type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full bg-white border border-line rounded-full px-5 py-3 outline-none text-sm focus:border-green">
                <option value="full">Full</option>
                <option value="summary">Summary</option>
                <option value="vitals">Vitals only</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={generating} className="a-button w-full justify-center">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text={generating ? "Generating..." : "Generate"}>{generating ? "Generating..." : "Generate"}</span>
                </span>
              </button>
            </div>
          </form>
        </Reveal>

        {/* Recent Reports */}
        <Reveal>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Stethoscope size={18} className="text-green" /> Recent reports</h2>
          {loading ? (
            <div className="ticket p-12 text-center text-ink/50">Loading…</div>
          ) : reports.length === 0 ? (
            <div className="ticket p-12 text-center text-ink/50"><FileText size={32} className="mx-auto mb-3" />No reports available yet.</div>
          ) : (
            <div className="space-y-3">
              {reports.map((r, i) => (
                <div key={r._id || i} className="ticket p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-green-soft text-green grid place-items-center shrink-0"><FileText size={20} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{r.filename || `Report ${i + 1}`}</p>
                    <p className="text-xs text-ink/60 flex gap-3 flex-wrap">
                      <span>Type: {r.report_type || "Full"}</span>
                      {r.patient_id && <span>Patient: #{r.patient_id}</span>}
                      {r.generated_at && <span>{new Date(r.generated_at).toLocaleString()}</span>}
                    </p>
                  </div>
                  {r.filename && (
                    <a
                      href={reportsAPI.downloadUrl(r.filename)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green text-sm font-semibold a-underline"
                    >
                      Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </AppShell>
  );
}
