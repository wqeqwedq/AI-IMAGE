"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AuthBrandPanelState = {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  isTyping: boolean;
};

type AuthBrandPanelContextValue = AuthBrandPanelState & {
  patch: (partial: Partial<AuthBrandPanelState>) => void;
  reset: () => void;
};

const initial: AuthBrandPanelState = {
  password: "",
  confirmPassword: "",
  showPassword: false,
  isTyping: false,
};

const AuthBrandPanelContext = createContext<AuthBrandPanelContextValue | null>(
  null
);

export function AuthBrandPanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthBrandPanelState>(initial);

  const patch = useCallback((partial: Partial<AuthBrandPanelState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setState(initial);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      patch,
      reset,
    }),
    [state, patch, reset]
  );

  return (
    <AuthBrandPanelContext.Provider value={value}>
      {children}
    </AuthBrandPanelContext.Provider>
  );
}

export function useAuthBrandPanel(): AuthBrandPanelContextValue {
  const ctx = useContext(AuthBrandPanelContext);
  if (!ctx) {
    throw new Error("useAuthBrandPanel must be used within AuthBrandPanelProvider");
  }
  return ctx;
}
