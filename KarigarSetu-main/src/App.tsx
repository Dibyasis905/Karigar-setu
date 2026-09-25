import { useState, useEffect, type ChangeEvent } from "react";
import { api, type ApiProduct, type ApiOrder } from "./api";

type Screen =
  | "landing" | "language" | "login" | "register" | "usertype"
  | "artisan-dashboard" | "add-product" | "ai-processing" | "ai-listing"
  | "edit-listing" | "product-published"
  | "marketplace" | "ai-search" | "ai-recommendations" | "product-details"
  | "cart" | "checkout" | "order-success" | "order-tracking"
  | "artisan-orders" | "artisan-profile";

type Nav = { navigate: (s: Screen) => void };

type CartItem = {
  product: string;
  name: string;
  artisan: string;
  price: number;
  qty: number;
  img: string;
};

const SELECTED_PRODUCT_KEY = "karigarsetu_selected_product";
const CART_KEY = "karigarsetu_cart";
const LAST_PRODUCT_KEY = "karigarsetu_last_product";
const LAST_ORDER_KEY = "karigarsetu_last_order";
const SEARCH_QUERY_KEY = "karigarsetu_search_query";
const ROLE_INTENT_KEY = "karigarsetu_role_intent";

function getSelectedProductId() {
  return localStorage.getItem(SELECTED_PRODUCT_KEY) || "";
}

function setSelectedProductId(id: string) {
  localStorage.setItem(SELECTED_PRODUCT_KEY, id);
}

function setRoleIntent(role: "buyer" | "artisan") {
  localStorage.setItem(ROLE_INTENT_KEY, role);
}

function getRoleIntent() {
  const role = localStorage.getItem(ROLE_INTENT_KEY);
  return role === "buyer" || role === "artisan" ? role : "";
}

function clearRoleIntent() {
  localStorage.removeItem(ROLE_INTENT_KEY);
}

function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function setCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function productImage(product?: ApiProduct | null) {
  return product?.images?.[0] || "https://images.unsplash.com/photo-1613833684971-9411a2b00970?w=400&h=300&fit=crop&auto=format";
}

function productArtisanName(product?: ApiProduct | null) {
  return product?.artisan?.name || product?.artisan?.user?.name || "KarigarSetu Artisan";
}

// ── Shared Components ─────────────────────────────────────────────────────────

function Btn({
  label, onClick, variant = "primary", full = true, small = false,
}: {
  label: string; onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
  full?: boolean; small?: boolean;
}) {
  const base = `${full ? "w-full" : ""} ${small ? "py-2 px-4 text-xs" : "py-4 px-6 text-sm"} rounded-2xl font-semibold transition-all active:scale-[0.97] cursor-pointer`;
  const styles = {
    primary: "bg-terracotta text-white shadow-md shadow-terracotta/20",
    secondary: "bg-beige text-brown",
    ghost: "text-terracotta border-2 border-terracotta bg-transparent",
  };
  return <button className={`${base} ${styles[variant]}`} onClick={onClick}>{label}</button>;
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-2 -ml-2 text-brown flex-shrink-0">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ArtisanNav({ active, navigate }: { active: string } & Nav) {
  const items = [
    { id: "home", icon: "⌂", label: "Home", to: "artisan-dashboard" as Screen },
    { id: "products", icon: "☰", label: "Products", to: "artisan-dashboard" as Screen },
    { id: "add", icon: "+", label: "Add", to: "add-product" as Screen },
    { id: "orders", icon: "📦", label: "Orders", to: "artisan-orders" as Screen },
    { id: "profile", icon: "👤", label: "Profile", to: "artisan-profile" as Screen },
  ];
  return (
    <div className="flex-shrink-0 bg-white border-t border-beige flex items-end pt-1 pb-2">
      {items.map((item) => {
        if (item.id === "add") return (
          <button key={item.id} onClick={() => navigate(item.to)} className="flex-1 flex flex-col items-center pb-0.5">
            <div className="w-12 h-12 -mt-6 bg-terracotta rounded-full flex items-center justify-center text-white text-2xl font-light shadow-lg border-4 border-cream">+</div>
            <span className="text-[10px] text-brown/40 mt-1">Add</span>
          </button>
        );
        const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => navigate(item.to)} className={`flex-1 flex flex-col items-center gap-0.5 py-1 ${isActive ? "text-terracotta" : "text-brown/35"}`}>
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function BuyerNav({ active, navigate }: { active: string } & Nav) {
  const items = [
    { id: "home", icon: "⌂", label: "Home", to: "marketplace" as Screen },
    { id: "search", icon: "🔍", label: "Search", to: "ai-search" as Screen },
    { id: "wishlist", icon: "♡", label: "Wishlist", to: "marketplace" as Screen },
    { id: "cart", icon: "🛒", label: "Cart", to: "cart" as Screen },
    { id: "profile", icon: "👤", label: "Profile", to: "marketplace" as Screen },
  ];
  return (
    <div className="flex-shrink-0 bg-white border-t border-beige flex pt-1 pb-2">
      {items.map((item) => (
        <button key={item.id} onClick={() => navigate(item.to)} className={`flex-1 flex flex-col items-center gap-0.5 py-1 ${active === item.id ? "text-terracotta" : "text-brown/35"}`}>
          <span className="text-lg">{item.icon}</span>
          <span className="text-[10px]">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProductCard({ id, name, price, artisan, rating, img, onClick }: {
  id?: string; name: string; price: string; artisan: string; rating: string; img: string; onClick: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const handleClick = () => {
    if (id) setSelectedProductId(id);
    onClick();
  };
  return (
    <div onClick={handleClick} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-beige/50 cursor-pointer active:scale-[0.97] transition-transform">
      <div className="relative">
        <img src={img} alt={name} className="w-full h-36 object-cover bg-beige" />
        <button onClick={(e) => { e.stopPropagation(); setLiked((v) => !v); }} className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-xs shadow">
          {liked ? "❤️" : "♡"}
        </button>
      </div>
      <div className="p-3">
        <p className="font-semibold text-brown text-xs leading-tight">{name}</p>
        <p className="text-brown/45 text-[10px] mt-0.5">{artisan}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-terracotta font-bold text-sm">{price}</span>
          <span className="text-yellow-500 text-[10px]">⭐ {rating}</span>
        </div>
      </div>
    </div>
  );
}

// ── Screen 1: Landing ─────────────────────────────────────────────────────────

function Landing({ navigate }: Nav) {
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "offline">("checking");
  useEffect(() => {
    api.health().then((data) => setDbStatus(data.database === "connected" ? "connected" : "offline")).catch(() => setDbStatus("offline"));
  }, []);

  const startRoleFlow = async (role: "buyer" | "artisan") => {
    setRoleIntent(role);
    const token = localStorage.getItem("karigarsetu_token");
    if (token) {
      try {
        const data = await api.getMe();
        if (data.user?.role === role) {
          clearRoleIntent();
          navigate(role === "artisan" ? "artisan-dashboard" : "marketplace");
          return;
        }
      } catch {
        api.logout();
      }
    }
    navigate(role === "artisan" ? "login" : "language");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-cream">
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-terracotta rounded-xl flex items-center justify-center text-white text-xs font-bold">KS</div>
          <span className="font-serif text-brown text-lg">KarigarSetu</span>
        </div>
        <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${dbStatus === "connected" ? "bg-green/10 text-green" : dbStatus === "offline" ? "bg-red-50 text-red-600" : "bg-beige text-brown/50"}`}>
          {dbStatus === "connected" ? "● Database connected" : dbStatus === "offline" ? "● Database offline" : "● Checking database"}
        </div>
      </div>

      <div className="px-5 pt-2">
        <p className="text-green text-xs font-semibold tracking-widest uppercase mb-2">AI-Powered Marketplace</p>
        <h1 className="font-serif text-brown text-[34px] leading-[1.15] mb-4">Bridging Artisans<br />to Markets</h1>
        <p className="text-brown/60 text-sm leading-relaxed mb-6">AI-powered tools helping artisans showcase their crafts, create professional product listings, and reach new customers.</p>
        <div className="flex flex-col gap-3 mb-6">
          <Btn label="Explore Marketplace" onClick={() => void startRoleFlow("buyer")} />
          <Btn label="I'm an Artisan" onClick={() => void startRoleFlow("artisan")} variant="ghost" />
        </div>
      </div>

      <div className="mx-5 rounded-3xl overflow-hidden h-52 bg-beige mb-8 shadow-lg">
        <img src="https://images.unsplash.com/photo-1507022787381-b30170b5ebf4?w=400&h=300&fit=crop&auto=format" alt="Indian artisan working on pottery" className="w-full h-full object-cover" />
      </div>

      <div className="px-5 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-beige"></div>
          <h2 className="font-serif text-brown text-xl">From Craft to Market</h2>
          <div className="h-px flex-1 bg-beige"></div>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: "📷", title: "Upload Your Craft", desc: "Take a photo of your handmade product." },
            { icon: "✨", title: "AI Creates Your Listing", desc: "AI identifies your product and generates a professional catalogue automatically." },
            { icon: "🏪", title: "Reach New Customers", desc: "Connect your traditional craft with customers beyond your local market." },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex gap-4 items-start shadow-sm border border-beige/40">
              <div className="w-11 h-11 bg-cream rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{f.icon}</div>
              <div><p className="font-semibold text-brown text-sm mb-0.5">{f.title}</p><p className="text-brown/55 text-xs leading-relaxed">{f.desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-6 bg-brown text-center">
        <p className="font-serif text-cream text-base mb-1">KarigarSetu</p>
        <p className="text-cream/50 text-xs">Bridging Artisans to Markets · SIH26090</p>
      </div>
    </div>
  );
}

// ── Screen 2: Language ─────────────────────────────────────────────────────────

function LanguageSelect({ navigate }: Nav) {
  const [selected, setSelected] = useState("en");
  const langs = [
    { id: "hi", label: "हिन्दी", sub: "Hindi" },
    { id: "en", label: "English", sub: "English" },
    { id: "bn", label: "বাংলা", sub: "Bengali" },
    { id: "mr", label: "मराठी", sub: "Marathi" },
    { id: "ta", label: "தமிழ்", sub: "Tamil" },
    { id: "te", label: "తెలుగు", sub: "Telugu" },
  ];
  return (
    <div className="flex-1 bg-cream flex flex-col px-5 pt-14">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-terracotta rounded-2xl flex items-center justify-center text-white font-serif text-2xl font-bold shadow-lg">KS</div>
      </div>
      <h1 className="font-serif text-brown text-3xl text-center mb-2">Welcome to KarigarSetu</h1>
      <p className="text-brown/55 text-center text-sm mb-8">Choose your preferred language</p>
      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {langs.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelected(l.id)}
            className={`rounded-2xl p-5 flex flex-col items-center gap-1.5 border-2 transition-all ${selected === l.id ? "border-terracotta bg-terracotta/8" : "border-beige bg-white"}`}
          >
            <span className={`text-2xl font-serif ${selected === l.id ? "text-terracotta" : "text-brown"}`}>{l.label}</span>
            <span className="text-xs text-brown/45">{l.sub}</span>
            {selected === l.id && <span className="text-terracotta text-xs font-bold">✓ Selected</span>}
          </button>
        ))}
      </div>
      <div className="py-6">
        <Btn label="Continue" onClick={() => navigate("login")} />
      </div>
    </div>
  );
}

// ── Screen 3: Login ───────────────────────────────────────────────────────────

function Login({ navigate }: Nav) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = async (demoEmail?: string, demoPassword = "Demo@12345") => {
    const finalEmail = demoEmail || email.trim();
    if (!finalEmail || !password && !demoEmail) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.login({ email: finalEmail, password: demoEmail ? demoPassword : password });
      const intendedRole = getRoleIntent();
      if (intendedRole && data.user.role !== intendedRole) {
        api.logout();
        setError(`This account is registered as a ${data.user.role}. Please use a ${intendedRole} account or choose the correct role.`);
        return;
      }
      clearRoleIntent();
      navigate(data.user.role === "artisan" ? "artisan-dashboard" : "marketplace");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-cream flex flex-col px-5 pt-14 overflow-y-auto">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-terracotta rounded-xl flex items-center justify-center text-white text-xs font-bold">KS</div>
        <span className="font-serif text-brown text-lg">KarigarSetu</span>
      </div>
      <h1 className="font-serif text-brown text-3xl mb-1.5">Welcome Back</h1>
      <p className="text-brown/55 text-sm mb-3">Sign in to the database-backed KarigarSetu prototype.</p>
      {getRoleIntent() && (
        <div className="mb-5 rounded-2xl border border-beige bg-white px-4 py-3 text-xs text-brown/65">
          Continuing as <span className="font-bold text-terracotta">{getRoleIntent() === "artisan" ? "🏺 Artisan" : "🛍️ Buyer"}</span>. Your account role will determine which dashboard opens.
        </div>
      )}

      <div className="flex flex-col gap-4 flex-1">
        <div>
          <label className="text-brown/65 text-xs font-semibold uppercase tracking-wider mb-2 block">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-white border-2 border-beige rounded-2xl px-4 py-4 text-brown text-sm placeholder:text-brown/25 outline-none focus:border-terracotta transition-colors" />
        </div>
        <div>
          <label className="text-brown/65 text-xs font-semibold uppercase tracking-wider mb-2 block">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" onKeyDown={(e) => { if (e.key === "Enter") signIn(); }} className="w-full bg-white border-2 border-beige rounded-2xl px-4 py-4 text-brown text-sm placeholder:text-brown/25 outline-none focus:border-terracotta transition-colors" />
        </div>
        {error && <div className="bg-red-50 text-red-600 rounded-xl px-3 py-2 text-xs">{error}</div>}
        <Btn label={loading ? "Signing in…" : "Sign In →"} onClick={() => signIn()} />
        <button onClick={() => navigate("register")} className="text-terracotta text-sm font-semibold py-1">New to KarigarSetu? Create an account</button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-beige"></div><span className="text-brown/35 text-xs">demo accounts</span><div className="flex-1 h-px bg-beige"></div>
        </div>

        <button onClick={() => signIn("artisan@karigarsetu.demo")} className="w-full bg-white border-2 border-beige rounded-2xl p-4 text-left active:scale-[0.98] transition-transform">
          <p className="font-semibold text-brown text-sm">🏺 Demo Artisan</p>
          <p className="text-brown/45 text-[10px] mt-1">artisan@karigarsetu.demo · Demo@12345</p>
        </button>
        <button onClick={() => signIn("buyer@karigarsetu.demo")} className="w-full bg-white border-2 border-beige rounded-2xl p-4 text-left active:scale-[0.98] transition-transform">
          <p className="font-semibold text-brown text-sm">🛍️ Demo Buyer</p>
          <p className="text-brown/45 text-[10px] mt-1">buyer@karigarsetu.demo · Demo@12345</p>
        </button>

        <p className="text-center text-brown/40 text-xs mt-1">Credentials are for local prototype/demo use.</p>
      </div>
      <p className="py-5 text-center text-xs text-brown/35">By continuing, you agree to our Terms & Privacy Policy</p>
    </div>
  );
}


// ── Screen 4: Register ─────────────────────────────────────────────────────────

function Register({ navigate }: Nav) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "artisan">(getRoleIntent() === "artisan" ? "artisan" : "buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const register = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.register({ name: cleanName, email: cleanEmail, password, role });
      clearRoleIntent();
      if (role === "artisan") {
        navigate("artisan-dashboard");
      } else {
        navigate("marketplace");
      }
      void data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-cream flex flex-col px-5 pt-14 overflow-y-auto">
      <div className="flex items-center gap-2 mb-8">
        <BackBtn onClick={() => navigate("login")} />
        <div className="w-8 h-8 bg-terracotta rounded-xl flex items-center justify-center text-white text-xs font-bold">KS</div>
        <span className="font-serif text-brown text-lg">KarigarSetu</span>
      </div>

      <h1 className="font-serif text-brown text-3xl mb-1.5">Create Account</h1>
      <p className="text-brown/55 text-sm mb-6">Join KarigarSetu and connect with the database-backed marketplace.</p>

      <div className="flex flex-col gap-4 flex-1">
        <div>
          <label className="text-brown/65 text-xs font-semibold uppercase tracking-wider mb-2 block">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="w-full bg-white border-2 border-beige rounded-2xl px-4 py-4 text-brown text-sm placeholder:text-brown/25 outline-none focus:border-terracotta transition-colors" />
        </div>
        <div>
          <label className="text-brown/65 text-xs font-semibold uppercase tracking-wider mb-2 block">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-white border-2 border-beige rounded-2xl px-4 py-4 text-brown text-sm placeholder:text-brown/25 outline-none focus:border-terracotta transition-colors" />
        </div>
        <div>
          <label className="text-brown/65 text-xs font-semibold uppercase tracking-wider mb-2 block">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full bg-white border-2 border-beige rounded-2xl px-4 py-4 text-brown text-sm placeholder:text-brown/25 outline-none focus:border-terracotta transition-colors" />
        </div>
        <div>
          <label className="text-brown/65 text-xs font-semibold uppercase tracking-wider mb-2 block">Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" onKeyDown={(e) => { if (e.key === "Enter") register(); }} className="w-full bg-white border-2 border-beige rounded-2xl px-4 py-4 text-brown text-sm placeholder:text-brown/25 outline-none focus:border-terracotta transition-colors" />
        </div>

        <div>
          <label className="text-brown/65 text-xs font-semibold uppercase tracking-wider mb-2 block">I am a</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setRole("buyer")} className={`rounded-2xl p-4 text-left border-2 transition-all ${role === "buyer" ? "border-green bg-green/5" : "border-beige bg-white"}`}>
              <p className="font-semibold text-brown text-sm">🛍️ Buyer</p>
              <p className="text-brown/45 text-[10px] mt-1">Discover and purchase crafts.</p>
            </button>
            <button onClick={() => setRole("artisan")} className={`rounded-2xl p-4 text-left border-2 transition-all ${role === "artisan" ? "border-terracotta bg-terracotta/5" : "border-beige bg-white"}`}>
              <p className="font-semibold text-brown text-sm">🏺 Artisan</p>
              <p className="text-brown/45 text-[10px] mt-1">Sell and manage your crafts.</p>
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl px-3 py-2 text-xs">{error}</div>}
        <Btn label={loading ? "Creating account…" : "Create Account →"} onClick={register} />
        <button onClick={() => navigate("login")} className="text-terracotta text-sm font-semibold py-2">Already have an account? Sign in</button>
      </div>
      <p className="py-5 text-center text-xs text-brown/35">Your account is securely stored in MongoDB.</p>
    </div>
  );
}

// ── Screen 4: User Type ───────────────────────────────────────────────────────

function UserType({ navigate }: Nav) {
  return (
    <div className="flex-1 bg-cream flex flex-col px-5 pt-14">
      <div className="flex items-center mb-8 self-start">
        <BackBtn onClick={() => navigate("login")} />
        <span className="text-brown/50 text-sm">Back</span>
      </div>
      <h1 className="font-serif text-brown text-3xl mb-2 text-center">How will you use<br />KarigarSetu?</h1>
      <p className="text-brown/55 text-center text-sm mb-8">Choose your role to get started</p>

      <div className="flex flex-col gap-4 flex-1">
        <button
          onClick={() => navigate("artisan-dashboard")}
          className="bg-white rounded-3xl p-6 border-2 border-beige flex flex-col items-center gap-3 shadow-sm active:scale-[0.97] transition-all hover:border-terracotta/40"
        >
          <div className="w-20 h-20 bg-terracotta/10 rounded-2xl flex items-center justify-center text-5xl">🏺</div>
          <div className="text-center">
            <p className="font-serif text-brown text-xl mb-1">I'm an Artisan</p>
            <p className="text-brown/55 text-sm">Sell my handmade products and reach more customers.</p>
          </div>
          <div className="w-full bg-terracotta text-white rounded-2xl py-3 text-center font-semibold text-sm">Get Started as Artisan</div>
        </button>

        <button
          onClick={() => navigate("marketplace")}
          className="bg-white rounded-3xl p-6 border-2 border-beige flex flex-col items-center gap-3 shadow-sm active:scale-[0.97] transition-all hover:border-green/40"
        >
          <div className="w-20 h-20 bg-green/10 rounded-2xl flex items-center justify-center text-5xl">🛍️</div>
          <div className="text-center">
            <p className="font-serif text-brown text-xl mb-1">I'm a Buyer</p>
            <p className="text-brown/55 text-sm">Discover and buy unique handmade products from artisans.</p>
          </div>
          <div className="w-full bg-green text-white rounded-2xl py-3 text-center font-semibold text-sm">Explore Marketplace</div>
        </button>
      </div>
      <div className="h-6"></div>
    </div>
  );
}

// ── Screen 5: Artisan Dashboard ───────────────────────────────────────────────

function ArtisanDashboard({ navigate }: Nav) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [artisanName, setArtisanName] = useState("Demo Artisan");
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.getMe();
        if (me.user?.role !== "artisan") {
          api.logout();
          navigate("login");
          return;
        }
        let artisan;
        try {
          artisan = (await api.getArtisanMe()).artisan;
        } catch (error) {
          if (error instanceof Error && /not found/i.test(error.message)) {
            const user = JSON.parse(localStorage.getItem("karigarsetu_user") || "{}");
            artisan = (await api.createArtisan({ name: user.name || "Karigar Artisan", craft: "Handicrafts", state: "West Bengal" })).artisan;
          } else throw error;
        }
        setArtisanName(artisan.name || "Demo Artisan");
        const [data, orderData] = await Promise.all([
          api.getProducts(`artisan=${encodeURIComponent(artisan._id)}`),
          api.getMyArtisanOrders()
        ]);
        setProducts(data.products || []);
        setOrderCount((orderData.orders || []).filter((o: ApiOrder) => o.status !== "delivered" && o.status !== "cancelled").length);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sales = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="flex flex-col flex-1 bg-cream">
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-14 pb-5 flex items-center justify-between">
          <div>
            <p className="text-terracotta text-[10px] font-bold uppercase tracking-widest mb-1">Artisan Studio</p>
            <p className="text-brown/50 text-xs">Good morning,</p>
            <h1 className="font-serif text-brown text-2xl">{artisanName} 👋</h1>
            <p className="text-brown/45 text-xs mt-0.5">Create listings, manage stock and handle buyer orders.</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-beige overflow-hidden border-2 border-white shadow"><img src="https://images.unsplash.com/photo-1606681246594-372e9e133ac1?w=100&h=100&fit=crop&auto=format" alt={artisanName} className="w-full h-full object-cover" /></div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 px-5 mb-5">
          {[{ label: "Products", value: String(products.length) }, { label: "Active Orders", value: String(orderCount) }, { label: "Catalogue value", value: `₹${sales.toLocaleString("en-IN")}` }].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-beige/40"><p className="font-bold text-terracotta text-lg">{s.value}</p><p className="text-brown/50 text-[10px]">{s.label}</p></div>
          ))}
        </div>

        <div className="mx-5 bg-terracotta rounded-3xl p-5 mb-5 relative overflow-hidden">
          <div className="absolute -right-5 -top-5 w-28 h-28 bg-white/10 rounded-full pointer-events-none"></div>
          <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest mb-1">AI Product Catalogue</p>
          <p className="text-white font-serif text-xl leading-tight mb-2">Have a handmade<br />product?</p>
          <p className="text-white/70 text-xs mb-4 leading-relaxed">Upload a photo and let AI create your marketplace listing instantly.</p>
          <button onClick={() => navigate("add-product")} className="bg-white text-terracotta font-bold rounded-xl px-5 py-2.5 text-sm shadow active:scale-[0.97] transition-transform">+ Add Product</button>
        </div>

        <div className="px-5 pb-4">
          <div className="flex items-center justify-between mb-3"><h2 className="font-serif text-brown text-xl">Your Products</h2><span className="text-brown/35 text-[10px]">Live from MongoDB</span></div>
          {loading ? <div className="bg-white rounded-2xl p-5 text-center text-xs text-brown/50">Loading products…</div> : products.length === 0 ? <div className="bg-white rounded-2xl p-5 text-center text-xs text-brown/50 border border-beige/40">No products yet. Add your first AI catalogue listing.</div> : (
            <div className="flex flex-col gap-2.5">
              {products.map((p) => (
                <div key={p._id} className="bg-white rounded-2xl p-3 flex gap-3 items-center shadow-sm border border-beige/40">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-beige flex-shrink-0"><img src={productImage(p)} alt={p.name} className="w-full h-full object-cover" /></div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-brown text-xs truncate">{p.name}</p><p className="text-terracotta font-bold text-sm">₹{p.price.toLocaleString("en-IN")}</p><span className="text-[10px] px-2 py-0.5 rounded-full bg-green/10 text-green">{p.isActive === false ? "Archived" : "Live"}</span></div>
                  <button onClick={() => { setSelectedProductId(p._id); navigate("edit-listing"); }} className="text-brown/35 text-[10px] border border-beige rounded-lg px-2 py-1 flex-shrink-0">Edit</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ArtisanNav active="home" navigate={navigate} />
    </div>
  );
}

// ── Screen 6: Add Product ─────────────────────────────────────────────────────

function AddProduct({ navigate }: Nav) {
  return (
    <div className="flex-1 bg-cream overflow-y-auto">
      <div className="px-5 pt-14 pb-4 flex items-center gap-2">
        <BackBtn onClick={() => navigate("artisan-dashboard")} />
        <div>
          <h1 className="font-serif text-brown text-2xl">Add New Product</h1>
          <p className="text-brown/50 text-xs">Let AI create your listing from a photo.</p>
        </div>
      </div>

      <div className="px-5">
        <button
          onClick={() => navigate("ai-processing")}
          className="w-full border-2 border-dashed border-terracotta/35 rounded-3xl bg-terracotta/5 p-8 flex flex-col items-center gap-3 mb-5 cursor-pointer active:bg-terracotta/8 transition-colors"
        >
          <div className="w-20 h-20 bg-terracotta/10 rounded-2xl flex items-center justify-center text-4xl">📷</div>
          <p className="font-semibold text-brown">Upload Product Photo</p>
          <p className="text-brown/45 text-xs text-center">Drag and drop or browse your gallery</p>
        </button>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <button onClick={() => navigate("ai-processing")} className="bg-terracotta text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-semibold text-sm active:scale-[0.97] transition-transform shadow-md shadow-terracotta/20">
            📸 Take Photo
          </button>
          <button onClick={() => navigate("ai-processing")} className="bg-white border-2 border-beige rounded-2xl py-4 flex items-center justify-center gap-2 text-brown font-semibold text-sm active:scale-[0.97] transition-transform">
            🖼️ Gallery
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-beige/40 shadow-sm mb-5">
          <p className="font-semibold text-brown text-sm mb-3">💡 Tips for a better result</p>
          <ul className="space-y-2.5">
            {["Use good natural lighting", "Keep the product clearly visible", "Avoid blurry or dark images"].map((tip, i) => (
              <li key={i} className="flex items-center gap-2.5 text-xs text-brown/65">
                <span className="w-5 h-5 bg-green/10 rounded-full flex items-center justify-center text-green text-[10px] font-bold flex-shrink-0">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <Btn label="✨ Analyze with AI" onClick={() => navigate("ai-processing")} />
      </div>
      <div className="h-6"></div>
    </div>
  );
}

// ── Screen 7: AI Processing ───────────────────────────────────────────────────

function AIProcessing({ navigate }: Nav) {
  const [progress, setProgress] = useState(0);
  const steps = [
    "Identifying product",
    "Detecting materials",
    "Identifying craft type",
    "Analyzing visual attributes",
    "Generating description",
    "Suggesting price",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = p + 1.2;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => navigate("ai-listing"), 600);
          return 100;
        }
        return next;
      });
    }, 80);
    return () => clearInterval(timer);
  }, [navigate]);

  const completedSteps = Math.min(steps.length, Math.floor((progress / 100) * steps.length));

  return (
    <div className="flex-1 bg-cream flex flex-col px-5 pt-14">
      <div className="rounded-3xl overflow-hidden h-44 bg-beige mb-5 relative shadow-md">
        <img src="https://images.unsplash.com/photo-1783070185188-ee2a182c883d?w=402&h=250&fit=crop&auto=format" alt="Analyzing product" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-brown/40 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl mb-1 animate-glow">✨</div>
            <p className="font-serif text-xl">AI Analyzing...</p>
          </div>
        </div>
      </div>

      <h1 className="font-serif text-brown text-2xl mb-1">Analyzing Your Craft</h1>
      <p className="text-brown/55 text-xs mb-5">Our AI is carefully studying your handmade product.</p>

      <div className="mb-5">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-brown/60">Processing</span>
          <span className="font-bold text-terracotta">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-beige rounded-full overflow-hidden">
          <div className="h-full bg-terracotta rounded-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm flex-1">
        <div className="flex flex-col gap-3">
          {steps.map((step, i) => {
            const done = i < completedSteps;
            const active = i === completedSteps;
            return (
              <div key={i} className={`flex items-center gap-3 text-sm transition-all ${done ? "text-brown" : "text-brown/30"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-all ${done ? "bg-green text-white" : active ? "bg-terracotta/20 border-2 border-terracotta animate-glow" : "bg-beige/60"}`}>
                  {done ? "✓" : "·"}
                </div>
                {step}
                {active && <span className="ml-auto text-terracotta text-xs animate-glow">···</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Screen 8: AI Generated Listing ───────────────────────────────────────────

function AIListing({ navigate }: Nav) {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const draft = {
    name: "Handwoven Bamboo Basket",
    category: "Home Decor",
    material: "Natural Bamboo",
    craftType: "Traditional Bamboo Craft",
    price: 850,
    description: "A handcrafted bamboo basket created using traditional techniques and locally sourced natural bamboo. Lightweight, durable and ideal for home decoration or everyday use.",
    image: "https://images.unsplash.com/photo-1783070185188-ee2a182c883d?w=402&h=260&fit=crop&auto=format",
  };

  const publish = async () => {
    setPublishing(true); setError("");
    try {
      const data = await api.createProduct({ name: draft.name, category: draft.category, material: draft.material, price: draft.price, stock: 10, images: [draft.image], tags: ["handmade", "bamboo", "traditional craft"], description: draft.description, aiGenerated: true });
      setSelectedProductId(data.product._id);
      localStorage.setItem(LAST_PRODUCT_KEY, JSON.stringify(data.product));
      navigate("product-published");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not publish product. Login as an artisan first.");
    } finally { setPublishing(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-cream">
      <div className="px-5 pt-14 pb-4 flex items-center gap-2"><BackBtn onClick={() => navigate("add-product")} /><h1 className="font-serif text-brown text-2xl">AI Generated Listing ✨</h1></div>
      <div className="px-5">
        <div className="rounded-3xl overflow-hidden h-44 bg-beige mb-4 relative shadow-md">
          <img src={draft.image} alt={draft.name} className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 bg-white/92 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-green shadow-sm">AI Confidence: 94%</div>
          <div className="absolute bottom-3 left-3 bg-terracotta text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">✨ AI Generated</div>
        </div>
        <div className="bg-white rounded-2xl border border-beige/40 shadow-sm mb-4 overflow-hidden">
          {[{ label: "Product Name", value: draft.name }, { label: "Category", value: draft.category }, { label: "Material", value: draft.material }, { label: "Craft Type", value: draft.craftType }, { label: "Suggested Price", value: `₹${draft.price}` }].map((f, i) => (
            <div key={i} className={`px-4 py-3 flex justify-between items-center ${i < 4 ? "border-b border-beige/40" : ""}`}><span className="text-brown/50 text-xs">{f.label}</span><span className="font-semibold text-brown text-sm">{f.value}</span></div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm mb-4"><p className="text-brown/45 text-[10px] uppercase tracking-wider font-semibold mb-2">AI-Generated Description</p><p className="text-brown text-sm leading-relaxed italic">"{draft.description}"</p></div>
        <div className="bg-green/8 border border-green/20 rounded-2xl px-4 py-3 flex items-center gap-3 mb-4"><span className="text-xl">✨</span><div><p className="text-green font-semibold text-sm">AI-Powered Cataloguing</p><p className="text-brown/50 text-xs">Approve to store this listing in MongoDB.</p></div></div>
        {error && <div className="bg-red-50 text-red-600 rounded-xl px-3 py-2 text-xs mb-4">{error}</div>}
        <div className="flex flex-col gap-3 pb-6"><Btn label={publishing ? "Publishing…" : "Approve & Publish to Database"} onClick={publish} /><Btn label="Edit Listing" onClick={() => navigate("edit-listing")} variant="ghost" /></div>
      </div>
    </div>
  );
}

// ── Screen 9: Edit Listing ────────────────────────────────────────────────────

function EditListing({ navigate }: Nav) {
  const [form, setForm] = useState({ name: "Handwoven Bamboo Basket", category: "Home Decor", material: "Natural Bamboo", craftType: "Traditional Bamboo Craft", price: "850", description: "A handcrafted bamboo basket created using traditional techniques and locally sourced natural bamboo. Lightweight, durable and ideal for home decoration or everyday use." });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const productId = getSelectedProductId();

  useEffect(() => {
    if (!productId) return;
    api.getProduct(productId).then(({ product }) => setForm({ name: product.name || "", category: product.category || "", material: product.material || "", craftType: product.craftType || "", price: String(product.price ?? ""), description: product.description || "" })).catch((e) => setError(e instanceof Error ? e.message : "Could not load product"));
  }, [productId]);

  const update = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ic = "w-full bg-white border-2 border-beige rounded-2xl px-4 py-3.5 text-brown text-sm outline-none focus:border-terracotta transition-colors";
  const lc = "text-brown/60 text-xs font-semibold uppercase tracking-wider mb-1.5 block";

  const save = async () => {
    setLoading(true); setError("");
    try {
      const payload = { name: form.name, category: form.category, material: form.material, craftType: form.craftType, price: Number(form.price), description: form.description, aiGenerated: true };
      const data = productId ? await api.updateProduct(productId, payload) : await api.createProduct({ ...payload, stock: 10, images: ["https://images.unsplash.com/photo-1783070185188-ee2a182c883d?w=402&h=260&fit=crop&auto=format"], tags: ["handmade", "traditional craft"] });
      setSelectedProductId(data.product._id); localStorage.setItem(LAST_PRODUCT_KEY, JSON.stringify(data.product)); navigate("product-published");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save product"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-cream">
      <div className="px-5 pt-14 pb-4 flex items-center gap-2"><BackBtn onClick={() => navigate("ai-listing")} /><h1 className="font-serif text-brown text-2xl">Edit Your Listing</h1></div>
      <div className="px-5 flex flex-col gap-4 pb-6">
        {([{ label: "Product Name", key: "name" as const }, { label: "Category", key: "category" as const }, { label: "Material", key: "material" as const }, { label: "Craft Type", key: "craftType" as const }, { label: "Price (₹)", key: "price" as const }]).map((f) => <div key={f.key}><label className={lc}>{f.label}</label><input className={ic} value={form[f.key]} onChange={update(f.key)} /></div>)}
        <div><label className={lc}>Description</label><textarea className={`${ic} resize-none h-28`} value={form.description} onChange={update("description")} /></div>
        {error && <div className="bg-red-50 text-red-600 rounded-xl px-3 py-2 text-xs">{error}</div>}
        <div className="flex flex-col gap-3 pt-2"><Btn label={loading ? "Saving…" : "Publish Product"} onClick={save} /><Btn label="Back to AI Listing" onClick={() => navigate("ai-listing")} variant="secondary" /></div>
      </div>
    </div>
  );
}

// ── Screen 10: Product Published ──────────────────────────────────────────────

function ProductPublished({ navigate }: Nav) {
  const [product, setProduct] = useState<ApiProduct | null>(null);
  useEffect(() => { try { const raw = localStorage.getItem(LAST_PRODUCT_KEY); if (raw) setProduct(JSON.parse(raw)); } catch {} }, []);
  const name = product?.name || "Handwoven Bamboo Basket";
  const price = product?.price ?? 850;
  const img = productImage(product);
  return (
    <div className="flex-1 bg-cream flex flex-col items-center justify-center px-5">
      <div className="text-center mb-8"><div className="w-28 h-28 bg-green/10 rounded-full flex items-center justify-center text-6xl mx-auto mb-6 shadow-sm">🎉</div><h1 className="font-serif text-brown text-3xl mb-3">Your Product is Live!</h1><p className="text-brown/55 text-sm leading-relaxed">Your product has been saved to MongoDB and is now available on the KarigarSetu marketplace.</p></div>
      <div className="bg-white rounded-2xl p-4 flex gap-3 items-center w-full mb-8 shadow-sm border border-beige/40"><div className="w-16 h-16 rounded-xl overflow-hidden bg-beige flex-shrink-0"><img src={img} alt={name} className="w-full h-full object-cover" /></div><div><p className="font-semibold text-brown text-sm">{name}</p><p className="text-terracotta font-bold">₹{price.toLocaleString("en-IN")}</p><span className="text-[10px] bg-green/10 text-green px-2 py-0.5 rounded-full">● Live in MongoDB</span></div></div>
      <div className="flex flex-col gap-3 w-full"><Btn label="View Product →" onClick={() => { if (product?._id) setSelectedProductId(product._id); navigate("product-details"); }} /><Btn label="Add Another Product" onClick={() => navigate("add-product")} variant="ghost" /><button onClick={() => navigate("artisan-dashboard")} className="text-brown/40 text-sm text-center py-2">Back to Dashboard</button></div>
    </div>
  );
}

// ── Screen 11: Buyer Marketplace ──────────────────────────────────────────────

function BuyerMarketplace({ navigate }: Nav) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const categories = ["All", "Textiles", "Pottery", "Woodwork", "Jewellery", "Home Decor", "Bamboo"];

  useEffect(() => {
    setLoading(true);
    const query = activeCategory === "All" ? "" : `category=${encodeURIComponent(activeCategory)}`;
    api.getProducts(query).then((data) => setProducts(data.products || [])).catch((e) => console.error(e)).finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="flex flex-col flex-1 bg-cream">
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-14 pb-3"><h1 className="font-serif text-brown text-2xl">Discover Handmade India</h1><p className="text-brown/50 text-xs">Unique crafts, directly from artisans.</p></div>
        <div className="px-5 mb-4"><button onClick={() => navigate("ai-search")} className="w-full bg-white border-2 border-beige rounded-2xl px-4 py-3.5 flex items-center gap-2 text-brown/35 text-xs shadow-sm active:scale-[0.98] transition-transform"><span className="text-base">🔍</span><span className="flex-1 text-left">Search products, crafts, or describe what you want...</span><span className="text-terracotta font-bold text-[10px] bg-terracotta/10 px-2 py-0.5 rounded-full">✨ AI</span></button></div>
        <div className="flex gap-2 px-5 overflow-x-auto pb-1 mb-4">{categories.map((c) => <button key={c} onClick={() => setActiveCategory(c)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeCategory === c ? "bg-terracotta text-white shadow-sm" : "bg-white text-brown border border-beige"}`}>{c}</button>)}</div>
        <div className="px-5 pb-4"><div className="flex items-center justify-between mb-3"><h2 className="font-serif text-brown text-xl">Marketplace Products</h2><span className="text-brown/35 text-[10px]">Live from MongoDB</span></div>
          {loading ? <div className="bg-white rounded-2xl p-6 text-center text-xs text-brown/50">Loading marketplace…</div> : products.length === 0 ? <div className="bg-white rounded-2xl p-6 text-center text-xs text-brown/50 border border-beige/40">No products found. Run the demo seed script or publish an artisan product.</div> : <div className="grid grid-cols-2 gap-3">{products.map((p) => <ProductCard key={p._id} id={p._id} name={p.name} price={`₹${p.price.toLocaleString("en-IN")}`} artisan={productArtisanName(p)} rating="4.8" img={productImage(p)} onClick={() => navigate("product-details")} />)}</div>}
        </div>
      </div>
      <BuyerNav active="home" navigate={navigate} />
    </div>
  );
}

// ── Screen 12: AI Search ──────────────────────────────────────────────────────

function AISearch({ navigate }: Nav) {
  const [query, setQuery] = useState(localStorage.getItem(SEARCH_QUERY_KEY) || "");
  const chips = ["Handmade gifts", "Traditional pottery", "Under ₹1000", "Home decor", "Bengali crafts"];
  const search = () => { localStorage.setItem(SEARCH_QUERY_KEY, query.trim()); navigate("ai-recommendations"); };
  return (
    <div className="flex flex-col flex-1 bg-cream">
      <div className="flex-1 overflow-y-auto px-5"><div className="pt-14 pb-5 flex items-center gap-2"><BackBtn onClick={() => navigate("marketplace")} /><div><h1 className="font-serif text-brown text-2xl">What are you looking for?</h1><p className="text-terracotta text-[10px] font-semibold">✨ Powered by AI</p></div></div>
        <div className="bg-terracotta/10 border border-terracotta/20 rounded-2xl px-4 py-3 flex items-start gap-2.5 mb-5"><span className="text-terracotta text-lg mt-0.5">✨</span><p className="text-terracotta text-xs leading-relaxed font-medium">Describe what you want in plain words — the backend searches the MongoDB product catalogue.</p></div>
        <div className="mb-4"><textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find me a handmade gift for my mother under ₹1000." className="w-full bg-white border-2 border-beige rounded-2xl px-4 py-4 text-brown text-sm placeholder:text-brown/25 outline-none focus:border-terracotta transition-colors resize-none h-28" /></div>
        <Btn label="✨ Find Products" onClick={search} />
        <div className="mt-6"><p className="text-brown/50 text-xs font-semibold mb-3">Try searching for:</p><div className="flex flex-wrap gap-2">{chips.map((c) => <button key={c} onClick={() => setQuery(c)} className="bg-white border border-beige rounded-full px-3 py-1.5 text-xs text-brown active:bg-terracotta/10 active:border-terracotta active:text-terracotta transition-colors">{c}</button>)}</div></div>
        <div className="mt-6 bg-white rounded-2xl p-4 border border-beige/40 shadow-sm mb-4"><p className="text-brown font-semibold text-sm mb-3">How database search works</p><div className="flex flex-col gap-2">{["Sends the query to Express API", "Searches product name, description, category, material and tags", "Returns matching products from MongoDB", "Opens real product records for checkout"].map((t, i) => <p key={i} className="text-xs text-brown/55 flex items-center gap-2"><span className="text-green font-bold">✓</span>{t}</p>)}</div></div>
      </div><BuyerNav active="search" navigate={navigate} />
    </div>
  );
}

// ── Screen 13: AI Recommendations ────────────────────────────────────────────

function AIRecommendations({ navigate }: Nav) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const query = localStorage.getItem(SEARCH_QUERY_KEY) || "handmade";
  useEffect(() => { api.getProducts(`search=${encodeURIComponent(query)}`).then((data) => setProducts(data.products || [])).catch((e) => console.error(e)).finally(() => setLoading(false)); }, [query]);
  return (
    <div className="flex flex-col flex-1 bg-cream"><div className="flex-1 overflow-y-auto px-5"><div className="pt-14 pb-4 flex items-center gap-2"><BackBtn onClick={() => navigate("ai-search")} /><div><h1 className="font-serif text-brown text-2xl">AI Recommendations ✨</h1><p className="text-brown/45 text-[10px]">Results from the live product catalogue</p></div></div>
      <div className="bg-terracotta/8 border border-terracotta/20 rounded-2xl px-4 py-3 mb-5 flex items-start gap-2"><span className="text-terracotta text-sm">✨</span><p className="text-brown/70 text-xs italic">"{query}"</p></div>
      {loading ? <div className="bg-white rounded-2xl p-6 text-center text-xs text-brown/50">Searching MongoDB…</div> : products.length === 0 ? <div className="bg-white rounded-2xl p-6 text-center text-xs text-brown/50">No matching products found. Try another search.</div> : <><p className="text-brown/50 text-xs mb-4 font-medium">{products.length} matches found</p><div className="flex flex-col gap-4 pb-4">{products.map((p, i) => <div key={p._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-beige/40"><div className="relative"><img src={productImage(p)} alt={p.name} className="w-full h-36 object-cover bg-beige" /><div className="absolute top-3 left-3 bg-terracotta text-white text-[10px] font-bold rounded-full px-2 py-0.5">#{i + 1} Match</div></div><div className="p-4"><div className="flex justify-between items-start mb-2"><div><p className="font-semibold text-brown text-sm">{p.name}</p><p className="text-brown/45 text-xs">{productArtisanName(p)}</p></div><p className="text-terracotta font-bold">₹{p.price.toLocaleString("en-IN")}</p></div><div className="bg-cream rounded-xl p-3 mb-3"><p className="text-brown/60 text-[10px] font-semibold uppercase tracking-wide mb-2">Why this matched</p><div className="flex flex-wrap gap-1.5">{(p.tags || [p.category, p.material || "handmade"]).map((t, j) => <span key={j} className="text-[10px] text-green bg-green/10 px-2 py-0.5 rounded-full font-medium">✓ {t}</span>)}</div></div><button onClick={() => { setSelectedProductId(p._id); navigate("product-details"); }} className="w-full bg-terracotta text-white rounded-xl py-2.5 text-sm font-semibold active:scale-[0.97] transition-transform">View Product →</button></div></div>)}</div></>}
    </div><BuyerNav active="search" navigate={navigate} /></div>
  );
}

// ── Screen 14: Product Details ────────────────────────────────────────────────

function ProductDetails({ navigate }: Nav) {
  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = getSelectedProductId();
    const load = id ? api.getProduct(id) : api.getProducts();
    load.then((data) => setProduct(id ? data.product : data.products?.[0] || null)).catch((e) => console.error(e)).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="flex-1 bg-cream flex items-center justify-center text-brown/50 text-sm">Loading product from MongoDB…</div>;
  if (!product) return <div className="flex-1 bg-cream flex flex-col items-center justify-center px-5"><p className="text-brown mb-4">Product not found.</p><Btn label="Back to Marketplace" onClick={() => navigate("marketplace")} /></div>;
  const addToCart = (goToCheckout = false) => {
    const items = getCart();
    const existing = items.find((i) => i.product === product._id);
    const next = existing ? items.map((i) => i.product === product._id ? { ...i, qty: i.qty + qty } : i) : [...items, { product: product._id, name: product.name, artisan: productArtisanName(product), price: product.price, qty, img: productImage(product) }];
    setCart(next);
    if (goToCheckout) navigate("checkout"); else navigate("cart");
  };
  return (
    <div className="flex flex-col flex-1 bg-cream"><div className="flex-1 overflow-y-auto pb-20"><div className="relative h-64 bg-beige flex-shrink-0"><img src={productImage(product)} alt={product.name} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div><button onClick={() => navigate("marketplace")} className="absolute top-12 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md">←</button><button onClick={() => setWishlisted((v) => !v)} className="absolute top-12 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md text-lg">{wishlisted ? "❤️" : "♡"}</button></div>
      <div className="px-5 pt-5"><h1 className="font-serif text-brown text-2xl mb-1">{product.name}</h1><div className="flex items-center justify-between mb-4"><span className="text-terracotta font-bold text-2xl">₹{product.price.toLocaleString("en-IN")}</span><span className="text-yellow-500 text-sm">⭐ 4.8 <span className="text-brown/40 text-xs">(prototype rating)</span></span></div>
        <div className="bg-white rounded-2xl p-4 flex items-center gap-3 mb-5 border border-beige/40 shadow-sm"><div className="w-11 h-11 rounded-full bg-beige overflow-hidden flex-shrink-0"><img src={product.artisan?.imageUrl || "https://images.unsplash.com/photo-1606681246594-372e9e133ac1?w=80&h=80&fit=crop&auto=format"} alt={productArtisanName(product)} className="w-full h-full object-cover" /></div><div className="flex-1"><p className="font-semibold text-brown text-sm">{productArtisanName(product)}</p><p className="text-brown/45 text-xs">📍 {product.artisan?.state || "India"}</p></div><span className="text-xs bg-green/10 text-green font-semibold px-2 py-1 rounded-full">Verified ✓</span></div>
        <div className="mb-5"><h2 className="font-serif text-brown text-lg mb-2">About this product</h2><p className="text-brown/65 text-sm leading-relaxed">{product.description || "Handcrafted product created by a local artisan and catalogued through KarigarSetu."}</p></div>
        <div className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm mb-5 grid grid-cols-2 gap-3">{[{ label: "Category", value: product.category }, { label: "Material", value: product.material || "Handmade" }, { label: "Stock", value: String(product.stock) }, { label: "Origin", value: product.artisan?.state || "India 🇮🇳" }].map((s, i) => <div key={i}><p className="text-brown/40 text-[10px] uppercase tracking-wide">{s.label}</p><p className="font-semibold text-brown text-xs mt-0.5">{s.value}</p></div>)}</div>
        <div className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm mb-5 flex items-center justify-between"><span className="text-brown font-semibold text-sm">Quantity</span><div className="flex items-center gap-4"><button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 bg-cream rounded-full flex items-center justify-center text-brown font-bold">−</button><span className="text-brown font-bold w-5 text-center">{qty}</span><button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} className="w-8 h-8 bg-terracotta rounded-full flex items-center justify-center text-white font-bold">+</button></div></div>
      </div></div>
      <div className="flex-shrink-0 bg-white border-t border-beige px-5 py-4 flex gap-3"><button onClick={() => addToCart(false)} className="flex-1 border-2 border-terracotta text-terracotta rounded-2xl py-3.5 font-semibold text-sm">Add to Cart</button><button onClick={() => addToCart(true)} className="flex-1 bg-terracotta text-white rounded-2xl py-3.5 font-semibold text-sm shadow-md">Buy Now</button></div>
    </div>
  );
}

// ── Screen 15: Cart ───────────────────────────────────────────────────────────

function Cart({ navigate }: Nav) {
  const [items, setItems] = useState<CartItem[]>(getCart());
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = items.length ? 60 : 0;
  const sync = (next: CartItem[]) => { setItems(next); setCart(next); };
  return (
    <div className="flex flex-col flex-1 bg-cream"><div className="flex-1 overflow-y-auto px-5 pb-4"><div className="pt-14 pb-5 flex items-center gap-2"><BackBtn onClick={() => navigate("marketplace")} /><h1 className="font-serif text-brown text-2xl">Your Cart</h1><span className="ml-auto text-xs bg-terracotta text-white rounded-full px-2 py-0.5 font-bold">{items.length}</span></div>
      {items.length === 0 ? <div className="bg-white rounded-2xl p-6 text-center border border-beige/40 shadow-sm"><p className="text-3xl mb-2">🛒</p><p className="font-semibold text-brown text-sm">Your cart is empty</p><p className="text-brown/50 text-xs mt-1">Add a product from the live marketplace.</p><button onClick={() => navigate("marketplace")} className="mt-4 bg-terracotta text-white rounded-xl px-4 py-2 text-xs font-semibold">Browse Marketplace</button></div> : <>
        <div className="flex flex-col gap-3 mb-5">{items.map((item) => <div key={item.product} className="bg-white rounded-2xl p-3.5 flex gap-3 items-start border border-beige/40 shadow-sm"><div className="w-16 h-16 rounded-xl overflow-hidden bg-beige flex-shrink-0"><img src={item.img} alt={item.name} className="w-full h-full object-cover" /></div><div className="flex-1 min-w-0"><p className="font-semibold text-brown text-xs leading-tight">{item.name}</p><p className="text-brown/45 text-[10px] mt-0.5">{item.artisan}</p><p className="text-terracotta font-bold text-sm mt-1">₹{item.price.toLocaleString("en-IN")}</p><div className="flex items-center gap-3 mt-2"><button onClick={() => sync(items.map((i) => i.product === item.product ? { ...i, qty: Math.max(1, i.qty - 1) } : i))} className="w-7 h-7 bg-cream rounded-full text-brown font-bold text-sm flex items-center justify-center border border-beige">−</button><span className="text-brown font-bold text-sm w-4 text-center">{item.qty}</span><button onClick={() => sync(items.map((i) => i.product === item.product ? { ...i, qty: i.qty + 1 } : i))} className="w-7 h-7 bg-terracotta rounded-full text-white font-bold text-sm flex items-center justify-center">+</button></div></div><button onClick={() => sync(items.filter((i) => i.product !== item.product))} className="text-brown/25 p-1 text-sm">✕</button></div>)}</div>
        <div className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm"><h3 className="font-semibold text-brown text-sm mb-3">Order Summary</h3><div className="flex flex-col gap-2 text-xs"><div className="flex justify-between text-brown/60"><span>Subtotal ({items.reduce((n, i) => n + i.qty, 0)} units)</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div><div className="flex justify-between text-brown/60"><span>Delivery</span><span>₹{delivery}</span></div><div className="flex justify-between text-green text-[10px]"><span>KarigarSetu Promise</span><span>✓ Artisan-direct</span></div><div className="h-px bg-beige my-1"></div><div className="flex justify-between font-bold text-brown text-sm"><span>Total</span><span>₹{(subtotal + delivery).toLocaleString("en-IN")}</span></div></div></div>
      </>}
    </div><div className="flex-shrink-0 bg-white border-t border-beige px-5 py-4"><Btn label="Proceed to Checkout →" onClick={() => items.length && navigate("checkout")} /></div></div>
  );
}

// ── Screen 16: Checkout ───────────────────────────────────────────────────────

function Checkout({ navigate }: Nav) {
  const [payment, setPayment] = useState("upi");
  const [form, setForm] = useState({ name: "", line1: "", city: "", state: "", pincode: "", mobile: "", email: "" });
  const [items] = useState<CartItem[]>(getCart());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ic = "w-full bg-cream rounded-xl px-4 py-3 text-brown text-xs outline-none border border-beige/50 placeholder:text-brown/30";
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0); const delivery = items.length ? 60 : 0;
  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const placeOrder = async () => {
    if (!items.length) return;
    if (!localStorage.getItem("karigarsetu_token")) { setError("Please sign in as a buyer before placing an order."); return; }
    if (!form.name || !form.line1 || !form.city || !form.state || !form.pincode) { setError("Please complete the delivery address."); return; }
    setLoading(true); setError("");
    try {
      const data = await api.createOrder({ items: items.map((i) => ({ product: i.product, quantity: i.qty })), shippingAddress: { line1: form.line1, city: form.city, state: form.state, pincode: form.pincode }, paymentMethod: payment });
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data.order)); setCart([]); navigate("order-success");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not place order"); }
    finally { setLoading(false); }
  };
  return (
    <div className="flex flex-col flex-1 bg-cream"><div className="flex-1 overflow-y-auto px-5 pb-4"><div className="pt-14 pb-5 flex items-center gap-2"><BackBtn onClick={() => navigate("cart")} /><h1 className="font-serif text-brown text-2xl">Checkout</h1></div>
      <div className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm mb-3"><h3 className="font-semibold text-brown text-sm mb-3">📍 Delivery Address</h3><div className="flex flex-col gap-2"><input value={form.name} onChange={update("name")} placeholder="Full name" className={ic} /><input value={form.line1} onChange={update("line1")} placeholder="Full address" className={ic} /><div className="grid grid-cols-2 gap-2"><input value={form.city} onChange={update("city")} placeholder="City" className={ic} /><input value={form.state} onChange={update("state")} placeholder="State" className={ic} /></div><input value={form.pincode} onChange={update("pincode")} placeholder="PIN Code" className={ic} /></div></div>
      <div className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm mb-3"><h3 className="font-semibold text-brown text-sm mb-3">📞 Contact Information</h3><div className="flex flex-col gap-2"><input value={form.mobile} onChange={update("mobile")} placeholder="Mobile number" className={ic} /><input value={form.email} onChange={update("email")} placeholder="Email (optional)" className={ic} /></div></div>
      <div className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm mb-3"><h3 className="font-semibold text-brown text-sm mb-3">🧺 Order Summary</h3>{items.map((i) => <div key={i.product} className="flex gap-3 items-center mb-3"><div className="w-12 h-12 rounded-xl bg-beige overflow-hidden flex-shrink-0"><img src={i.img} alt={i.name} className="w-full h-full object-cover" /></div><div className="flex-1"><p className="text-brown text-xs font-semibold">{i.name}</p><p className="text-brown/45 text-[10px]">Qty: {i.qty} · {i.artisan}</p></div><p className="text-brown font-bold text-sm">₹{(i.price * i.qty).toLocaleString("en-IN")}</p></div>)}<div className="border-t border-beige pt-2.5 flex justify-between"><span className="text-brown/60 text-xs">Total (incl. delivery)</span><span className="font-bold text-terracotta text-sm">₹{(subtotal + delivery).toLocaleString("en-IN")}</span></div></div>
      <div className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm mb-3"><h3 className="font-semibold text-brown text-sm mb-3">💳 Payment Method</h3><div className="flex flex-col gap-2">{[{ id: "upi", label: "UPI", desc: "PhonePe, GPay, BHIM", icon: "📱" }, { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay", icon: "💳" }, { id: "cod", label: "Cash on Delivery", desc: "Pay when you receive", icon: "💵" }].map((p) => <button key={p.id} onClick={() => setPayment(p.id)} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${payment === p.id ? "border-terracotta bg-terracotta/5" : "border-beige"}`}><span className="text-xl">{p.icon}</span><div className="flex-1"><p className={`text-xs font-semibold ${payment === p.id ? "text-terracotta" : "text-brown"}`}>{p.label}</p><p className="text-brown/40 text-[10px]">{p.desc}</p></div><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${payment === p.id ? "border-terracotta bg-terracotta" : "border-beige"}`}>{payment === p.id && <div className="w-2 h-2 bg-white rounded-full"></div>}</div></button>)}</div></div>
      {error && <div className="bg-red-50 text-red-600 rounded-xl px-3 py-2 text-xs mb-4">{error}</div>}
    </div><div className="flex-shrink-0 bg-white border-t border-beige px-5 py-4"><Btn label={loading ? "Placing order…" : "Place Order"} onClick={placeOrder} /></div></div>
  );
}

// ── Screen 17: Order Success ──────────────────────────────────────────────────

function OrderSuccess({ navigate }: Nav) {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  useEffect(() => { try { const raw = localStorage.getItem(LAST_ORDER_KEY); if (raw) setOrder(JSON.parse(raw)); } catch {} }, []);
  const id = order?._id ? `KS-${order._id.slice(-8).toUpperCase()}` : "KS-DEMO";
  const product = order?.items?.[0]?.name || "Order items";
  const total = order?.totalAmount ?? 0;
  return (
    <div className="flex-1 bg-cream flex flex-col items-center justify-center px-6"><div className="text-center mb-8"><div className="w-28 h-28 bg-green/10 rounded-full flex items-center justify-center text-6xl mx-auto mb-5 shadow-sm">✅</div><h1 className="font-serif text-brown text-3xl mb-3">Order Placed Successfully!</h1><p className="text-brown/55 text-sm leading-relaxed">The order has been stored in MongoDB and can be tracked from the database.</p></div><div className="bg-white rounded-2xl p-5 w-full mb-8 border border-beige/40 shadow-sm"><p className="text-brown/40 text-[10px] uppercase tracking-widest font-semibold mb-3">Order Details</p><div className="flex flex-col gap-2.5 text-sm">{[{ label: "Order ID", value: id, bold: true }, { label: "Product", value: product }, { label: "Status", value: order?.status || "placed" }, { label: "Total", value: `₹${total.toLocaleString("en-IN")}`, color: "text-terracotta font-bold" }, { label: "Placed", value: formatDate(order?.createdAt) }].map((r, i) => <div key={i} className="flex justify-between"><span className="text-brown/50 text-xs">{r.label}</span><span className={`text-xs ${r.color || (r.bold ? "font-semibold text-brown" : "text-brown")}`}>{r.value}</span></div>)}</div></div><div className="flex flex-col gap-3 w-full"><Btn label="Track Order" onClick={() => navigate("order-tracking")} /><Btn label="Continue Shopping" onClick={() => navigate("marketplace")} variant="ghost" /></div></div>
  );
}

// ── Screen 18: Order Tracking ─────────────────────────────────────────────────

function OrderTracking({ navigate }: Nav) {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let mounted = true; const load = async () => { try { const raw = localStorage.getItem(LAST_ORDER_KEY); const cached = raw ? JSON.parse(raw) : null; const data = cached?._id ? await api.getOrder(cached._id) : null; if (mounted) setOrder(data?.order || cached); } catch {} finally { if (mounted) setLoading(false); } }; load(); return () => { mounted = false; }; }, []);
  if (loading) return <div className="flex-1 bg-cream flex items-center justify-center text-brown/50 text-sm">Loading order…</div>;
  const current = order?.status || "placed";
  const statusRank: Record<string, number> = { placed: 1, confirmed: 2, packed: 3, shipped: 4, delivered: 5, cancelled: 0 };
  const rank = statusRank[current] ?? 1;
  const steps = [{ label: "Order Confirmed", key: "placed" }, { label: "Artisan Preparing", key: "confirmed" }, { label: "Packed / Shipped", key: "shipped" }, { label: "Out for Delivery", key: "shipped" }, { label: "Delivered", key: "delivered" }];
  return (
    <div className="flex-1 bg-cream overflow-y-auto pb-6"><div className="px-5 pt-14 pb-5 flex items-center gap-2"><BackBtn onClick={() => navigate("order-success")} /><div><h1 className="font-serif text-brown text-2xl">Track Your Order</h1><p className="text-brown/45 text-xs">Order #{order?._id?.slice(-8).toUpperCase() || "DEMO"}</p></div></div><div className="px-5"><div className="bg-white rounded-2xl p-4 flex gap-3 items-center mb-4 border border-beige/40 shadow-sm"><div className="w-14 h-14 rounded-xl bg-beige overflow-hidden flex-shrink-0"><img src={productImage(order?.items?.[0]?.product as ApiProduct)} alt="" className="w-full h-full object-cover" /></div><div className="flex-1"><p className="font-semibold text-brown text-sm">{order?.items?.[0]?.name || "Order"}</p><p className="text-brown/45 text-xs">Qty: {order?.items?.[0]?.quantity || 1}</p><p className="text-terracotta font-bold text-sm">₹{order?.totalAmount?.toLocaleString("en-IN") || "0"}</p></div></div><div className="bg-terracotta/10 border border-terracotta/20 rounded-2xl p-4 mb-5 flex items-center gap-3"><span className="text-2xl">🚚</span><div><p className="text-brown/50 text-xs">Current Status</p><p className="font-bold text-brown capitalize">{current}</p></div></div><div className="bg-white rounded-2xl p-5 border border-beige/40 shadow-sm"><h3 className="font-semibold text-brown mb-4 text-sm">Order Status</h3><div className="relative pl-2"><div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-beige pointer-events-none"></div><div className="flex flex-col gap-5">{steps.map((step, i) => { const done = (step.key === "delivered" ? rank >= 5 : i === 0 ? rank >= 1 : rank >= 2 + Math.min(i - 1, 2)); return <div key={step.label} className="flex items-start gap-4"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 z-10 font-bold ${done ? "bg-green text-white" : "bg-white border-2 border-beige text-brown/30"}`}>{done ? "✓" : ""}</div><div><p className={`text-sm font-medium ${done ? "text-brown" : "text-brown/35"}`}>{step.label}</p><p className="text-xs text-brown/35">{done ? "Completed" : "Pending"}</p></div></div>; })}</div></div></div></div></div>
  );
}

// ── Screen 19: Artisan Orders ─────────────────────────────────────────────────

function ArtisanOrders({ navigate }: Nav) {
  const [activeTab, setActiveTab] = useState("New");
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const tabs = ["New", "Processing", "Shipped", "Completed"];
  const filterStatus = (status: string) => activeTab === "New" ? ["placed", "confirmed"].includes(status) : activeTab === "Processing" ? ["packed"].includes(status) : activeTab === "Shipped" ? ["shipped"].includes(status) : ["delivered"].includes(status);
  const load = () => api.getMyArtisanOrders().then((data) => setOrders(data.orders || [])).catch((e) => console.error(e));
  useEffect(() => { load(); }, []);
  const nextStatus = (current: string) => current === "placed" ? "confirmed" : current === "confirmed" ? "packed" : current === "packed" ? "shipped" : current === "shipped" ? "delivered" : current;
  const updateStatus = async (id: string, current: string) => { const next = nextStatus(current); if (next === current) return; try { await api.updateOrderStatus(id, next); load(); } catch (e) { alert(e instanceof Error ? e.message : "Could not update order"); } };
  const visible = orders.filter((o) => filterStatus(o.status));
  return (
    <div className="flex flex-col flex-1 bg-cream"><div className="flex-1 overflow-y-auto px-5"><div className="pt-14 pb-4"><h1 className="font-serif text-brown text-2xl">Your Orders</h1><p className="text-brown/45 text-xs">Live orders from MongoDB</p></div><div className="flex gap-2 overflow-x-auto pb-2 mb-4">{tabs.map((t) => <button key={t} onClick={() => setActiveTab(t)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${activeTab === t ? "bg-terracotta text-white shadow-sm" : "bg-white text-brown border border-beige"}`}>{t}</button>)}</div><div className="flex flex-col gap-3 pb-4">{visible.length === 0 ? <div className="bg-white rounded-2xl p-5 text-center text-xs text-brown/45">No {activeTab.toLowerCase()} orders.</div> : visible.map((o) => <div key={o._id} className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm"><div className="flex justify-between items-start mb-1.5"><div><p className="font-semibold text-brown text-sm">{o.items?.[0]?.name || "Order"}</p><p className="text-brown/45 text-xs">Buyer: {o.buyer?.name || "Buyer"}</p></div><span className="text-[10px] px-2 py-1 rounded-full bg-terracotta/10 text-terracotta font-semibold capitalize">{o.status}</span></div><div className="flex gap-3 text-[10px] text-brown/50 mb-3"><span>#{o._id.slice(-8).toUpperCase()}</span><span>·</span><span>Qty: {o.items?.reduce((n, i) => n + i.quantity, 0)}</span><span>·</span><span className="text-terracotta font-bold">₹{o.totalAmount.toLocaleString("en-IN")}</span><span>·</span><span>{formatDate(o.createdAt)}</span></div><div className="flex gap-2"><button onClick={() => updateStatus(o._id, o.status)} className="flex-1 bg-terracotta text-white rounded-xl py-2 text-xs font-semibold">{o.status === "delivered" ? "Completed" : "Update Status"}</button><span className="flex-1 bg-cream text-brown rounded-xl py-2 text-xs font-medium border border-beige text-center">Database order</span></div></div>)}</div></div><ArtisanNav active="orders" navigate={navigate} /></div>
  );
}

// ── Screen 20: Artisan Profile ────────────────────────────────────────────────

function ArtisanProfile({ navigate }: Nav) {
  const [artisan, setArtisan] = useState<any>(null);
  useEffect(() => { api.getArtisanMe().then((data) => setArtisan(data.artisan)).catch((e) => console.error(e)); }, []);
  const name = artisan?.name || "Demo Artisan";
  const craft = artisan?.craft || "Traditional Handicrafts";
  return (
    <div className="flex flex-col flex-1 bg-cream"><div className="flex-1 overflow-y-auto px-5"><div className="pt-14 pb-4 flex items-center justify-between"><h1 className="font-serif text-brown text-2xl">My Profile</h1><span className="text-green text-[10px] font-semibold bg-green/10 px-2.5 py-1 rounded-full">Stored in MongoDB</span></div><div className="bg-terracotta rounded-3xl p-5 flex items-center gap-4 mb-5 relative overflow-hidden shadow-md"><div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full pointer-events-none"></div><div className="w-20 h-20 rounded-full bg-beige overflow-hidden border-4 border-white/25 flex-shrink-0 shadow-lg"><img src={artisan?.imageUrl || "https://images.unsplash.com/photo-1606681246594-372e9e133ac1?w=100&h=100&fit=crop&auto=format"} alt={name} className="w-full h-full object-cover" /></div><div className="text-white"><h2 className="font-serif text-2xl leading-tight">{name}</h2><p className="text-white/75 text-xs mt-0.5">{craft} Artisan</p><p className="text-white/60 text-[10px] mt-1">📍 {artisan?.state || "India"}</p><div className="flex items-center gap-1 mt-2"><span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">Verified ✓</span></div></div></div><div className="grid grid-cols-3 gap-2.5 mb-5">{[{ label: "Products", value: "Live" }, { label: "Orders", value: "DB" }, { label: "Role", value: "Artisan" }].map((s, i) => <div key={i} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-beige/40"><p className="font-bold text-terracotta text-base">{s.value}</p><p className="text-brown/50 text-[10px] mt-0.5">{s.label}</p></div>)}</div><div className="bg-white rounded-2xl p-5 border border-beige/40 shadow-sm mb-3"><h3 className="font-serif text-brown text-lg mb-3">My Craft Story</h3><p className="text-brown/65 text-xs leading-relaxed">{artisan?.bio || "Artisan profile stored through the KarigarSetu backend. The profile can be updated through the REST API and displayed on the marketplace."}</p></div><div className="bg-white rounded-2xl p-4 border border-beige/40 shadow-sm mb-4"><h3 className="font-semibold text-brown text-sm mb-3">Profile Data</h3><div className="text-xs text-brown/60 space-y-2"><p><b className="text-brown">District:</b> {artisan?.district || "—"}</p><p><b className="text-brown">Village:</b> {artisan?.village || "—"}</p><p><b className="text-brown">Phone:</b> {artisan?.phone || "—"}</p></div></div></div><ArtisanNav active="profile" navigate={navigate} /></div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const navigate = (s: Screen) => setScreen(s);

  const renderScreen = () => {
    switch (screen) {
      case "landing": return <Landing navigate={navigate} />;
      case "language": return <LanguageSelect navigate={navigate} />;
      case "login": return <Login navigate={navigate} />;
      case "register": return <Register navigate={navigate} />;
      case "usertype": return <UserType navigate={navigate} />;
      case "artisan-dashboard": return <ArtisanDashboard navigate={navigate} />;
      case "add-product": return <AddProduct navigate={navigate} />;
      case "ai-processing": return <AIProcessing navigate={navigate} />;
      case "ai-listing": return <AIListing navigate={navigate} />;
      case "edit-listing": return <EditListing navigate={navigate} />;
      case "product-published": return <ProductPublished navigate={navigate} />;
      case "marketplace": return <BuyerMarketplace navigate={navigate} />;
      case "ai-search": return <AISearch navigate={navigate} />;
      case "ai-recommendations": return <AIRecommendations navigate={navigate} />;
      case "product-details": return <ProductDetails navigate={navigate} />;
      case "cart": return <Cart navigate={navigate} />;
      case "checkout": return <Checkout navigate={navigate} />;
      case "order-success": return <OrderSuccess navigate={navigate} />;
      case "order-tracking": return <OrderTracking navigate={navigate} />;
      case "artisan-orders": return <ArtisanOrders navigate={navigate} />;
      case "artisan-profile": return <ArtisanProfile navigate={navigate} />;
    }
  };

  return (
    <div className="h-full bg-cream flex flex-col items-center">
      <div className="w-full max-w-[430px] h-full flex flex-col bg-cream" key={screen}>
        {renderScreen()}
      </div>
    </div>
  );
}
