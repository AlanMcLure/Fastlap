'use client'

// Switches between the dark (default) and light theme. The label is chosen with
// CSS (see .when-dark / .when-light in globals.css), so no state is needed and
// there is no hydration mismatch.
const ThemeToggle = () => {
  const toggle = () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // storage can be blocked (private mode); the theme still changes for this visit
    }
  }

  return (
    <button
      type='button'
      onClick={toggle}
      className='label whitespace-nowrap rounded-full px-3 py-2 transition-colors hover:text-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      aria-label='Cambiar entre tema claro y oscuro'>
      {/* phones: a short mark, so the search keeps room in the header */}
      <span className='sm:hidden' aria-hidden='true'>[◐]</span>
      <span className='hidden sm:inline'>
        <span className='when-dark'>[ CLARO ]</span>
        <span className='when-light'>[ OSCURO ]</span>
      </span>
    </button>
  )
}

export default ThemeToggle
