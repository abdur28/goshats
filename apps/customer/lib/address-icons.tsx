import { Briefcase, Home2, Location } from "iconsax-react-native";

export function getAddressIcon(label: string, color: string = "#006B3F", size: number = 24) {
  const norm = label.toLowerCase();
  if (norm.includes("home"))
    return <Home2 size={size} color={color} variant="Bulk" />;
  if (norm.includes("work") || norm.includes("office"))
    return <Briefcase size={size} color={color} variant="Bulk" />;
  return <Location size={size} color={color} variant="Bulk" />;
}
