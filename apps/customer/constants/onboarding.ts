import { type ImageSourcePropType } from "react-native";

export interface OnboardingSlide {
  id: number;
  // Title segments: normal text rendered plain, emphasized text rendered bold italic
  titleParts: { text: string; emphasized?: boolean }[];
  subtitle: string;
  image: ImageSourcePropType;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 0,
    titleParts: [
      { text: "Swift " },
      { text: "Delivery", emphasized: true },
      { text: "\nYou Can " },
      { text: "Trust", emphasized: true },
    ],
    subtitle: "A seamless journey from pickup to doorstep.",
    image: require("@/assets/images/delivery-image.jpg"),
  },
  {
    id: 1,
    titleParts: [
      { text: "Choose " },
      { text: "Your", emphasized: true },
      { text: " Rider,\nOwn the " },
      { text: "Experience", emphasized: true },
    ],
    subtitle: "Pick your rider, track in real-time, and stay in control.",
    image: require("@/assets/images/rider-image.jpg"),
  },
  {
    id: 2,
    titleParts: [
      { text: "Pay " },
      { text: "Securely", emphasized: true },
      { text: ",\nDeliver " },
      { text: "Confidently", emphasized: true },
    ],
    subtitle: "Safe payments, real-time tracking — every step of the way.",
    image: require("@/assets/images/payment-image.jpg"),
  },
];
