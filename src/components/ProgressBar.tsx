const STEPS = ['Upload', 'Form', 'Review', 'Payment', 'Status']

interface ProgressBarProps {
  currentStep: number
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-6 pb-2">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                i < currentStep
                  ? 'bg-indigo-600 text-white'
                  : i === currentStep
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span
              className={`text-xs hidden sm:block ${
                i === currentStep ? 'text-indigo-700 font-medium' : 'text-slate-400'
              }`}
            >
              {step}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px w-8 sm:w-16 mx-1 ${
                  i < currentStep ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
