import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

export function Tour({ steps, isOpen, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const updatePosition = () => {
      const step = steps[currentStep];
      if (!step || !step.target) return;
      
      const el = document.querySelector(step.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        // Scroll into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, currentStep, steps]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      if (onComplete) onComplete();
      onClose();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(s => Math.max(0, s - 1));
  };

  return (
    <>
      {/* Overlay to prevent interaction with the background while tour is active */}
      <div className="fixed inset-0 bg-black/20 z-40" aria-hidden="true" />
      
      {/* Highlight ring around target */}
      {targetRect && (
        <div 
          className="fixed border-2 border-green ring-4 ring-green/20 rounded-xl transition-all duration-300 z-40 pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tour popover */}
      <div 
        className="fixed z-50 ticket p-6 max-w-sm w-full bg-white shadow-2xl transition-all duration-300 transform scale-100 opacity-100"
        style={{
          top: targetRect ? Math.max(10, targetRect.bottom + 16) : '50%',
          left: targetRect ? Math.max(10, targetRect.left) : '50%',
          transform: targetRect ? 'none' : 'translate(-50%, -50%)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-ink/50 hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-green rounded-full p-1"
          aria-label="Close tour"
        >
          <X size={18} />
        </button>
        
        <div className="text-[10px] uppercase tracking-widest text-green font-bold mb-2">
          Step {currentStep + 1} of {steps.length}
        </div>
        
        <h3 id="tour-title" className="text-lg font-semibold mb-2">{step.title}</h3>
        <p className="text-sm text-ink/70 mb-6">{step.content}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span 
                key={i} 
                className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-green' : 'bg-green/20'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                className="p-2 text-ink/60 hover:text-ink hover:bg-green-soft rounded-full transition-colors"
                aria-label="Previous step"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-full font-semibold text-sm hover:bg-green-hover transition-colors shadow-lg shadow-green/20"
            >
              {isLastStep ? (
                <>Finish <Check size={16} /></>
              ) : (
                <>Next <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
