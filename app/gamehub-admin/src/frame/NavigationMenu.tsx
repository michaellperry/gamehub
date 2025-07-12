import { Link } from "react-router-dom";
import { LoginButton } from "../auth/LoginButton";
import { useState } from "react";
import { ThemeToggle } from "../theme/ThemeToggle";

function NavigationMenu() {
    const [openMenu, setOpenMenu] = useState<"events" | "setup" | null>(null);

    const toggleMenu = (menu: "events" | "setup") => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    return (
        <nav className="bg-gray-800 dark:bg-gray-900 shadow-md transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-white font-bold text-xl">LaunchKings Admin</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:items-center">
                            <div className="flex space-x-4">
                                <Link to="/" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                    Home
                                </Link>
                                <div className="relative">
                                    <button 
                                        onClick={() => toggleMenu("setup")} 
                                        className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
                                    >
                                        Setup
                                        <svg 
                                            className={`ml-1 h-5 w-5 transform ${openMenu === "setup" ? 'rotate-180' : ''} transition-transform duration-200`} 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            viewBox="0 0 20 20" 
                                            fill="currentColor" 
                                            aria-hidden="true"
                                        >
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {openMenu === "setup" && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-dark-surface ring-1 ring-black ring-opacity-5 dark:ring-dark-border z-10">
                                            <Link 
                                                to="/tenants" 
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => setOpenMenu(null)}
                                            >
                                                Tenants
                                            </Link>
                                            <Link 
                                                to="/service-principals" 
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => setOpenMenu(null)}
                                            >
                                                Service Principals
                                            </Link>
                                            <Link
                                                to="/invitations"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => setOpenMenu(null)}
                                            >
                                                Invitations
                                            </Link>
                                            <Link
                                                to="/style-guide"
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => setOpenMenu(null)}
                                            >
                                                Style Guide
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <button 
                                        onClick={() => toggleMenu("events")} 
                                        className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
                                    >
                                        Events
                                        <svg 
                                            className={`ml-1 h-5 w-5 transform ${openMenu === "events" ? 'rotate-180' : ''} transition-transform duration-200`} 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            viewBox="0 0 20 20" 
                                            fill="currentColor" 
                                            aria-hidden="true"
                                        >
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <ThemeToggle />
                        <LoginButton />
                    </div>
                </div>
            </div>
            
            {/* Mobile menu */}
            <div className="sm:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1">
                    <Link to="/" className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Home
                    </Link>
                    <button 
                        onClick={() => toggleMenu("setup")}
                        className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left flex justify-between items-center"
                    >
                        Setup
                        <svg 
                            className={`h-5 w-5 transform ${openMenu === "setup" ? 'rotate-180' : ''} transition-transform duration-200`} 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20" 
                            fill="currentColor" 
                            aria-hidden="true"
                        >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {openMenu === "setup" && (
                        <div className="pl-4 space-y-1">
                            <Link 
                                to="/tenants" 
                                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                            >
                                Tenants
                            </Link>
                            <Link 
                                to="/service-principals" 
                                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                            >
                                Service Principals
                            </Link>
                            <Link
                                to="/invitations"
                                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                            >
                                Invitations
                            </Link>
                            <Link
                                to="/style-guide"
                                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                            >
                                Style Guide
                            </Link>
                        </div>
                    )}
                    <button 
                        onClick={() => toggleMenu("events")}
                        className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left flex justify-between items-center"
                    >
                        Events
                        <svg 
                            className={`h-5 w-5 transform ${openMenu === "events" ? 'rotate-180' : ''} transition-transform duration-200`} 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20" 
                            fill="currentColor" 
                            aria-hidden="true"
                        >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default NavigationMenu;
