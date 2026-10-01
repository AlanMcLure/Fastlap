'use client';

import React from 'react';
import Link from 'next/link';
import { newsData } from '@/lib/newsData';
import BackButton from '@/components/BackButton';

const NewsPage = () => {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <BackButton defaultPath="/f1-dashboard" backText="Volver al Dashboard" />
            <h1 className="font-bold text-3xl md:text-4xl mb-8 mt-4">Noticias</h1>
            {newsData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {newsData.map(article => (
                        <Link href={`/f1-dashboard/noticia/${article.id}`} key={article.id}>
                            <div className="bg-card rounded-lg overflow-hidden border border-border hover:border-input transition-colors duration-300">
                                <div className="p-4">
                                    <h2 className="text-xl font-bold mb-2">{article.title}</h2>
                                    <p className="text-foreground">{article.summary}</p>
                                </div>
                                <div className="bg-secondary p-4 text-right">
                                    <p className="text-display hover:underline">Leer más</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p>No se encontraron noticias.</p>
            )}
        </div>
    );
};

export default NewsPage;
