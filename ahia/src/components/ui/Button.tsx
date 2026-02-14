import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  onClick?: () => void;
}

export const Button = ({
  children,
  variant = "primary",
  className = "",
  onClick,
}: ButtonProps) => {
  const baseStyles =
    "px-6 py-3 rounded-ahia font-heading font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-ahia-grad text-white shadow-ahia hover:opacity-90",
    secondary:
      "border-2 border-ahia-sunset text-ahia-sunset hover:bg-ahia-sunset/5",
    danger: "border-2 border-ahia-red text-ahia-red hover:bg-ahia-red/5",
    ghost: "text-gray-500 hover:bg-gray-100",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
