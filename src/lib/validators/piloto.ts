import { z } from 'zod'

export const PilotoValidator = z.object({
    nombre: z.string(),
    fecha_nac: z.string().refine(value => !isNaN(Date.parse(value)), {
        message: "fecha_nac must be a valid date string",
    }),
    nacionalidad: z.string(),
    img_flag: z.string().url(),
    img: z.string().url(),
    lugar_nac: z.string(),
    casco: z.string().url(),
})

export type CreatePilotoPayload = z.infer<typeof PilotoValidator>