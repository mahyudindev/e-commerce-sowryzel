import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useCallback, useState } from 'react';
import { Link } from '@inertiajs/react';

interface CarouselProps {
    slides: {
        id: number;
        image: string;
        title: string;
        description: string;
        link: string;
    }[];
    autoSlideInterval?: number;
}

export function HomeCarousel({ slides, autoSlideInterval = 3000 }: CarouselProps) {
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const prev = useCallback(() => 
        setCurrent((current) => (current === 0 ? slides.length - 1 : current - 1)),
        [slides.length]
    );

    const next = useCallback(() => 
        setCurrent((current) => (current === slides.length - 1 ? 0 : current + 1)),
        [slides.length]
    );

    // Auto slide functionality
    useEffect(() => {
        if (isPaused) return;
        
        const slideInterval = setInterval(() => {
            next();
        }, autoSlideInterval);

        return () => clearInterval(slideInterval);
    }, [current, isPaused, autoSlideInterval, next]);

    const goToSlide = (index: number) => {
        setCurrent(index);
    };

    // Pause auto slide on hover
    const handleMouseEnter = () => {
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
    };

    return (
        <div 
            className="relative w-full overflow-hidden rounded-xl shadow-lg"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative h-[280px] w-full md:h-[350px]">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                            index === current ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                            backgroundImage: `url(${slide.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20">
                            <div className="container mx-auto flex h-full items-center px-6 md:px-12">
                                <div className="max-w-2xl text-white">
                                    <h2 className="mb-4 text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                                        {slide.title}
                                    </h2>
                                    <p className="mb-6 text-lg md:text-xl text-gray-100">
                                        {slide.description}
                                    </p>
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        Beli Sekarang
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-3 text-white hover:bg-black/50 transition-colors duration-200"
                aria-label="Previous slide"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>

            <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-3 text-white hover:bg-black/50 transition-colors duration-200"
                aria-label="Next slide"
            >
                <ChevronRight className="h-6 w-6" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2.5 rounded-full transition-all ${
                            index === current 
                                ? 'w-8 bg-white' 
                                : 'w-3 bg-white/50 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                        aria-current={index === current}
                    />
                ))}
            </div>
        </div>
    );
}
