import { logger } from "firebase-functions";
import admin, { firestore } from "./admin";

/**
 * Store a payment receipt in the payment_receipts collection.
 *
 * @param entityId       - The related entity ID (orderId, userId, etc.)
 * @param paystackData   - Raw Paystack webhook data
 * @param receiptType    - Type: "order", "tokenization", "refund", "transfer"
 * @param additionalInfo - Extra fields to merge into the receipt
 */
export async function storePaymentReceipt(
  entityId: string,
  paystackData: Record<string, any>,
  receiptType: "order" | "tokenization" | "refund" | "transfer",
  additionalInfo: Record<string, any> = {}
): Promise<void> {
  try {
    const userId = additionalInfo.userId || null;
    const authorization = paystackData.authorization || {};
    const customer = paystackData.customer || {};

    const receipt = {
      entityId,
      userId,
      receiptType,

      // Transaction details
      transactionId: paystackData.id || null,
      reference: paystackData.reference || additionalInfo.refundReference || null,
      amount: paystackData.amount
        ? paystackData.amount > 10000
          ? paystackData.amount / 100  // Convert from kobo if large
          : paystackData.amount
        : paystackData.refund_amount || 0,
      currency: paystackData.currency || "NGN",
      channel: paystackData.channel || "paystack",
      status: paystackData.status || "success",

      // Customer details
      customer: customer.email
        ? {
            email: customer.email,
            name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
            phone: customer.phone || null,
          }
        : null,

      // Payment method details
      authorization: authorization.last4
        ? {
            last4: authorization.last4 || "",
            bank: authorization.bank || "",
            brand: authorization.brand || "",
            cardType: authorization.card_type || "",
            channel: authorization.channel || "",
          }
        : null,

      // Additional details
      fees: paystackData.fees || 0,
      gatewayResponse: paystackData.gateway_response || null,

      // Timestamps
      paidAt: paystackData.paid_at
        ? new Date(paystackData.paid_at)
        : admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),

      // Merge additional info
      ...additionalInfo,
    };

    await firestore.collection("payment_receipts").add(receipt);

    logger.info("📄 Receipt stored", {
      entityId,
      userId,
      receiptType,
      reference: receipt.reference,
    });
  } catch (error: any) {
    logger.error("❌ Error storing receipt", {
      error: error.message,
      entityId,
      receiptType,
    });
    // Don't throw — receipt storage failure shouldn't break payment processing
  }
}
