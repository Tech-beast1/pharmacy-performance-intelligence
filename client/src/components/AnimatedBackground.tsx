export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-40px) translateX(20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-50px) translateX(-30px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(30px) translateX(40px); }
        }
        @keyframes float4 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(-20px); }
        }
        
        .blob-1 {
          animation: float1 8s ease-in-out infinite;
        }
        .blob-2 {
          animation: float2 10s ease-in-out infinite;
        }
        .blob-3 {
          animation: float3 12s ease-in-out infinite;
        }
        .blob-4 {
          animation: float4 9s ease-in-out infinite;
        }
      `}</style>

      {/* Background base */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>

      {/* Blob 1 - Purple/Pink - Top Right */}
      <div 
        className="blob-1 absolute"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.4) 100%)',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          top: '-100px',
          right: '-100px',
          filter: 'blur(80px)',
          opacity: 0.6,
        }}
      ></div>

      {/* Blob 2 - Pink/Red - Bottom Left */}
      <div 
        className="blob-2 absolute"
        style={{
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(240, 147, 251, 0.8) 0%, rgba(245, 87, 108, 0.4) 100%)',
          borderRadius: '50% 40% 30% 70% / 60% 50% 40% 50%',
          bottom: '-80px',
          left: '-80px',
          filter: 'blur(80px)',
          opacity: 0.6,
        }}
      ></div>

      {/* Blob 3 - Blue/Cyan - Center Right */}
      <div 
        className="blob-3 absolute"
        style={{
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(79, 172, 254, 0.8) 0%, rgba(0, 242, 254, 0.4) 100%)',
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          top: '40%',
          right: '10%',
          filter: 'blur(80px)',
          opacity: 0.5,
        }}
      ></div>

      {/* Blob 4 - Green - Top Left */}
      <div 
        className="blob-4 absolute"
        style={{
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(132, 250, 176, 0.8) 0%, rgba(143, 211, 244, 0.4) 100%)',
          borderRadius: '70% 30% 50% 50% / 50% 50% 30% 70%',
          top: '-50px',
          left: '5%',
          filter: 'blur(80px)',
          opacity: 0.5,
        }}
      ></div>

      {/* Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/10"></div>
    </div>
  );
}
