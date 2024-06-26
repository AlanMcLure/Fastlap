'use client'

import { User } from '@prisma/client'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
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

    const { mutate: updateProfileImage, isLoading } = useMutation({
        mutationFn: async () => {
            // const formData = new FormData();

            // if (selectedFile) {
            //     formData.append('profileImage', selectedFile);
            // }

            // const { data } = await axios.patch(`/api/profile-image/`, formData)
            // return data
            let imageUrl = '';
            if (selectedFile) {
                const [res] = await uploadFiles([selectedFile], 'imageUploader');
                imageUrl = res.fileUrl;
            }

            const { data } = await axios.patch(`/api/profile-image/`, { imageUrl })
            return data
        },
        onError: (err: any) => {
            if (err instanceof AxiosError) {
                return toast({
                    title: 'Algo fue mal',
                    description: 'Por favor, inténtelo de nuevo más tarde',
                    variant: 'destructive',
                })
            }
        },
        onSuccess: () => {
            toast({
                description: 'Su imagen de perfil ha sido actualizada',
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
                    <CardTitle>Tú Imagen de perfil</CardTitle>
                    <CardDescription>
                        La imagen de perfil es pública. Puedes cambiarla en cualquier momento.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3'>
                        <label className="relative w-24 h-24 cursor-pointer group">
                            <UserAvatar
                                user={{
                                    name: user.name || null,
                                    image: previewImage || user.image || null,
                                }}
                                className="w-24 h-24"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full">
                                <span className="text-4xl text-white opacity-0 group-hover:opacity-100">+</span>
                            </div>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                        <Button isLoading={isLoading}>Cambiar imagen</Button>
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