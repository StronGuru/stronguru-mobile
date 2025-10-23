import React from "react";
import { Text, View } from "react-native";

type Props = {
  date: string; // ISO date string
};

function formatDateLabel(dateString: string): string {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset ore per confronto solo data
  const resetTime = (date: Date) => {
    date.setHours(0, 0, 0, 0);
    return date;
  };
  
  const messageDateReset = resetTime(new Date(messageDate));
  const todayReset = resetTime(new Date(today));
  const yesterdayReset = resetTime(new Date(yesterday));
  
  if (messageDateReset.getTime() === todayReset.getTime()) {
    return "Oggi";
  } else if (messageDateReset.getTime() === yesterdayReset.getTime()) {
    return "Ieri";
  } else {
    // Formato: "15 Ottobre 2024"
    return messageDate.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
}

export default function DateSeparator({ date }: Props) {
  const label = formatDateLabel(date);
  
  return (
    <View className="flex-row items-center my-4 px-4">
      <View className="flex-1 h-px bg-border/50" />
      <Text className="mx-3 text-xs text-muted-foreground font-medium">
        {label}
      </Text>
      <View className="flex-1 h-px bg-border/50" />
    </View>
  );
}
