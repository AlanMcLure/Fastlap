// /app/news/page.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { newsData } from '@/lib/newsData';
import BackButton from '@/components/BackButton';

const NewsPage = () => {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <BackButton defaultPath="/f1-dashboard" backText="Volver al Dashboard" />
            <h1 className="font-bold text-3xl md:text-4xl mb-2 mt-4">Noticias</h1>
            {newsData.length > 0 ? (
                <ul>
                    {newsData.map(article => (
                        <li key={article.id} className="mb-4">
                            <Link href={`/f1-dashboard/noticia/${article.id}`}>
                                <p className="text-blue-500 hover:underline">{article.title}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No se encontraron noticias.</p>
            )}
        </div>
    );
};

export default NewsPage;
