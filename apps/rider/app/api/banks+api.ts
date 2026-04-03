/**
 * API Route: Fetch Nigerian Banks
 * Proxies Paystack /bank endpoint so the secret key stays server-side
 *
 * GET /api/banks
 */
export async function GET() {
  try {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET) {
      return Response.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.paystack.co/bank?currency=NGN&use_cursor=false&perPage=100",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return Response.json(
        { error: errorData.message || "Failed to fetch banks" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.status || !data.data) {
      return Response.json(
        { error: "Invalid response from payment service" },
        { status: 500 }
      );
    }

    // Filter active, non-deleted banks and sort A→Z
    const banks = data.data
      .filter((b: any) => b.active && !b.is_deleted)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return Response.json({ status: true, data: banks });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to fetch banks" },
      { status: 500 }
    );
  }
}
