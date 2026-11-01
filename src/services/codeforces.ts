
const API_URL = "https://codeforces.com/api";

export interface CodeforcesSubmission {
  id: number;
  creationTimeSeconds: number;
  verdict: string;
  problem: {
    contestId?: number;
    index: string;
    name: string;
  };
}

export async function fetchCodeforcesSubmissions(
  handle: string
): Promise<CodeforcesSubmission[]> {
  const response = await fetch(
    `${API_URL}/user.status?handle=${encodeURIComponent(handle)}`
  );

  if (!response.ok) {
    throw new Error("Could not connect to Codeforces.");
  }

  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(data.comment || "Codeforces API returned an error.");
  }

  return data.result as CodeforcesSubmission[];
}

export function getCodeforcesAcceptedDates(
  submissions: CodeforcesSubmission[]
): string[] {
  const dates = new Set<string>();

  for (const submission of submissions) {
    if (submission.verdict !== "OK") continue;

    const date = new Date(
      submission.creationTimeSeconds * 1000
    );

    const localDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

    dates.add(localDate);
  }

  return [...dates].sort().reverse();
}
