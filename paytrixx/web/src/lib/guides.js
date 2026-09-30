import { createOrderSamples, verifySamples } from "./samples.js";

const API = "https://api.yourdomain.com";
const byLabel = (list, label) => list.find((s) => s.label === label).code;

// One guide per server stack: how to create an order and how to verify the callback.
export const GUIDES = [
  {
    slug: "node-express",
    name: "Node.js + Express",
    setup: "No packages needed on Node 18+ (fetch is built in). Keep PAYTRIXX_API_KEY and PAYTRIXX_WEBHOOK_SECRET in environment variables.",
    create: byLabel(createOrderSamples, "Node.js"),
    verify: byLabel(verifySamples, "Node.js"),
  },
  {
    slug: "php",
    name: "PHP",
    setup: "Uses the cURL extension that ships with most PHP installs. Set PAYTRIXX_API_KEY and PAYTRIXX_WEBHOOK_SECRET in your server environment.",
    create: byLabel(createOrderSamples, "PHP"),
    verify: byLabel(verifySamples, "PHP"),
  },
  {
    slug: "laravel",
    name: "Laravel",
    setup: "Uses Laravel's HTTP client. Add the two secrets to .env and read them through config/services.php. Register the callback in routes/api.php so it is outside CSRF protection.",
    create: `// app/Http/Controllers/CheckoutController.php
use Illuminate\\Support\\Facades\\Http;

public function pay(Order $order)
{
    $res = Http::withHeaders([
            'x-api-key' => config('services.paytrixx.key'),
            'Idempotency-Key' => 'order-' . $order->id,
        ])
        ->timeout(15)
        ->post('${API}/api/payment/create', [
            'amount' => $order->total,
            'currency' => 'INR',
            'customerDetails' => ['email' => $order->email],
            'returnUrl' => route('orders.thanks', $order),
        ])
        ->throw()
        ->json();

    $order->update(['paytrixx_order_id' => $res['orderId']]);
    return redirect()->away($res['paymentUrl']);
}`,
    verify: `// routes/api.php
Route::post('/payment/callback', [PaymentCallbackController::class, 'handle']);

// app/Http/Controllers/PaymentCallbackController.php
public function handle(Request $request)
{
    $raw = $request->getContent(); // raw body, not $request->all()
    $expected = hash_hmac('sha256', $raw, config('services.paytrixx.webhook_secret'));

    if (! hash_equals($expected, (string) $request->header('X-Paytrixx-Signature'))) {
        abort(401);
    }

    $data = json_decode($raw, true);
    // Idempotent: the same callback can arrive more than once.
    // Order::where('paytrixx_order_id', $data['orderId'])->where('status', 'pending')
    //      ->update(['status' => $data['status'] === 'success' ? 'paid' : 'failed']);
    return response()->noContent();
}`,
  },
  {
    slug: "python-flask",
    name: "Python + Flask",
    setup: "pip install flask requests. Keep the two secrets in environment variables.",
    create: byLabel(createOrderSamples, "Python"),
    verify: byLabel(verifySamples, "Python"),
  },
  {
    slug: "spring-boot",
    name: "Java + Spring Boot",
    setup: "Uses Spring's RestClient (Spring Framework 6.1+ / Spring Boot 3.2+). Put the secrets in application.properties or environment variables.",
    create: `import org.springframework.web.client.RestClient;
import java.util.Map;

@Service
public class PaytrixxClient {
    private final RestClient http = RestClient.builder().baseUrl("${API}").build();

    public Map<String, Object> createOrder(double amount, String returnUrl, String idempotencyKey) {
        return http.post()
            .uri("/api/payment/create")
            .header("x-api-key", System.getenv("PAYTRIXX_API_KEY"))
            .header("Idempotency-Key", idempotencyKey)
            .body(Map.of("amount", amount, "currency", "INR", "returnUrl", returnUrl))
            .retrieve()
            .body(Map.class); // contains orderId and paymentUrl
    }
}`,
    verify: `import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@RestController
public class PaymentCallbackController {

    @PostMapping("/payment/callback")
    public ResponseEntity<Void> callback(
            @RequestBody String rawBody, // raw text, not a parsed object
            @RequestHeader(value = "X-Paytrixx-Signature", defaultValue = "") String given) throws Exception {

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(System.getenv("PAYTRIXX_WEBHOOK_SECRET").getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String expected = HexFormat.of().formatHex(mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8)));

        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), given.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(401).build();
        }
        // Parse rawBody as JSON here. Be idempotent: the same callback can arrive more than once.
        return ResponseEntity.ok().build();
    }
}`,
  },
  {
    slug: "go",
    name: "Go",
    setup: "Standard library only. Keep the two secrets in environment variables.",
    create: `package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
	"time"
)

type createResp struct {
	OrderID    string \`json:"orderId"\`
	PaymentURL string \`json:"paymentUrl"\`
}

func createOrder(amount float64, returnURL string) (*createResp, error) {
	body, _ := json.Marshal(map[string]any{
		"amount": amount, "currency": "INR", "returnUrl": returnURL,
	})
	req, _ := http.NewRequest("POST", "${API}/api/payment/create", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", os.Getenv("PAYTRIXX_API_KEY"))

	resp, err := (&http.Client{Timeout: 15 * time.Second}).Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var out createResp
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil // redirect the customer to out.PaymentURL
}`,
    verify: `package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"os"
)

func callback(w http.ResponseWriter, r *http.Request) {
	raw, _ := io.ReadAll(r.Body) // raw bytes, before any JSON decoding

	mac := hmac.New(sha256.New, []byte(os.Getenv("PAYTRIXX_WEBHOOK_SECRET")))
	mac.Write(raw)
	expected := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(expected), []byte(r.Header.Get("X-Paytrixx-Signature"))) {
		http.Error(w, "bad signature", http.StatusUnauthorized)
		return
	}
	// json.Unmarshal(raw, &payload). Be idempotent: the same callback can arrive twice.
	w.WriteHeader(http.StatusOK)
}`,
  },
  {
    slug: "rails",
    name: "Ruby on Rails",
    setup: "Uses Net::HTTP from the standard library. Store the secrets in Rails credentials or environment variables.",
    create: `require "net/http"
require "json"

class PaytrixxClient
  def self.create_order(amount:, return_url:, idempotency_key:)
    uri = URI("${API}/api/payment/create")
    req = Net::HTTP::Post.new(uri, "Content-Type" => "application/json",
                                   "x-api-key" => ENV.fetch("PAYTRIXX_API_KEY"),
                                   "Idempotency-Key" => idempotency_key)
    req.body = { amount: amount, currency: "INR", returnUrl: return_url }.to_json

    res = Net::HTTP.start(uri.host, uri.port, use_ssl: true, read_timeout: 15) { |h| h.request(req) }
    JSON.parse(res.body) # orderId, paymentUrl
  end
end

# in a controller: redirect_to result["paymentUrl"], allow_other_host: true`,
    verify: `class PaymentCallbacksController < ApplicationController
  skip_forgery_protection # server-to-server, no browser session

  def create
    raw = request.raw_post # raw body, not params
    expected = OpenSSL::HMAC.hexdigest("SHA256", ENV.fetch("PAYTRIXX_WEBHOOK_SECRET"), raw)
    given = request.headers["X-Paytrixx-Signature"].to_s

    unless ActiveSupport::SecurityUtils.secure_compare(expected, given)
      return head :unauthorized
    end

    data = JSON.parse(raw)
    # Be idempotent: the same callback can arrive more than once.
    # Order.where(paytrixx_order_id: data["orderId"], status: "pending")
    #      .update_all(status: data["status"] == "success" ? "paid" : "failed")
    head :ok
  end
end`,
  },
  {
    slug: "dotnet",
    name: "C# + ASP.NET Core",
    setup: "Uses HttpClient and minimal APIs. Keep the secrets in user-secrets or environment variables.",
    create: `using System.Net.Http.Json;

public class PaytrixxClient(HttpClient http, IConfiguration config)
{
    public async Task<CreateResult?> CreateOrderAsync(decimal amount, string returnUrl, string idempotencyKey)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, "${API}/api/payment/create")
        {
            Content = JsonContent.Create(new { amount, currency = "INR", returnUrl })
        };
        req.Headers.Add("x-api-key", config["Paytrixx:ApiKey"]);
        req.Headers.Add("Idempotency-Key", idempotencyKey);

        var res = await http.SendAsync(req);
        res.EnsureSuccessStatusCode();
        return await res.Content.ReadFromJsonAsync<CreateResult>();
    }
}

public record CreateResult(string OrderId, string PaymentUrl, string Status);
// Redirect the customer to PaymentUrl.`,
    verify: `using System.Security.Cryptography;
using System.Text;

app.MapPost("/payment/callback", async (HttpRequest request, IConfiguration config) =>
{
    using var reader = new StreamReader(request.Body);
    var raw = await reader.ReadToEndAsync(); // raw body, before JSON parsing

    using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(config["Paytrixx:WebhookSecret"]!));
    var expected = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();
    var given = request.Headers["X-Paytrixx-Signature"].ToString();

    if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(expected), Encoding.UTF8.GetBytes(given)))
        return Results.Unauthorized();

    // Deserialize raw with System.Text.Json. Be idempotent: the same callback can arrive twice.
    return Results.Ok();
});`,
  },
];

export const findGuide = (slug) => GUIDES.find((g) => g.slug === slug);
