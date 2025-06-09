import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    // Глобально игнорируем папки
    ignores: ['dist/'],
  },
  {
    // Настройки для всех JS/JSX файлов
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      // Указываем, что это файлы ECMAScript Modules
      sourceType: 'module',
      // Определяем глобальные переменные, доступные в коде
      globals: {
        ...globals.browser, // `window`, `document`, etc.
      },
      // Указываем парсеру, что мы используем JSX
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    // Регистрируем плагины
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
    },
    // Настройки для плагинов
    settings: {
      react: {
        version: 'detect', // Автоматически определять версию React
      },
    },
    // Правила линтинга
    rules: {
      // Базовые правила от ESLint
      ...pluginJs.configs.recommended.rules,
      // Рекомендованные правила для React
      ...pluginReact.configs.recommended.rules,
      // Рекомендованные правила для хуков React
      ...pluginReactHooks.configs.recommended.rules,

      // --- Наши кастомные переопределения ---

      // Отключаем, так как в Vite/CRA не нужно импортить React в каждый файл
      'react/react-in-jsx-scope': 'off',
      // Отключаем, так как мы не используем PropTypes
      'react/prop-types': 'off',
      
      // Предупреждение для `react-refresh`
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
];