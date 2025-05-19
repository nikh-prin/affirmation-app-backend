import { Request, Response } from "express";
import prisma from "../prisma"; // Import the centralized Prisma client
import crypto from "crypto"; // Node.js built-in module for cryptography

// Define a custom interface to add user property to Request, matching auth.middleware
interface AuthRequest extends Request {
  user?: { id: string };
}

// --- Mock PhonePe Integration ---
// In a real integration, you would use the actual PhonePe SDK or make HTTP requests
// to their APIs here. This is a simplified mock.

// Mock PhonePe API Key and Salt (Replace with your actual test/production keys)
const MOCK_PHONEPE_API_KEY = process.env.PHONEPE_API_KEY || "YOUR_MOCK_API_KEY";
const MOCK_PHONEPE_SALT = process.env.PHONEPE_SALT || "YOUR_MOCK_SALT";
const MOCK_PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1"; // As provided by PhonePe

// Mock function to generate a signature (simplified)
// In a real scenario, follow PhonePe's specific signature generation algorithm
const generateMockSignature = (payload: any): string => {
  const stringToHash =
    JSON.stringify(payload) + "/pg/v1/pay" + MOCK_PHONEPE_SALT; // Example string format
  const hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
  return hash + "###" + MOCK_PHONEPE_SALT_INDEX;
};

// Mock function to verify a webhook signature (simplified)
// In a real scenario, follow PhonePe's specific signature verification algorithm
const verifyMockWebhookSignature = (
  body: any,
  receivedSignature: string | undefined
): boolean => {
  if (!receivedSignature) {
    return false;
  }
  // Example verification string format (adjust based on PhonePe docs)
  const stringToHash = JSON.stringify(body) + MOCK_PHONEPE_SALT;
  const expectedSignature =
    crypto.createHash("sha256").update(stringToHash).digest("hex") +
    "###" +
    MOCK_PHONEPE_SALT_INDEX;
  console.log("Received Signature:", receivedSignature);
  console.log("Expected Signature:", expectedSignature);
  return receivedSignature === expectedSignature;
};

// @desc    Create a mock payment order for premium subscription
// @route   POST /api/payments/create-order
// @access  Private (requires authentication)
const createPaymentOrder = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { plan } = req.body; // Expecting the plan (e.g., 'premium_monthly')

  if (!userId) {
    return res.status(401).json({ message: "Not authorized" });
  }
  if (!plan) {
    return res.status(400).json({ message: "Plan is required" });
  }

  // --- Mock Order Creation ---
  // In a real scenario, you'd call PhonePe API here.
  // This mock generates a dummy order ID and a mock redirect URL/payload.
  const mockOrderId = `order_${Date.now()}_${userId.substring(0, 5)}`;
  const mockAmount = plan === "premium_monthly" ? 10000 : 100000; // Example: 100 INR (in paise) or 1000 INR

  const mockPaymentPayload = {
    merchantId: "MOCK_MERCHANT_ID", // Replace with your PhonePe Merchant ID
    merchantTransactionId: mockOrderId,
    merchantUserId: userId,
    amount: mockAmount,
    redirectUrl: `${process.env.BACKEND_URL}/api/payments/webhook?orderId=${mockOrderId}`, // This is where PhonePe redirects the user (browser flow)
    redirectMode: "REDIRECT",
    callbackUrl: `${process.env.BACKEND_URL}/api/payments/webhook`, // This is the webhook URL (server-to-server)
    mobileNumber: "9999999999", // User's mobile number (optional but recommended)
    paymentInstrument: {
      type: "PAY_PAGE", // Indicates using the PhonePe hosted payment page
    },
  };

  const mockBase64Payload = Buffer.from(
    JSON.stringify(mockPaymentPayload)
  ).toString("base64");
  const mockSignature = generateMockSignature(mockPaymentPayload); // Generate mock signature

  // In a real scenario, you'd send this payload to PhonePe's initiate payment API
  // and get a response containing a redirect URL or payment data.
  // For this mock, we'll just return the payload and signature as if we got it from PhonePe.

  try {
    // Optionally, save a pending payment record in your DB
    // await prisma.payment.create({
    //     data: {
    //         userId: userId,
    //         amount: mockAmount / 100, // Store in currency units
    //         currency: 'INR',
    //         status: 'pending',
    //         gatewayPaymentId: mockOrderId, // Using orderId as mock payment ID
    //     }
    // });

    res.json({
      success: true,
      message: "Mock payment order created",
      data: {
        // In a real PhonePe integration, this would be the response from PhonePe's API
        // containing the URL or data needed to open the payment page/app.
        // For this mock, we'll return the base64 payload and signature
        // as if the app will use these to construct the payment request.
        // NOTE: A real PhonePe flow usually involves getting a payment URL from PhonePe's API response.
        // This mock is simplified.
        base64Payload: mockBase64Payload,
        signature: mockSignature,
        // A real response might look more like:
        // redirectUrl: 'https://cashfree.com/pg/payments/...' or similar
      },
      mockPaymentDetails: mockPaymentPayload, // Include mock details for client understanding
    });
  } catch (error) {
    console.error("Error creating mock payment order:", error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

// @desc    Handle mock PhonePe webhook notifications
// @route   POST /api/payments/webhook
// @access  Public (PhonePe servers)
const handlePhonePeWebhook = async (req: Request, res: Response) => {
  // PhonePe typically sends a JSON payload in the request body
  // and a signature in a header (e.g., 'X-Verify').

  // In Express, you need middleware like `express.raw({ type: 'application/json' })`
  // *before* this route handler to get the raw body for signature verification.
  // The JSON body will be available in `req.body` (if parsed) or `req.body.toString()` (if raw).

  const receivedSignature = req.headers["x-verify"] as string | undefined; // Check the actual header name PhonePe uses
  const webhookBody = req.body; // This will be the raw body if using express.raw

  console.log("Received webhook:", webhookBody.toString());
  console.log("Received Signature Header (X-Verify):", receivedSignature);

  // --- Mock Signature Verification ---
  // In a real scenario, verify the signature using PhonePe's algorithm and your salt/key.
  // const isSignatureValid = verifyMockWebhookSignature(JSON.parse(webhookBody.toString()), receivedSignature); // Parse if raw body
  // For this mock, we'll skip signature verification for simplicity, but it's CRITICAL in production.
  const isSignatureValid = true; // MOCK: Assume signature is always valid for demonstration

  if (!isSignatureValid) {
    console.warn("Webhook signature verification failed!");
    return res.status(401).send("Invalid signature"); // 401 Unauthorized
  }

  try {
    // --- Mock Webhook Processing ---
    // In a real scenario, parse the webhook body from PhonePe.
    // The structure depends on PhonePe's webhook documentation.
    // This mock assumes a simple structure indicating success/failure.

    const webhookData = JSON.parse(webhookBody.toString()); // Parse the raw body

    const { code, merchantTransactionId, transactionId, state } = webhookData; // Example fields

    console.log("Parsed webhook data:", webhookData);

    // Check if the payment was successful based on PhonePe's status code/field
    // The actual field names and values depend on PhonePe's webhook documentation.
    const isPaymentSuccessful =
      code === "PAYMENT_SUCCESS" || state === "COMPLETED"; // MOCK: Example conditions

    if (isPaymentSuccessful) {
      console.log(
        `Mock Payment Success for Transaction ID: ${merchantTransactionId}`
      );

      // Find the user associated with this transaction ID (assuming you stored it)
      // In a real app, you might look up a pending payment record by merchantTransactionId
      // or the user ID if it's included in the webhook payload.
      const user = await prisma.user.findFirst({
        where: {
          // Assuming merchantTransactionId can be linked back to a user
          // This is a simplification; a real system might use a dedicated Payment record
          // or include userId in the initial payment request payload that PhonePe returns in the webhook.
          // For this mock, let's assume merchantTransactionId is stored somewhere linkable to the user.
          // A better approach: store merchantTransactionId in a Payment table with userId, then look up the Payment record here.
        },
      });

      // MOCK: Assuming we can somehow link the webhook to a user
      // In a real app, you'd get the user ID reliably from your system based on the webhook data.
      const mockUserId = "some-user-id-from-your-system-based-on-webhook-data"; // Replace with logic to get actual user ID
      // For the purpose of this mock, let's find a user to simulate updating their subscription
      const targetUser = await prisma.user.findFirst(); // MOCK: Get any user to demonstrate update

      if (targetUser) {
        console.log(`Updating subscription for user: ${targetUser.id}`);
        // Update the user's subscription status in your database
        // Create or update the Subscription record
        await prisma.subscription.upsert({
          where: { userId: targetUser.id }, // Find by userId
          update: {
            // If subscription exists, update it
            status: "active",
            plan: "premium_monthly", // Or get plan from webhook data if available
            startDate: new Date(),
            endDate: null, // Assuming recurring, no fixed end date initially
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Mock renewal in 30 days
            paymentGateway: "phonepe",
            gatewaySubscriptionId: transactionId, // Store gateway's transaction ID
            gatewayCustomerId: targetUser.id, // Use userId as mock gateway customer ID
          },
          create: {
            // If no subscription exists, create one
            userId: targetUser.id,
            status: "active",
            plan: "premium_monthly",
            startDate: new Date(),
            endDate: null,
            renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentGateway: "phonepe",
            gatewaySubscriptionId: transactionId,
            gatewayCustomerId: targetUser.id,
          },
        });
        console.log(`Subscription updated to active for user ${targetUser.id}`);

        // You might want to send a confirmation email or push notification to the user here
      } else {
        console.error(
          `User not found for merchantTransactionId: ${merchantTransactionId}`
        );
        // Log this error - indicates an issue linking the payment to a user
      }
    } else {
      console.log(
        `Mock Payment Failed for Transaction ID: ${merchantTransactionId}. State: ${state}, Code: ${code}`
      );
      // Handle failed payments (e.g., update a payment record status to 'failed')
    }

    // Respond to PhonePe to acknowledge successful receipt of the webhook
    // PhonePe expects a 200 OK response.
    res.status(200).send("Webhook received successfully");
  } catch (error) {
    console.error("Error processing PhonePe webhook:", error);
    // It's important to return a 200 OK even on internal errors
    // so PhonePe doesn't keep retrying the webhook endlessly.
    // Log the error and handle it internally.
    res.status(200).send("Error processing webhook (internal)");
  }
};

export { createPaymentOrder, handlePhonePeWebhook, handlePhonePeRedirect };

// @desc    Handle PhonePe redirect from browser after payment
// @route   GET /api/payments/webhook
// @access  Public (redirected user)
const handlePhonePeRedirect = async (req: Request, res: Response) => {
  try {
    // Extract parameters from the query string
    const { orderId, transactionId, status } = req.query;

    console.log(
      `Payment redirect received with status: ${status}, orderId: ${orderId}`
    );

    let redirectUrl = "affirmation-app://payment";

    // Add query parameters based on the payment result
    if (status === "SUCCESS" || status === "success") {
      redirectUrl += "/success";

      // Update user subscription in database if not already done by webhook
      // For demo purposes, we're assuming the orderId can help us identify the user
      if (orderId) {
        // In a real app, find the user by the payment record
        const targetUser = await prisma.user.findFirst(); // MOCK: Get any user to demonstrate update

        if (targetUser) {
          // Check if the user already has an active subscription
          const existingSubscription = await prisma.subscription.findUnique({
            where: { userId: targetUser.id },
          });

          if (
            !existingSubscription ||
            existingSubscription.status !== "active"
          ) {
            // If no active subscription, create or update it
            await prisma.subscription.upsert({
              where: { userId: targetUser.id },
              update: {
                status: "active",
                plan: "premium_monthly",
                startDate: new Date(),
                renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                paymentGateway: "phonepe",
                gatewaySubscriptionId: (transactionId as string) || "unknown",
              },
              create: {
                userId: targetUser.id,
                status: "active",
                plan: "premium_monthly",
                startDate: new Date(),
                renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                paymentGateway: "phonepe",
                gatewaySubscriptionId: (transactionId as string) || "unknown",
              },
            });
            console.log(
              `Subscription activated for user ${targetUser.id} on redirect`
            );
          }
        }
      }
    } else {
      redirectUrl +=
        "/failure?reason=" +
        encodeURIComponent((status as string) || "unknown");
    }

    // In a real production app, you'd use a frontend URL from your config
    const frontendSuccessUrl = "https://yourfrontend.com/payment-success";
    const frontendFailureUrl = "https://yourfrontend.com/payment-failure";

    // HTML page with auto-redirect to the mobile app
    const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Payment ${status === "SUCCESS" ? "Successful" : "Failed"}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          text-align: center;
          padding: 20px;
          background-color: #f9f9f9;
          color: #333;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: ${status === "SUCCESS" ? "#4CAF50" : "#F44336"};
        }
        .button {
          display: inline-block;
          background-color: #4e73df;
          color: white;
          padding: 10px 20px;
          margin-top: 20px;
          border-radius: 5px;
          text-decoration: none;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Payment ${status === "SUCCESS" ? "Successful" : "Failed"}</h1>
        <p>${
          status === "SUCCESS"
            ? "Your payment was successful! You now have access to premium features."
            : "There was a problem with your payment. Please try again."
        }</p>
        <p>Redirecting you back to the app...</p>
        <a href="${redirectUrl}" class="button">Return to App</a>
      </div>
      <script>
        // Attempt to redirect back to the app automatically
        setTimeout(function() {
          window.location.href = '${redirectUrl}';
        }, 2000); // Redirect after 2 seconds
      </script>
    </body>
    </html>
    `;

    // Set content type and send the HTML
    res.setHeader("Content-Type", "text/html");
    res.send(htmlResponse);
  } catch (error) {
    console.error("Error handling payment redirect:", error);
    res.status(500).send("Error processing payment redirect");
  }
};
