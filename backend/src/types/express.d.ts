declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: "candidate" | "recruiter" | "admin" };
    }
  }
}

export {};
