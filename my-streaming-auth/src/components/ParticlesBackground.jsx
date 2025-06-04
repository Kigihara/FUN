// src/components/ParticlesBackground.jsx
import React, { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim'; // Загрузчик для slim-версии движка

const ParticlesBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    // Инициализируем движок tsparticles (если еще не инициализирован)
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    // Можно что-то сделать, когда частицы загружены, если нужно
    console.log("Particles loaded", container);
  }, []);

  // Конфигурация частиц. Это ОЧЕНЬ гибкая часть.
  // Можно найти много готовых конфигов онлайн или создать свой.
  // Этот конфиг создает эффект "созвездия" (plexus/network).
  const particlesOptions = {
    background: {
      // Мы не будем задавать фон здесь, так как у нас уже есть градиент в AppContainer
      // color: {
      //   value: '#1a1a2e', // Пример фона, если бы он был нужен
      // },
    },
    fpsLimit: 165, // Ограничение FPS для производительности
    interactivity: {
      events: {
        onClick: {
          enable: true,
          mode: 'push', // Добавляет частицы при клике
        },
        onHover: {
          enable: true,
          mode: 'repulse', // Отталкивает частицы при наведении
        },
        resize: true,
      },
      modes: {
        push: {
          quantity: 4,
        },
        repulse: {
          distance: 150, // Увеличил дистанцию отталкивания
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: 'rgba(255, 255, 255, 0.6)', // Цвет частиц (белый с прозрачностью)
      },
      links: {
        color: 'rgba(255, 255, 255, 0.4)', // Цвет линий между частицами
        distance: 150,
        enable: true,
        opacity: 0.4,
        width: 1,
      },
      collisions: { // Включаем коллизии, чтобы частицы отталкивались друг от друга
        enable: true,
      },
      move: {
        direction: 'none',
        enable: true,
        outModes: { // Как частицы ведут себя на краях экрана
          default: 'bounce', // Отскакивают
        },
        random: false,
        speed: 1.5, // Уменьшил скорость для более спокойного эффекта
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 1000, // Плотность частиц
        },
        value: 60, // Количество частиц (можно уменьшить для производительности)
      },
      opacity: {
        value: 0.5,
        random: true, // Случайная начальная прозрачность
        anim: { // Анимация прозрачности
          enable: true,
          speed: 0.5,
          opacity_min: 0.1,
          sync: false
        }
      },
      shape: {
        type: 'circle', // Форма частиц
      },
      size: {
        value: { min: 1, max: 3 }, // Случайный размер частиц
        random: true,
        anim: { // Анимация размера
          enable: true,
          speed: 2,
          size_min: 0.3,
          sync: false
        }
      },
    },
    detectRetina: true, // Для лучшего отображения на Retina-дисплеях
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={particlesOptions}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0, // Чтобы было под основным контентом, но над градиентом (если градиент - фон AppContainer)
                   // или zIndex: -1 если нужно под всем.
                   // У AppContainer::before (шум) zIndex: 0, у StyledAuthCard zIndex: 1.
                   // Значит, частицам нужен zIndex: 0, чтобы быть между шумом и карточкой,
                   // или -1, чтобы быть под шумом.
                   // Давай попробуем zIndex: 0, и если шум будет перекрывать, изменим.
      }}
    />
  );
};

export default ParticlesBackground;