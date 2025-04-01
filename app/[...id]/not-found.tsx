export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full px-6 py-12 bg-white shadow-lg rounded-lg text-center">
                <h2 className="text-2xl font-bold text-gray-900">Image not found</h2>
                <p className="mt-2 text-gray-600">
                    The image you're looking for doesn't exist or has been deleted.
                </p>
            </div>
        </div>
    )
}