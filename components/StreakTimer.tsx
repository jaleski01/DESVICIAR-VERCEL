import React, { useEffect, useState } from 'react';
import { COLORS } from '../types';

interface StreakTimerProps {
  startDate?: string;
}

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export const StreakTimer: React.FC<StreakTimerProps> = ({ startDate }) => {
  const [time, setTime] = useState<TimeLeft>({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!startDate) return;

    const start = new Date(startDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = now - start;

      if (difference < 0) {
        setTime({ days: '00', hours: '00', minutes: '00', seconds: '00' });
        setIsLoaded(true);
        return;
      }

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      const pad = (num: number) => num.toString().padStart(2, '0');

      setTime({
        days: pad(d),
        hours: pad(h),
        minutes: pad(m),
        seconds: pad(s)
      });
      setIsLoaded(true);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [startDate]);

  if (!startDate || !isLoaded) {
    return (
      <div className="flex justify-between items-center w-full animate-pulse gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center flex-1">
             <div className="h-10 w-12 bg-gray-800 rounded mb-2"></div>
             <div className="h-3 w-8 bg-gray-900 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const TimeUnit = ({ value, label }: { value: string, label: string }) => (
    <div className="flex flex-col items-center flex-1 min-w-[50px]">
      {/* 
        AJUSTE RESPONSIVO:
        text-3xl para telas pequenas
        text-5xl para telas maiores (sm)
        Isso impede que números grandes (ex: 100 DIAS) quebrem o layout
      */}
      <div 
        className="text-3xl sm:text-5xl font-bold font-mono tracking-tighter text-white drop-shadow-lg leading-none"
      >
        {value}
      </div>
      
      <div 
        className="text-[9px] sm:text-xs font-bold uppercase tracking-widest mt-2"
        style={{ color: COLORS.TextSecondary }}
      >
        {label}
      </div>
    </div>
  );

  return (
    <div className="w-full py-4">
      {/* 
         Flex container configurado para distribuir espaço igualmente 
         sem forçar larguras fixas que causam overflow 
      */}
      <div className="flex flex-row justify-between items-center w-full">
        <TimeUnit value={time.days} label="DIAS" />
        <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
        <TimeUnit value={time.hours} label="HRS" />
        <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
        <TimeUnit value={time.minutes} label="MIN" />
        <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
        <TimeUnit value={time.seconds} label="SEG" />
      </div>
    </div>
  );
};