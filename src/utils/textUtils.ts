const hungryTexts = [
  "Time to satisfy those cravings! 🍽️",
  "Your taste buds will thank you! 😋",
  "Great choice! Let's get you fed! 🍴",
  "Hungry? Not for long! 🌟",
  "Delicious food coming your way! 🎉",
  "Get ready for a tasty meal! 👨‍🍳",
  "Your stomach will be happy! 🥘",
  "Food makes everything better! 🍱",
  "Time for some yummy goodness! 🥗",
  "Making hunger history! 🍜"
];

export const getRandomHungryText = (): string => {
  const randomIndex = Math.floor(Math.random() * hungryTexts.length);
  return hungryTexts[randomIndex];
}; 