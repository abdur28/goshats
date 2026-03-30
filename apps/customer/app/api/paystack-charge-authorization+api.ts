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
    const { authorizationCode, email, amount, reference } = body;

    if (!authorizationCode || !email || !amount || !reference) {
      return Response.json(
        { error: "Missing required fields: authorizationCode, email, amount, reference", status: false },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.paystack.co/transaction/charge_authorization",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorization_code: authorizationCode,
          email,
          amount, // in kobo
          reference,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.message || "Charge authorization failed", status: false },
        { status: response.status }
      );
    }

    const tx = data.data;

    return Response.json({
      status: true,
      data: {
        reference: tx.reference,
        status: tx.status,
        amount: tx.amount,
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to charge authorization", status: false },
      { status: 500 }
    );
  }
}
