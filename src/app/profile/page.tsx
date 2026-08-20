"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { User, Eye, EyeOff, ShieldCheck, Link2, Check } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";

const AVATARS = Array.from({ length: 11 }, (_, i) => ({
  id: `av-${i + 1}`,
  src: `/profiles/${i + 1}.png`,
}));

function getAvatarUrl(avatarId: string): string {
  const av = AVATARS.find(a => a.id === avatarId);
  return av ? av.src : "";
}

export default function ProfilePage() {
  return <AuthGuard feature="Profile"><ProfileContent /></AuthGuard>;
}

function ProfileContent() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.user_metadata?.avatar_id || "");
  const [avatarLoading, setAvatarLoading] = useState(false);

  const identities = user?.identities || [];
  const hasGoogle = identities.some((id) => id.provider === "google");
  const googleAvatar = user?.user_metadata?.avatar_url;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user?.user_metadata?.avatar_id) {
      setSelectedAvatar(user.user_metadata.avatar_id);
    }
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const currentAvatarUrl = selectedAvatar
    ? getAvatarUrl(selectedAvatar)
    : googleAvatar || "";

  const handleSaveAvatar = async () => {
    setAvatarLoading(true);
    let supabase;
    try {
      supabase = createClient();
    } catch {
      toast("Supabase client failed to load", "error");
      setAvatarLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_id: selectedAvatar },
      });
      if (error) throw error;
      toast("Profile picture updated!");
    } catch (err: unknown) {
      toast((err as Error).message || "Failed to update profile picture", "error");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }
    if (password.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast("Password must contain at least one number", "error");
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      toast("Password must contain at least one special character", "error");
      return;
    }

    setPasswordLoading(true);
    let supabase;
    try {
      supabase = createClient();
    } catch {
      toast("Supabase client failed to load", "error");
      setPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast("Password saved successfully!");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    } catch (err: unknown) {
      console.error(err);
      toast((err as Error).message || "Failed to update password", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setGoogleLoading(true);
    let supabase;
    try {
      supabase = createClient();
    } catch {
      toast("Supabase client failed to load", "error");
      setGoogleLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      console.error(err);
      toast((err as Error).message || "Failed to link Google account", "error");
      setGoogleLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="notebook-paper min-h-screen p-8 pt-16 lg:pl-20">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-paper-dark rounded" />
          <div className="h-64 bg-paper-dark rounded mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="notebook-paper min-h-screen page-enter">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 pt-16 lg:pl-20">
        <h1 className="font-handwritten text-3xl sm:text-4xl text-ink-dark mb-6">Profile</h1>

        {/* Profile Picture Selection */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4">Profile Picture</h3>

          {/* Current avatar preview */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-paper-dark shadow-md">
              {currentAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user avatar
                <img src={currentAvatarUrl} alt="Profile" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-warm/20 to-accent-warm/5 flex items-center justify-center">
                  <User size={18} className="text-accent-warm" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-ink-dark">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-ink-light">Choose from below</p>
            </div>
          </div>

          {/* Avatar grid */}
          <div className="grid grid-cols-6 gap-2 mb-4">
            {/* Google avatar option */}
            {hasGoogle && googleAvatar && (
              <button
                onClick={() => setSelectedAvatar("google")}
                className={`relative w-full aspect-square rounded-xl overflow-hidden ring-2 transition-all ${
                  selectedAvatar === "google"
                    ? "ring-accent-warm shadow-md scale-105"
                    : "ring-transparent hover:ring-paper-dark/50"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- OAuth avatar */}
                <img src={googleAvatar} alt="Google" className="w-full h-full object-cover" />
                {selectedAvatar === "google" && (
                  <div className="absolute inset-0 bg-accent-warm/20 flex items-center justify-center">
                    <Check size={18} className="text-white drop-shadow" />
                  </div>
                )}
              </button>
            )}

            {/* Predefined avatars */}
            {AVATARS.map((av) => (
              <button
                key={av.id}
                onClick={() => setSelectedAvatar(av.id)}
                className={`relative w-full aspect-square rounded-xl overflow-hidden ring-2 transition-all ${
                  selectedAvatar === av.id
                    ? "ring-accent-warm shadow-md scale-105"
                    : "ring-transparent hover:ring-paper-dark/50"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- predefined avatar */}
                <img src={av.src} alt="" className="w-full h-full object-cover" />
                {selectedAvatar === av.id && (
                  <div className="absolute inset-0 bg-accent-warm/20 flex items-center justify-center">
                    <Check size={18} className="text-white drop-shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleSaveAvatar}
            disabled={avatarLoading || !selectedAvatar}
            className="px-5 py-2.5 bg-accent-warm text-white rounded text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer font-sans"
          >
            {avatarLoading ? "Saving..." : "Save Picture"}
          </button>
        </div>

        {/* Account & Security */}
        <div className="paper-card p-6 mb-6">
          <h3 className="font-handwritten text-xl text-ink-dark mb-4 flex items-center gap-2">
            <ShieldCheck size={18} /> Account &amp; Security
          </h3>

          <div className="mb-6 p-4 bg-paper-dark/50 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-ink-light">Email Address</span>
              <span className="text-ink-dark font-semibold">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium border-t border-[rgba(0,0,0,0.06)] pt-2.5">
              <span className="text-ink-light">Google Sync</span>
              {hasGoogle ? (
                <span className="px-2.5 py-0.5 bg-accent-green/10 text-accent-green text-[10px] font-bold rounded-full border border-accent-green/20 flex items-center gap-1">
                  ✓ Connected
                </span>
              ) : (
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={handleLinkGoogle}
                  className="flex items-center gap-1 px-3 py-1 bg-white border border-[rgba(0,0,0,0.12)] hover:bg-gray-50 rounded text-neutral-800 text-[10px] font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Link2 size={11} /> Link Google Account
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <p className="text-xs text-ink-light font-bold uppercase tracking-wide">Set / Update Password</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-ink-light uppercase tracking-wide mb-1 font-semibold">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-xs text-ink-dark focus:outline-none focus:border-accent-warm transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-medium focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-ink-light uppercase tracking-wide mb-1 font-semibold">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 bg-paper-bg border border-[rgba(0,0,0,0.08)] rounded text-xs text-ink-dark focus:outline-none focus:border-accent-warm transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 bg-accent-warm text-white rounded text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer font-sans"
            >
              {passwordLoading ? "Saving..." : "Save Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
