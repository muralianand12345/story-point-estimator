'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const HomePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                        Story Point Estimator
                    </h1>
                    <p className="text-lg text-gray-600">
                        Collaborative planning poker for agile teams
                    </p>
                </div>

                <div className="mt-10 space-y-4">
                    <Link
                        href="/room/create"
                        className="group w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Create a Room
                    </Link>

                    <Link
                        href="/room/join"
                        className="group w-full flex justify-center py-3 px-4 border border-gray-300 text-lg font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Join a Room
                    </Link>
                </div>

                <div className="mt-10">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Create</h3>
                            <p className="text-gray-500">Create a room and invite your team members to join</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Estimate</h3>
                            <p className="text-gray-500">Vote on story points in real-time with your team</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Decide</h3>
                            <p className="text-gray-500">Reveal votes and reach consensus on story point estimates</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;