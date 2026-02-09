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

// Get current month's start and end dates
const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// Get current year's start and end dates
const startOfYear = new Date(now.getFullYear(), 0, 1);
const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

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

async function getPRsForRepo(owner, repo, startDate, endDate) {
  try {
    const prs = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
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
        // Filter PRs created in the specified date range
        const filteredPRs = data.filter(pr => {
          const createdAt = new Date(pr.created_at);
          return createdAt >= startDate && createdAt <= endDate;
        });
        
        prs.push(...filteredPRs);
        
        // If oldest PR in this page is older than start date, stop
        const oldestPR = data[data.length - 1];
        if (new Date(oldestPR.created_at) < startDate) {
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

async function getCommitsForRepo(owner, repo, startDate, endDate) {
  try {
    const commits = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= MAX_PAGES_PER_REPO) {
      const { data } = await octokit.repos.listCommits({
        owner,
        repo,
        since: startDate.toISOString(),
        until: endDate.toISOString(),
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

async function generateStatistics(startDate, endDate, label) {
  console.log(`Generating ${label} statistics for ${ORG_NAME} - ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  
  const repos = await getOrganizationRepos();
  console.log(`Found ${repos.length} repositories`);
  
  const prStats = {};
  const commitStats = {};
  
  for (const repo of repos) {
    console.log(`Processing ${repo.name}...`);
    
    // Get PRs
    const prs = await getPRsForRepo(ORG_NAME, repo.name, startDate, endDate);
    console.log(`  Found ${prs.length} PRs`);
    
    prs.forEach(pr => {
      const author = pr.user.login;
      prStats[author] = (prStats[author] || 0) + 1;
    });
    
    // Get commits
    const commits = await getCommitsForRepo(ORG_NAME, repo.name, startDate, endDate);
    console.log(`  Found ${commits.length} commits`);
    
    commits.forEach(commit => {
      if (commit.author && commit.author.login) {
        const author = commit.author.login;
        commitStats[author] = (commitStats[author] || 0) + 1;
      }
    });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
  }
  
  // Sort and get top 5
  const topPRContributors = Object.entries(prStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
    
  const topCommitContributors = Object.entries(commitStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  return {
    topPRContributors,
    topCommitContributors
  };
}

async function updateReadme(monthlyStats, yearlyStats) {
  const readmePath = path.join(__dirname, '../../profile/README.md');
  let readme = fs.readFileSync(readmePath, 'utf-8');
  
  const monthLabel = startOfMonth.toLocaleDateString(LOCALE, { year: 'numeric', month: 'long' });
  const yearLabel = now.getFullYear().toString();
  
  // Create the monthly statistics section
  let statsSection = `\n## 📊 Aylık İstatistikler (${monthLabel})\n\n`;
  
  if (monthlyStats.topPRContributors.length > 0) {
    statsSection += `### 🏆 En Çok PR Gönderen Geliştiriciler\n\n`;
    statsSection += `| Sıra | Geliştirici | PR Sayısı |\n`;
    statsSection += `|------|-------------|----------|\n`;
    monthlyStats.topPRContributors.forEach(([dev, count], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      statsSection += `| ${medal} ${index + 1} | [@${dev}](https://github.com/${dev}) | ${count} |\n`;
    });
    statsSection += `\n`;
  }
  
  if (monthlyStats.topCommitContributors.length > 0) {
    statsSection += `### 💻 En Çok Geliştirme Yapan Geliştiriciler\n\n`;
    statsSection += `| Sıra | Geliştirici | Commit Sayısı |\n`;
    statsSection += `|------|-------------|---------------|\n`;
    monthlyStats.topCommitContributors.forEach(([dev, count], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      statsSection += `| ${medal} ${index + 1} | [@${dev}](https://github.com/${dev}) | ${count} |\n`;
    });
    statsSection += `\n`;
  }
  
  // Create the yearly statistics section
  statsSection += `## 📈 Yıllık İstatistikler (${yearLabel})\n\n`;
  
  if (yearlyStats.topPRContributors.length > 0) {
    statsSection += `### 🏆 En Çok PR Gönderen Geliştiriciler\n\n`;
    statsSection += `| Sıra | Geliştirici | PR Sayısı |\n`;
    statsSection += `|------|-------------|----------|\n`;
    yearlyStats.topPRContributors.forEach(([dev, count], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      statsSection += `| ${medal} ${index + 1} | [@${dev}](https://github.com/${dev}) | ${count} |\n`;
    });
    statsSection += `\n`;
  }
  
  if (yearlyStats.topCommitContributors.length > 0) {
    statsSection += `### 💻 En Çok Geliştirme Yapan Geliştiriciler\n\n`;
    statsSection += `| Sıra | Geliştirici | Commit Sayısı |\n`;
    statsSection += `|------|-------------|---------------|\n`;
    yearlyStats.topCommitContributors.forEach(([dev, count], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      statsSection += `| ${medal} ${index + 1} | [@${dev}](https://github.com/${dev}) | ${count} |\n`;
    });
    statsSection += `\n`;
  }
  
  // Remove old stats sections if they exist
  const monthlyStatsMarker = '## 📊 Aylık İstatistikler';
  const yearlyStatsMarker = '## 📈 Yıllık İstatistikler';
  
  let statsStartIndex = readme.indexOf(monthlyStatsMarker);
  if (statsStartIndex === -1) {
    statsStartIndex = readme.indexOf(yearlyStatsMarker);
  }
  
  if (statsStartIndex !== -1) {
    // Find the next section (starts with ##) after the stats sections
    let nextSectionIndex = readme.indexOf('\n## ', statsStartIndex + 1);
    
    // Check if the next section is the yearly stats marker, if so skip it
    if (nextSectionIndex !== -1) {
      const nextSectionTitle = readme.substring(nextSectionIndex, nextSectionIndex + 50);
      if (nextSectionTitle.includes(yearlyStatsMarker.substring(3))) {
        // Find the section after the yearly stats
        nextSectionIndex = readme.indexOf('\n## ', nextSectionIndex + 1);
      }
    }
    
    if (nextSectionIndex !== -1) {
      readme = readme.substring(0, statsStartIndex) + readme.substring(nextSectionIndex);
    } else {
      // Stats section is at the end
      readme = readme.substring(0, statsStartIndex);
    }
  }
  
  // Insert new stats section after the team members section
  const teamSectionMarker = '## 👥 Ekip Üyelerimiz';
  const teamSectionIndex = readme.indexOf(teamSectionMarker);
  
  if (teamSectionIndex !== -1) {
    // Find the end of team section (next ## or end of file)
    const nextSectionIndex = readme.indexOf('\n## ', teamSectionIndex + teamSectionMarker.length);
    
    if (nextSectionIndex !== -1) {
      // Insert before next section
      readme = readme.substring(0, nextSectionIndex) + '\n' + statsSection + readme.substring(nextSectionIndex);
    } else {
      // Append at the end
      readme = readme.trimEnd() + '\n\n' + statsSection;
    }
  } else {
    // Append at the end if team section not found
    readme = readme.trimEnd() + '\n\n' + statsSection;
  }
  
  fs.writeFileSync(readmePath, readme);
  console.log('README updated successfully!');
}

async function main() {
  try {
    // Generate monthly statistics
    const monthlyStats = await generateStatistics(startOfMonth, endOfMonth, 'monthly');
    console.log('\nMonthly Top PR Contributors:', monthlyStats.topPRContributors);
    console.log('Monthly Top Commit Contributors:', monthlyStats.topCommitContributors);
    
    // Generate yearly statistics
    const yearlyStats = await generateStatistics(startOfYear, endOfYear, 'yearly');
    console.log('\nYearly Top PR Contributors:', yearlyStats.topPRContributors);
    console.log('Yearly Top Commit Contributors:', yearlyStats.topCommitContributors);
    
    await updateReadme(monthlyStats, yearlyStats);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
