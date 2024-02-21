import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNowStrict } from 'date-fns'
import locale from 'date-fns/locale/en-US'
import { Session } from 'next-auth'
import axios, { AxiosError, AxiosRequestConfig } from 'axios'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const formatDistanceLocale = {
  lessThanXSeconds: 'justo ahora',
  xSeconds: 'justo ahora',
  halfAMinute: 'justo ahora',
  lessThanXMinutes: '{{count}}m',
  xMinutes: '{{count}}m',
  aboutXHours: '{{count}}h',
  xHours: '{{count}}h',
  xDays: '{{count}}d',
  aboutXWeeks: '{{count}}s',
  xWeeks: '{{count}}s',
  aboutXMonths: '{{count}}m',
  xMonths: '{{count}}m',
  aboutXYears: '{{count}}a',
  xYears: '{{count}}a',
  overXYears: '{{count}}a',
  almostXYears: '{{count}}a',
}

function formatDistance(token: string, count: number, options?: any): string {
  options = options || {}

  const result = formatDistanceLocale[
    token as keyof typeof formatDistanceLocale
  ].replace('{{count}}', count.toString())

  if (options.addSuffix) {
    if (options.comparison > 0) {
      return 'en ' + result
    } else {
      if (result === 'justo ahora') return result
      return 'hace ' + result
    }
  }

  return result
}

export function formatTimeToNow(date: Date): string {
  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: {
      ...locale,
      formatDistance,
    },
  })
}

export async function authenticated(url: string, session: Session | null, options?: AxiosRequestConfig) {
  if (!session?.user) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const response = await axios(url, options);
    return response.data;
  } catch (error: AxiosError | any) {
    if (error.response) {
      // La solicitud se hizo y el servidor respondió con un estado fuera del rango de 2xx
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió ninguna respuesta
      console.error(error.request);
    } else {
      // Algo sucedió en la configuración de la solicitud que provocó un error
      console.error('Error', error.message);
    }
    throw error;
  }
}

export async function adminAuthenticated(url: string, session: Session | null, options?: AxiosRequestConfig) {
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('Usuario no es administrador');
  }

  try {
    const response = await axios(url, options);
    return response.data;
  } catch (error: AxiosError | any) {
    if (error.response) {
      // La solicitud se hizo y el servidor respondió con un estado fuera del rango de 2xx
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió ninguna respuesta
      console.error(error.request);
    } else {
      // Algo sucedió en la configuración de la solicitud que provocó un error
      console.error('Error', error.message);
    }
    throw error;
  }
}