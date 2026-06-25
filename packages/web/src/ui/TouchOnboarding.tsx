import React from 'react';

const TOUCH_ONBOARDING_KEY = 'tetris:touch-onboarding:v1';

/** Props controlling whether the touch onboarding hint may be displayed. */
export interface TouchOnboardingProps {
  visible: boolean;
}

/**
 * Shows a dismissible, one-time local hint for board taps, dragging, and drop gestures.
 */
export function TouchOnboarding({ visible }: TouchOnboardingProps): JSX.Element | null {
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem(TOUCH_ONBOARDING_KEY) === 'dismissed';
    } catch {
      return false;
    }
  });

  if (!visible || dismissed) return null;

  return (
    <aside className="touch-onboarding" aria-label="touch-onboarding">
      <span>
        Tap the left or right board half to rotate. Drag horizontally to move. Drag down slowly and
        hold for Soft Drop; flick down quickly for Hard Drop; flick up quickly for Hold.
      </span>
      <button
        type="button"
        aria-label="Dismiss touch hint"
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem(TOUCH_ONBOARDING_KEY, 'dismissed');
          } catch {
            // Storage can be unavailable in private or restricted contexts.
          }
        }}
      >
        Got it
      </button>
    </aside>
  );
}
