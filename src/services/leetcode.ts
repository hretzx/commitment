
const USERNAME = "hretz";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";
const CORS_PROXY = "https://proxy.cors.dev/";

export interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
}

interface LeetCodeResponse {
  data?: {
    recentAcSubmissionList?: LeetCodeSubmission[] | null;
  };
  errors?: { message: string }[];
}

export async function fetchLeetCodeSubmissions(
  username: string = USERNAME
): Promise<LeetCodeSubmission[]> {
  const query = `
    query recentSubmissions {
      recentAcSubmissionList(username: "${username}", limit: 20) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  const params = new URLSearchParams({ query });

  const url =
    CORS_PROXY +
    LEETCODE_GRAPHQL +
    "?" +
    params.toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `LeetCode request failed: HTTP ${response.status}`
    );
  }

  const result: LeetCodeResponse = await response.json();

  if (result.errors?.length) {
    throw new Error(result.errors[0].message);
  }

  if (!result.data?.recentAcSubmissionList) {
    throw new Error(
      "Could not find this LeetCode profile or its submissions."
    );
  }

  return result.data.recentAcSubmissionList;
}

export function getLeetCodeAcceptedDates(
  submissions: LeetCodeSubmission[]
): string[] {
  const dates = new Set<string>();

  for (const submission of submissions) {
    const date = new Date(Number(submission.timestamp) * 1000);

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
