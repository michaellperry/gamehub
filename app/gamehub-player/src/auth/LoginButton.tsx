import { AuthContext } from "react-oauth2-code-pkce";
import { useContext } from "react";
import { useAccess } from "./AccessProvider";

export function LoginButton() {
  const { logIn: authLogIn, token, error } = useContext(AuthContext);
  const { logOut } = useAccess();

  if (error) {
    return (
      <button 
        onClick={() => authLogIn()}
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
      >
        Login Failed - Try Again
      </button>
    );
  }

  if (!token) {
    return (
      <button 
        onClick={() => authLogIn()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
      >
        Log In
      </button>
    );
  }

  return (
    <button 
      onClick={() => logOut()} 
      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
    >
      Log Out
    </button>
  );
}
