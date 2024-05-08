'use client'

import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'
import { ExtendedPost } from '@/types/db'
import { useIntersection } from '@mantine/hooks'
import { useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'
import { FC, useEffect, useRef, useState } from 'react'
import Post from './Post'
import { useSession } from 'next-auth/react'

import '@/styles/loader.css'
import { SkeletonCard } from './SkeletonCard'

interface PostFeedProps {
  initialPosts: ExtendedPost[]
  subredditName?: string
  username?: string
}

const PostFeed: FC<PostFeedProps> = ({ initialPosts, subredditName, username }) => {

  const lastPostRef = useRef<HTMLElement>(null)
  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  })
  const { data: session } = useSession()
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState(initialPosts);

  // const { data, fetchNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery(
  //   ['infinite-query'],
  //   async ({ pageParam = 1 }) => {
  //     let query = `/api/posts?limit=${INFINITE_SCROLL_PAGINATION_RESULTS}&page=${pageParam}`

  //     if (username) {
  //       query += `&username=${username}`
  //     }

  //     if (subredditName) {
  //       query += `&subredditName=${subredditName}`
  //     }

  //     console.log('query: ', query)

  //     const { data } = await axios.get(query)
  //     return data as ExtendedPost[]
  //   },

  //   {
  //     getNextPageParam: (_, pages) => {
  //       return pages.length + 1
  //     },
  //     // initialData: { pages: [initialPosts], pageParams: [1] },
  //   }
  // )

  // console.log('isLoading:', isLoading);

  // useEffect(() => {
  //   if (entry?.isIntersecting) {
  //     fetchNextPage() // Load more posts when the last post comes into view
  //   }
  // }, [entry, fetchNextPage])

  // const posts = data?.pages.flatMap((page) => page) ?? initialPosts

  const loadNextPage = async () => {
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    let query = `/api/posts?limit=${INFINITE_SCROLL_PAGINATION_RESULTS}&page=${nextPage}`;

    if (username) {
      query += `&username=${username}`;
    }

    if (subredditName) {
      query += `&subredditName=${subredditName}`;
    }

    try {
      const { data: newPosts } = await axios.get(query);
      setCurrentPage(nextPage);
      setPosts([...posts, ...newPosts]);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <ul className='flex flex-col col-span-2 space-y-6'>
      {
        isLoadingMore ? (
          <>
            <SkeletonCard />
          </>
        ) : (
          posts.map((post, index) => {
            const votesAmt = post.votes.reduce((acc, vote) => {
              if (vote.type === 'UP') return acc + 1
              if (vote.type === 'DOWN') return acc - 1
              return acc
            }, 0)

            const currentVote = post.votes.find(
              (vote) => vote.userId === session?.user.id
            )

            if (posts.length >= 2 && posts.length - 2 === index) {
              // Add a ref to the last post in the list
              return (
                <li key={post.id} ref={ref}>
                  <Post
                    post={post}
                    commentAmt={post.comments.length}
                    subredditName={post.subreddit.name}
                    votesAmt={votesAmt}
                    currentVote={currentVote}
                  />
                </li>
              )
            } else {
              return (
                <Post
                  key={post.id}
                  post={post}
                  commentAmt={post.comments.length}
                  subredditName={post.subreddit.name}
                  votesAmt={votesAmt}
                  currentVote={currentVote}
                />
              )
            }
          })
        )}
      {!isLoadingMore && (
        <li className='flex justify-center'>
          <button onClick={loadNextPage}>Cargar más posts</button>
        </li>
      )}
    </ul>
  )
}

export default PostFeed


// {isLoadingMore && (
//   <li className='flex justify-center'>
//     {/* <Loader2 className='w-6 h-6 text-zinc-500 animate-spin' /> */}
//     <div className="loader"></div>
//   </li>
// )}

// /*

// 1. Importaciones: Importa varias utilidades y componentes necesarios, incluyendo useIntersection de @mantine/hooks para detectar cuando un elemento está en la vista, useInfiniteQuery de @tanstack/react-query para manejar la paginación infinita, y axios para hacer solicitudes HTTP.

// 2. Props: PostFeed acepta initialPosts, que son los posts iniciales a mostrar, y subredditName, que es el nombre del subreddit del que se deben cargar los posts.

// 3. useIntersection: Utiliza el hook useIntersection para crear una referencia (ref) a un elemento y un objeto entry que contiene información sobre si el elemento está en la vista o no.

// 4. useInfiniteQuery: Utiliza el hook useInfiniteQuery para cargar posts de manera paginada. Cuando se llama a fetchNextPage, se carga la siguiente página de posts. La función de consulta hace una solicitud GET a /api/posts, pasando el número de página y el nombre del subreddit como parámetros de consulta.

// 5. useEffect: Utiliza el hook useEffect para llamar a fetchNextPage cuando el último post entra en la vista (es decir, cuando entry.isIntersecting es true).

// 6. Renderizado: Renderiza una lista de posts. Para cada post, calcula la cantidad de votos y el voto actual del usuario. Si el post es el penúltimo en la lista, le añade la referencia creada por useIntersection para que se pueda detectar cuando este post entra en la vista y cargar más posts. También muestra un cargador cuando se están cargando más posts.

// */
// 'use client'
// import React, { FC, useState } from 'react';
// import axios from 'axios';
// import { ExtendedPost } from '@/types/db';
// import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config';
// import Post from './Post';
// import { SkeletonCard } from './SkeletonCard';
// import { useSession } from 'next-auth/react'

// interface PostFeedProps {
//   initialPosts: ExtendedPost[];
//   subredditName?: string;
//   username?: string;
// }

// const PostFeed: FC<PostFeedProps> = ({ initialPosts, subredditName, username }) => {
//   const [isLoadingMore, setIsLoadingMore] = useState(false);
//   const [allPostsLoaded, setAllPostsLoaded] = useState(false);
//   const [posts, setPosts] = useState(initialPosts);
//   const { data: session } = useSession();

//   const loadMorePosts = async () => {
//     if (allPostsLoaded) return; // Evitar cargar más si ya se cargaron todos los posts

//     setIsLoadingMore(true);
//     const nextPage = posts.length / INFINITE_SCROLL_PAGINATION_RESULTS + 1;
//     let query = `/api/posts?limit=${INFINITE_SCROLL_PAGINATION_RESULTS}&page=${nextPage}`;

//     if (username) {
//       query += `&username=${username}`;
//     }

//     if (subredditName) {
//       query += `&subredditName=${subredditName}`;
//     }

//     try {
//       const { data: newPosts } = await axios.get(query);

//       if (newPosts.length === 0) {
//         setAllPostsLoaded(true);
//       } else {
//         setPosts(prevPosts => [...prevPosts, ...newPosts]);
//       }
//     } catch (error) {
//       console.error('Error loading more posts:', error);
//     } finally {
//       setIsLoadingMore(false);
//     }
//   };

//   const calculateVotesAmt = (post: ExtendedPost) => {
//     return post.votes.reduce((acc, vote) => {
//       if (vote.type === 'UP') return acc + 1;
//       if (vote.type === 'DOWN') return acc - 1;
//       return acc;
//     }, 0);
//   };

//   const getCurrentVote = (post: ExtendedPost) => {
//     return post.votes.find(vote => vote.userId === session?.user.id);
//   };

//   return (
//     <ul className='flex flex-col col-span-2 space-y-6'>
//       {isLoadingMore && <li className='flex justify-center'>Cargando...</li>}
//       {!isLoadingMore &&
//         posts.map((post, index) => (
//           <Post
//             key={post.id}
//             post={post}
//             commentAmt={post.comments.length}
//             subredditName={post.subreddit.name}
//             votesAmt={calculateVotesAmt(post)}
//             currentVote={getCurrentVote(post)}
//           />
//         ))}
//       {!isLoadingMore && !allPostsLoaded && (
//         <li className='flex justify-center'>
//           <button onClick={loadMorePosts}>Cargar más posts</button>
//         </li>
//       )}
//     </ul>
//   );
// };

// export default PostFeed;


