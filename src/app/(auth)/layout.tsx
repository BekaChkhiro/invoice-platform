import Link from "next/link"
import { FileText } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-primary p-2 rounded-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">
            Invoice Platform
          </span>
        </Link>
        
        {/* Auth Form Container */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {children}
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">
          © 2024 Invoice Platform. ყველა უფლება დაცულია.
        </p>
      </div>
    </div>
  )
}