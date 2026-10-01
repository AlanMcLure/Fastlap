// Pone a NULL los tokens de Google que guardó el adaptador antes del cambio.
// Uso: DATABASE_URL=... node scripts/scrub-google-tokens.mjs [--apply]
// Sin --apply solo cuenta las filas afectadas.
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const where = {
  OR: [
    { access_token: { not: null } },
    { refresh_token: { not: null } },
    { id_token: { not: null } },
  ],
}

try {
  const pending = await db.account.count({ where })
  console.log(`Cuentas con tokens guardados: ${pending}`)
  if (process.argv.includes('--apply') && pending > 0) {
    const { count } = await db.account.updateMany({
      where,
      data: { access_token: null, refresh_token: null, id_token: null },
    })
    console.log(`Limpiadas: ${count}`)
  } else if (pending > 0) {
    console.log('Simulación: añade --apply para limpiarlas.')
  }
} finally {
  await db.$disconnect()
}
