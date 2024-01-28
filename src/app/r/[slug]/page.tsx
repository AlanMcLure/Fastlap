import MiniCreatePost from '@/components/MiniCreatePost'
import PostFeed from '@/components/PostFeed'
import { INFINITE_SCROLL_PAGINATION_RESULTS } from '@/config'
import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    slug: string
  }
}

const page = async ({ params }: PageProps) => {
  const { slug } = params

  const session = await getAuthSession()

  const subreddit = await db.subreddit.findFirst({
    where: { name: slug },
    include: {
      posts: {
        include: {
          author: true,
          votes: true,
          comments: true,
          subreddit: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: INFINITE_SCROLL_PAGINATION_RESULTS,
      },
    },
  })

  if (!subreddit) return notFound()

  return (
    <>
      <h1 className='font-bold text-3xl md:text-4xl h-14'>
        r/{subreddit.name}
      </h1>
      <MiniCreatePost session={session} />
      <PostFeed initialPosts={subreddit.posts} subredditName={subreddit.name} />
    </>
  )
}

export default page

/*

1. Importaciones: Importa varios componentes y utilidades que necesita, incluyendo MiniCreatePost y PostFeed de tus componentes, INFINITE_SCROLL_PAGINATION_RESULTS de tu configuración, getAuthSession de tu librería de autenticación, db de tu librería de base de datos, y notFound de next/navigation.

2. Props de la página: Define una interfaz PageProps que describe las props que recibe la página. En este caso, recibe un objeto params que contiene un slug.

3. Función de la página: Define una función asíncrona page que se ejecuta cuando se renderiza la página. Esta función recibe las props de la página como argumento.

  -Extrae el slug de params y la session del usuario actual utilizando getAuthSession.

  -Hace una consulta a la base de datos para encontrar el primer subreddit con el nombre slug. Incluye los posts del subreddit en los resultados de la consulta, junto con el autor, los votos, los comentarios y el subreddit de cada post. Ordena los posts por createdAt en orden descendente y toma INFINITE_SCROLL_PAGINATION_RESULTS posts.

  -Si no encuentra un subreddit, devuelve notFound(), que probablemente redirige al usuario a una página de error 404.

  -Si encuentra un subreddit, renderiza un componente h1 con el nombre del subreddit, un componente MiniCreatePost y un componente PostFeed con los posts iniciales del subreddit.

4. Exportación por defecto: Exporta la función page como el export por defecto del archivo, lo que significa que esta función se utilizará para renderizar la página cuando se visite una ruta que coincida con /r/[slug].

*/