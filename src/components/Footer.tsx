import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Heart } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:flex md:items-center md:justify-between">
        <div className="flex justify-center space-x-6 md:order-2">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <span className="sr-only">Github</span>
            <Github className="h-5 w-5" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <span className="sr-only">Twitter</span>
            <Twitter className="h-5 w-5" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <span className="sr-only">Linkedin</span>
            <Linkedin className="h-5 w-5" />
          </a>
        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <p className="text-center text-xs leading-5 text-muted-foreground flex items-center justify-center md:justify-start gap-1">
            &copy; {currentYear} EventHub. Built with <Heart className="h-3 w-3 text-red-500 fill-current" /> for Radency Internship.
          </p>
        </div>
      </div>
    </footer>
  );
};
