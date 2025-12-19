# 📤 Guide: Submitting Project to BEProjects_2026

This guide will help you submit your Insider Threat Detection project to the BEProjects_2026 repository.

## Prerequisites

- GitHub account
- Git installed on your system
- Your team number (e.g., 12)

---

## Step-by-Step Instructions

### Step 1: Fork the Repository on GitHub

1. Go to the BEProjects_2026 repository on GitHub
2. Click the **"Fork"** button in the top-right corner
3. Select your GitHub account as the destination
4. Wait for the fork to complete

**Note:** You'll need the repository URL. It's likely something like:

- `https://github.com/[ORGANIZATION]/BEProjects_2026` or
- `https://github.com/[USERNAME]/BEProjects_2026`

---

### Step 2: Clone Your Forked Repository

After forking, clone your fork to your local machine:

```bash
# Replace YOUR_USERNAME with your GitHub username
git clone https://github.com/YOUR_USERNAME/BEProjects_2026.git
cd BEProjects_2026
```

---

### Step 3: Create Your Team Folder

Create a folder with your team number (e.g., `Team_12`):

```bash
# Replace 12 with your actual team number
mkdir Team_12
```

---

### Step 4: Copy Your Project Files

Copy all your project files into the team folder:

```bash
# From your current project directory
cp -r /Users/abhinavpv/Desktop/insider-threat-detection/* Team_12/
```

**Or use the automated script** (see below)

---

### Step 5: Commit and Push Changes

```bash
# Add all files
git add Team_12/

# Commit with a descriptive message
git commit -m "Add Team_12 project: Insider Threat Detection System"

# Push to your fork
git push origin main
```

---

### Step 6: Create Pull Request on GitHub

1. Go to your forked repository on GitHub: `https://github.com/YOUR_USERNAME/BEProjects_2026`
2. Click on **"Contribute"** button (usually visible when viewing your fork)
3. Click **"Open Pull Request"**
4. Review the changes
5. Fill in the PR title and description
6. Click **"Create Pull Request"**

---

## 🚀 Automated Script

Run the helper script to automate steps 3-5:

```bash
bash submit_to_beprojects.sh
```

The script will:

- Ask for your team number
- Ask for the path to your BEProjects_2026 fork
- Create the team folder
- Copy all project files
- Commit and push changes

---

## ⚠️ Important Notes

1. **Don't commit sensitive data**: Make sure `.env` files, API keys, or passwords are in `.gitignore`
2. **Check .gitignore**: Ensure your project's `.gitignore` is properly set up
3. **Team Number**: Confirm your team number before creating the folder
4. **Repository URL**: You'll need the exact URL of the BEProjects_2026 repository

---

## Troubleshooting

### If you get "remote repository not found"

- Make sure you've forked the repository first
- Check that you're using the correct GitHub username

### If you get permission errors

- Make sure you're authenticated with GitHub (use `gh auth login` or SSH keys)

### If files are too large

- Some files might exceed GitHub's file size limits
- Check for large binary files or model files that might need to be excluded
