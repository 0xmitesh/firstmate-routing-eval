export type Product = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  stock: number;
  active: boolean;
};

export type User = {
  id: string;
  role: "viewer" | "editor" | "admin";
};
