import { useEffect, useState } from 'react';

export type TwoStepFlowStep = 1 | 2;

export function useTwoStepEmailFlow() {
  const [step, setStep] = useState<TwoStepFlowStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return {
    step,
    setStep,
    isLoading,
    setIsLoading,
    isSendingCode,
    setIsSendingCode,
    email,
    setEmail,
    countdown,
    setCountdown,
  };
}
