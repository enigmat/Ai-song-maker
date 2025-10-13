import { useState, useEffect, useCallback } from 'react';
import { Project } from '../types';

const PROJECTS_STORAGE_KEY = 'mustbmusic_projects_v2';

export const useProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    const createProject = useCallback((name: string, makeActive: boolean = true) => {
        const newProject: Project = {
            id: Date.now().toString(),
            name: name.trim() || 'Untitled Project',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            songData: null,
            artistImageUrl: null,
            generationParams: null,
            originalPrompt: null,
        };

        setProjects(prev => {
            const updatedProjects = [...prev, newProject];
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
            if (makeActive) {
                setActiveProjectId(newProject.id);
            }
            return updatedProjects;
        });
        
        return newProject;
    }, []);


    useEffect(() => {
        try {
            const rawData = localStorage.getItem(PROJECTS_STORAGE_KEY);
            const savedProjects: Project[] = rawData ? JSON.parse(rawData) : [];
            
            if (savedProjects.length > 0) {
                setProjects(savedProjects);
                // Set the most recently updated project as active
                const sortedProjects = [...savedProjects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                setActiveProjectId(sortedProjects[0].id);
            } else {
                // If no projects, create a default one
                createProject('My First Song', true);
            }
        } catch (e) {
            console.error('Failed to load projects from storage:', e);
            // If loading fails, start with a fresh default project
            createProject('My First Song', true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveProjects = useCallback((updatedProjects: Project[]) => {
        setProjects(updatedProjects);
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
    }, []);


    const updateProject = useCallback((updatedProject: Project) => {
        const updatedProjects = projects.map(p =>
            p.id === updatedProject.id ? { ...updatedProject, updatedAt: new Date().toISOString() } : p
        );
        saveProjects(updatedProjects);
    }, [projects, saveProjects]);

    const deleteProject = useCallback((id: string) => {
        const updatedProjects = projects.filter(p => p.id !== id);
        saveProjects(updatedProjects);

        // If the deleted project was active, select another one
        if (activeProjectId === id) {
            if (updatedProjects.length > 0) {
                 const sortedProjects = [...updatedProjects].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                setActiveProjectId(sortedProjects[0].id);
            } else {
                // If no projects left, create a new default one
                const newProject = createProject('My First Song', true);
                setActiveProjectId(newProject.id);
            }
        }
    }, [projects, activeProjectId, saveProjects, createProject]);

    return {
        projects,
        activeProjectId,
        setActiveProjectId,
        createProject,
        updateProject,
        deleteProject,
    };
};
