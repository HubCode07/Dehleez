export type ServiceVertical = "food" | "instamart" | "dineout" | "scenes";

export interface ProductResult {
  id: string;
  name: string;
  price?: number;
  image?: string;
  description?: string;
  available?: boolean;
  variant?: string;
}

export interface RestaurantResult {
  id: string;
  name: string;
  image?: string;
  rating?: number | string;
  cuisine?: string;
  deliveryTime?: string;
  address?: string;
  priceForTwo?: number | string;
  distance?: string;
  offer?: string;
  available?: boolean;
}

export interface MenuResult {
  id: string;
  name: string;
  restaurant?: string;
  category?: string;
  description?: string;
  price?: number;
  image?: string;
  available?: boolean;
}

export interface CartLineResult {
  id: string;
  name: string;
  quantity?: number;
  price?: number;
  detail?: string;
  available?: boolean;
}

export interface AddressResult {
  id: string;
  label: string;
  address: string;
}

export interface OrderResult {
  id: string;
  title: string;
  detail?: string;
  status?: string;
  total?: string;
  eta?: string;
}

export interface TimeOptionResult {
  id: string;
  label: string;
  detail?: string;
  available?: boolean;
  selectionPrompt?: string;
}

export interface CouponResult {
  id: string;
  name: string;
  description?: string;
  available?: boolean;
}

export interface PaymentMethodResult {
  id: string;
  label: string;
  detail?: string;
}

export type ResultCard =
  | { type: "products"; title: string; items: ProductResult[] }
  | { type: "restaurants"; title: string; items: RestaurantResult[] }
  | { type: "menu"; title: string; items: MenuResult[] }
  | { type: "cart"; title: string; items: CartLineResult[]; total?: string; detail?: string }
  | { type: "addresses"; title: string; items: AddressResult[] }
  | { type: "orders"; title: string; items: OrderResult[]; actionLabel?: string }
  | { type: "payments"; title: string; methods: PaymentMethodResult[]; amount?: string }
  | { type: "payment"; title: string; status: string; detail?: string; bridgeUrl?: string }
  | { type: "times"; title: string; items: TimeOptionResult[]; actionLabel: string }
  | { type: "coupons"; title: string; items: CouponResult[] }
  | { type: "info"; title: string; message: string; link?: { url: string; label: string }; action?: { label: string; prompt: string } };

export interface WidgetResource {
  uri: string;
  html: string;
  data: unknown;
  csp?: Record<string, string[]>;
}

export interface ChatResponse {
  text: string;
  activities: string[];
  cards: ResultCard[];
  widgets: WidgetResource[];
}

export interface SessionStatus {
  ready: boolean;
  connected: boolean;
  missing: string[];
}
