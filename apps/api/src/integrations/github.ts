import axios from "axios";
import { pool } from "../db";

const CONTRIBUTION_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
        totalCommitContributions
        totalPullRequestReviewContributions
        pullRequestContributions(first: 100) {
          nodes {
            pullRequest {
              mergedAt
              title
            }
          }
        }
      }
    }
  }
`;

interface ContributionDay {
  date: string;
  contributionCount: number;
}

export async function syncGitHub(userId: string, username: string, token: string, daysBack: number = 365): Promise<number> {
  const to = new Date();
  const from = new Date(Date.now() - daysBack * 86_400_000);

  const response = await axios.post(
    "https://api.github.com/graphql",
    {
      query: CONTRIBUTION_QUERY,
      variables: {
        username,
        from: from.toISOString(),
        to: to.toISOString(),
      },
    },
    {
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15_000,
    }
  );

  if (response.data.errors) {
    throw new Error(`GitHub GraphQL error: ${JSON.stringify(response.data.errors)}`);
  }

  const weeks = response.data.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  const days: ContributionDay[] = weeks.flatMap((w: { contributionDays: ContributionDay[] }) => w.contributionDays);

  const prs: { mergedAt: string | null }[] =
    response.data.data?.user?.contributionsCollection?.pullRequestContributions?.nodes?.map(
      (n: { pullRequest: { mergedAt: string | null } }) => n.pullRequest
    ) ?? [];

  let synced = 0;

  for (const day of days) {
    if (day.contributionCount === 0) continue;

    await pool.query(
      `INSERT INTO activities (user_id, platform, activity_type, activity_date, count, score, external_id)
       VALUES ($1, 'github', 'commit', $2, $3, $4, $5)
       ON CONFLICT (user_id, platform, activity_type, activity_date, external_id)
       DO UPDATE SET count = EXCLUDED.count, score = EXCLUDED.score`,
      [userId, day.date, day.contributionCount, Math.min(day.contributionCount * 1.5, 10), `gh_commit_${day.date}`]
    );
    synced++;
  }

  // Log merged PRs
  for (const pr of prs) {
    if (!pr.mergedAt) continue;
    const date = pr.mergedAt.slice(0, 10);
    await pool.query(
      `INSERT INTO activities (user_id, platform, activity_type, activity_date, count, score, external_id)
       VALUES ($1, 'github', 'pr_merged', $2, 1, 3, $3)
       ON CONFLICT (user_id, platform, activity_type, activity_date, external_id) DO NOTHING`,
      [userId, date, `gh_pr_${pr.mergedAt}`]
    );
  }

  return synced;
}
