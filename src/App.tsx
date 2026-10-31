import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Home,
  MapPin,
  Mic,
  MessageSquarePlus,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Search,
  Settings2,
  ShoppingBasket,
  Sparkles,
  Utensils,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ChatResponse, ResultCard, ServiceVertical, SessionStatus, WidgetResource } from "@/lib/contracts";
import { api } from "@/lib/api";

type Page = "home" | "sunao" | "history" | ServiceVertical;
type ChatLine = { role: "user" | "assistant"; text: string; activities?: string[]; cards?: ResultCard[]; widgets?: WidgetResource[]; retryText?: string };
type Conversation = { id: string; vertical: ServiceVertical; title: string; updatedAt: number; messages: ChatLine[] };

const conversationStorageKey = "dehleez:conversations:v1";

const verticals: { id: ServiceVertical; label: string; short: string; icon: typeof Utensils; color: string }[] = [
  { id: "food", label: "Food", short: "Food", icon: Utensils, color: "saffron" },
  { id: "instamart", label: "Instamart", short: "Groceries", icon: ShoppingBasket, color: "leaf" },
  { id: "dineout", label: "Dineout", short: "Dine out", icon: MapPin, color: "coral" },
  { id: "scenes", label: "Scenes", short: "Events", icon: AudioLines, color: "violet" },
];

const prompts = [
  { text: "Find a gentle vegetarian dinner", detail: "Food, nearby" },
  { text: "Order my everyday groceries", detail: "Instamart" },
  { text: "Book a table for two tonight", detail: "Dineout" },
  { text: "What can we do this weekend?", detail: "Scenes" },
];

const servicePrompts: Record<ServiceVertical, string[]> = {
  food: ["Find a vegetarian dinner", "Show me meals under ₹500", "Help me choose a family meal"],
  instamart: ["Find groceries for tonight", "Search for pantry staples", "Compare snack options"],
  dineout: ["Find a table for two", "Browse quieter dinner spots", "Look for family-friendly places"],
  scenes: ["Find something for this weekend", "Browse live music", "Show family-friendly events"],
};

const categoryLinks = [
  { title: "A meal, delivered", description: "Find something you’ll enjoy, then review it together.", icon: Utensils, page: "food" as const, tint: "saffron" },
  { title: "Things for home", description: "Fresh food and everyday essentials from Instamart.", icon: ShoppingBasket, page: "instamart" as const, tint: "leaf" },
  { title: "A table out", description: "Choose a place and a time that works for you.", icon: MapPin, page: "dineout" as const, tint: "coral" },
  { title: "Something to do", description: "Explore events and shows around you.", icon: AudioLines, page: "scenes" as const, tint: "violet" },
];

function safeImage(source?: string) {
  if (!source) return undefined;
  try {
    const url = new URL(source);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function readConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem(conversationStorageKey);
    if (saved) return JSON.parse(saved) as Conversation[];
    const now = Date.now();
    const migrated = verticals.flatMap(({ id }) => {
      const raw = localStorage.getItem(`dehleez:chat:${id}`);
      if (!raw) return [];
      try {
        const messages = JSON.parse(raw) as ChatLine[];
        if (!messages.length) return [];
        const firstRequest = messages.find((line) => line.role === "user")?.text;
        return [{ id: "legacy", vertical: id, title: firstRequest?.slice(0, 64) ?? "Earlier conversation", updatedAt: now, messages }];
      } catch { return []; }
    });
    if (migrated.length) localStorage.setItem(conversationStorageKey, JSON.stringify(migrated));
    return migrated;
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  try {
    const saved = conversations.slice(0, 60).map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map(({ role, text }) => ({ role, text })),
    }));
    localStorage.setItem(conversationStorageKey, JSON.stringify(saved));
  } catch { /* Keep the active chat usable if storage is unavailable. */ }
}

function createConversationId() {
  return globalThis.crypto?.randomUUID?.() ?? `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newConversation(vertical: ServiceVertical): Conversation {
  return { id: createConversationId(), vertical, title: "New conversation", updatedAt: Date.now(), messages: [] };
}

function conversationDate(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatPrice(value?: number) {
  return typeof value === "number" ? `₹${Math.round(value)}` : null;
}

function widgetDocument(widget: WidgetResource) {
  const payload = JSON.stringify(widget.data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const nonce = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const policy = widget.csp
    ? Object.entries(widget.csp).map(([key, values]) => `${key} ${values.join(" ")}`).join("; ")
    : "default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https:; script-src 'unsafe-inline' https:; font-src https: data:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'";
  const scriptPolicy = policy.replace(/(^|;\s*)script-src([^;]*)/i, (_directive, prefix: string, sources: string) => `${prefix}script-src${sources} 'nonce-${nonce}'`);
  const effectivePolicy = scriptPolicy === policy && !/script-src/i.test(policy) ? `${policy}; script-src 'nonce-${nonce}'` : scriptPolicy;
  const bootstrap = `<script nonce="${nonce}">window.__DEHLEEZ_WIDGET_DATA__=${payload};</script>`;
  return widget.html.replace(/<head([^>]*)>/i, `<head$1><meta http-equiv="Content-Security-Policy" content="${effectivePolicy.replaceAll('"', "&quot;")}">${bootstrap}`);
}

function attributionFor(service: ServiceVertical) {
  if (service === "instamart") return { label: "Powered by Instamart", logo: "/brand/instamart.jpg" };
  if (service === "dineout") return { label: "Powered by Dineout", logo: "/brand/dineout.jpg" };
  return { label: "Powered by Swiggy", logo: "/brand/swiggy.jpg" };
}

function Attribution({ service }: { service: ServiceVertical }) {
  const attribution = attributionFor(service);
  return <div className="service-attribution" aria-label={attribution.label}><img src={attribution.logo} alt="" aria-hidden="true" /><span>{attribution.label}</span></div>;
}

function ResultCards({ cards, onChoose, service, selectedAddressId, onSelectAddress }: { cards: ResultCard[]; onChoose: (message: string) => void; service: ServiceVertical; selectedAddressId?: string; onSelectAddress: (id: string) => void }) {
  if (!cards.length) return null;
  return (
    <div className="result-stack" aria-label="Swiggy results">
      {cards.map((card, cardIndex) => (
        <section className="result-panel" key={`${card.type}-${cardIndex}`} aria-label={card.title}>
          <h3 className="result-title">{card.title}</h3>
          <Attribution service={service} />
          {card.type === "addresses" && <p className="result-info">{card.items.length === 1 ? "One saved address is available." : "Choose the delivery address for this order."}</p>}
          {card.type === "products" && card.items.map((item) => (
            <article className="result-row" key={item.id}>
              {safeImage(item.image) ? <img className="result-image" src={safeImage(item.image)} alt="" loading="lazy" /> : <span className="result-image result-image-fallback"><ShoppingBasket size={20} aria-hidden="true" /></span>}
              <div className="result-copy"><strong>{item.name}</strong>{(item.variant || item.description) && <span>{[item.variant, item.description].filter(Boolean).join(" · ")}</span>}{item.available === false && <span className="result-unavailable">Currently unavailable</span>}</div>
              <div className="result-actions">{item.price !== undefined && <strong className="result-price">{formatPrice(item.price)}</strong>}<Button variant="outline" size="sm" disabled={item.available === false} onClick={() => onChoose(`Add one ${item.variant ? `${item.variant} ` : ""}${item.name} to my Instamart cart`)}>Choose</Button></div>
            </article>
          ))}
          {card.type === "restaurants" && card.items.map((item) => (
            <article className="result-row" key={item.id}>
              {safeImage(item.image) ? <img className="result-image" src={safeImage(item.image)} alt="" loading="lazy" /> : <span className="result-image result-image-fallback"><Utensils size={20} aria-hidden="true" /></span>}
              <div className="result-copy"><strong>{item.name}</strong><span>{[item.cuisine, item.rating && `Rating ${item.rating}`, item.deliveryTime && `${item.deliveryTime} min`, item.distance, item.offer].filter(Boolean).join(" · ") || item.address || "Open details with Sunao"}</span></div>
              <Button variant="outline" size="sm" disabled={item.available === false} onClick={() => onChoose(`${card.title.toLowerCase().includes("event") ? `Tell me more about the Swiggy event ${item.name}` : `Show me the menu at the Swiggy restaurant ${item.name}`}`)}>Explore</Button>
            </article>
          ))}
          {card.type === "menu" && card.items.map((item) => (
            <article className="result-row" key={item.id}>
              {safeImage(item.image) ? <img className="result-image" src={safeImage(item.image)} alt="" loading="lazy" /> : <span className="result-image result-image-fallback"><Utensils size={20} aria-hidden="true" /></span>}
              <div className="result-copy"><strong>{item.name}</strong><span>{[item.category, item.restaurant, item.description].filter(Boolean).join(" · ") || (item.available === false ? "Unavailable" : "Ask Sunao for ingredients and options")}</span></div>
              <div className="result-actions">{item.price !== undefined && <strong className="result-price">{formatPrice(item.price)}</strong>}<Button variant="outline" size="sm" disabled={item.available === false} onClick={() => onChoose(`Add one ${item.name}${item.restaurant ? ` from ${item.restaurant}` : ""} to my Food cart`)}>Choose</Button></div>
            </article>
          ))}
          {card.type === "cart" && (
            <>
              {card.detail && <p className="result-info">{card.detail}</p>}
              {card.items.map((item) => <article className="result-row" key={item.id}><div className="result-copy"><strong>{item.name}</strong><span>{[item.quantity && `Quantity ${item.quantity}`, item.detail, item.available === false ? "Check availability" : undefined].filter(Boolean).join(" · ")}</span></div>{item.price !== undefined && <strong className="result-price">{formatPrice(item.price)}</strong>}</article>)}
              {card.total && <div className="result-total"><span>Current total</span><strong>{card.total}</strong></div>}
            </>
          )}
          {card.type === "addresses" && card.items.map((item) => (
            <button className={`result-select-row ${selectedAddressId === item.id ? "selected" : ""}`} key={item.id} aria-pressed={selectedAddressId === item.id} onClick={() => onSelectAddress(item.id)}><span className="address-select-icon"><MapPin size={17} aria-hidden="true" /></span><span><strong>{item.label}</strong><small>{item.address}</small></span>{selectedAddressId === item.id ? <Check size={16} aria-label="Selected" /> : <ArrowRight size={16} aria-hidden="true" />}</button>
          ))}
          {card.type === "orders" && card.items.map((item) => (
            <article className="result-row" key={item.id}><div className="result-copy"><strong>{item.title}</strong><span>{[item.status, item.detail, item.eta && `ETA ${item.eta}`].filter(Boolean).join(" · ")}</span></div><div className="result-actions">{item.total && <strong className="result-price">{item.total.startsWith("₹") ? item.total : `₹${item.total}`}</strong>}<Button variant="outline" size="sm" onClick={() => onChoose(`${card.actionLabel ?? "Check order"} ${item.id}`)}>{card.actionLabel ?? "Open"}</Button></div></article>
          ))}
          {card.type === "payments" && <>
            {card.amount && <p className="result-info">Amount due: {card.amount}</p>}
            {card.methods.map((method) => <article className="result-row" key={method.id}><div className="result-copy"><strong>{method.label}</strong>{method.detail && <span>{method.detail}</span>}</div><Button variant="outline" size="sm" onClick={() => onChoose(`I choose the live payment method labeled “${method.label}”. Please review my exact current order or booking total and address or booking, then ask me to confirm before proceeding with payment.`)}>Choose</Button></article>)}
          </>}
          {card.type === "payment" && <div className="payment-status" role="status"><strong>{card.status.replaceAll("_", " ")}</strong>{card.detail && <p>{card.detail}</p>}{card.bridgeUrl && <a href={card.bridgeUrl} target="_blank" rel="noopener noreferrer">Continue securely with Swiggy payment <ArrowRight size={15} /></a>}</div>}
          {card.type === "times" && card.items.map((item) => (
            <article className="result-row" key={item.id}><span className="result-image result-image-fallback"><Clock3 size={19} aria-hidden="true" /></span><div className="result-copy"><strong>{item.label}</strong>{item.detail && <span>{item.detail}</span>}{item.available === false && <span className="result-unavailable">Unavailable</span>}</div><Button variant="outline" size="sm" disabled={item.available === false} onClick={() => onChoose(item.selectionPrompt ?? `I choose ${item.label}${item.detail ? `, ${item.detail}` : ""}. Please review this exact selection and ask me to confirm before booking.`)}>Select</Button></article>
          ))}
          {card.type === "coupons" && card.items.map((item) => (
            <article className="result-row" key={item.id}>
              <div className="result-copy"><strong>{item.name}</strong><span>{item.description || (item.available === false ? "Not available for this cart" : "Ask Sunao to check this offer against your cart")}</span></div>
              <Button variant="outline" size="sm" disabled={item.available === false} onClick={() => onChoose(`Please check whether the Swiggy offer “${item.name}” is eligible for my current cart, and apply it only if Swiggy confirms it.`)}>Check offer</Button>
            </article>
          ))}
          {card.type === "info" && <p className="result-info">{card.message}</p>}
          {card.type === "info" && card.link && <a className="support-report-link" href={card.link.url}>{card.link.label}<ArrowRight size={15} aria-hidden="true" /></a>}
          {card.type === "info" && card.action && <Button variant="outline" size="sm" className="result-primary-action" onClick={() => onChoose(card.action!.prompt)}>{card.action.label}<ArrowRight size={15} aria-hidden="true" /></Button>}
        </section>
      ))}
    </div>
  );
}

function WidgetEmbeds({ widgets, service }: { widgets: WidgetResource[]; service: ServiceVertical }) {
  return (
    <div className="widget-stack">
      {widgets.map((widget) => (
        <div className="widget-entry" key={widget.uri}>
          <iframe
            className="swiggy-widget"
            title="Swiggy interactive content"
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            srcDoc={widgetDocument(widget)}
          />
          <Attribution service={service} />
        </div>
      ))}
    </div>
  );
}

function SunaoMessage({ message, onChoose, onEditRequest, service, selectedAddressId, onSelectAddress }: { message: ChatLine; onChoose: (message: string) => void; onEditRequest: (message: string) => void; service: ServiceVertical; selectedAddressId?: string; onSelectAddress: (id: string) => void }) {
  return (
    <article className={`chat-line ${message.role === "user" ? "from-user" : "from-sunao"}`}>
      {message.role === "assistant" && <div className="sunao-mark" aria-hidden="true"><Sparkles size={16} /></div>}
      <div className="chat-content">
        <div className="chat-bubble">{message.text}</div>
        {message.retryText && <button className="retry-message" onClick={() => onEditRequest(message.retryText!)}><RotateCcw size={15} aria-hidden="true" />Review and resend</button>}
        {message.activities?.length ? <p className="activity-note"><Clock3 size={13} aria-hidden="true" />{message.activities[message.activities.length - 1]}</p> : null}
        {message.cards && <ResultCards cards={message.cards} onChoose={onChoose} service={service} selectedAddressId={selectedAddressId} onSelectAddress={onSelectAddress} />}
        {message.widgets && <WidgetEmbeds widgets={message.widgets} service={service} />}
      </div>
    </article>
  );
}

function App() {
  const [page, setPage] = useState<Page>("home");
  const [service, setService] = useState<ServiceVertical>("food");
  const [session, setSession] = useState<SessionStatus>({ ready: false, connected: false, missing: [] });
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(readConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const activeConversationRef = useRef<string | null>(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("connect_error") ?? "");
  const [largeText, setLargeText] = useState(() => {
    try { return localStorage.getItem("dehleez:large-text") === "true"; } catch { return false; }
  });
  const [highContrast, setHighContrast] = useState(() => {
    try { return localStorage.getItem("dehleez:high-contrast") === "true"; } catch { return false; }
  });
  const [showServices, setShowServices] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("dehleez:left-sidebar-collapsed") === "true"; } catch { return false; }
  });
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("dehleez:right-sidebar-collapsed") === "true"; } catch { return false; }
  });
  const [selectedAddressIds, setSelectedAddressIds] = useState<Record<string, string>>({});
  const voiceAvailable = typeof window !== "undefined" && Boolean(
    (window as typeof window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      ?? (window as typeof window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition,
  );
  const messagesEnd = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const servicesMenu = useRef<HTMLDivElement>(null);
  const servicesTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const returnedFromSwiggy = query.get("connected") === "1";
    api.session().then((status) => {
      setSession(status);
      if (returnedFromSwiggy) {
        setNotice(status.connected
          ? "Swiggy is connected. You can start with Sunao."
          : "Swiggy returned to Dehleez, but this device could not find a saved connection. Please reconnect.");
      }
    }).catch(() => {
      setSession({ ready: false, connected: false, missing: ["API service"] });
      if (returnedFromSwiggy) setNotice("Swiggy returned to Dehleez, but the local API could not verify the connection. Please restart Dehleez and reconnect.");
    });
    if (query.has("connected") || query.has("connect_error")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("large-text", largeText);
    document.documentElement.classList.toggle("high-contrast", highContrast);
    try {
      localStorage.setItem("dehleez:large-text", String(largeText));
      localStorage.setItem("dehleez:high-contrast", String(highContrast));
    } catch { /* Accessibility settings still work for this session. */ }
  }, [largeText, highContrast]);

  useEffect(() => {
    try {
      localStorage.setItem("dehleez:left-sidebar-collapsed", String(leftSidebarCollapsed));
      localStorage.setItem("dehleez:right-sidebar-collapsed", String(rightSidebarCollapsed));
    } catch { /* The layout preference still works for this session. */ }
  }, [leftSidebarCollapsed, rightSidebarCollapsed]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat, busy]);

  useEffect(() => {
    if (!showServices) return;
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !servicesMenu.current?.contains(event.target) && !servicesTrigger.current?.contains(event.target)) setShowServices(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowServices(false);
        servicesTrigger.current?.focus();
        return;
      }
      if (event.key === "Tab" && servicesMenu.current) {
        const focusable = servicesMenu.current.querySelectorAll<HTMLElement>("button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex=\"-1\"])");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showServices]);
  function appendConversationMessage(id: string, vertical: ServiceVertical, line: ChatLine) {
    setConversations((prior) => {
      const existing = prior.find((item) => item.id === id && item.vertical === vertical);
      const messages = [...(existing?.messages ?? []), line];
      const firstRequest = messages.find((line) => line.role === "user")?.text;
      const updated: Conversation = {
        id,
        vertical,
        title: existing?.title !== "New conversation" ? existing?.title ?? firstRequest?.slice(0, 64) ?? "New conversation" : firstRequest?.slice(0, 64) ?? "New conversation",
        updatedAt: Date.now(),
        messages,
      };
      const next = [updated, ...prior.filter((item) => !(item.id === id && item.vertical === vertical))].slice(0, 60);
      saveConversations(next);
      return next;
    });
    if (activeConversationRef.current === id) setChat((prior) => [...prior, line]);
  }

  function startNewChat(vertical: ServiceVertical = service) {
    const conversation = newConversation(vertical);
    const id = conversation.id;
    activeConversationRef.current = id;
    setActiveConversationId(id);
    setService(vertical);
    setChat([]);
    setMessage("");
    setPage(vertical === "food" ? "sunao" : vertical);
    setShowServices(false);
    return id;
  }

  function openConversation(conversation: Conversation) {
    activeConversationRef.current = conversation.id;
    setActiveConversationId(conversation.id);
    setService(conversation.vertical);
    setChat(conversation.messages);
    setMessage("");
    setPage(conversation.vertical === "food" ? "sunao" : conversation.vertical);
    setShowServices(false);
  }

  function showHistory() {
    setHistorySearch("");
    setPage("history");
    setShowServices(false);
  }

  function goToService(next: Page) {
    if (next === "home") {
      setPage("home");
      setShowServices(false);
      return;
    }
    const vertical: ServiceVertical = next === "sunao" ? "food" : next === "history" ? service : next;
    const latest = conversations.find((item) => item.vertical === vertical);
    if (latest) openConversation(latest);
    else startNewChat(vertical);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const conversationId = activeConversationRef.current ?? activeConversationId ?? startNewChat(service);
    setMessage("");
    setNotice("");
    const userLine: ChatLine = { role: "user", text: trimmed };
    appendConversationMessage(conversationId, service, userLine);
    setBusy(true);
    if (!session.connected) {
      appendConversationMessage(conversationId, service, { role: "assistant", text: "I’m ready to help. Connect Swiggy first so I can check live options for you." });
      setBusy(false);
      return;
    }
    try {
      const result: ChatResponse = await api.sendMessage(service, conversationId, trimmed, { allowCombined: true, selectedAddressId: selectedAddressIds[service] });
      appendConversationMessage(conversationId, service, { role: "assistant", text: result.text, activities: result.activities, cards: result.cards, widgets: result.widgets });
    } catch (error) {
      appendConversationMessage(conversationId, service, { role: "assistant", text: error instanceof Error ? error.message : "I couldn’t connect just now. Please try again.", retryText: trimmed });
      if (error instanceof Error && /connect swiggy/i.test(error.message)) {
        setSession((prior) => ({ ...prior, connected: false }));
      }
    } finally {
      setBusy(false);
      composer.current?.focus();
    }
  }

  function editFailedRequest(text: string) {
    setMessage(text);
    setNotice("Review the request before sending it again.");
    composer.current?.focus();
  }

  async function connectSwiggy() {
    setNotice("");
    try {
      const result = await api.startSwiggy();
      window.location.assign(result.url);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Swiggy could not be connected yet.");
    }
  }

  async function disconnectSwiggy() {
    try {
      await api.disconnectSwiggy();
      setSession((prior) => ({ ...prior, connected: false }));
      setNotice("Swiggy has been disconnected from this device.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not disconnect Swiggy.");
    }
  }

  function startVoiceInput() {
    const constructors = window as typeof window & {
      SpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; start: () => void };
      webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; start: () => void };
    };
    const Constructor = constructors.SpeechRecognition ?? constructors.webkitSpeechRecognition;
    if (!Constructor) {
      setNotice("Voice input is not available in this browser. You can type your request instead.");
      return;
    }
    const recognition = new Constructor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => setMessage((value) => `${value}${value ? " " : ""}${event.results[0]?.[0]?.transcript ?? ""}`);
    recognition.onerror = () => setNotice("I couldn’t hear that. Please try again or type your request.");
    recognition.start();
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    if (!query) return;
    const target: ServiceVertical = /\b(grocer(?:y|ies)|instamart|milk|vegetables|essentials|snacks|household)\b/i.test(query)
      ? "instamart"
      : /\b(book|booking|table|restaurant|dine ?out|reservation)\b/i.test(query)
        ? "dineout"
        : /\b(event|show|concert|ticket|weekend|activity)\b/i.test(query)
          ? "scenes"
          : "food";
    goToService(target);
    setMessage(query);
  }

  function composerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(message);
    }
  }

  const serviceTitle: Record<ServiceVertical, { headline: string; description: string }> = {
    food: { headline: "Let’s find something delicious.", description: "Tell Sunao what sounds good. You can mention your dietary needs, too." },
    instamart: { headline: "What do you need at home?", description: "Ask for groceries or everyday essentials. Sunao will check what’s available." },
    dineout: { headline: "Plan a meal out.", description: "Tell Sunao where, when, and how many people are joining." },
    scenes: { headline: "Find something to look forward to.", description: "Ask Sunao about events and shows in your area." },
  };

  const pageService = page !== "home" && page !== "sunao" && page !== "history";
  const showingChat = page === "sunao" || pageService;

  return (
    <main className={`app-frame ${leftSidebarCollapsed ? "left-collapsed" : ""} ${rightSidebarCollapsed ? "right-collapsed" : ""}`}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-top">
          <button className="brand-lockup" onClick={() => goToService("home")} aria-label="Dehleez home" title="Dehleez home">
            <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
            <span className="brand-name">dehleez<span className="brand-dot">.</span></span>
          </button>
          <button className="rail-toggle sidebar-toggle" aria-label={leftSidebarCollapsed ? "Expand main navigation" : "Collapse main navigation"} aria-expanded={!leftSidebarCollapsed} aria-controls="primary-navigation" onClick={() => setLeftSidebarCollapsed((value) => !value)} title={leftSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}>
            {leftSidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>
        </div>
        <div className="sidebar-home-label">YOUR DAY, MADE EASIER</div>
        <nav className="primary-nav" id="primary-navigation">
          <button className={`nav-link ${page === "home" ? "active" : ""}`} aria-label="Home" title="Home" onClick={() => goToService("home")}><Home size={19} /><span>Home</span></button>
          <button className={`nav-link ${page === "sunao" ? "active" : ""}`} aria-label="Sunao" title="Sunao" onClick={() => goToService("sunao")}><span className="nav-sunao-icon"><Sparkles size={17} /></span><span>Sunao</span><span className="nav-help">Here to help</span></button>
          <button className={`nav-link history-nav-link ${page === "history" ? "active" : ""}`} aria-label="Chat history" title="Chat history" onClick={showHistory}><BookOpen size={18} /><span>Chat history</span></button>
          <button className="nav-link new-chat-nav-link" aria-label="New chat" title="New chat" onClick={() => startNewChat(service)}><MessageSquarePlus size={18} /><span>New chat</span></button>
          <div className="nav-divider" />
          <div className="sidebar-home-label">ORDER WITH SWIGGY</div>
          {verticals.map(({ id, label, icon: Icon, color }) => (
            <button key={id} className={`nav-link ${page === id ? "active" : ""}`} aria-label={label} title={label} onClick={() => goToService(id)}>
              <span className={`nav-icon ${color}`}><Icon size={18} /></span><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="connection-mini" role="status" aria-label={session.connected ? "Swiggy connected" : "Swiggy not connected"} title={session.connected ? "Swiggy connected" : "Swiggy not connected"}>
            <span className={`connection-dot ${session.connected ? "online" : ""}`} />
            <span>{session.connected ? "Swiggy connected" : "Swiggy not connected"}</span>
          </div>
          <button className="settings-link" aria-label="Toggle high contrast" title="Toggle high contrast" onClick={() => setHighContrast((value) => !value)} aria-pressed={highContrast}><Settings2 size={18} /><span>Accessibility settings</span></button>
          <div className="profile-chip"><div className="profile-avatar">D</div><div><strong>My Dehleez</strong><span>This device</span></div><ChevronDown size={16} aria-hidden="true" /></div>
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar">
          <button className="location-control" onClick={() => setNotice(session.connected ? "Ask Sunao to choose or change your Swiggy address." : "Connect Swiggy to choose a delivery address.")}>
            <span className="location-symbol"><MapPin size={18} /></span>
            <span className="location-text"><small>DELIVERING TO</small><strong>Choose an address</strong></span>
            <ChevronDown size={16} aria-hidden="true" />
          </button>
          <div className="topbar-actions">
            <button className="text-size-control" onClick={() => setLargeText((value) => !value)} aria-pressed={largeText} aria-label={largeText ? "Use standard text size" : "Enlarge text"}>A<span>+</span></button>
            <Button variant="outline" className="connect-button" onClick={session.connected ? disconnectSwiggy : connectSwiggy}>
              {session.connected ? <><Check size={16} /> Connected</> : <>Connect Swiggy <ArrowRight size={16} /></>}
            </Button>
          </div>
        </header>

        <div className="mobile-heading">
          <button className="mobile-brand" onClick={() => goToService("home")}><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><span>dehleez<span className="brand-dot">.</span></span></button>
          <div className="mobile-header-actions">
            <button className="mobile-accessibility-control" onClick={() => setLargeText((value) => !value)} aria-pressed={largeText} aria-label={largeText ? "Use standard text size" : "Enlarge text"}>A<span>+</span></button>
            <button className="mobile-accessibility-control" onClick={() => setHighContrast((value) => !value)} aria-pressed={highContrast} aria-label={highContrast ? "Use standard contrast" : "Increase contrast"}><span className={`contrast-glyph ${highContrast ? "selected" : ""}`} /></button>
          </div>
          <button className="mobile-location" onClick={() => setNotice("Connect Swiggy to choose your delivery address.")}><MapPin size={16} />Choose address<ChevronDown size={14} /></button>
        </div>

        <div className="page-scroll">
          {notice && <div className="notice-banner" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={16} /></button></div>}
          {page === "home" ? (
            <div className="home-page">
              <section className="welcome-zone">
                <div className="welcome-copy">
                  <h1>How can we make<br className="desktop-break" /> today easier?</h1>
                  <p className="welcome-text">A meal, a few essentials, or a little help choosing. Start wherever you like.</p>
                  <form className="home-search" onSubmit={submitSearch} role="search">
                    <Search size={20} aria-hidden="true" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="What do you need today?" aria-label="Search food, groceries, and more" />
                    <Button type="submit" className="search-submit" aria-label="Ask Sunao"><span>Ask Sunao</span><ArrowRight size={18} /></Button>
                  </form>
                  <div className="search-suggestions"><span>Try:</span>{["vegetarian dinner", "daily groceries", "dining out"].map((text) => <button key={text} onClick={() => { setSearch(text); const target: ServiceVertical = text === "daily groceries" ? "instamart" : text === "dining out" ? "dineout" : "food"; goToService(target); setMessage(text); }}>{text}</button>)}</div>
                </div>
                <div className="welcome-visual">
                  <img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1100&q=85" alt="A colorful bowl of fresh vegetables and grains" />
                </div>
              </section>



              <section className="services-section">
                <div className="section-heading"><div><h2>Choose a service</h2><p>Food, groceries, dining, and events.</p></div></div>
                <div className="service-grid">
                  {categoryLinks.map(({ title: itemTitle, description, icon: Icon, page: target, tint }) => (
                    <button key={target} className={`service-tile ${tint}`} onClick={() => goToService(target)}>
                      <span className="service-tile-icon"><Icon size={22} strokeWidth={1.8} /></span>
                      <span className="service-tile-body"><strong>{itemTitle}</strong><span>{description}</span></span>
                      <ArrowRight className="service-tile-arrow" size={18} />
                    </button>
                  ))}
                </div>
              </section>


              <footer className="home-footer"><span>Food, made easier.</span><span>Thoughtfully built for everyone.</span></footer>
            </div>
          ) : page === "history" ? (
            <div className="history-page">
              <header className="history-heading">
                <div><p className="day-note">YOUR SUNAO LIBRARY</p><h1>Pick up where you left off.</h1><p>Your conversations stay on this device.</p></div>
                <Button className="history-new-button" onClick={() => startNewChat(service)}><MessageSquarePlus size={17} />New chat</Button>
              </header>
              <label className="history-search"><Search size={18} aria-hidden="true" /><Input value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search your conversations" aria-label="Search chat history" /></label>
              {(() => {
                const filtered = conversations.filter((item) => `${item.title} ${item.messages.map((line) => line.text).join(" ")} ${serviceTitle[item.vertical].headline}`.toLowerCase().includes(historySearch.trim().toLowerCase()));
                return filtered.length ? <div className="conversation-grid">{filtered.map((item) => {
                  const VerticalIcon = verticals.find((vertical) => vertical.id === item.vertical)?.icon ?? Sparkles;
                  const lastLine = item.messages[item.messages.length - 1];
                  return <button className="conversation-card" key={`${item.vertical}-${item.id}`} onClick={() => openConversation(item)}>
                    <div className="conversation-card-top"><span className={`conversation-service-icon ${item.vertical}`}><VerticalIcon size={17} /></span><span>{serviceTitle[item.vertical].headline}</span><time>{conversationDate(item.updatedAt)}</time></div>
                    <strong>{item.title}</strong>
                    <p>{lastLine?.text ?? "A new conversation with Sunao, ready when you are."}</p>
                    <span className="conversation-card-open">Open conversation <ArrowRight size={15} /></span>
                  </button>;
                })}</div> : <div className="history-empty"><span className="history-empty-icon"><BookOpen size={23} /></span><h2>{historySearch ? "No matching conversations" : "Your conversations will appear here"}</h2><p>{historySearch ? "Try a different word or phrase." : "Start a new chat with Sunao. You can return to it any time on this device."}</p>{!historySearch && <Button onClick={() => startNewChat(service)}>Start a conversation <ArrowRight size={16} /></Button>}</div>;
              })()}
            </div>
          ) : showingChat ? (
            <div className="chat-page">
              <header className="chat-page-heading">
                <div className="chat-heading-icon"><Sparkles size={21} /></div>
                <div><h1>{page === "sunao" ? "Talk with Sunao" : serviceTitle[service].headline}</h1><p>{page === "sunao" ? "I’m here to make ordering feel simple." : serviceTitle[service].description}</p></div>
                <div className="chat-heading-actions"><button className="chat-options" onClick={showHistory} aria-label="Open chat history"><BookOpen size={17} /></button><button className="chat-options" onClick={() => startNewChat(service)} aria-label="Start a new chat"><MessageSquarePlus size={17} /></button></div>
              </header>
              {!session.connected && (
                <section className="connect-prompt" aria-label="Connect Swiggy">
                  <div className="connect-prompt-icon"><MapPin size={20} /></div>
                  <div><strong>Connect Swiggy to see live options</strong><p>Your Swiggy account stays with Swiggy. Dehleez stores a secure session on this device.</p></div>
                  <Button onClick={connectSwiggy}>Connect Swiggy <ArrowRight size={16} /></Button>
                </section>
              )}
              <section className="conversation" role="log" aria-label="Conversation with Sunao" aria-live="polite" aria-relevant="additions">
                {!chat.length && (
                  <div className="chat-welcome">
                    <div className="sunao-large"><Sparkles size={24} /></div>
                    <h2>{page === "sunao" ? "Hello, I’m Sunao." : serviceTitle[service].headline}</h2>
                    <p>{page === "sunao" ? "Tell me what you’re in the mood for. You can type or speak." : serviceTitle[service].description}</p>
                    <div className="suggestion-chips">{(page === "sunao" ? prompts.map((prompt) => prompt.text) : servicePrompts[service]).map((prompt) => <button key={prompt} onClick={() => void sendMessage(prompt)}>{prompt}<ArrowRight size={14} /></button>)}</div>
                  </div>
                )}
                {chat.map((line, index) => <SunaoMessage key={`${service}-${index}`} message={line} onEditRequest={editFailedRequest} service={service} selectedAddressId={selectedAddressIds[service]} onSelectAddress={(id) => { setSelectedAddressIds((prior) => ({ ...prior, [service]: id })); void sendMessage("Continue with this selected address"); }} onChoose={(choice) => void sendMessage(choice)} />)}
                {busy && <div className="typing-row" role="status"><span className="typing-dots"><i /><i /><i /></span><span>Sunao is checking</span></div>}
                <div ref={messagesEnd} />
              </section>
              <div className="composer-wrap">
                {!chat.length && <p className="composer-hint">For example: “Find a vegetarian meal under ₹500.”</p>}
                <div className="composer">
                  <Textarea ref={composer} value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={composerKeyDown} placeholder="Ask Sunao anything…" aria-label="Message Sunao" rows={2} disabled={busy} />
                  <div className="composer-actions">
                    <span className="composer-note">{voiceAvailable ? "You can speak or type" : "A little at a time is fine"}</span>
                    <div className="composer-buttons">
                      {voiceAvailable && <Button variant="outline" size="icon-lg" className="voice-button" onClick={startVoiceInput} aria-label="Speak your request"><Mic size={19} /></Button>}
                      <Button className="send-button" onClick={() => void sendMessage(message)} disabled={!message.trim() || busy} aria-label="Send to Sunao"><ArrowRight size={20} /></Button>
                    </div>
                  </div>
                </div>
                <p className="safety-note">Sunao can make mistakes. Please review your choices before confirming.</p>
              </div>
            </div>
          ) : null}
        </div>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          <button className={page === "home" ? "active" : ""} aria-current={page === "home" ? "page" : undefined} onClick={() => goToService("home")}><Home size={19} /><span>Home</span></button>
          <button className={page === "sunao" ? "active" : ""} aria-current={page === "sunao" ? "page" : undefined} onClick={() => goToService("sunao")}><Sparkles size={19} /><span>Sunao</span></button>
          <button className={page === "history" ? "active" : ""} aria-current={page === "history" ? "page" : undefined} onClick={showHistory}><BookOpen size={19} /><span>History</span></button>
          <button className={showServices || page === "instamart" || page === "dineout" || page === "scenes" ? "active" : ""} ref={servicesTrigger} aria-haspopup="dialog" aria-expanded={showServices} onClick={() => setShowServices((value) => !value)} aria-controls="mobile-services-menu"><Utensils size={19} /><span>Services</span></button>
        </nav>
        {showServices && <><div className="mobile-menu-backdrop" aria-hidden="true" onClick={() => setShowServices(false)} /><div id="mobile-services-menu" ref={servicesMenu} className="mobile-service-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-services-title" tabIndex={-1}><div className="mobile-sheet-heading"><strong id="mobile-services-title">Choose a service</strong><button onClick={() => { setShowServices(false); servicesTrigger.current?.focus(); }} aria-label="Close services"><X size={19} /></button></div>{verticals.map(({ id, label, icon: Icon, color }) => <button key={id} onClick={() => goToService(id)}><span className={`mobile-menu-icon ${color}`}><Icon size={19} /></span><span>{label}</span>{page === id ? <Check size={16} /> : <ArrowRight size={16} />}</button>)}</div></>}
      </section>

      <aside className="right-rail" aria-label="Helpful information">
        <div className="right-rail-header">
          <span>Helpful tools</span>
          <button className="rail-toggle right-toggle" aria-label={rightSidebarCollapsed ? "Expand helpful tools" : "Collapse helpful tools"} aria-expanded={!rightSidebarCollapsed} aria-controls="right-rail-content" onClick={() => setRightSidebarCollapsed((value) => !value)} title={rightSidebarCollapsed ? "Expand helpful tools" : "Collapse helpful tools"}>
            {rightSidebarCollapsed ? <PanelRightOpen size={19} /> : <PanelRightClose size={19} />}
          </button>
        </div>
        <div className="right-rail-content" id="right-rail-content">
        <div className="rail-card sunao-rail-card">
          <h2>Order at your pace.</h2>
          <p>Browse clear options, compare details, and review each choice before you confirm.</p>
          <Button variant="outline" className="rail-action" onClick={() => goToService("sunao")}>Ask Sunao <ArrowRight size={16} /></Button>
        </div>
        <div className="rail-note">
          <div className="rail-note-icon"><Volume2 size={18} /></div>
          <div><strong>Made for your pace</strong><p>Speak, type, or take a moment to decide. You’re always in control.</p></div>
        </div>
        <div className="rail-connect">
          <div><span className={`connection-dot ${session.connected ? "online" : ""}`} /><strong>{session.connected ? "Swiggy is ready" : "Connect your Swiggy account"}</strong></div>
          <p>{session.connected ? "Your saved Swiggy services are available here." : "A secure Swiggy connection lets Sunao find live choices for you."}</p>
          <button onClick={session.connected ? disconnectSwiggy : connectSwiggy}>{session.connected ? "Disconnect" : "Connect Swiggy"}<ArrowRight size={15} /></button>
        </div>
        <div className="accessibility-panel">
          <div className="accessibility-heading"><Settings2 size={17} /><strong>Make it comfortable</strong></div>
          <button onClick={() => setLargeText((value) => !value)} aria-pressed={largeText}><span>Larger text</span><span className={`toggle-indicator ${largeText ? "selected" : ""}`}>{largeText ? <Check size={13} /> : <Plus size={13} />}</span></button>
          <button onClick={() => setHighContrast((value) => !value)} aria-pressed={highContrast}><span>More contrast</span><span className={`toggle-indicator ${highContrast ? "selected" : ""}`}>{highContrast ? <Check size={13} /> : <Plus size={13} />}</span></button>
          {voiceAvailable && <button onClick={startVoiceInput}><span>Speak a request</span><Mic size={17} /></button>}
          <p>Your preference applies on this device.</p>
        </div>
        </div>
        <div className="right-rail-compact" aria-label="Helpful tools">
          <button className="compact-rail-button" onClick={session.connected ? disconnectSwiggy : connectSwiggy} aria-label={session.connected ? "Disconnect Swiggy" : "Connect Swiggy"} title={session.connected ? "Disconnect Swiggy" : "Connect Swiggy"}><MapPin size={19} /></button>
          <button className="compact-rail-button" onClick={() => setLargeText((value) => !value)} aria-pressed={largeText} aria-label={largeText ? "Use standard text size" : "Enlarge text"} title="Text size"><span>A+</span></button>
          <button className="compact-rail-button" onClick={() => setHighContrast((value) => !value)} aria-pressed={highContrast} aria-label={highContrast ? "Use standard contrast" : "Increase contrast"} title="Contrast"><Settings2 size={19} /></button>
          {voiceAvailable && <button className="compact-rail-button" onClick={startVoiceInput} aria-label="Speak a request" title="Speak a request"><Mic size={19} /></button>}
        </div>
      </aside>
    </main>
  );
}

export default App;
