'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { FileText, Gauge, User, Users } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useEffect, useRef, useState } from 'react'

import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/Command'
import { useOnClickOutside } from '@/hooks/use-on-click-outside'
import { MIN_QUERY, normalizeQuery, totalResults, type SearchResults } from '@/lib/search'

const DEBOUNCE_MS = 250

/** Search over communities, users, post titles and drivers. "/" focuses it from anywhere on the page. */
const SearchBar: FC = () => {
  const [input, setInput] = useState('')
  const [debounced, setDebounced] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const commandRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useOnClickOutside(commandRef, () => setInput(''))

  // wait for a pause in typing before asking the server
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(normalizeQuery(input) ?? ''), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [input])

  useEffect(() => {
    setInput('')
  }, [pathname])

  // "/" focuses the search unless the user is already typing somewhere
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const { data, isFetching, isError } = useQuery({
    queryKey: ['search', debounced],
    queryFn: async () => (await axios.get<SearchResults>('/api/search', { params: { q: debounced } })).data,
    enabled: debounced.length >= MIN_QUERY,
    staleTime: 30_000,
  })

  const go = (href: string) => {
    setInput('')
    inputRef.current?.blur()
    router.push(href)
  }

  const typed = normalizeQuery(input) !== null
  const settled = typed && debounced === normalizeQuery(input) && !isFetching
  const count = data ? totalResults(data) : 0

  return (
    <Command
      ref={commandRef}
      shouldFilter={false}
      className='relative z-50 mx-auto h-10 w-full min-w-[5rem] max-w-lg flex-1 overflow-visible rounded-full border border-input bg-card focus-within:border-display focus-within:ring-2 focus-within:ring-ring [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:h-full'
      aria-label='Buscar en FastLap'
      role='search'
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setInput('')
          inputRef.current?.blur()
        }
      }}>
      <CommandInput
        ref={inputRef}
        isLoading={isFetching}
        onValueChange={setInput}
        value={input}
        className='h-9 outline-none border-none focus:border-none focus:outline-none ring-0'
        placeholder='Buscar…'
        aria-label='Buscar comunidades, usuarios, publicaciones y pilotos'
      />
      {input.length === 0 && (
        <kbd
          aria-hidden='true'
          className='pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-input px-1.5 font-mono text-[10px] leading-4 text-muted-foreground md:block'>
          /
        </kbd>
      )}

      {/* always in the DOM: the input's aria-controls points at it; hidden while there is nothing to show */}
      <CommandList hidden={input.length === 0} className='fixed inset-x-4 top-16 max-h-[70vh] rounded-xl border border-border bg-popover sm:absolute sm:inset-x-0 sm:top-full sm:mt-2'>
          {!typed && <p className='px-4 py-3 text-sm text-muted-foreground'>Escribe al menos {MIN_QUERY} letras.</p>}
          {isError && <p className='px-4 py-3 text-sm text-signal'>No se ha podido buscar. Inténtalo de nuevo.</p>}
          {typed && settled && !isError && count === 0 && <CommandEmpty>Sin resultados para «{normalizeQuery(input)}».</CommandEmpty>}

          {data && typed && data.communities.length > 0 && (
            <CommandGroup heading='Comunidades'>
              {data.communities.map((c) => (
                <CommandItem key={c.name} value={`c:${c.name}`} onSelect={() => go(`/r/${c.name}`)} className='cursor-pointer gap-2'>
                  <Users className='h-4 w-4 shrink-0' aria-hidden='true' />
                  <span className='truncate'>r/{c.name}</span>
                  <span className='label ml-auto shrink-0'>{c.members} {c.members === 1 ? 'MIEMBRO' : 'MIEMBROS'}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {data && typed && data.users.length > 0 && (
            <CommandGroup heading='Usuarios'>
              {data.users.map((u) => (
                <CommandItem key={u.username} value={`u:${u.username}`} onSelect={() => go(`/u/${u.username}`)} className='cursor-pointer gap-2'>
                  <User className='h-4 w-4 shrink-0' aria-hidden='true' />
                  <span className='truncate'>u/{u.username}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {data && typed && data.posts.length > 0 && (
            <CommandGroup heading='Publicaciones'>
              {data.posts.map((p) => (
                <CommandItem key={p.id} value={`p:${p.id}`} onSelect={() => go(`/r/${p.community}/post/${p.id}`)} className='cursor-pointer gap-2'>
                  <FileText className='h-4 w-4 shrink-0' aria-hidden='true' />
                  <span className='truncate'>{p.title}</span>
                  <span className='label ml-auto shrink-0'>r/{p.community}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {data && typed && data.drivers.length > 0 && (
            <CommandGroup heading='Pilotos'>
              {data.drivers.map((d) => (
                <CommandItem key={d.id} value={`d:${d.id}`} onSelect={() => go(`/f1-dashboard/piloto/${d.id}`)} className='cursor-pointer gap-2'>
                  <Gauge className='h-4 w-4 shrink-0' aria-hidden='true' />
                  <span className='truncate'>{d.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
    </Command>
  )
}

export default SearchBar
