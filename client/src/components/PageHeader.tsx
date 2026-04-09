import React from 'react';

interface PageHeaderProps {
  title?: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-2 px-4 md:px-8 rounded-lg mb-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-xl md:text-2xl font-bold">Pharmacy Performance Intelligence</div>
        </div>
        {title && (
          <h1 className="text-2xl md:text-3xl font-bold mt-4">{title}</h1>
        )}
        {description && (
          <p className="text-blue-100 mt-2 text-sm md:text-base">{description}</p>
        )}
      </div>
    </div>
  );
}
