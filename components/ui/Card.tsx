import { ReactNode } from "react";
import { View } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return <View className={`bg-card shadow-sm p-4 rounded-2xl border border-card dark:border-secondary ${className}`}>{children}</View>;
}
