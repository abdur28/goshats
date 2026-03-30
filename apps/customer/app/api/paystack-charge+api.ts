export async function POST(request: Request) {
  try {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET) {
      return Response.json(
        { error: "Payment service not configured", status: false },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, amount, card, metadata } = body;

    if (!email || !amount) {
      return Response.json(
        { error: "Missing required fields: email and amount", status: false },
        { status: 400 }
      );
    }

    if (!card) {
      return Response.json(
        { error: "No payment method specified. Include card object.", status: false },
        { status: 400 }
      );
    }

    const txRef = `gs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`.toUpperCase();

    const payload: Record<string, any> = {
      email,
      amount, // already in kobo
      reference: txRef,
      metadata: metadata || {},
      card: {
        number: card.number.replace(/\s/g, ""),
        cvv: card.cvv,
        expiry_month: card.expiry_month,
        expiry_year: card.expiry_year,
      },
    };

    const response = await fetch("https://api.paystack.co/charge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.message || "Charge failed", status: false },
        { status: response.status }
      );
    }

    const chargeData = data.data;

    return Response.json({
      status: true,
      message: data.message,
      data: {
        reference: chargeData.reference,
        status: chargeData.status,
        display_text: chargeData.display_text ?? null,
        url: chargeData.url ?? null,
        next_action: getNextAction(chargeData.status),
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to process charge", status: false },
      { status: 500 }
    );
  }
}

function getNextAction(status: string): string | null {
  switch (status) {
    case "send_otp": return "otp";
    case "send_pin": return "pin";
    case "send_phone": return "phone";
    case "send_birthday": return "birthday";
    case "open_url": return "3ds";
    case "pending": return "pending";
    case "success": return null;
    default: return null;
  }
}
