import React from 'react';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

interface RirGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RirGuideModal: React.FC<RirGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 text-zinc-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Scientific Autoregulation Guide</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Rating of Perceived Exertion (RPE) & Reps in Reserve (RIR) Protocol
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-5 text-sm">
          {/* Overview text */}
          <div className="bg-zinc-800/60 p-3.5 rounded-xl border border-zinc-700/60 leading-relaxed text-zinc-300">
            <span className="font-semibold text-emerald-400">Evidence-Based Autoregulation Rule: </span>
            Autoregulation allows you to adjust on the fly based on daily readiness. If you're feeling explosive,
            push for the top of the rep range or higher load; if fatigue is high, match the prescribed RPE without
            compromising form.
          </div>

          {/* RPE & RIR Scale Table */}
          <div>
            <h3 className="font-bold text-zinc-200 mb-2">MASS Research Review RIR-Based Scale</h3>
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">RPE Score</th>
                    <th className="py-2.5 px-3">RIR (Reps In Reserve)</th>
                    <th className="py-2.5 px-3">Subjective Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 font-mono">
                  <tr className="bg-red-500/10 text-red-300 font-semibold">
                    <td className="py-2.5 px-3">10</td>
                    <td className="py-2.5 px-3">0 RIR</td>
                    <td className="font-sans text-zinc-200">Maximal Effort. Could not complete another rep.</td>
                  </tr>
                  <tr className="bg-orange-500/10 text-orange-300">
                    <td className="py-2.5 px-3">9.5</td>
                    <td className="py-2.5 px-3">0 RIR (Load)</td>
                    <td className="font-sans text-zinc-300">No more reps possible, but could marginally increase weight.</td>
                  </tr>
                  <tr className="bg-amber-500/10 text-amber-300">
                    <td className="py-2.5 px-3">9</td>
                    <td className="py-2.5 px-3">1 RIR</td>
                    <td className="font-sans text-zinc-300">Definitely 1 rep left in the tank before muscular failure.</td>
                  </tr>
                  <tr className="bg-yellow-500/10 text-yellow-300">
                    <td className="py-2.5 px-3">8.5</td>
                    <td className="py-2.5 px-3">1 - 2 RIR</td>
                    <td className="font-sans text-zinc-300">Definitely 1, maybe 2 reps remaining.</td>
                  </tr>
                  <tr className="bg-emerald-500/10 text-emerald-300">
                    <td className="py-2.5 px-3">8</td>
                    <td className="py-2.5 px-3">2 RIR</td>
                    <td className="font-sans text-zinc-300">2 reps left in the tank. Solid working set sweet spot.</td>
                  </tr>
                  <tr className="text-zinc-400">
                    <td className="py-2.5 px-3">7 - 7.5</td>
                    <td className="py-2.5 px-3">3 RIR</td>
                    <td className="font-sans text-zinc-400">Moderate effort. Standard for early acclimation or warmup sets.</td>
                  </tr>
                  <tr className="text-zinc-500">
                    <td className="py-2.5 px-3">5 - 6</td>
                    <td className="py-2.5 px-3">4 - 6 RIR</td>
                    <td className="font-sans text-zinc-500">Light Effort. Warm-up and primer sets only.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Safety Clarification for RIR 0 from PDF */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Safety Rule for RIR 0 (Failure)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong>For Heavy Compounds (Squats, RDLs, Leg Press, Lunges):</strong> RIR 0 means you are 100%
              confident you had zero reps left, but for spinal and joint safety, you <em>do not</em> attempt and
              catastrophically fail the rep under the bar.
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong>For Isolations & Machines (Curls, Pushdowns, Lateral Raises, Crunches):</strong> RIR 0 means you
              attempt the final repetition with full intensity until concentric movement ceases.
            </p>
          </div>

          {/* Warmup protocol reminder */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Warmup Pyramid Blueprint</span>
            </div>
            <p className="text-xs text-zinc-400">
              Warm-up sets do not build muscle—they prime the nervous system and lubricate joints.
              Use our interactive Warm-Up Calculator inside any exercise to get exact 45%, 65%, and 85% plate weights.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition"
          >
            Got it, Let's Lift
          </button>
        </div>
      </div>
    </div>
  );
};
