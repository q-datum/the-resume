export interface INavLink {
    label: string
    path: string
}

export const navLinks: INavLink[] = [
    { label: 'Home', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'Chat', path: '/chat' },
    { label: 'Contact', path: '/contact' },
];