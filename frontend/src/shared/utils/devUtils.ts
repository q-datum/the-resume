export const devLog = (...args: unknown[]) => {
    if (import.meta.env.DEV) console.log(...args);
};

export const devWarn = (...args: unknown[]) => {
    if (import.meta.env.DEV) console.warn(...args);
};
