import { GitHubActivityItem, ActivityLog, TimesheetEntry, Project, Client } from '../types';

export class GitHubService {
  /**
   * Fetch recent GitHub activity (Pushes, Pull Requests, Commits) for a user or repo
   */
  static async fetchRecentActivity(
    username: string = 'Tsholi-Belle',
    repo: string = 'Tsholi-Belle/Chronotock',
    token?: string
  ): Promise<GitHubActivityItem[]> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ChronoTrack-Timesheet-App',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const items: GitHubActivityItem[] = [];

    // 1. Fetch Pull Requests from Repo
    try {
      const cleanRepo = repo.replace('https://github.com/', '').trim();
      if (cleanRepo.includes('/')) {
        const prRes = await fetch(`https://api.github.com/repos/${cleanRepo}/pulls?state=all&per_page=10`, { headers });
        if (prRes.ok) {
          const prs = await prRes.json();
          if (Array.isArray(prs)) {
            prs.forEach((pr: any) => {
              items.push({
                id: `gh-pr-${pr.id}`,
                type: 'pull_request',
                repo: cleanRepo,
                title: `PR #${pr.number}: ${pr.title}`,
                message: pr.body || pr.title,
                url: pr.html_url,
                timestamp: pr.created_at,
                author: pr.user?.login || username,
                branch: pr.head?.ref,
                prNumber: pr.number,
                status: pr.merged_at ? 'merged' : pr.state,
                estimatedDurationMinutes: 60,
              });
            });
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch GitHub PRs:', e);
    }

    // 2. Fetch Commits from Repo
    try {
      const cleanRepo = repo.replace('https://github.com/', '').trim();
      if (cleanRepo.includes('/')) {
        const commitRes = await fetch(`https://api.github.com/repos/${cleanRepo}/commits?per_page=15`, { headers });
        if (commitRes.ok) {
          const commits = await commitRes.json();
          if (Array.isArray(commits)) {
            commits.forEach((c: any) => {
              const commitMsg = c.commit?.message || 'Commit';
              const firstLine = commitMsg.split('\n')[0];
              items.push({
                id: `gh-commit-${c.sha}`,
                type: 'commit',
                repo: cleanRepo,
                title: `Commit ${c.sha.slice(0, 7)}: ${firstLine}`,
                message: commitMsg,
                url: c.html_url,
                timestamp: c.commit?.author?.date || new Date().toISOString(),
                author: c.author?.login || c.commit?.author?.name || username,
                status: 'pushed',
                estimatedDurationMinutes: 45,
              });
            });
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch GitHub Commits:', e);
    }

    // 3. Fetch User Events (Public Push Events & PRs)
    try {
      if (username) {
        const eventsRes = await fetch(`https://api.github.com/users/${username}/events?per_page=20`, { headers });
        if (eventsRes.ok) {
          const events = await eventsRes.json();
          if (Array.isArray(events)) {
            events.forEach((ev: any) => {
              if (ev.type === 'PushEvent') {
                const commits = ev.payload?.commits || [];
                const commitSummary = commits.map((c: any) => c.message.split('\n')[0]).join('; ');
                items.push({
                  id: `gh-push-${ev.id}`,
                  type: 'push',
                  repo: ev.repo?.name || repo,
                  title: `Git Push to ${ev.payload?.ref?.replace('refs/heads/', '') || 'main'} (${commits.length} commits)`,
                  message: commitSummary || `Pushed to ${ev.repo?.name}`,
                  url: `https://github.com/${ev.repo?.name}`,
                  timestamp: ev.created_at,
                  author: ev.actor?.login || username,
                  branch: ev.payload?.ref?.replace('refs/heads/', ''),
                  status: 'pushed',
                  estimatedDurationMinutes: 30,
                });
              } else if (ev.type === 'PullRequestEvent') {
                const pr = ev.payload?.pull_request;
                if (pr) {
                  items.push({
                    id: `gh-event-pr-${ev.id}`,
                    type: 'pull_request',
                    repo: ev.repo?.name || repo,
                    title: `PR #${pr.number} (${ev.payload?.action}): ${pr.title}`,
                    message: pr.title,
                    url: pr.html_url,
                    timestamp: ev.created_at,
                    author: ev.actor?.login || username,
                    branch: pr.head?.ref,
                    prNumber: pr.number,
                    status: pr.state,
                    estimatedDurationMinutes: 60,
                  });
                }
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch user events:', e);
    }

    // De-duplicate items by title and date
    const uniqueMap = new Map<string, GitHubActivityItem>();
    items.forEach((item) => {
      const key = `${item.repo}-${item.title}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    // If API returned items, return them sorted newest first
    if (uniqueMap.size > 0) {
      return Array.from(uniqueMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    // Fallback Mock Data from current project
    return this.getMockGitHubActivity(repo, username);
  }

  /**
   * Fallback mock activity for demo & rate-limit resilience
   */
  static getMockGitHubActivity(repo = 'Tsholi-Belle/Chronotock', username = 'Tsholi-Belle'): GitHubActivityItem[] {
    const now = new Date();
    const todayIso = now.toISOString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString();

    return [
      {
        id: 'gh-pr-101',
        type: 'pull_request',
        repo: repo,
        title: 'PR #3: Add Google Antigravity to tracked applications & rules',
        message: 'Integrated Google Antigravity (AGY) with custom process detection, simulator, and timesheet categorization.',
        url: `https://github.com/${repo}/pull/3`,
        timestamp: todayIso,
        author: username,
        branch: 'feature/antigravity-support',
        prNumber: 3,
        status: 'merged',
        estimatedDurationMinutes: 75,
      },
      {
        id: 'gh-commit-681f307',
        type: 'commit',
        repo: repo,
        title: 'Commit 681f307: Fix root route handling and static asset serving',
        message: 'Resolved address in use port conflict and added complete HTML status/dashboard response on root route.',
        url: `https://github.com/${repo}/commit/681f307`,
        timestamp: todayIso,
        author: username,
        branch: 'main',
        status: 'pushed',
        estimatedDurationMinutes: 45,
      },
      {
        id: 'gh-commit-02fbd73',
        type: 'commit',
        repo: repo,
        title: 'Commit 02fbd73: Enhance backend API and tracker daemon with standalone server',
        message: 'Zero-dependency native Node.js HTTP server supporting REST API and AppleScript window poller.',
        url: `https://github.com/${repo}/commit/02fbd73`,
        timestamp: todayIso,
        author: username,
        branch: 'main',
        status: 'pushed',
        estimatedDurationMinutes: 60,
      },
      {
        id: 'gh-push-main',
        type: 'push',
        repo: repo,
        title: 'Git Push to main (2 commits)',
        message: 'Pushed backend updates and active window tracking daemon.',
        url: `https://github.com/${repo}`,
        timestamp: todayIso,
        author: username,
        branch: 'main',
        status: 'pushed',
        estimatedDurationMinutes: 30,
      },
      {
        id: 'gh-pr-100',
        type: 'pull_request',
        repo: repo,
        title: 'PR #1: Initial ChronoTrack timesheet consolidation engine',
        message: 'Core timesheet app with 24-hour interactive visual timeline, rounding engine, and export options.',
        url: `https://github.com/${repo}/pull/1`,
        timestamp: yesterdayIso,
        author: username,
        branch: 'main',
        prNumber: 1,
        status: 'merged',
        estimatedDurationMinutes: 120,
      },
    ];
  }

  /**
   * Converts a GitHub activity item into a TimesheetEntry
   */
  static convertToTimesheetEntry(
    item: GitHubActivityItem,
    project: Project,
    client: Client,
    targetDate: string
  ): TimesheetEntry {
    const startDate = new Date(item.timestamp);
    const sh = String(startDate.getHours()).padStart(2, '0');
    const sm = String(startDate.getMinutes()).padStart(2, '0');

    const durationMins = item.estimatedDurationMinutes || 45;
    const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);
    const eh = String(endDate.getHours()).padStart(2, '0');
    const em = String(endDate.getMinutes()).padStart(2, '0');

    const hourlyRate = project.hourlyRate || client.hourlyRate || 85;
    const billableAmount = (durationMins / 60) * hourlyRate;

    let desc = item.title;
    if (item.type === 'pull_request') {
      desc = `[GitHub PR #${item.prNumber}] ${item.title.replace(/^PR #\d+:\s*/, '')} (${item.repo})`;
    } else if (item.type === 'commit') {
      desc = `[GitHub Commit] ${item.title.replace(/^Commit [a-f0-9]+:\s*/, '')} (${item.repo})`;
    } else if (item.type === 'push') {
      desc = `[GitHub Push] ${item.message} (${item.repo})`;
    }

    return {
      id: `ts-${item.id}`,
      date: targetDate,
      startTime: `${sh}:${sm}`,
      endTime: `${eh}:${em}`,
      durationMinutes: durationMins,
      roundedMinutes: durationMins,
      projectId: project.id,
      projectName: project.name,
      clientId: client.id,
      clientName: client.name,
      appIds: ['app-github', 'app-vscode'],
      appNames: ['GitHub', 'VS Code'],
      category: 'development',
      description: desc,
      details: [
        `Repository: ${item.repo}`,
        `Branch: ${item.branch || 'main'}`,
        `Author: ${item.author}`,
        `URL: ${item.url}`,
        `Message: ${item.message}`,
      ],
      isBillable: project.isBillableDefault,
      hourlyRate,
      billableAmount: Math.round(billableAmount * 100) / 100,
      status: 'draft',
      rawLogIds: [],
      isManual: false,
      color: '#24292e',
    };
  }
}
