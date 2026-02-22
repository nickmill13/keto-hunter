export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

export const cuisineOptions = [
  'American', 'Mediterranean', 'Greek', 'Mexican', 'Italian',
  'Chinese', 'Japanese', 'Thai', 'Indian', 'Vietnamese', 'Korean',
  'Steakhouse', 'Seafood', 'BBQ', 'Brazilian', 'Middle Eastern',
  'Bar & Grill', 'Fast Food', 'Burgers', 'Sandwiches'
];

export const dietaryOptions = [
  'Gluten-free', 'Dairy-free', 'Nut-free', 'Carnivore', 'Paleo'
];

export const ketoScoreOptions = [
  { label: 'Any', value: 0 },
  { label: '40%+', value: 0.4 },
  { label: '60%+', value: 0.6 },
  { label: '80%+', value: 0.8 }
];

export const DEMO_RESTAURANTS = [
  {
    id: 1,
    name: "The Protein Kitchen",
    cuisine: "American",
    distance: "0.3",
    rating: 4.8,
    ketoScore: 0.9,
    priceLevel: 2,
    ketoOptions: ["Grilled Salmon", "Bunless Burgers", "Cauliflower Rice Bowls"],
    address: "123 Main St",
    diningOptions: ["Dine-in", "Takeout", "Delivery"],
    ketoReviews: 45
  },
  {
    id: 2,
    name: "Green Leaf Bistro",
    cuisine: "Mediterranean",
    distance: "0.5",
    rating: 4.6,
    ketoScore: 0.85,
    priceLevel: 3,
    ketoOptions: ["Greek Salad (no pita)", "Grilled Chicken", "Lamb Kebabs"],
    address: "456 Oak Ave",
    diningOptions: ["Dine-in", "Outdoor Seating"],
    ketoReviews: 32
  },
  {
    id: 3,
    name: "Steakhouse Prime",
    cuisine: "Steakhouse",
    distance: "0.7",
    rating: 4.9,
    ketoScore: 0.95,
    priceLevel: 4,
    ketoOptions: ["Ribeye Steak", "Caesar Salad", "Grilled Vegetables"],
    address: "789 Elm Street",
    diningOptions: ["Dine-in"],
    ketoReviews: 78
  },
  {
    id: 4,
    name: "Ocean's Catch",
    cuisine: "Seafood",
    distance: "1.1",
    rating: 4.7,
    ketoScore: 0.88,
    priceLevel: 3,
    ketoOptions: ["Grilled Fish", "Shrimp Cocktail", "Lobster Tail"],
    address: "321 Beach Blvd",
    diningOptions: ["Dine-in", "Takeout"],
    ketoReviews: 56
  },
  {
    id: 5,
    name: "Taco Express",
    cuisine: "Mexican",
    distance: "1.5",
    rating: 4.4,
    ketoScore: 0.75,
    priceLevel: 1,
    ketoOptions: ["Burrito Bowl", "Carnitas Salad", "Guacamole"],
    address: "555 Sunset Blvd",
    diningOptions: ["Dine-in", "Takeout", "Drive-through"],
    ketoReviews: 23
  },
  {
    id: 6,
    name: "Curry House",
    cuisine: "Indian",
    distance: "2.3",
    rating: 4.5,
    ketoScore: 0.7,
    priceLevel: 2,
    ketoOptions: ["Tandoori Chicken", "Paneer Tikka", "Saag"],
    address: "888 Market St",
    diningOptions: ["Dine-in", "Delivery", "Takeout"],
    ketoReviews: 18
  }
];
