import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t p-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} AnonHost
        </p>
        <div className="hidden">
          <div className="flex gap-4">
            <Link
              href="/terms"
              className="text-sm text-gray-500 hover:underline dark:text-gray-400"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-gray-500 hover:underline dark:text-gray-400"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
