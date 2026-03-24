export const PAYSTACK_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";

export function generatePaystackReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `gs_${timestamp}_${random}`.toUpperCase();
}

export interface PaystackChargeParams {
  email: string;
  amount: number; // in kobo
  reference: string;
  currency?: string;
  channels?: ("card" | "bank" | "ussd" | "qr" | "mobile_money")[];
}

export interface PaystackSuccessResponse {
  status: string;
  transactionRef: string;
  reference: string;
}
