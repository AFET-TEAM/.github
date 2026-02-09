#!/usr/bin/env node

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

// Configuration constants
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG_NAME = process.env.ORG_NAME || 'AFET-TEAM';
const LOCALE = process.env.LOCALE || 'tr-TR';
const MAX_PAGES_PER_REPO = 10; // Limit pages to avoid rate limits
const RATE_LIMIT_DELAY_MS = 1000; // Delay between API calls
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Get current year's start and end dates
const now = new Date();
const startOfYear = new Date(now.getFullYear(), 0, 1);
const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

// AI agents and bots to exclude from statistics
const EXCLUDED_USERS = [
  'copilot',
  'github-actions[bot]',
  'dependabot[bot]',
  'renovate[bot]',
  'greenkeeper[bot]',
  'snyk-bot'
];

function isExcludedUser(username) {
  const lowerUsername = username.toLowerCase();
  return EXCLUDED_USERS.some(excluded => lowerUsername.includes(excluded.toLowerCase()));
}

async function getOrganizationRepos() {
  try {
    const { data: repos } = await octokit.repos.listForOrg({
      org: ORG_NAME,
      type: 'all',
      per_page: 100
    });
    return repos;
  } catch (error) {
    console.error('Error fetching organization repos:', error.message);
    return [];
  }
}

async function getPRsForRepo(owner, repo) {
  try {
    const prs = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= MAX_PAGES_PER_REPO) {
      const { data } = await octokit.pulls.list({
        owner,
        repo,
        state: 'all',
        per_page: 100,
        page,
        sort: 'created',
        direction: 'desc'
      });
      
      if (data.length === 0) {
        hasMore = false;
      } else {
        // Filter PRs created in current year
        const yearlyPRs = data.filter(pr => {
          const createdAt = new Date(pr.created_at);
          return createdAt >= startOfYear && createdAt <= endOfYear;
        });
        
        prs.push(...yearlyPRs);
        
        // If oldest PR in this page is older than start of year, stop
        const oldestPR = data[data.length - 1];
        if (new Date(oldestPR.created_at) < startOfYear) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }
    
    return prs;
  } catch (error) {
    console.error(`Error fetching PRs for ${repo}:`, error.message);
    return [];
  }
}

async function getCommitsForRepo(owner, repo) {
  try {
    const commits = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= MAX_PAGES_PER_REPO) {
      const { data } = await octokit.repos.listCommits({
        owner,
        repo,
        since: startOfYear.toISOString(),
        until: endOfYear.toISOString(),
        per_page: 100,
        page
      });
      
      if (data.length === 0) {
        hasMore = false;
      } else {
        commits.push(...data);
        page++;
      }
    }
    
    return commits;
  } catch (error) {
    console.error(`Error fetching commits for ${repo}:`, error.message);
    return [];
  }
}

async function generateStatistics() {
  console.log(`Generating yearly statistics for ${ORG_NAME} - ${startOfYear.toISOString().split('T')[0]} to ${endOfYear.toISOString().split('T')[0]}`);
  
  const repos = await getOrganizationRepos();
  console.log(`Found ${repos.length} repositories`);
  
  const prStats = {};
  const commitStats = {};
  
  for (const repo of repos) {
    console.log(`Processing ${repo.name}...`);
    
    // Get PRs
    const prs = await getPRsForRepo(ORG_NAME, repo.name);
    console.log(`  Found ${prs.length} PRs`);
    
    prs.forEach(pr => {
      const author = pr.user.login;
      if (!isExcludedUser(author)) {
        prStats[author] = (prStats[author] || 0) + 1;
      }
    });
    
    // Get commits
    const commits = await getCommitsForRepo(ORG_NAME, repo.name);
    console.log(`  Found ${commits.length} commits`);
    
    commits.forEach(commit => {
      if (commit.author && commit.author.login) {
        const author = commit.author.login;
        if (!isExcludedUser(author)) {
          commitStats[author] = (commitStats[author] || 0) + 1;
        }
      }
    });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
  }
  
  // Sort and get top 10 for yearly stats
  const topPRContributors = Object.entries(prStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
    
  const topCommitContributors = Object.entries(commitStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  return {
    topPRContributors,
    topCommitContributors,
    year: startOfYear.getFullYear()
  };
}

async function updateReadme(stats) {
  const readmePath = path.join(__dirname, '../../profile/README.md');
  let readme = fs.readFileSync(readmePath, 'utf-8');
  
  // Create the yearly statistics section
  let statsSection = `\n## 📈 Yıllık İstatistikler (${stats.year})\n\n`;
  
  if (stats.topPRContributors.length > 0) {
    statsSection += `### 🏆 En Çok PR Gönderen Geliştiriciler\n\n`;
    statsSection += `| Sıra | Geliştirici | PR Sayısı |\n`;
    statsSection += `|------|-------------|----------|\n`;
    stats.topPRContributors.forEach(([dev, count], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      statsSection += `| ${medal} ${index + 1} | [@${dev}](https://github.com/${dev}) | ${count} |\n`;
    });
    statsSection += `\n`;
  }
  
  if (stats.topCommitContributors.length > 0) {
    statsSection += `### 💻 En Çok Geliştirme Yapan Geliştiriciler\n\n`;
    statsSection += `| Sıra | Geliştirici | Commit Sayısı |\n`;
    statsSection += `|------|-------------|---------------|\n`;
    stats.topCommitContributors.forEach(([dev, count], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      statsSection += `| ${medal} ${index + 1} | [@${dev}](https://github.com/${dev}) | ${count} |\n`;
    });
    statsSection += `\n`;
  }
  
  // Remove old yearly stats section if exists
  const statsStartMarker = '## 📈 Yıllık İstatistikler';
  const statsStartIndex = readme.indexOf(statsStartMarker);
  
  if (statsStartIndex !== -1) {
    // Find the next section (starts with ##)
    const nextSectionIndex = readme.indexOf('\n## ', statsStartIndex + 1);
    if (nextSectionIndex !== -1) {
      readme = readme.substring(0, statsStartIndex) + readme.substring(nextSectionIndex);
    } else {
      // Stats section is at the end
      readme = readme.substring(0, statsStartIndex);
    }
  }
  
  // Insert new yearly stats section after monthly stats or team members section
  const monthlySectionMarker = '## 📊 Aylık İstatistikler';
  const teamSectionMarker = '## 👥 Ekip Üyelerimiz';
  
  let insertIndex = readme.indexOf(monthlySectionMarker);
  
  if (insertIndex !== -1) {
    // Find the end of monthly section (next ## or end of file)
    const nextSectionIndex = readme.indexOf('\n## ', insertIndex + monthlySectionMarker.length);
    
    if (nextSectionIndex !== -1) {
      // Insert before next section
      readme = readme.substring(0, nextSectionIndex) + '\n' + statsSection + readme.substring(nextSectionIndex);
    } else {
      // Append at the end
      readme = readme.trimEnd() + '\n\n' + statsSection;
    }
  } else {
    // If no monthly section, insert after team section
    insertIndex = readme.indexOf(teamSectionMarker);
    
    if (insertIndex !== -1) {
      const nextSectionIndex = readme.indexOf('\n## ', insertIndex + teamSectionMarker.length);
      
      if (nextSectionIndex !== -1) {
        readme = readme.substring(0, nextSectionIndex) + '\n' + statsSection + readme.substring(nextSectionIndex);
      } else {
        readme = readme.trimEnd() + '\n\n' + statsSection;
      }
    } else {
      // Append at the end if no sections found
      readme = readme.trimEnd() + '\n\n' + statsSection;
    }
  }
  
  fs.writeFileSync(readmePath, readme);
  console.log('README updated successfully with yearly statistics!');
}

async function main() {
  try {
    const stats = await generateStatistics();
    console.log('\nTop PR Contributors (Yearly):', stats.topPRContributors);
    console.log('Top Commit Contributors (Yearly):', stats.topCommitContributors);
    
    await updateReadme(stats);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
