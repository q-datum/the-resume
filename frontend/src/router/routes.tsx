import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ContactPage } from '@/pages/ContactPage';
import {ChatPage} from "@/pages/ChatPage.tsx";
import {MainLayout} from "@/layout/MainLayout.tsx";
import {PrivacyPolicyPage} from "@/pages/PrivacyPolicyPage.tsx";

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: '/projects', element: <ProjectsPage /> },
            { path: '/contact', element: <ContactPage /> },
            { path: '/chat', element: <ChatPage /> },
            { path: '/privacy', element: <PrivacyPolicyPage /> },
        ],
    },
]);
