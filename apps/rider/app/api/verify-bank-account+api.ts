/**
 * API Route: Verify Nigerian Bank Account
 * Proxies Paystack /bank/resolve — secret key stays server-side
 *
 * POST /api/verify-bank-account
 * Body: { accountNumber: string, bankCode: string }
 */
export async function POST(request: Request) {
  try {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET) {
      return Response.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { accountNumber, bankCode } = body;

    if (!accountNumber || !bankCode) {
      return Response.json(
        { error: "Missing required fields: accountNumber and bankCode" },
        { status: 400 }
      );
    }

    // Nigerian NUBAN is exactly 10 digits
    if (!/^\d{10}$/.test(accountNumber)) {
      return Response.json(
        { error: "Invalid account number. Must be exactly 10 digits." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return Response.json(
        {
          error: data.message || "Could not verify this account. Check the details and try again.",
          verified: false,
        },
        { status: response.ok ? 400 : response.status }
      );
    }

    return Response.json({
      status: true,
      data: {
        accountNumber: data.data.account_number,
        accountName: data.data.account_name,
        bankCode,
        verified: true,
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to verify bank account", verified: false },
      { status: 500 }
    );
  }
}
