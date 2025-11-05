import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../lib/firebase";

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const isAuthed = !!auth.currentUser;
  return isAuthed ? <>{children}</> : <Navigate to="/login" replace />;
}
