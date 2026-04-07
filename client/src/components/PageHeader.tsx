export function PageHeader() {
  const PPILogoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663468724713/S4YkwNcqjTUWGj5JFbbkiz/ppi-logo-d2hc4Ly38HBq4HMxQA5qtx.webp';

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-blue-900/80 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-4 px-6 py-4">
        {/* Logo - White colored */}
        <div className="flex-shrink-0">
          <img 
            src={PPILogoUrl} 
            alt="PPI" 
            className="h-12 w-12 brightness-200 drop-shadow-lg"
            style={{
              filter: 'brightness(200%) drop-shadow(0 0 8px rgba(255,255,255,0.5))'
            }}
          />
        </div>
        
        {/* Header Text */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Pharmacy Performance Intelligence
          </h1>
          <p className="text-sm text-white/70">
            Data Intelligence for High-Performance Pharmacies
          </p>
        </div>
      </div>
    </div>
  );
}
