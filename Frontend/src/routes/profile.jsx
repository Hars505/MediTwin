import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Reveal } from "@/hooks/use-site-motion";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";
import { User, Mail, Phone, Calendar, Shield, Save, Edit3, Lock, Eye, EyeOff, CheckCircle2, X, Activity, Stethoscope, ChevronRight } from "lucide-react";
import { DOB_MIN, dobMax, calculateAge, validateName, validatePhone, validateDateOfBirth } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    if (!localStorage.getItem("access_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: Profile,
});

function Field({ label, value, subValue, icon: Icon }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold flex items-center gap-1">
        {Icon && <Icon size={11} />} {label}
      </span>
      <span className={`text-sm ${empty ? "text-ink/40 italic" : "text-ink font-medium"}`}>
        {empty ? "Not set" : value}
      </span>
      {subValue && (
        <span className="text-[11px] text-ink/50">{subValue}</span>
      )}
    </div>
  );
}

function Profile() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pwdForm, setPwdForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });
  const [pwdSaving, setPwdSaving] = useState(false);

  // DOB limits and age — hooks must always run regardless of loading/profile state.
  const formAge = useMemo(() => calculateAge(form.date_of_birth), [form.date_of_birth]);
  const profileAge = useMemo(() => calculateAge(profile?.date_of_birth), [profile?.date_of_birth]);

  useEffect(() => {
    let ignore = false;
    async function fetchProfile() {
      setLoading(true);
      try {
        const data = await authAPI.profile();
        if (!ignore) {
          setProfile(data);
          setForm({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            gender: data.gender || "",
            date_of_birth: data.date_of_birth || "",
          });
        }
      } catch {
        if (!ignore) toast.error("Failed to load profile.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchProfile();
    return () => { ignore = true; };
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handlePwdChange(e) {
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });
  }

  async function handleSave() {
    setSaving(true);
    // Field-level validation (mirrors register.jsx so the same rules apply on edit).
    const fieldErrs = [];
    const fn = validateName(form.first_name, "First name");
    const ln = validateName(form.last_name, "Last name");
    const ph = validatePhone(form.phone);
    const db = form.date_of_birth ? validateDateOfBirth(form.date_of_birth) : "";
    if (fn) fieldErrs.push(`First name: ${fn}`);
    if (ln) fieldErrs.push(`Last name: ${ln}`);
    if (ph) fieldErrs.push(`Phone: ${ph}`);
    if (db) fieldErrs.push(`Date of birth: ${db}`);
    if (fieldErrs.length) {
      setSaving(false);
      toast.error(fieldErrs.join(" "));
      return;
    }
    try {
      const data = await authAPI.updateProfile(form);
      setProfile(data);
      setEditMode(false);
      await refreshProfile();
      toast.success("Profile updated successfully.");
    } catch (err) {
      const data = err.data;
      if (data && typeof data === "object") {
        const k = Object.keys(data)[0];
        const v = data[k];
        toast.error(Array.isArray(v) ? `${k}: ${v[0]}` : `${k}: ${v}`);
      } else {
        toast.error("Failed to update profile.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      gender: profile.gender || "",
      date_of_birth: profile.date_of_birth || "",
    });
    setEditMode(false);
  }

  async function handleChangePassword() {
    if (!pwdForm.old_password || !pwdForm.new_password) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (pwdForm.new_password.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      toast.error("New passwords don't match.");
      return;
    }
    setPwdSaving(true);
    try {
      await authAPI.changePassword({
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      setPwdForm({ old_password: "", new_password: "", confirm_password: "" });
      toast.success("Password changed successfully.");
    } catch (err) {
      const data = err.data;
      if (data?.old_password) {
        toast.error("Current password is incorrect.");
      } else if (data?.new_password) {
        const v = data.new_password;
        toast.error(Array.isArray(v) ? v[0] : v);
      } else {
        toast.error("Failed to change password.");
      }
    } finally {
      setPwdSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center text-ink/50">Loading profile…</div>
      </Layout>
    );
  }

  if (!profile) {
    // Not authenticated or profile failed to load — redirect to login.
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-ink/60 mb-4">You need to be signed in to view your profile.</p>
          <Link to="/login" className="a-button inline-flex">
            <span className="a-button__mask">
              <span className="a-button__text" data-text="Sign in">Sign in</span>
            </span>
          </Link>
        </div>
      </Layout>
    );
  }

  const fullName = (`${profile?.first_name || ""} ${profile?.last_name || ""}`).trim() || profile?.username || "";
  const initials = fullName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "U";
  const role = profile?.is_admin_user ? "Admin" : profile?.is_doctor ? "Doctor" : "Patient";
  const RoleIcon = profile?.is_admin_user ? Shield : profile?.is_doctor ? Stethoscope : Activity;


  const inputCls = "flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 focus-within:border-green transition-colors";
  const inputInnerCls = "flex-1 outline-none bg-transparent text-sm";

  // DOB limits for the date picker.
  const minDob = DOB_MIN;
  const maxDob = dobMax(10);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-green font-semibold mb-3">
                — your account
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold">My Profile</h1>
              <p className="mt-2 text-ink/70 text-sm">View and manage your account information.</p>
            </div>
            {!editMode ? (
              <button type="button" onClick={() => setEditMode(true)} className="a-button">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text="Edit profile">Edit profile</span>
                </span>
              </button>
            ) : (
              <div className="flex gap-3">
                <button type="button" onClick={handleCancel} className="a-button a-button--ghost">
                  <span className="a-button__mask">
                    <span className="a-button__text" data-text="Cancel">Cancel</span>
                  </span>
                </button>
                <button type="button" onClick={handleSave} disabled={saving} className="a-button">
                  <span className="a-button__mask">
                    <span className="a-button__text" data-text={saving ? "Saving..." : "Save changes"}>
                      {saving ? "Saving..." : "Save changes"}
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {/* Identity card */}
        <div className="ticket p-8 md:p-10 mb-8">
          <div className="flex items-center gap-5 pb-6 border-b border-line">
            <div className="w-20 h-20 rounded-full bg-green text-white grid place-items-center text-3xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{fullName}</h2>
              <p className="text-ink/70 text-sm mt-1">{profile?.email}</p>
              <span className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-soft text-green text-[10px] uppercase tracking-widest font-semibold">
                <RoleIcon size={11} /> {role}
              </span>
            </div>
          </div>

          {!editMode ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <Field label="First name" value={profile?.first_name} icon={User} />
              <Field label="Last name" value={profile?.last_name} icon={User} />
              <Field label="Username" value={profile?.username} icon={User} />
              <Field label="Email" value={profile?.email} icon={Mail} />
              <Field label="Phone" value={profile?.phone} icon={Phone} />
              <Field label="Gender" value={profile?.gender} icon={User} />
              <Field
                label="Date of birth"
                value={profile?.date_of_birth}
                subValue={profileAge !== null ? `${profileAge} years old` : undefined}
                icon={Calendar}
              />
              <Field label="Role" value={role} icon={Shield} />
              <Field label="Member since" value={profile?.date_joined?.split("T")[0]} icon={Calendar} />
            </div>
          ) : (
            <div className="grid gap-4 mt-8">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">First name</label>
                  <div className={inputCls}><User size={18} className="text-ink/50" /><input className={inputInnerCls} type="text" name="first_name" value={form.first_name} onChange={handleChange} maxLength={50} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Last name</label>
                  <div className={inputCls}><User size={18} className="text-ink/50" /><input className={inputInnerCls} type="text" name="last_name" value={form.last_name} onChange={handleChange} maxLength={50} /></div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Email</label>
                <div className={inputCls}><Mail size={18} className="text-ink/50" /><input className={inputInnerCls} type="email" name="email" value={form.email} onChange={handleChange} /></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Phone</label>
                  <div className={inputCls}><Phone size={18} className="text-ink/50" /><input className={inputInnerCls} type="tel" name="phone" value={form.phone} onChange={handleChange} maxLength={20} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Gender</label>
                  <div className={inputCls}>
                    <select className={inputInnerCls} name="gender" value={form.gender} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Date of birth</label>
                <div className={inputCls}><Calendar size={18} className="text-ink/50" /><input className={inputInnerCls} type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} min={minDob} max={maxDob} /></div>
                {formAge !== null && (
                  <p className="text-xs text-ink/60 mt-1 px-3">Age: {formAge} years</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Change password */}
        <div className="ticket p-8 md:p-10">
          <h3 className="text-xl font-semibold flex items-center gap-2 mb-1">
            <Lock size={18} /> Change password
          </h3>
          <p className="text-sm text-ink/60 mb-6">Use 8+ characters with a mix of letters and numbers.</p>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Current password</label>
              <div className={inputCls} style={{ paddingRight: 0 }}>
                <Lock size={18} className="text-ink/50" />
                <input className={inputInnerCls} type={showPwd.old ? "text" : "password"} name="old_password" value={pwdForm.old_password} onChange={handlePwdChange} placeholder="Enter current password" />
                <button type="button" tabIndex={-1} onClick={() => setShowPwd((s) => ({ ...s, old: !s.old }))} className="px-3 text-ink/50">
                  {showPwd.old ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">New password</label>
                <div className={inputCls}>
                  <Lock size={18} className="text-ink/50" />
                  <input className={inputInnerCls} type={showPwd.new ? "text" : "password"} name="new_password" value={pwdForm.new_password} onChange={handlePwdChange} placeholder="Minimum 8 characters" />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd((s) => ({ ...s, new: !s.new }))} className="text-ink/50">
                    {showPwd.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-green">Confirm new password</label>
                <div className={inputCls}>
                  <Lock size={18} className="text-ink/50" />
                  <input className={inputInnerCls} type={showPwd.confirm ? "text" : "password"} name="confirm_password" value={pwdForm.confirm_password} onChange={handlePwdChange} placeholder="Re-enter password" />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))} className="text-ink/50">
                    {showPwd.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" onClick={handleChangePassword} disabled={pwdSaving} className="a-button">
                <span className="a-button__mask">
                  <span className="a-button__text" data-text={pwdSaving ? "Updating..." : "Update password"}>
                    {pwdSaving ? "Updating..." : "Update password"}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
