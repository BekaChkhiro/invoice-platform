export default function WorkingDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">მოგესალმებით!</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">დღეს</h3>
          <p className="text-2xl font-bold">₾0</p>
          <p className="text-xs text-gray-500">0% წინა დღესთან</p>
        </div>
        
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">ამ თვეში</h3>
          <p className="text-2xl font-bold">₾0</p>
          <p className="text-xs text-gray-500">0% წინა თვესთან</p>
        </div>
        
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">აქტიური ინვოისები</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-gray-500">დაიწყეთ პირველი ინვოისით</p>
        </div>
        
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">კლიენტები</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-gray-500">დაამატეთ პირველი კლიენტი</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <h3 className="text-green-800 font-medium">✅ Working Dashboard</h3>
        <p className="text-green-600 text-sm mt-1">
          ეს არის მუშავი dashboard authentication-ის გარეშე
        </p>
        <div className="mt-2 space-y-1 text-sm text-green-600">
          <p>• /working-dashboard - მთავარი გვერდი</p>
          <p>• /working-dashboard/invoices - ინვოისები</p>
          <p>• /working-dashboard/clients - კლიენტები</p>
          <p>• /working-dashboard/settings - პარამეტრები</p>
        </div>
      </div>
    </div>
  )
}