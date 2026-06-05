import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  IndianRupee,
  Users,
  Award,
  Tag,
  X,
  Save,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { preferenceService } from "../services/api";
import type { Preference } from "../services/api";

export const Preferences: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [monthlyBudget, setMonthlyBudget] = useState<string>("");
  const [familySize, setFamilySize] = useState<number>(1);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [favoriteBrands, setFavoriteBrands] = useState<string[]>([]);
  const [newDiet, setNewDiet] = useState("");
  const [newBrand, setNewBrand] = useState("");

  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await preferenceService.get();
        if (response.success && response.preference) {
          const pref = response.preference;
          setMonthlyBudget(
            pref.monthlyBudget !== null ? String(pref.monthlyBudget) : ""
          );
          setFamilySize(pref.familySize);
          setDietaryPreferences(pref.dietaryPreferences);
          setFavoriteBrands(pref.favoriteBrands);
        }
      } catch (err: any) {
        console.error("Failed to load preferences:", err);
        setError(
          err.message || "Failed to load preferences. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleAddDiet = (e: React.FormEvent) => {
    e.preventDefault();
    const diet = newDiet.trim();
    if (!diet) return;
    if (!dietaryPreferences.includes(diet)) {
      setDietaryPreferences((prev) => [...prev, diet]);
    }
    setNewDiet("");
  };

  const handleRemoveDiet = (diet: string) => {
    setDietaryPreferences((prev) => prev.filter((d) => d !== diet));
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const brand = newBrand.trim();
    if (!brand) return;
    if (!favoriteBrands.includes(brand)) {
      setFavoriteBrands((prev) => [...prev, brand]);
    }
    setNewBrand("");
  };

  const handleRemoveBrand = (brand: string) => {
    setFavoriteBrands((prev) => prev.filter((b) => b !== brand));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const budget =
      monthlyBudget.trim() === "" ? null : parseFloat(monthlyBudget);
    if (budget !== null && (isNaN(budget) || budget < 0)) {
      setError("Please enter a valid, non-negative monthly budget.");
      setSaving(false);
      return;
    }

    try {
      const payload: Partial<Preference> = {
        monthlyBudget: budget,
        familySize,
        dietaryPreferences,
        favoriteBrands,
      };

      const response = await preferenceService.update(payload);
      if (response.success) {
        setSuccess(true);
        window.dispatchEvent(new Event("refresh-preferences"));
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Failed to save preferences:", err);
      setError(
        err.message ||
          "Failed to save preferences. Please check your connection."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen w-screen px-4 py-8 md:py-16"
      style={{ background: "#ece8f4" }}
    >
      <div className="mx-auto max-w-2xl">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <Sparkles className="h-4 w-4 animate-spin-slow" />
            <span>Profile synced</span>
          </div>
        </div>

        <div className="mb-8">
          <h1
            className="text-3xl font-black tracking-tight text-gray-800"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Preferences & Budget
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tailor PantryFrugalAI's recommendations to your dietary profile and
            savings targets.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center gap-4 shadow-sm border border-gray-100">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500" />
            <p className="text-sm text-gray-400 font-medium">
              Loading preferences...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alerts */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <span className="text-xs text-red-600 font-medium leading-relaxed">
                  {error}
                </span>
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-xs text-emerald-700 font-medium leading-relaxed">
                  Preferences updated successfully! Your budget is synced with
                  the assistant.
                </span>
              </div>
            )}

            {/* Panel 1: Financial & Household */}
            <div className="bg-white rounded-3xl p-6 space-y-6 shadow-sm border border-gray-100">
              <h2
                className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                <User className="h-5 w-5 text-emerald-500" /> Profile Metrics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Budget */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <IndianRupee className="h-4 w-4 text-emerald-500" />
                    Monthly Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 600.00"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="w-full glass-input px-4 py-3 text-sm"
                  />
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Assists in calculating weekly caps against suggested cart
                    items.
                  </p>
                </div>

                {/* Family Size */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-500" />
                    Family Size
                  </label>
                  <select
                    value={familySize}
                    onChange={(e) =>
                      setFamilySize(parseInt(e.target.value) || 1)
                    }
                    className="w-full glass-input px-4 py-3 text-sm appearance-none"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? "person" : "people"}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Helps the AI estimate volume quantities for meal plans.
                  </p>
                </div>
              </div>
            </div>

            {/* Panel 2: Dietary */}
            <div className="bg-white rounded-3xl p-6 space-y-4 shadow-sm border border-gray-100">
              <h2
                className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                <Award className="h-5 w-5 text-emerald-500" /> Dietary
                Preferences
              </h2>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Active Preferences
                </label>
                <div className="flex flex-wrap gap-2 min-h-10 p-3 rounded-2xl bg-gray-50 border border-gray-200">
                  {dietaryPreferences.length === 0 ? (
                    <span className="text-xs text-gray-400 italic my-auto">
                      No dietary preferences defined yet.
                    </span>
                  ) : (
                    dietaryPreferences.map((diet) => (
                      <span
                        key={diet}
                        className="inline-flex items-center gap-1.5 rounded-xl tag-badge-diet px-3 py-1.5 text-xs text-emerald-700 font-semibold transition-all"
                      >
                        {diet}
                        <button
                          type="button"
                          onClick={() => handleRemoveDiet(diet)}
                          className="rounded-full p-0.5 hover:bg-emerald-200 text-emerald-500 hover:text-emerald-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Vegetarian, Gluten-Free, Nut-Free"
                  value={newDiet}
                  onChange={(e) => setNewDiet(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddDiet(e);
                  }}
                  className="flex-1 glass-input px-4 py-2.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddDiet}
                  className="rounded-xl bg-gray-100 hover:bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-600 border border-gray-200 hover:border-emerald-200 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Panel 3: Brands */}
            <div className="bg-white rounded-3xl p-6 space-y-4 shadow-sm border border-gray-100">
              <h2
                className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                <Tag className="h-5 w-5 text-emerald-500" /> Preferred Brands
              </h2>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Favored Brands
                </label>
                <div className="flex flex-wrap gap-2 min-h-10 p-3 rounded-2xl bg-gray-50 border border-gray-200">
                  {favoriteBrands.length === 0 ? (
                    <span className="text-xs text-gray-400 italic my-auto">
                      No favorite brands listed yet.
                    </span>
                  ) : (
                    favoriteBrands.map((brand) => (
                      <span
                        key={brand}
                        className="inline-flex items-center gap-1.5 rounded-xl tag-badge-brand px-3 py-1.5 text-xs text-blue-700 font-semibold transition-all"
                      >
                        {brand}
                        <button
                          type="button"
                          onClick={() => handleRemoveBrand(brand)}
                          className="rounded-full p-0.5 hover:bg-blue-200 text-blue-500 hover:text-blue-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Kirkland, Organic Valley, Heinz"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddBrand(e);
                  }}
                  className="flex-1 glass-input px-4 py-2.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddBrand}
                  className="rounded-xl bg-gray-100 hover:bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-600 border border-gray-200 hover:border-blue-200 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-2xl bg-white border border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50 hover:shadow-md active:scale-[0.98]"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
