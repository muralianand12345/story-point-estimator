// src/app/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const HomePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <div className="container mx-auto px-4 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-5xl font-extrabold text-blue-900 mb-4">
                        Story Point Estimator
                    </h1>
                    <p className="text-xl text-blue-700 max-w-2xl mx-auto">
                        A collaborative planning poker tool for agile teams to estimate story points efficiently
                    </p>
                </header>

                <div className="max-w-md mx-auto mb-16">
                    <div className="space-y-4">
                        <Link
                            href="/room/create"
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                        >
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </span>
                            Create a Room
                        </Link>

                        <Link
                            href="/room/join"
                            className="group relative w-full flex justify-center py-4 px-4 border border-gray-300 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                        >
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                                </svg>
                            </span>
                            Join a Room
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <div className="bg-white p-8 rounded-2xl shadow-lg transform transition-all hover:scale-105">
                        <div className="flex items-center justify-center h-16 w-16 bg-blue-100 text-blue-600 rounded-full mb-6 mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-blue-900 mb-3 text-center">Create</h3>
                        <p className="text-gray-600 text-center">Create a room and invite your team members to join for estimation sessions</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-lg transform transition-all hover:scale-105">
                        <div className="flex items-center justify-center h-16 w-16 bg-green-100 text-green-600 rounded-full mb-6 mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-blue-900 mb-3 text-center">Estimate</h3>
                        <p className="text-gray-600 text-center">Vote on story points in real-time with your team for efficient estimation</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-lg transform transition-all hover:scale-105">
                        <div className="flex items-center justify-center h-16 w-16 bg-purple-100 text-purple-600 rounded-full mb-6 mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-blue-900 mb-3 text-center">Decide</h3>
                        <p className="text-gray-600 text-center">Reveal votes and reach consensus on story point estimates as a team</p>
                    </div>
                </div>
            </div>

            <footer className="bg-gray-50 py-8 mt-20">
                <div className="container mx-auto px-4 text-center text-gray-500">
                    <p>Story Point Estimator - A collaboration tool for agile teams</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;