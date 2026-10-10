import React, { useState } from 'react';
import { UserFitnessProfile } from '../types/workout';
import {
  X,
  Download,
  Upload,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Github,
  HardDrive,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserFitnessProfile;
  onRestoreProfile: (imported: UserFitnessProfile) => void;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  profile,
  onRestoreProfile,
}) => {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // GitHub Gist Sync state
  const [githubPat, setGithubPat] = useState<string>(() => localStorage.getItem('apexlift_github_pat') || '');
  const [gistId, setGistId] = useState<string>(() => localStorage.getItem('apexlift_github_gist_id') || '');
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  if (!isOpen) return null;

  // 1. Export JSON file download
  const handleDownloadBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ApexLift-Backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Copy JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // 3. Import JSON from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.completedWorkouts && parsed.badges) {
          onRestoreProfile(parsed);
          setImportStatus({ success: true, msg: 'Profile successfully restored from backup file!' });
        } else {
          setImportStatus({ success: false, msg: 'Invalid backup file structure.' });
        }
      } catch (err) {
        setImportStatus({ success: false, msg: 'Failed to parse JSON file.' });
      }
    };
    reader.readAsText(file);
  };

  // 4. Import from pasted text
  const handleTextImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (parsed.completedWorkouts && parsed.badges) {
        onRestoreProfile(parsed);
        setImportStatus({ success: true, msg: 'Profile successfully restored from pasted JSON!' });
        setImportText('');
      } else {
        setImportStatus({ success: false, msg: 'Invalid backup JSON data.' });
      }
    } catch {
      setImportStatus({ success: false, msg: 'Invalid JSON format. Check syntax.' });
    }
  };

  // 5. GitHub Gist Cloud Sync
  const handleSaveGithubConfig = () => {
    localStorage.setItem('apexlift_github_pat', githubPat);
    localStorage.setItem('apexlift_github_gist_id', gistId);
    setSyncStatus('GitHub tokens saved locally.');
  };

  const handlePushToGithubGist = async () => {
    if (!githubPat) {
      setSyncStatus('Please enter a GitHub Personal Access Token (classic with gist scope).');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Syncing to GitHub Gist...');

    try {
      const payload = {
        description: 'ApexLift Workout & Hypertrophy Progress Cloud Sync',
        public: false,
        files: {
          'apexlift_fitness_profile.json': {
            content: JSON.stringify(profile, null, 2),
          },
        },
      };

      let url = 'https://api.github.com/gists';
      let method = 'POST';

      if (gistId) {
        url = `https://api.github.com/gists/${gistId}`;
        method = 'PATCH';
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${githubPat.trim()}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `GitHub error ${res.status}`);
      }

      const data = await res.json();
      if (!gistId && data.id) {
        setGistId(data.id);
        localStorage.setItem('apexlift_github_gist_id', data.id);
      }
      setSyncStatus(`Successfully backed up to GitHub Gist ID: ${data.id}!`);
    } catch (e: any) {
      setSyncStatus(`Sync error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-3xl shadow-2xl p-5 sm:p-7 text-zinc-100 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Save Progress & Cloud Sync</h2>
              <p className="text-xs text-zinc-400">
                Where is your history stored and how to sync across devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout: How storage currently works */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <HardDrive className="w-4 h-4" />
            <span>Local Storage Active</span>
          </div>
          <p className="text-zinc-300">
            <strong>Yes, all your history is currently saved locally:</strong> Every set, working weight, weekly target,
            consistency streak, and unlocked badge is saved in your browser’s <code className="text-emerald-300 bg-zinc-900 px-1 py-0.5 rounded">localStorage</code> immediately upon completion.
          </p>
          <p className="text-zinc-400">
            To make sure you never lose your progress if you clear your browser cache or switch devices, you can
            download a backup file or sync with GitHub below.
          </p>
        </div>

        {/* SECTION 1: 1-Tap File Download / Backup */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>1-Tap Backup File (Save to Google Drive / iCloud / Local)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadBackup}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download ApexLift-Backup.json</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs transition active:scale-95"
            >
              {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copySuccess ? 'Copied JSON to Clipboard!' : 'Copy Raw Data'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: Restore from File */}
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-sky-400" />
            <span>Restore / Import Progress</span>
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer transition">
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Upload Backup File (.json)</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {importStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {importStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{importStatus.msg}</span>
            </div>
          )}
        </div>

        {/* SECTION 3: GitHub Gist Direct Cloud Sync */}
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Github className="w-4 h-4 text-zinc-300" />
              <span>GitHub Gist Direct Cloud Sync</span>
            </h3>
            <span className="text-[11px] text-zinc-500 font-mono">Private & Free</span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            You can automatically push your workout logs and 1RM history to a private GitHub Gist using a Personal
            Access Token (PAT with <code className="text-zinc-200">gist</code> permission).
          </p>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">GitHub Personal Access Token (PAT):</label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={githubPat}
                onChange={(e) => setGithubPat(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            {gistId && (
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Gist ID:</label>
                <input
                  type="text"
                  value={gistId}
                  onChange={(e) => setGistId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 font-mono text-xs focus:outline-none"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handlePushToGithubGist}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 transition active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Push Progress to GitHub'}</span>
              </button>

              <button
                onClick={handleSaveGithubConfig}
                className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition"
              >
                Save Credentials
              </button>
            </div>

            {syncStatus && (
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-sky-300 font-mono">
                {syncStatus}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
