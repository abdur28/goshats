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
    const { reference, otp, pin, phone, birthday } = body;

    if (!reference) {
      return Response.json(
        { error: "Missing required field: reference", status: false },
        { status: 400 }
      );
    }

    let endpoint: string;
    const payload: Record<string, any> = { reference };

    if (otp) {
      endpoint = "https://api.paystack.co/charge/submit_otp";
      payload.otp = otp;
    } else if (pin) {
      endpoint = "https://api.paystack.co/charge/submit_pin";
      payload.pin = pin;
    } else if (phone) {
      endpoint = "https://api.paystack.co/charge/submit_phone";
      payload.phone = phone;
    } else if (birthday) {
      endpoint = "https://api.paystack.co/charge/submit_birthday";
      payload.birthday = birthday;
    } else {
      return Response.json(
        { error: "No submission data provided. Include otp, pin, phone, or birthday.", status: false },
        { status: 400 }
      );
    }

    const response = await fetch(endpoint, {
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
        { error: data.message || "Submission failed", status: false },
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
      { error: error.message || "Failed to submit data", status: false },
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
