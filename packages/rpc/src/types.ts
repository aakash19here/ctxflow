export type UserData = {
  email: string;
  state: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
};
