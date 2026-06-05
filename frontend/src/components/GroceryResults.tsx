import React, { useEffect, useState } from "react";
import { ShoppingCart, CheckSquare, Square, CreditCard, Store, HelpCircle, Plus, Trash2 } from "lucide-react";
import type { Message, Preference } from "../services/api";

interface GroceryResultsProps {
  messages: Message[];
  preference: Preference | null;
  conversationId?: string;
}

interface ParsedProduct {
  id: string;
  name: string;
  price: number;
  store: string;
  image?: string;
  unit?: string;
  checked: boolean;
}

export const GroceryResults: React.FC<GroceryResultsProps> = ({
  messages,
  preference,
  conversationId,
}) => {
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemStore, setNewItemStore] = useState("");

  // Parse products from tool calls inside assistant messages
  useEffect(() => {
    const seen = new Set<string>();
    const extracted: ParsedProduct[] = [];

    // Local storage key for preserving checked state in this conversation
    const checkedStateKey = `checked_products_${conversationId || "temp"}`;
    const savedCheckedIds = JSON.parse(localStorage.getItem(checkedStateKey) || "[]") as string[];

    messages.forEach((msg) => {
      if (msg.role !== "assistant" || !msg.toolCalls) return;

      msg.toolCalls.forEach((toolExec: any) => {
        const result = toolExec.result;
        if (!result) return;

        // Recursive helper to traverse JSON and locate arrays of product items
        const searchForProducts = (obj: any) => {
          if (!obj || typeof obj !== "object") return;

          if (Array.isArray(obj)) {
            obj.forEach((item) => {
              if (item && typeof item === "object") {
                const name = item.name || item.title || item.product || item.productName || item.itemName;
                const priceRaw = item.price || item.cost || item.amount || item.salePrice;

                if (name && typeof name === "string") {
                  const price = typeof priceRaw === "number"
                    ? priceRaw
                    : parseFloat(String(priceRaw || "").replace(/[^0-9.]/g, ""));

                  const store = item.store || item.shop || item.retailer || toolExec.arguments?.store || "QuickCommerce";
                  const image = item.image || item.imageUrl || item.thumbnail || item.image_url;
                  const unit = item.unit || item.size || item.weight || item.packSize || item.pack_size;

                  const key = `${name}-${price}-${store}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    extracted.push({
                      id: key,
                      name,
                      price: isNaN(price) ? 0 : price,
                      store: String(store),
                      image: typeof image === "string" ? image : undefined,
                      unit: typeof unit === "string" ? unit : undefined,
                      checked: savedCheckedIds.includes(key) || savedCheckedIds.length === 0, // checked by default on new parse
                    });
                  }
                }
              }
            });
          } else {
            Object.values(obj).forEach((val) => searchForProducts(val));
          }
        };

        searchForProducts(result);
      });
    });

    setProducts(extracted);
  }, [messages, conversationId]);

  // Persist checked states to LocalStorage
  const handleToggleCheck = (id: string) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, checked: !p.checked };
      }
      return p;
    });
    setProducts(updated);

    const checkedStateKey = `checked_products_${conversationId || "temp"}`;
    const checkedIds = updated.filter((p) => p.checked).map((p) => p.id);
    localStorage.setItem(checkedStateKey, JSON.stringify(checkedIds));
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const price = parseFloat(newItemPrice) || 0;
    const store = newItemStore.trim() || "Manual Add";

    const key = `custom-${Date.now()}`;
    const newItem: ParsedProduct = {
      id: key,
      name: newItemName.trim(),
      price,
      store,
      checked: true,
    };

    setProducts((prev) => [...prev, newItem]);
    
    // Reset inputs
    setNewItemName("");
    setNewItemPrice("");
    setNewItemStore("");
  };

  const handleRemoveItem = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Math aggregates
  const checkedProducts = products.filter((p) => p.checked);
  const totalCost = checkedProducts.reduce((sum, p) => sum + p.price, 0);

  // Budget calculations
  const monthlyBudget = preference?.monthlyBudget || 0;
  const weeklyBudget = monthlyBudget > 0 ? monthlyBudget / 4.33 : 0;
  const budgetUtilization = weeklyBudget > 0 ? (totalCost / weeklyBudget) * 100 : 0;

  // Group items by store to display split orders breakdown
  const storeBreakdown = checkedProducts.reduce((acc, p) => {
    acc[p.store] = (acc[p.store] || 0) + p.price;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex h-full flex-col bg-slate-950/70 border-l border-emerald-500/10 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-200 font-outfit">Grocery Summary</h2>
          <p className="text-xs text-gray-500">Live prices parsed from chat history</p>
        </div>
      </div>

      {/* Budget Tracker Indicator */}
      <div className="rounded-2xl border border-emerald-500/10 bg-emerald-950/5 p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-gray-300">Frugal Budget Tracker</span>
          </div>
          <span className="text-xs font-bold text-emerald-400 font-outfit">
            {monthlyBudget > 0 ? `$${totalCost.toFixed(2)} / $${weeklyBudget.toFixed(2)} wk` : "No budget set"}
          </span>
        </div>

        {monthlyBudget > 0 ? (
          <div className="space-y-2">
            {/* Progress Gauge */}
            <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUtilization > 100
                    ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                    : budgetUtilization > 85
                    ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                    : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>Weekly Cap: ${weeklyBudget.toFixed(2)}</span>
              <span>{budgetUtilization.toFixed(0)}% consumed</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 leading-relaxed italic">
            Define your monthly budget in the Profile settings to track weekly savings health automatically.
          </p>
        )}
      </div>

      {/* Product list checklist */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Shopping Checklist</h3>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-gray-500">
            <HelpCircle className="mx-auto h-8 w-8 text-slate-700 mb-2" />
            <p className="text-xs font-medium">No ingredients selected</p>
            <p className="text-[10px] text-gray-600 mt-1 max-w-xs mx-auto">
              Suggested products will automatically populate here as the assistant calls live lookup services.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleToggleCheck(product.id)}
                className={`group flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-3 border transition-all ${
                  product.checked
                    ? "bg-slate-900/40 border-emerald-500/10 text-gray-200"
                    : "bg-slate-950/20 border-transparent text-gray-500 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button className="shrink-0 text-emerald-400 transition-colors">
                    {product.checked ? (
                      <CheckSquare className="h-4.5 w-4.5" />
                    ) : (
                      <Square className="h-4.5 w-4.5 text-gray-600" />
                    )}
                  </button>
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-8 w-8 rounded-lg object-cover bg-slate-900 border border-slate-800"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-semibold ${product.checked ? "text-gray-200" : "line-through text-gray-600"}`}>
                      {product.name}
                    </p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Store className="h-3 w-3 text-gray-600" />
                      <span className="truncate">{product.store}</span>
                      {product.unit && <span>• {product.unit}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300 font-mono">
                    ${product.price.toFixed(2)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(product.id);
                    }}
                    className="rounded p-1 text-gray-600 hover:bg-slate-800 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Item Add Form */}
      <form onSubmit={handleAddCustomItem} className="rounded-2xl border border-slate-900 bg-slate-900/10 p-4 space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
          <Plus className="h-3 w-3" /> Add Custom Item
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            required
            placeholder="Item name (e.g. Apple)"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="col-span-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/40"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price ($)"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
            className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/40"
          />
          <input
            type="text"
            placeholder="Store"
            value={newItemStore}
            onChange={(e) => setNewItemStore(e.target.value)}
            className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/40"
          />
        </div>
        <button
          type="submit"
          disabled={!newItemName.trim()}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-emerald-400 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          Add to Cart
        </button>
      </form>

      {/* Split stores checkout summary */}
      {checkedProducts.length > 0 && (
        <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Checkout Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(storeBreakdown).map(([store, sum]) => (
              <div key={store} className="flex items-center justify-between text-xs">
                <span className="text-gray-400 truncate max-w-[140px] flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                  {store}
                </span>
                <span className="font-semibold text-gray-300 font-mono">${sum.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-sm">
              <span className="font-bold text-gray-300 font-outfit">Total Estimate</span>
              <span className="font-black text-emerald-400 font-mono">${totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
