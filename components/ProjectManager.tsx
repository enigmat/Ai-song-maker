import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectManagerProps {
    projects: Project[];
    activeProjectId: string | null;
    onSelectProject: (id: string) => void;
    onCreateProject: (name: string) => void;
    onDeleteProject: (id: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
    projects,
    activeProjectId,
    onSelectProject,
    onCreateProject,
    onDeleteProject,
}) => {
    const [newProjectName, setNewProjectName] = useState('');

    const handleCreate = () => {
        if (newProjectName.trim()) {
            onCreateProject(newProjectName.trim());
            setNewProjectName('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCreate();
        }
    };

    const sortedProjects = [...projects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Manage Projects
            </h2>
            <div className="mt-6 space-y-4 max-w-2xl mx-auto">
                {/* Create New Project */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-200 mb-3">Create New Project</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., 'Synthwave Banger'"
                            className="flex-grow p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 transition-colors"
                        />
                        <button
                            onClick={handleCreate}
                            disabled={!newProjectName.trim()}
                            className="px-4 py-2 font-semibold bg-purple-600 text-white rounded-md shadow-md hover:bg-purple-500 transition-colors disabled:opacity-50"
                        >
                            Create
                        </button>
                    </div>
                </div>

                {/* Project List */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-200 mt-6">Your Projects</h3>
                    {sortedProjects.length > 0 ? (
                        sortedProjects.map(project => (
                            <div
                                key={project.id}
                                className={`p-4 rounded-lg border flex justify-between items-center transition-all duration-200 ${
                                    project.id === activeProjectId
                                        ? 'bg-purple-900/50 border-purple-500'
                                        : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50'
                                }`}
                            >
                                <div>
                                    <p className="font-bold text-gray-200">{project.name}</p>
                                    <p className="text-xs text-gray-500">
                                        Last updated: {new Date(project.updatedAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onSelectProject(project.id)}
                                        className="px-4 py-1.5 text-sm font-semibold bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-500 transition-colors"
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (projects.length > 1) {
                                               if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
                                                   onDeleteProject(project.id);
                                               }
                                            } else {
                                                alert("You cannot delete the last project.");
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                                        title="Delete Project"
                                        disabled={projects.length <= 1}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">No projects found. Create one above to get started!</p>
                    )}
                </div>
            </div>
        </div>
    );
};
