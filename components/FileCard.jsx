// components/FileCard.jsx
import React from 'react';

export default function FileCard({ file, isAdmin, onDelete }) {
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;
    onDelete(file);
  };

  return (
    <div className="border rounded p-4 mb-4 flex justify-between items-center bg-white dark:bg-gray-700 shadow">
      <div>
        <p className="font-semibold">{file.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-300">{file.type}</p>
      </div>

      <div className="flex space-x-4 items-center">
        {file.downloadable ? (
          <a
            href={file.url}
            download={file.name}
            className="text-indigo-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </a>
        ) : (
          <span className="text-gray-400 italic">Download disabled</span>
        )}

        {isAdmin && (
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800"
            title="Delete file"
            aria-label={`Delete ${file.name}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
