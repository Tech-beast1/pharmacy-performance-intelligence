export function PageHeader() {
  const PPILogoUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663468724713/S4YkwNcqjTUWGj5JFbbkiz/ppi-logo-d2hc4Ly38HBq4HMxQA5qtx.webp';

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-900/80 via-purple-900/80 to-blue-900/80 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-2 md:gap-4 px-3 md:px-6 py-2 md:py-4">
        {/* Logo - Original Blue Color */}
        <div className="flex-shrink-0">
          <img 
            src={PPILogoUrl} 
            alt="PPI" 
            className="h-8 md:h-12 w-8 md:w-12 drop-shadow-lg"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.3))', backgroundColor: '#a46060', borderColor: '#f9fafa'
            }}
          />
        </div>
        
        {/* Header Text - Hidden on Mobile */}
        <div className="flex-1 min-w-0 hidden md:block">
          <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight truncate">
            Pharmacy Performance Intelligence
          </h1>
          <p className="text-xs md:text-sm text-white/70 truncate">
            Data Intelligence for Pharmacies
          </p>
        </div>
      </div>
    </div>
  );
}
