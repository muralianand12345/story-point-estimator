import React from 'react';

interface BookLogoProps {
    className?: string;
    color?: string;
}

const BookLogo: React.FC<BookLogoProps> = ({
    className = '',
    color = 'currentColor'
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={color}
            className={className}
            width="100%"
            height="100%"
        >
            <path d="M19 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 4h2v5l-1-.75L9 9V4zm8 16H6V4h1v9l3-2.25L13 13V4h4v16z" />
        </svg>
    );
};

export default BookLogo;