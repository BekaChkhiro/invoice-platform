export default function DashboardPage() {
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
    </div>
  )
}