'use client'

import { Prisma, Subreddit } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import debounce from 'lodash.debounce'
import { usePathname, useRouter } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState } from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/Command'
import { useOnClickOutside } from '@/hooks/use-on-click-outside'
import { Users } from 'lucide-react'

interface SearchBarProps { }

const SearchBar: FC<SearchBarProps> = ({ }) => {
  const [input, setInput] = useState<string>('')
  const pathname = usePathname()
  const commandRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useOnClickOutside(commandRef, () => {
    setInput('')
  })

  const request = debounce(async () => {
    refetch()
  }, 300)

  const debounceRequest = useCallback(() => {
    request()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    isFetching,
    data: queryResults,
    refetch,
    isFetched,
  } = useQuery({
    queryFn: async () => {
      if (!input) return []
      const { data } = await axios.get(`/api/search?q=${input}`)
      return data as (Subreddit & {
        _count: Prisma.SubredditCountOutputType
      })[]
    },
    queryKey: ['search-query'],
    enabled: false,
  })

  useEffect(() => {
    setInput('')
  }, [pathname])

  return (
    <Command
      ref={commandRef}
      className='relative z-50 mx-auto h-10 w-full min-w-0 max-w-lg flex-1 overflow-visible rounded-full border border-input bg-card [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:h-full'
      aria-label='Buscar comunidades'
      role='search'>
      <CommandInput
        isLoading={isFetching}
        onValueChange={(text) => {
          setInput(text)
          debounceRequest()
        }}
        value={input}
        className='h-9 outline-none border-none focus:border-none focus:outline-none ring-0'
        placeholder='Buscar…'
        aria-label='Campo de búsqueda'
      />

      {input.length > 0 && (
        <CommandList 
          className='absolute top-full inset-x-0 mt-2 rounded-xl border border-border bg-popover'
          role='listbox'
          aria-expanded={true}>
          {isFetched && <CommandEmpty>Sin resultados.</CommandEmpty>}
          {(queryResults?.length ?? 0) > 0 ? (
            <CommandGroup heading='Comunidades'>
              {queryResults?.map((subreddit) => (
                <CommandItem className='cursor-pointer'
                  onSelect={(e) => {
                    router.push(`/r/${e}`)
                    router.refresh()
                  }}
                  key={subreddit.id}
                  value={subreddit.name}
                  role='option'
                  aria-selected='false'>
                  <Users className='mr-2 h-4 w-4' />
                  <Link href={`/r/${subreddit.name}`}>r/{subreddit.name}</Link>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      )}
    </Command>
  )
}

export default SearchBar
