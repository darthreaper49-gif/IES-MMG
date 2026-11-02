import { useId } from 'react';
import { VideoOff } from 'lucide-react';
export function SyntheticScene({
  scene = 0,
  unavailable = false,
  label,
  unavailableLabel,
}: {
  scene?: number;
  unavailable?: boolean;
  label: string;
  unavailableLabel: string;
}) {
  const id = useId().replace(/:/g, '');
  if (unavailable)
    return (
      <div className="synthetic-scene unavailable">
        <VideoOff size={30} />
        <span>{unavailableLabel}</span>
        <small>NO SIGNAL · SIMULATION</small>
      </div>
    );
  const outdoor = scene % 3 !== 2;
  return (
    <div className="synthetic-scene">
      <svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
        <defs>
          <linearGradient id={`${id}-sky`} x2="0" y2="1">
            <stop stopColor={outdoor ? '#9baeb0' : '#b6bdb8'} />
            <stop offset="1" stopColor="#d4d7c9" />
          </linearGradient>
          <linearGradient id={`${id}-ground`} x2="0" y2="1">
            <stop stopColor="#a5aaa0" />
            <stop offset="1" stopColor="#777f77" />
          </linearGradient>
          <filter id={`${id}-grain`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".7"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope=".09" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
        </defs>
        <g filter={`url(#${id}-grain)`}>
          <rect width="640" height="360" fill={`url(#${id}-sky)`} />
          {outdoor ? (
            <>
              <path d="M0 185L320 128 640 185V360H0Z" fill={`url(#${id}-ground)`} />
              <path d="M0 62L245 95V219L0 265Z" fill="#c4c4b5" />
              <path d="M0 62L245 95 258 85 0 45Z" fill="#dedfd2" />
              <path d="M640 48L414 91V218L640 274Z" fill="#b8bcae" />
              <path d="M640 48L414 91 400 80 640 32Z" fill="#dadfd3" />
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <path d={`M${24 + i * 43} ${91 + i * 5}v42l27 3v-42Z`} fill="#607a7c" />
                  <path d={`M${610 - i * 37} ${84 + i * 3}v42l-24 4v-42Z`} fill="#637a78" />
                </g>
              ))}
              <rect x="251" y="117" width="155" height="84" fill="#d2d1bf" />
              <rect x="299" y="144" width="51" height="57" fill="#5c7471" />
              <path d="M244 117H413L397 107H260Z" fill="#e4e1cf" />
              <path d="M300 203L211 360H452L345 203Z" fill="#c1c1b1" />
              <path d="M319 205L326 360" stroke="#dadacb" strokeWidth="2" />
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <path d={`M${80 + i * 74} ${244 + i * 31}l45 -8 28 12 -47 10Z`} fill="#6c786c" />
                  <path
                    d={`M${87 + i * 74} ${245 + i * 31}v20m38 -24v20`}
                    stroke="#535e54"
                    strokeWidth="5"
                  />
                </g>
              ))}
              <path d="M534 235v-75" stroke="#626d59" strokeWidth="8" />
              <ellipse cx="535" cy="143" rx="40" ry="47" fill="#6f856c" />
              <ellipse cx="518" cy="144" rx="28" ry="34" fill="#829577" />
              {scene % 2 === 0 && (
                <g>
                  <path d="M413 251l42 -10 40 15 -5 24 -64 4Z" fill="#657b80" />
                  <path d="M425 249l12 -17 27 1 17 18Z" fill="#819699" />
                  <ellipse cx="435" cy="280" rx="8" ry="6" fill="#414b4b" />
                  <ellipse cx="480" cy="275" rx="8" ry="6" fill="#414b4b" />
                </g>
              )}
            </>
          ) : (
            <>
              <path d="M0 0L250 110H390L640 0Z" fill="#d5d8cf" />
              <path d="M0 360L250 220H390L640 360Z" fill="#a7afa7" />
              <path d="M0 0L250 110V220L0 360Z" fill="#c5c8ba" />
              <path d="M640 0L390 110V220L640 360Z" fill="#b2beb2" />
              <rect x="250" y="110" width="140" height="110" fill="#d4d7c9" />
              <rect x="290" y="137" width="57" height="83" fill="#708782" />
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <path
                    d={`M${40 + i * 65} ${65 + i * 24}v${190 - i * 35}l40 -${15 + i * 3}V${80 + i * 23}Z`}
                    fill="#8b9e93"
                  />
                  <path
                    d={`M${585 - i * 62} ${65 + i * 24}v${190 - i * 35}l-35 -${15 + i * 3}V${80 + i * 23}Z`}
                    fill="#78918a"
                  />
                </g>
              ))}
              <path
                d="M270 220L190 360M370 220L450 360M0 310H640M120 265H520"
                stroke="#c6cdc2"
                strokeWidth="2"
              />
              <path d="M230 45H410L380 65H260Z" fill="#f3f3df" />
            </>
          )}
          <rect width="640" height="360" fill="#183b35" opacity=".08" />
        </g>
        <path
          d="M20 44V20H44M596 20H620V44M620 316V340H596M44 340H20V316"
          stroke="white"
          strokeOpacity=".55"
          fill="none"
          strokeWidth="1.5"
        />
      </svg>
      <span className="scene-label">{label}</span>
    </div>
  );
}
