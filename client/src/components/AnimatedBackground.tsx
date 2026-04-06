export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-white">
      {/* Animated gradient background - more visible */}
      <div className="absolute inset-0 animated-gradient-bg opacity-40"></div>

      {/* Floating blob 1 - Purple/Pink - Top Right */}
      <div 
        className="absolute w-96 h-96 rounded-full animate-blob"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          top: '-100px',
          right: '-100px',
          filter: 'blur(60px)',
          opacity: 0.4,
          mixBlendMode: 'multiply'
        }}
      ></div>

      {/* Floating blob 2 - Pink/Red - Bottom Left */}
      <div 
        className="absolute w-80 h-80 rounded-full animate-blob-2"
        style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          bottom: '-80px',
          left: '-80px',
          filter: 'blur(60px)',
          opacity: 0.4,
          mixBlendMode: 'multiply'
        }}
      ></div>

      {/* Floating blob 3 - Blue/Cyan - Center */}
      <div 
        className="absolute w-72 h-72 rounded-full animate-blob"
        style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)',
          opacity: 0.3,
          mixBlendMode: 'screen',
          animationDelay: '2s'
        }}
      ></div>

      {/* Floating blob 4 - Green - Top Left */}
      <div 
        className="absolute w-64 h-64 rounded-full animate-blob-2"
        style={{
          background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
          top: '-50px',
          left: '10%',
          filter: 'blur(60px)',
          opacity: 0.3,
          mixBlendMode: 'multiply',
          animationDelay: '1s'
        }}
      ></div>

      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-white/30"></div>
    </div>
  );
}
