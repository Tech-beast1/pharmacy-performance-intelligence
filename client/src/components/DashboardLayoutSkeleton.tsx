export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="w-[280px] border-r border-border bg-background p-4 space-y-6 opacity-60">
        {/* Logo area */}
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-md bg-gray-300" />
          <div className="h-4 w-24 bg-gray-300 rounded" />
        </div>

        {/* Menu items */}
        <div className="space-y-2 px-2">
          <div className="h-10 w-full rounded-lg bg-gray-300" />
          <div className="h-10 w-full rounded-lg bg-gray-300" />
          <div className="h-10 w-full rounded-lg bg-gray-300" />
        </div>

        {/* User profile area at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3 px-1">
            <div className="h-9 w-9 rounded-full bg-gray-300" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-300 rounded" />
              <div className="h-2 w-32 bg-gray-300 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-4 space-y-4 opacity-60">
        {/* Content blocks */}
        <div className="h-12 w-48 rounded-lg bg-gray-300" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-32 rounded-xl bg-gray-300" />
          <div className="h-32 rounded-xl bg-gray-300" />
          <div className="h-32 rounded-xl bg-gray-300" />
        </div>
        <div className="h-64 rounded-xl bg-gray-300" />
      </div>
    </div>
  );
}
