import React from 'react';

export default function Skeleton({ width, height, borderRadius = 'var(--radius-md)', style }) {
    return (
        <div
            className="skeleton-loader"
            style={{
                width: width || '100%',
                height: height || '20px',
                borderRadius: borderRadius,
                ...style
            }}
            aria-hidden="true"
        />
    );
}
