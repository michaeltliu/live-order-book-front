import React, { createContext, useState, useEffect, useContext } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(0);

  const toggleTheme = () => {
    setTheme(1 - theme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function ThemeButton() {
  const { theme, toggleTheme } = useContext(ThemeContext); 

  useEffect(() => {
    document.body.className = theme ? 'dark' : '';
  }, [theme]);

  return (
    <button style={{float:'right'}} onClick={toggleTheme}>
      {theme ? 'Light ' : 'Dark '} mode
    </button>
  );
}