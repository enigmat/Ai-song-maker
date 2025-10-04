import React, { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'mustbmusic_onboarding_complete_v1';

const steps = [
    {
        title: "Welcome to Recipe Mode!",
        content: "Let's create your first song together. This quick guide will walk you through the simple steps to turn your idea into a complete musical piece."
    },
    {
        title: "Step 1: The Big Idea",
        content: "Everything starts with an idea. In the 'Your Song Idea' box, describe what you want your song to be about. It can be a simple phrase like 'a rainy day in Tokyo' or a full story."
    },
    {
        title: "Step 2: Set the Vibe",
        content: "Now, choose the style. Use the dropdowns to select a Genre, Mood, and Tempo. These settings guide the AI in crafting the perfect sound for your idea."
    },
    {
        title: "Step 3: Generate!",
        content: "Once you're happy with your idea and style, hit the 'Generate with AI' button. Our AI will compose a full song package for you, including lyrics, a beat, and an artist profile."
    },
    {
        title: "Step 4: Review & Finalize",
        content: "After generation, you'll land in the editor. Here you can tweak the lyrics, change the beat, and even generate a music video. When you're ready, click 'Create Artist & Finalize' to see the finished product."
    },
    {
        title: "You're Ready to Create!",
        content: "That's it! You now know the basics of creating music with the app. Feel free to explore all the other powerful tools. Enjoy your creative journey!"
    }
];

interface OnboardingWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    
    // Reset to the first step whenever the wizard is opened
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
        }
    }, [isOpen]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };
    
    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        try {
            // Still mark as complete when closed, but now the parent controls visibility
            localStorage.setItem(ONBOARDING_KEY, 'true');
        } catch (e) {
            console.error("Could not save onboarding status.", e);
        }
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-200">Recipe Mode</h2>
                    <button onClick={handleClose} className="text-sm text-gray-400 hover:text-white">Skip</button>
                </header>
                <main className="p-6 text-center flex-grow">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                        {step.title}
                    </h3>
                    <p className="mt-4 text-gray-300 leading-relaxed">
                        {step.content}
                    </p>
                </main>
                <footer className="p-4 border-t border-gray-700 flex justify-between items-center">
                    <div className="flex gap-1">
                        {steps.map((_, index) => (
                             <div key={index} className={`w-2 h-2 rounded-full transition-colors ${index === currentStep ? 'bg-purple-500' : 'bg-gray-600'}`}></div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                         {currentStep > 0 && (
                            <button onClick={handlePrev} className="px-4 py-2 text-gray-300 font-semibold rounded-lg border-2 border-gray-600 hover:bg-gray-700 transition-colors">
                                Back
                            </button>
                        )}
                        <button onClick={handleNext} className="px-5 py-2 text-white font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all">
                            {isLastStep ? "Let's Go!" : "Next"}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};