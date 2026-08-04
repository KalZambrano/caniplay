import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
        <Link to="/" className="flex items-center gap-2 text-text hover:text-brand-strong">
          <svg className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12">
            <path
              fill="currentColor"
              d="M2 5H1v1h1Zm0 0h7V4H6V2H5v2H2Zm-1 7h2v-1H1Zm-1-1h1V6H0Zm3 0h5v-1H3Zm0-2h1V8h1V7H4V6H3v1H2v1h1Zm5 3h2v-1H8ZM6 8h1V7H6Zm1 1h1V8H7Zm0-2h1V6H7Zm1 1h1V7H8Zm2 3h1V6h-1ZM4 2h1V1H4Zm5 4h1V5H9Zm0 0"
            />
          </svg>
          <span className="font-display text-lg font-bold tracking-wide">CanIPlay</span>
        </Link>
      </div>
    </header>
  )
}
