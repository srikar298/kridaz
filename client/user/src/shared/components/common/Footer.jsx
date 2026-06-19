import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#050505] py-12 border-t border-gray-900 mt-20">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-44 h-16 bg-transparent flex items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="Kridaz Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <Link
            to="/privacy-policy"
            className="text-gray-400 hover:text-primary transition-colors text-xs uppercase tracking-wider"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms-of-service"
            className="text-gray-400 hover:text-primary transition-colors text-xs uppercase tracking-wider"
          >
            Terms of Service
          </Link>
          <Link
            to="/data-deletion-instructions"
            className="text-gray-400 hover:text-primary transition-colors text-xs uppercase tracking-wider"
          >
            Data Deletion Instructions
          </Link>
        </div>
        <p className="text-gray-600 text-[10px] font-mono uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Kridaz. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
