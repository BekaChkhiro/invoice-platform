// Simple dashboard layout without authentication for testing

export default function WorkingDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified layout for testing */}
      <div className="flex">
        <div className="w-64 bg-gray-900 text-white min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold">Dashboard</h2>
          </div>
          <nav className="px-4 space-y-2">
            <a href="/working-dashboard" className="block px-4 py-2 rounded bg-gray-800">დაშბორდი</a>
            <a href="/working-dashboard/invoices" className="block px-4 py-2 rounded hover:bg-gray-800">ინვოისები</a>
            <a href="/working-dashboard/clients" className="block px-4 py-2 rounded hover:bg-gray-800">კლიენტები</a>
            <a href="/working-dashboard/services" className="block px-4 py-2 rounded hover:bg-gray-800">სერვისები</a>
            <a href="/working-dashboard/settings" className="block px-4 py-2 rounded hover:bg-gray-800">პარამეტრები</a>
          </nav>
        </div>
        <div className="flex-1">
          <div className="bg-white shadow p-4 mb-6">
            <h1 className="text-lg font-semibold">Working Dashboard</h1>
          </div>
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}