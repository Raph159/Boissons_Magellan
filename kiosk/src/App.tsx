import { useEffect, useRef, useState } from "react";
import "./App.css";

type User = { id: number; name: string; is_active: number };
type Product = { id: number; name: string; price_cents: number | null; available: boolean };
type Cart = Record<number, number>;

export default function App() {
  const [screen, setScreen] = useState<"badge" | "products" | "thanks">("badge");
  const [status, setStatus] = useState("Badger pour commencer");
  const [user, setUser] = useState<User | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>({});

  // --- badge input (invisible) ---
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bufferRef = useRef("");
  const [debugBuffer, setDebugBuffer] = useState("");

  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    window.addEventListener("click", focus);
    const interval = window.setInterval(focus, 1000);
    return () => {
      window.removeEventListener("click", focus);
      window.clearInterval(interval);
    };
  }, []);

  async function identify(uidRaw: string) {
    const uid = uidRaw.trim().toUpperCase();
    setStatus(`Identification de ${uid}...`);

    const res = await fetch("/api/kiosk/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setStatus(err.error || `Erreur (${res.status})`);
      return;
    }

    const data = await res.json();
    setUser(data.user);
    setStatus(`Bonjour ${data.user.name} ✅`);

    await loadProducts();
    setCart({});
    setScreen("products");
  }

  async function loadProducts() {
    const res = await fetch("/api/kiosk/products");
    const data = await res.json();
    setProducts(data.products);
  }

  function onBadgeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.preventDefault();

    if (e.key === "Enter") {
      const uid = bufferRef.current;
      bufferRef.current = "";
      setDebugBuffer("");
      if (uid) identify(uid);
      return;
    }

    if (e.key.length === 1) {
      bufferRef.current += e.key;
      setDebugBuffer(bufferRef.current);
    }
  }

  function addToCart(productId: number) {
    setCart((c) => ({ ...c, [productId]: (c[productId] || 0) + 1 }));
  }

  function removeFromCart(productId: number) {
    setCart((c) => {
      const next = { ...c };
      const q = next[productId] || 0;
      if (q <= 1) delete next[productId];
      else next[productId] = q - 1;
      return next;
    });
  }

  const cartLines = Object.entries(cart)
    .map(([pid, qty]) => {
      const p = products.find(x => x.id === Number(pid));
      return p ? { product: p, qty } : null;
    })
    .filter(Boolean) as Array<{ product: Product; qty: number }>;

  const totalCents = cartLines.reduce((sum, l) => sum + (l.product.price_cents ?? 0) * l.qty, 0);

  async function submitOrder() {
    if (!user) return;
    if (cartLines.length === 0) return;

    setStatus("Validation...");

    const payload = {
      user_id: user.id,
      items: cartLines.map(l => ({ product_id: l.product.id, qty: l.qty })),
    };

    const res = await fetch("/api/kiosk/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setStatus(err.error || `Erreur (${res.status})`);
      return;
    }

    setScreen("thanks");
    setStatus("Merci ! ✅");

    // reset après 3s
    setTimeout(() => {
      setUser(null);
      setProducts([]);
      setCart({});
      setStatus("Badger pour commencer");
      setScreen("badge");
    }, 3000);
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui" }}>
      <input
        ref={inputRef}
        autoFocus
        inputMode="none"
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 1, width: 1 }}
        onKeyDown={screen === "badge" ? onBadgeKeyDown : undefined}
      />

      {screen === "badge" && (
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, margin: 0 }}>Kiosk</h1>
          <p style={{ fontSize: 20 }}>{status}</p>
          <p style={{ opacity: 0.5, fontSize: 14 }}>Buffer (debug) : {debugBuffer || "—"}</p>
          <p style={{ opacity: 0.7 }}>Test : tape <b>TEST123</b> puis Enter</p>
        </div>
      )}

      {screen === "products" && user && (
        <div style={{ width: "min(900px, 92vw)", display: "grid", gap: 16 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h1 style={{ margin: 0 }}>Bonjour {user.name}</h1>
            <button onClick={() => { setScreen("badge"); setUser(null); setCart({}); setStatus("Badger pour commencer"); }}>
              Déconnexion
            </button>
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <section style={{ border: "1px solid #333", borderRadius: 12, padding: 12 }}>
              <h2>Boissons</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                {products.map(p => (
                  <button
                    key={p.id}
                    disabled={!p.available || p.price_cents == null}
                    onClick={() => addToCart(p.id)}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      border: "1px solid #444",
                      opacity: p.available ? 1 : 0.4,
                      cursor: p.available ? "pointer" : "not-allowed",
                      textAlign: "left"
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{p.name}</div>
                    <div style={{ opacity: 0.8 }}>
                      {p.price_cents == null ? "Prix manquant" : `${(p.price_cents / 100).toFixed(2)} €`}
                      {" · "}
                      {p.available ? "Dispo" : "Indispo"}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <aside style={{ border: "1px solid #333", borderRadius: 12, padding: 12 }}>
              <h2>Panier</h2>

              {cartLines.length === 0 ? (
                <p style={{ opacity: 0.7 }}>Vide</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {cartLines.map(l => (
                    <div key={l.product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{l.product.name}</div>
                        <div style={{ opacity: 0.7 }}>{(Number(l.qty))} × {(l.product.price_cents!/100).toFixed(2)} €</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => removeFromCart(l.product.id)}>-</button>
                        <button onClick={() => addToCart(l.product.id)}>+</button>
                      </div>
                    </div>
                  ))}

                  <hr style={{ opacity: 0.2 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
                    <span>Total</span>
                    <span>{(totalCents / 100).toFixed(2)} €</span>
                  </div>

                  <button
                    onClick={submitOrder}
                    style={{ padding: 14, borderRadius: 12, fontWeight: 900 }}
                  >
                    Valider
                  </button>

                  <p style={{ opacity: 0.7 }}>{status}</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {screen === "thanks" && (
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 56, margin: 0 }}>Merci !</h1>
          <p style={{ opacity: 0.8 }}>{status}</p>
        </div>
      )}
    </main>
  );
}
