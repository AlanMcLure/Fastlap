import axios from 'axios'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const href = url.searchParams.get('url')

  if (!href) {
    return new Response('Invalid href', { status: 400 })
  }

  const res = await axios.get(href)

  // Parse the HTML using regular expressions
  const titleMatch = res.data.match(/<title>(.*?)<\/title>/)
  const title = titleMatch ? titleMatch[1] : ''

  const descriptionMatch = res.data.match(
    /<meta name="description" content="(.*?)"/
  )
  const description = descriptionMatch ? descriptionMatch[1] : ''

  const imageMatch = res.data.match(/<meta property="og:image" content="(.*?)"/)
  const imageUrl = imageMatch ? imageMatch[1] : ''

  // Return the data in the format required by the editor tool
  return new Response(
    JSON.stringify({
      success: 1,
      meta: {
        title,
        description,
        image: {
          url: imageUrl,
        },
      },
    })
  )
}

// Importa el módulo axios para hacer solicitudes HTTP.

// Define la función GET que toma un objeto Request como argumento.

// Crea un nuevo objeto URL a partir de req.url, que es la URL de la solicitud entrante.

// Obtiene el valor del parámetro de búsqueda url de la URL. Este es el URL al que se hará la solicitud GET.

// Si no se proporciona un href, devuelve una respuesta con un estado 400 e indica que el href es inválido.

// Hace una solicitud GET al href proporcionado usando axios.get.

// Extrae el título, la descripción y la URL de la imagen de la respuesta utilizando expresiones regulares. Si no se encuentra un valor, se utiliza una cadena vacía como valor predeterminado.

// Devuelve una nueva Response que contiene un objeto JSON con los datos extraídos. Este objeto tiene una propiedad success que indica si la solicitud fue exitosa, y una propiedad meta que contiene el título, la descripción y la URL de la imagen extraídos.

// Este código se utiliza generalmente para extraer metadatos de una página web, como el título, la descripción y la URL de la imagen, que luego se pueden utilizar para generar una vista previa de la página web.

