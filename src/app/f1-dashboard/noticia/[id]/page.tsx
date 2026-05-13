// /app/news/[id]/page.tsx

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { newsData } from '@/lib/newsData';
import BackButton from '@/components/BackButton';

const NewsDetailPage = () => {
    const params = useParams();
    const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
    const newsArticle = rawId ? newsData.find(article => article.id === parseInt(rawId, 10)) : undefined;

    if (!newsArticle) {
        return (
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <h1 className="font-bold text-3xl md:text-4xl mb-2">Noticia no encontrada</h1>
                <p>No se encontraron resultados para esta noticia.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <BackButton defaultPath="/f1-dashboard/noticias" backText="Volver al Dashboard" />
            <h1 className="font-bold text-3xl md:text-4xl mb-2 mt-4">{newsArticle.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: newsArticle.content }}></div>
        </div>
    );
};

export default NewsDetailPage;
