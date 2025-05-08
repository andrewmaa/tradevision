import React from 'react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

function ScoreCircle({ score }: { score: number }) {
    const radius = 36;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const target = Math.max(0, Math.min(score, 100));
  
    // Get color based on score
    const getScoreColor = (score: number) => {
      if (score >= 50) return "#22c55e"; // green
      if (score >= 30) return "#eab308"; // yellow
      return "#ef4444"; // red
    };
  
    // Get tooltip message based on score
    const getTooltipMessage = (score: number) => {
      if (score === 0) {
        return "No score available or an error occurred computing the Hype Index.";
      }
      if (score >= 50) {
        return "This score indicates a strong positive sentiment with high market confidence, suggesting favorable conditions for investment.";
      }
      if (score >= 30) {
        return "This score shows moderate market sentiment with mixed signals, suggesting cautious consideration before investment.";
      }
      return "This score indicates concerning market sentiment with potential risks, suggesting careful evaluation before investment.";
    };
  
    // Animation state
    const [animatedScore, setAnimatedScore] = React.useState(0);
  
    React.useEffect(() => {
      let frame: number;
      let start: number | null = null;
      const duration = 900; // ms
      const initial = animatedScore;
      const diff = target - initial;
  
      function animate(ts: number) {
        if (start === null) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        setAnimatedScore(initial + diff * progress);
        if (progress < 1) {
          frame = requestAnimationFrame(animate);
        } else {
          setAnimatedScore(target);
        }
      }
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
      // eslint-disable-next-line
    }, [target]);
  
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
    const scoreColor = getScoreColor(animatedScore);
  
    return (
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <div className="cursor-help group">
            <svg 
              height={radius * 2 + 4} 
              width={radius * 2 + 4} 
              viewBox={`0 0 ${radius * 2 + 4} ${radius * 2 + 4}`}
              className="translate-x-[-2px] translate-y-[-2px]"
            >
              <circle
                stroke="#e5e7eb"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius + 2}
                cy={radius + 2}
                className="transition-all duration-200 group-hover:stroke-[10px]"
              />
              <circle
                stroke={scoreColor}
                fill="transparent"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference + ' ' + circumference}
                style={{ 
                  strokeDashoffset, 
                  transition: 'stroke-dashoffset 0.5s, stroke 0.5s, stroke-width 0.2s',
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center'
                }}
                r={normalizedRadius}
                cx={radius + 2}
                cy={radius + 2}
                className="transition-all duration-200 group-hover:stroke-[10px]"
              />
              <text
                x={radius + 2}
                y={radius + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="1.5rem"
                fontWeight="bold"
                fill="#222"
              >
                {Math.round(animatedScore)}
              </text>
            </svg>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Hype Index Score: {Math.round(animatedScore)}</h4>
            <p className="text-sm text-muted-foreground">
              {getTooltipMessage(animatedScore)}
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }

export { ScoreCircle };