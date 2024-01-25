import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export async function GET(req: Request) {
  const url = new URL(req.url)

  const session = await getAuthSession()

  let followedCommunitiesIds: string[] = []

  if (session) {
    const followedCommunities = await db.subscription.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        subreddit: true,
      },
    })

    followedCommunitiesIds = followedCommunities.map((sub) => sub.subreddit.id)
  }

  try {
    const { limit, page, subredditName } = z
      .object({
        limit: z.string(),
        page: z.string(),
        subredditName: z.string().nullish().optional(),
      })
      .parse({
        subredditName: url.searchParams.get('subredditName'),
        limit: url.searchParams.get('limit'),
        page: url.searchParams.get('page'),
      })

    let whereClause = {}

    if (subredditName) {
      whereClause = {
        subreddit: {
          name: subredditName,
        },
      }
    } else if (session) {
      whereClause = {
        subreddit: {
          id: {
            in: followedCommunitiesIds,
          },
        },
      }
    }

    const posts = await db.post.findMany({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit), // skip should start from 0 for page 1
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        subreddit: true,
        votes: true,
        author: true,
        comments: true,
      },
      where: whereClause,
    })

    return new Response(JSON.stringify(posts))
  } catch (error) {
    return new Response('Could not fetch posts', { status: 500 })
  }
}

// 1. Extrae la URL de la solicitud entrante.

// 2. Intenta obtener la sesión de autenticación del usuario.

// 3. Si hay una sesión de usuario, busca en la base de datos las comunidades que el usuario sigue. Guarda los IDs de estas comunidades en followedCommunitiesIds.

// 4. Intenta extraer los parámetros limit, page y subredditName de la URL de la solicitud. limit y page se utilizan para la paginación de los resultados, y subredditName se utiliza para filtrar los posts por subreddit.

// 5. Construye una cláusula where para la consulta a la base de datos basada en subredditName y followedCommunitiesIds. Si subredditName está definido, la cláusula where filtra los posts por subreddit. Si subredditName no está definido pero hay una sesión de usuario, la cláusula where filtra los posts por las comunidades que el usuario sigue.

// 6. Realiza una consulta a la base de datos para obtener los posts que coinciden con la cláusula where, limitando el número de resultados y saltándose los resultados según los parámetros limit y page.

// 7. Devuelve los posts como una respuesta JSON.