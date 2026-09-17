export interface Month {
  month: string;
  income: number;
  essentials: number;
  obligations: number;
}
export interface Borrower {
  id: string;
  name: string;
  initials: string;
  occupation: string;
  location: string;
  color: string;
  story: string;
  principal: number;
  interest: number;
  reserve: number;
  history: Month[];
}
const patterns = [
  [
    16000, 18000, 19000, 31000, 24000, 19000, 17000, 18000, 38000, 26000, 23000,
    32000,
  ],
  [
    23000, 21000, 24000, 23000, 25000, 21000, 22000, 23000, 31000, 36000, 28000,
    30000,
  ],
  [
    27000, 29000, 25000, 31000, 28000, 26000, 30000, 27000, 31000, 28000, 26000,
    29000,
  ],
];
function history(profile: number): Month[] {
  return Array.from({ length: 24 }, (_, i) => {
    const date = new Date(Date.UTC(2024, 6 + i, 1));
    let income = Math.round(
      patterns[profile][date.getUTCMonth()] * (i < 12 ? 0.96 : 1.02),
    );
    if (profile === 2 && i >= 21)
      income = Math.round(income * (0.78 - (i - 21) * 0.09));
    return {
      month: date.toISOString().slice(0, 7),
      income,
      essentials: profile === 0 ? 10000 : profile === 1 ? 14500 : 16500,
      obligations: profile === 0 ? 1000 : profile === 1 ? 1500 : 1800,
    };
  });
}
export const borrowers: Borrower[] = [
  {
    id: "asha",
    name: "Asha Devi",
    initials: "AD",
    occupation: "Smallholder farmer",
    location: "Nashik, Maharashtra",
    color: "#d7ead6",
    story:
      "Two harvest cycles. A quiet monsoon. The ability to repay was always there — the calendar needed to catch up.",
    principal: 18000,
    interest: 0,
    reserve: 5000,
    history: history(0),
  },
  {
    id: "meera",
    name: "Meera Shah",
    initials: "MS",
    occupation: "Market shop owner",
    location: "Ahmedabad, Gujarat",
    color: "#f0dfc9",
    story:
      "Festival sales lift autumn income. Keep working capital intact while planning repayments around predictable demand.",
    principal: 24000,
    interest: 0,
    reserve: 5000,
    history: history(1),
  },
  {
    id: "ravi",
    name: "Ravi Kumar",
    initials: "RK",
    occupation: "Delivery partner",
    location: "Bengaluru, Karnataka",
    color: "#dce3f0",
    story:
      "Three months of lower earnings need a conversation. A seasonal explanation alone would miss the change.",
    principal: 18000,
    interest: 0,
    reserve: 5000,
    history: history(2),
  },
];
