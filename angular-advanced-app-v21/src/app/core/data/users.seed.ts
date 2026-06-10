import { Department, UserRole } from "../models/user.model";

interface SeedUser {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department: Department;
  skills: string[];
  superAdmin?: boolean;
}

export const USERS: Record<string, SeedUser> = {
  alice: {
    firstName: "Alice",
    lastName: "Zhang",
    email: "alice@acme.com",
    role: "admin",
    department: "ops",
    skills: ["TypeScript", "Angular", "Leadership"],
    superAdmin: true,
  },
  bob: {
    firstName: "Bob",
    lastName: "Martin",
    email: "bob@acme.com",
    role: "manager",
    department: "engineering",
    skills: ["Node.js", "PostgreSQL"],
  },
  carol: {
    firstName: "Carol",
    lastName: "White",
    email: "carol@acme.com",
    role: "developer",
    department: "engineering",
    skills: ["React", "CSS"],
  },
  dave: {
    firstName: "Dave",
    lastName: "Kim",
    email: "dave@acme.com",
    role: "developer",
    department: "design",
    skills: ["Figma", "CSS"],
  },
  eva: {
    firstName: "Eva",
    lastName: "Patel",
    email: "eva@acme.com",
    role: "developer",
    department: "product",
    skills: ["Python", "Analytics"],
  },
};
