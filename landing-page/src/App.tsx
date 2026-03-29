import { useEffect } from 'react';
import Hero from './sections/Hero';
import TechStack from './sections/TechStack';
import Architecture from './sections/Architecture';
import Features from './sections/Features';
import Stats from './sections/Stats';
import Footer from './sections/Footer';

function App() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    document.querySelectorAll('.section-fade-in').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      <Hero />
      <TechStack />
      <Architecture />
      <Features />
      <Stats />
      <Footer />
    </div>
  );
}

export default App;
