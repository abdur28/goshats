export async function GET(request: Request) {
  try {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET) {
      return Response.json(
        { error: "Payment service not configured", status: false },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const reference = url.searchParams.get("reference");

    if (!reference) {
      return Response.json(
        { error: "Missing required parameter: reference", status: false },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.message || "Failed to verify transaction", status: false },
        { status: response.status }
      );
    }

    const tx = data.data;
    const auth = tx.authorization ?? {};

    return Response.json({
      status: true,
      data: {
        reference: tx.reference,
        status: tx.status,
        amount: tx.amount,
        authorizationCode: auth.authorization_code ?? null,
        last4: auth.last4 ?? null,
        bank: auth.bank ?? null,
        cardType: auth.card_type ?? null,
        expiryMonth: auth.exp_month ? parseInt(auth.exp_month, 10) : null,
        expiryYear: auth.exp_year ? parseInt(auth.exp_year, 10) : null,
        brand: auth.brand ?? null,
        signature: auth.signature ?? null,
        bin: auth.bin ?? null,
        customerEmail: tx.customer?.email ?? null,
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to verify transaction", status: false },
      { status: 500 }
    );
  }
}
