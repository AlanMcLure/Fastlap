// /app/news/[id]/page.tsx

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { newsData } from '@/lib/newsData';

const NewsDetailPage = () => {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const newsArticle = newsData.find(article => article.id === parseInt(id, 10));

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
            <h1 className="font-bold text-3xl md:text-4xl mb-2">{newsArticle.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: newsArticle.content }}></div>
        </div>
    );
};

export default NewsDetailPage;
