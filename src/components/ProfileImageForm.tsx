'use client'

import { User } from '@prisma/client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from '@/hooks/use-toast'
import { uploadFiles } from '@/lib/uploadthing'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card'
import { UserAvatar } from './UserAvatar'
import { Button } from './ui/Button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"


interface ProfileImageFormProps extends React.HTMLAttributes<HTMLFormElement> {
    user: Pick<User, 'id' | 'name' | 'image'>
}

export function ProfileImageForm({ user, className, ...props }: ProfileImageFormProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const router = useRouter()

    const { mutate: updateProfileImage, isPending: isLoading } = useMutation({
        mutationFn: async () => {
            // const formData = new FormData();

            // if (selectedFile) {
            //     formData.append('profileImage', selectedFile);
            // }

            // const { data } = await axios.patch(`/api/profile-image/`, formData)
            // return data
            let imageUrl = '';
            if (!selectedFile) throw new Error('No file selected')
            const [res] = await uploadFiles([selectedFile], 'imageUploader');
            imageUrl = res.fileUrl;

            const { data } = await axios.patch(`/api/profile-image/`, { imageUrl })
            return data
        },
        onError: () => {
            // Both a failed upload and a failed save end here.
            toast({
                title: 'Algo fue mal',
                description: 'No se ha podido actualizar la imagen. Inténtalo de nuevo más tarde.',
                variant: 'destructive',
            })
        },
        onSuccess: () => {
            setSelectedFile(null)
            setPreviewImage(null)
            toast({
                description: 'Tu imagen de perfil ha sido actualizada',
            })
            router.refresh()
        },
    })

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.length) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        updateProfileImage();
    }

    return (
        <form
            className={className}
            onSubmit={handleSubmit}
            {...props}>
            <Card className='min-h-[250px]'>
                <CardHeader>
                    <CardTitle>Tu imagen de perfil</CardTitle>
                    <CardDescription>
                        La imagen de perfil es pública. Puedes cambiarla en cualquier momento.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3'>
                        <label className="relative h-24 w-24 cursor-pointer rounded-full group focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background" title="Elegir una imagen">
                            <UserAvatar
                                user={{
                                    name: user.name || null,
                                    image: previewImage || user.image || null,
                                }}
                                className="w-24 h-24"
                            />
                            <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-input bg-card text-lg text-display group-hover:border-display" aria-hidden="true">+</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" aria-label="Elegir una imagen de perfil" />
                        </label>
                        <Button isLoading={isLoading} disabled={!selectedFile || isLoading}>Guardar imagen</Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}

{/* <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <label>
                                        <UserAvatar
                                            user={{
                                                name: user.name || null,
                                                image: previewImage || user.image || null,
                                            }}
                                            className="w-24 h-24 cursor-pointer"
                                        />
                                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                    </label>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Elige una nueva imagen</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider> */}