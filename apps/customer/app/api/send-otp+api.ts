export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return Response.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.EXPO_PUBLIC_ADMIN_API_URL;
    const apiKey = process.env.EXPO_PUBLIC_EMAIL_API_KEY;

    if (!backendUrl || !apiKey) {
      console.error("Missing environment variables");
      return Response.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const response = await fetch(`${backendUrl}/api/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Error in send-otp API route:", error);
    return Response.json(
      { success: false, error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}
