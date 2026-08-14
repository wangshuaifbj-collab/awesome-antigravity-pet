import { readFileSync } from "node:fs";
import { join } from "node:path";

export type RequestStatus =
  | "triage"
  | "open"
  | "in-progress"
  | "review"
  | "completed"
  | "declined";

export type RequestAuthor = {
  login: string;
  avatarUrl: string;
  url: string;
};

export type PetRequest = {
  number: number;
  character: string;
  characterDetails: string;
  franchise: string;
  category: string;
  version: string;
  requestType: string;
  referenceStatus: string;
  references: string;
  referenceUrls: string[];
  referenceImages: string[];
  referenceThumbnails?: string[];
  visualDirection: string;
  nameLanguages: string;
  attribution: string;
  duplicateCheck: string;
  state: "open" | "closed";
  status: RequestStatus;
  labels: string[];
  author: RequestAuthor;
  assignees: RequestAuthor[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  comments: number;
  reactions: number;
  githubUrl: string;
  completedPet?: {
    slug: string;
    name: string;
    localizedNames: { en?: string; zh?: string };
    previewImage: string;
  };
};

function readGeneratedRequests(): PetRequest[] {
  const path = join(process.cwd(), ".generated", "requests.generated.json");
  return JSON.parse(readFileSync(path, "utf8")) as PetRequest[];
}

export function getAllRequests() {
  return readGeneratedRequests();
}

export function getRequestByNumber(number: number) {
  return getAllRequests().find((request) => request.number === number) ?? null;
}

export function getRequestCategories(requests: PetRequest[]) {
  return [...new Set(requests.map((request) => request.category))].sort();
}

export function getOpenRequests(requests = getAllRequests()) {
  return requests.filter(
    (request) =>
      request.state === "open" &&
      request.status !== "completed" &&
      request.status !== "declined",
  );
}
