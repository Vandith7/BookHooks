import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../themes';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', or 'system'

    const getTheme = (mode) => {
        if (mode === 'system') {
            return systemColorScheme === 'dark' ? darkTheme : lightTheme;
        }
        return mode === 'dark' ? darkTheme : lightTheme;
    };

    const [theme, setTheme] = useState(getTheme(themeMode));

    useEffect(() => {
        setTheme(getTheme(themeMode));
    }, [themeMode, systemColorScheme]);

    const toggleTheme = (mode) => {
        setThemeMode(mode);
        setTheme(getTheme(mode)); // Update theme when user manually selects a mode
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, themeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
