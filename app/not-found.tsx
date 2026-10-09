import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-3xl font-bold text-[#136CFC] mb-2">Page Not Found</h2>
      <p className="text-slate-500 mb-6">Could not find requested resource</p>
      <Link href="/" className="px-4 py-2 bg-[#136CFC] text-white rounded-md hover:bg-[#0d5ad4] transition-colors shadow-sm shadow-[#136CFC]/25">
        Return Home
      </Link>
    </div>
  )
}
