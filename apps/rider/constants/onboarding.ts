import { type ImageSourcePropType } from "react-native";

export interface OnboardingSlide {
  id: number;
  titleParts: { text: string; emphasized?: boolean }[];
  subtitle: string;
  image: ImageSourcePropType;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 0,
    titleParts: [
      { text: "Earn on\nYour " },
      { text: "Own Terms", emphasized: true },
    ],
    subtitle: "Ride when you want, earn what you deserve. You're the boss.",
    image: require("@/assets/images/delivery-image.jpg"),
  },
  {
    id: 1,
    titleParts: [
      { text: "Navigate " },
      { text: "Smarter", emphasized: true },
      { text: ",\nDeliver " },
      { text: "Faster", emphasized: true },
    ],
    subtitle:
      "Real-time routes, live status updates, and instant customer chat.",
    image: require("@/assets/images/rider-image.jpg"),
  },
  {
    id: 2,
    titleParts: [
      { text: "Get " },
      { text: "Paid", emphasized: true },
      { text: " After\nEvery " },
      { text: "Delivery", emphasized: true },
    ],
    subtitle: "Earnings tracked automatically. Cash out whenever you're ready.",
    image: require("@/assets/images/payment-image.jpg"),
  },
];
