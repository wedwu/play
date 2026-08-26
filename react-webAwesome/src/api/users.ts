import type { User } from "@/types";
import { MOCK_USERS } from "@/const";

export const fetchUsers = ({ failRate = 0 }: { failRate?: number } = {}): Promise<User[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failRate) {
        reject(new Error("Failed to load users (simulated network error)"));
        return;
      }
      resolve(MOCK_USERS.map((u) => ({ ...u })));
    }, 800);
  });
};

export const fetchUserById = (
  id: number,
  { failRate = 0 }: { failRate?: number } = {}
): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failRate) {
        reject(new Error("Failed to load user (simulated network error)"));
        return;
      }
      const user = MOCK_USERS.find((u) => u.id === id);
      if (user) {
        resolve({ ...user });
      } else {
        reject(new Error("User not found"));
      }
    }, 500);
  });
};
