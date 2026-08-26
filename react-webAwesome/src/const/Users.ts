import type { User } from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: 1,
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "Admin",
    status: "active",
    joined: "2023-01-12",
  },
  {
    id: 2,
    name: "Alan Turing",
    email: "alan@example.com",
    role: "Engineer",
    status: "active",
    joined: "2023-03-04",
  },
  {
    id: 3,
    name: "Grace Hopper",
    email: "grace@example.com",
    role: "Engineer",
    status: "invited",
    joined: "2024-06-21",
  },
  {
    id: 4,
    name: "Katherine Johnson",
    email: "katherine@example.com",
    role: "Analyst",
    status: "active",
    joined: "2022-11-30",
  },
  {
    id: 5,
    name: "Linus Torvalds",
    email: "linus@example.com",
    role: "Maintainer",
    status: "suspended",
    joined: "2021-08-15",
  },
  {
    id: 6,
    name: "Margaret Hamilton",
    email: "margaret@example.com",
    role: "Lead",
    status: "active",
    joined: "2023-09-09",
  },
];
