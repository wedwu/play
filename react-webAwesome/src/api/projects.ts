import type { Project } from "@/types";
import { MOCK_PROJECTS } from "@/const";

export const fetchProjects = ({ failRate = 0 }: { failRate?: number } = {}): Promise<Project[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failRate) {
        reject(new Error("Failed to load projects (simulated network error)"));
        return;
      }
      resolve(MOCK_PROJECTS.map((p) => ({ ...p })));
    }, 800);
  });
};
