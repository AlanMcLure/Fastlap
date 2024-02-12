import { z } from 'zod'

export const CreatePilotoValidator = z.object({
    nombre: z.string().nullable(),
    fecha_nac: z.string().nullable().refine(value => value === null || !isNaN(Date.parse(value)), {
        message: "fecha_nac must be a valid date string",
    }),
    nacionalidad: z.string().nullable(),
    img_flag: z.string().url().nullable(),
    img: z.string().url().nullable(),
    lugar_nac: z.string().nullable(),
    casco: z.string().url().nullable(),
})

export type CreatePilotoPayload = z.infer<typeof CreatePilotoValidator>

export const UpdatePilotoValidator = CreatePilotoValidator.extend({
    id: z.string(),
})

export type UpdatePilotoPayload = z.infer<typeof UpdatePilotoValidator>