export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient-bg opacity-20"></div>

      {/* Floating blob 1 - Purple/Pink */}
      <div className="bg-blob bg-blob-1"></div>

      {/* Floating blob 2 - Pink/Red */}
      <div className="bg-blob bg-blob-2"></div>

      {/* Floating blob 3 - Blue/Cyan */}
      <div className="bg-blob bg-blob-3"></div>

      {/* Subtle overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white/50"></div>
    </div>
  );
}
