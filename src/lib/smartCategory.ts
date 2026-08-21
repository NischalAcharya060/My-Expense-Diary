import type { Category } from "@/types";

// Keyword → category mapping for auto-categorization, ordered so that more
// specific brand/product names are checked before generic words.
const KEYWORD_CATEGORIES: ReadonlyArray<readonly [string, string]> = [
  // Subscriptions (brands first — most distinctive)
  ["netflix", "Subscription"], ["spotify", "Subscription"], ["youtube premium", "Subscription"],
  ["prime video", "Subscription"], ["amazon prime", "Subscription"], ["hotstar", "Subscription"],
  ["disney+", "Subscription"], ["hulu", "Subscription"], ["icloud", "Subscription"],
  ["google one", "Subscription"], ["google drive", "Subscription"], ["dropbox", "Subscription"],
  ["chatgpt", "Subscription"], ["openai", "Subscription"], ["claude", "Subscription"],
  ["adobe", "Subscription"], ["microsoft 365", "Subscription"], ["office 365", "Subscription"],
  ["canva", "Subscription"], ["notion", "Subscription"], ["github", "Subscription"],
  ["linkedin premium", "Subscription"], ["subscription", "Subscription"], ["membership", "Subscription"],

  // Transport
  ["uber", "Transport"], ["ola", "Transport"], ["lyft", "Transport"], ["bolt", "Transport"],
  ["taxi", "Transport"], ["cab", "Transport"], ["bus", "Transport"], ["metro", "Transport"],
  ["subway pass", "Transport"], ["train", "Transport"], ["tram", "Transport"],
  ["petrol", "Transport"], ["diesel", "Transport"], ["fuel", "Transport"], ["gas station", "Transport"],
  ["parking", "Transport"], ["toll", "Transport"], ["fastag", "Transport"], ["rickshaw", "Transport"],
  ["flight", "Transport"], ["airline", "Transport"], ["irctc", "Transport"], ["car wash", "Transport"],
  ["tire", "Transport"], ["tyre", "Transport"], ["bike service", "Transport"], ["car service", "Transport"],

  // Shopping
  ["amazon", "Shopping"], ["flipkart", "Shopping"], ["myntra", "Shopping"], ["ajio", "Shopping"],
  ["ebay", "Shopping"], ["aliexpress", "Shopping"], ["shein", "Shopping"], ["etsy", "Shopping"],
  ["zara", "Shopping"], ["h&m", "Shopping"], ["nike", "Shopping"], ["adidas", "Shopping"],
  ["puma", "Shopping"], ["clothes", "Shopping"], ["clothing", "Shopping"], ["shoes", "Shopping"],
  ["sneakers", "Shopping"], ["shirt", "Shopping"], ["jeans", "Shopping"], ["t-shirt", "Shopping"],
  ["mall", "Shopping"], ["shopping", "Shopping"], ["gift", "Shopping"], ["jewelry", "Shopping"],
  ["watch", "Shopping"], ["headphones", "Shopping"], ["phone case", "Shopping"], ["gadget", "Shopping"],

  // Food
  ["swiggy", "Food"], ["zomato", "Food"], ["doordash", "Food"], ["ubereats", "Food"],
  ["grubhub", "Food"], ["deliveroo", "Food"], ["dominos", "Food"], ["pizza hut", "Food"],
  ["mcdonald", "Food"], ["kfc", "Food"], ["burger king", "Food"], ["starbucks", "Food"],
  ["subway sandwich", "Food"], ["restaurant", "Food"], ["cafe", "Food"], ["coffee", "Food"],
  ["latte", "Food"], ["cappuccino", "Food"], ["tea", "Food"], ["lunch", "Food"], ["dinner", "Food"],
  ["breakfast", "Food"], ["brunch", "Food"], ["snack", "Food"], ["pizza", "Food"], ["burger", "Food"],
  ["sandwich", "Food"], ["bakery", "Food"], ["dessert", "Food"], ["ice cream", "Food"],
  ["biryani", "Food"], ["sushi", "Food"], ["noodles", "Food"], ["pasta", "Food"], ["juice", "Food"],
  ["smoothie", "Food"], ["takeout", "Food"], ["takeaway", "Food"], ["dine out", "Food"],
  ["food", "Food"], ["meal", "Food"], ["eat", "Food"],

  // Groceries
  ["grocery", "Groceries"], ["groceries", "Groceries"], ["supermarket", "Groceries"],
  ["walmart", "Groceries"], ["target run", "Groceries"], ["costco", "Groceries"],
  ["kirana", "Groceries"], ["dmart", "Groceries"], ["aldi", "Groceries"], ["lidl", "Groceries"],
  ["trader joe", "Groceries"], ["whole foods", "Groceries"], ["milk", "Groceries"], ["bread", "Groceries"],
  ["eggs", "Groceries"], ["rice", "Groceries"], ["flour", "Groceries"], ["cheese", "Groceries"],
  ["butter", "Groceries"], ["vegetables", "Groceries"], ["veggies", "Groceries"],
  ["vegetable", "Groceries"], ["fruits", "Groceries"], ["fruit", "Groceries"], ["chicken", "Groceries"],
  ["meat", "Groceries"], ["fish", "Groceries"], ["cereal", "Groceries"], ["oil", "Groceries"],
  ["sugar", "Groceries"], ["salt", "Groceries"], ["snacks grocery", "Groceries"],

  // Medicine
  ["pharmacy", "Medicine"], ["chemist", "Medicine"], ["medicine", "Medicine"], ["medical", "Medicine"],
  ["doctor", "Medicine"], ["clinic", "Medicine"], ["hospital", "Medicine"], ["dentist", "Medicine"],
  ["tablets", "Medicine"], ["pills", "Medicine"], ["prescription", "Medicine"],
  ["vitamins", "Medicine"], ["supplements", "Medicine"], ["therapy", "Medicine"], ["lab test", "Medicine"],

  // Education
  ["tuition", "Education"], ["course", "Education"], ["udemy", "Education"], ["coursera", "Education"],
  ["textbook", "Education"], ["book", "Education"], ["books", "Education"], ["kindle", "Education"],
  ["school fee", "Education"], ["college fee", "Education"], ["exam fee", "Education"],
  ["stationery", "Education"], ["notebook", "Education"], ["pen", "Education"], ["class", "Education"],

  // Entertainment
  ["cinema", "Entertainment"], ["movie", "Entertainment"], ["theater", "Entertainment"],
  ["concert", "Entertainment"], ["steam", "Entertainment"], ["playstation", "Entertainment"],
  ["xbox", "Entertainment"], ["nintendo", "Entertainment"], ["game", "Entertainment"],
  ["games", "Entertainment"], ["bowling", "Entertainment"], ["theme park", "Entertainment"],
  ["amusement park", "Entertainment"], ["zoo", "Entertainment"], ["museum", "Entertainment"],

  // Bills
  ["electricity", "Bills"], ["water bill", "Bills"], ["internet", "Bills"], ["broadband", "Bills"],
  ["wifi", "Bills"], ["mobile recharge", "Bills"], ["phone bill", "Bills"], ["airtime", "Bills"],
  ["cable", "Bills"], ["utility", "Bills"], ["utilities", "Bills"], ["rent", "Bills"],
  ["mortgage", "Bills"], ["insurance", "Bills"], ["emi", "Bills"], ["gas bill", "Bills"],
  ["property tax", "Bills"], ["council tax", "Bills"],

  // Household
  ["detergent", "Household"], ["cleaning", "Household"], ["maid", "Household"], ["plumber", "Household"],
  ["electrician", "Household"], ["repair", "Household"], ["maintenance", "Household"],
  ["furniture", "Household"], ["ikea", "Household"], ["hardware", "Household"],
  ["utensils", "Household"], ["kitchen", "Household"], ["curtain", "Household"],
  ["mattress", "Household"], ["pillow", "Household"], ["bedsheet", "Household"], ["broom", "Household"],

  // Personal
  ["haircut", "Personal"], ["salon", "Personal"], ["barber", "Personal"], ["spa", "Personal"],
  ["massage", "Personal"], ["gym", "Personal"], ["fitness", "Personal"], ["yoga", "Personal"],
  ["cosmetics", "Personal"], ["makeup", "Personal"], ["skincare", "Personal"], ["shampoo", "Personal"],
  ["perfume", "Personal"], ["soap", "Personal"], ["toothpaste", "Personal"], ["laundry", "Personal"],
  ["nail", "Personal"], ["skincare routine", "Personal"],
];

/**
 * Suggest a category for an expense name using keyword matching with word
 * boundaries. The earliest keyword occurrence wins; on ties at the same
 * position the longer (more specific) keyword wins.
 */
export function suggestCategory(name: string): Category | null {
  const text = name.toLowerCase();
  if (!text.trim()) return null;

  let best: { index: number; length: number; category: string } | null = null;
  for (const [keyword, category] of KEYWORD_CATEGORIES) {
    const idx = text.indexOf(keyword);
    if (idx === -1) continue;

    const beforeOk = idx === 0 || /\W/.test(text[idx - 1]);
    const afterIdx = idx + keyword.length;
    const afterOk = afterIdx === text.length || /\W/.test(text[afterIdx]);
    if (!beforeOk || !afterOk) continue;

    if (!best || idx < best.index || (idx === best.index && keyword.length > best.length)) {
      best = { index: idx, length: keyword.length, category };
    }
  }
  return best ? best.category : null;
}

/**
 * Like suggestCategory but validates the suggestion exists in the given
 * category list, so we never auto-select a hidden/renamed/deleted category.
 */
export function suggestCategoryFrom(
  name: string,
  availableCategories: readonly string[]
): Category | null {
  const suggestion = suggestCategory(name);
  if (!suggestion) return null;
  return availableCategories.includes(suggestion) ? suggestion : null;
}
