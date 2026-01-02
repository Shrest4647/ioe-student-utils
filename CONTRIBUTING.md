# Contributing to IOE Student Utils

Thank you for your interest in contributing to IOE Student Utils! We welcome contributions from the community to help improve this project.

## How to Contribute

### 1. Fork the Repository

A fork is your own copy of the project on GitHub where you can make changes without affecting the original project. This is the first step to contribute.

#### Step-by-Step Guide for Beginners:

1. **Sign in to GitHub**: If you don't have a GitHub account, create one at [github.com](https://github.com). Sign in to your account.

2. **Go to the Repository**: Visit the main repository page: [https://github.com/Shrest4647/ioe-student-utils](https://github.com/Shrest4647/ioe-student-utils).

3. **Fork the Repository**: Click the "Fork" button in the top-right corner of the page. This creates a copy of the repository under your GitHub account.

4. **Clone Your Fork**: After forking, you'll be redirected to your fork's page. Click the green "Code" button and copy the URL (it should look like `https://github.com/your-username/ioe-student-utils.git`).

   Now, open your terminal (Command Prompt on Windows, Terminal on Mac/Linux) and run:

   ```bash
   git clone https://github.com/your-username/ioe-student-utils.git
   cd ioe-student-utils
   ```

   This downloads the code to your computer and enters the project folder. If you don't have Git installed, download it from [git-scm.com](https://git-scm.com).

### 2. Set Up the Development Environment

This project uses Next.js, Better Auth, Elysia, and other modern web technologies. Ensure you have the following installed:

- Node.js (version 20 or higher)
- Bun (for package management)
- PostgreSQL / Docker (for the database)

Install dependencies:

```bash
bun install
```

Set up the environment variables:

```bash
cp .env.example .env
```

Now, Update the `.env` file with your local configuration.

Set up the database:

```bash
./start-database.sh
```

Run the database migrations:

```bash
bun db:generate
bun db:migrate
```

Run the development server:

```bash
bun run dev
```

### 3. Create a Branch

Create a new branch for your feature or bug fix:

```bash
git checkout -b feature/your-feature-name
```

### 4. Make Changes

- Follow the existing code style and conventions.
- Write clear, concise commit messages.
- Ensure your code is well-tested.
- Update documentation if necessary.

### 5. Test Your Changes

Run the test suite:

```bash
bun run check
```

```bash
bun run typecheck
```

Also, manually test the application to ensure everything works as expected.

### 6. Submit a Pull Request

A pull request (PR) is a proposal to merge your changes into the main project. After testing your changes, you need to push them to your fork and create a PR on GitHub.

#### Step-by-Step Guide for Beginners:

1. **Stage Your Changes**: In your terminal, from the project folder, run:

   ```bash
   git add [file1] [file2] [directory] [...]
   ```

   This adds your modified files to the staging area.

2. **Commit Your Changes**: Create a commit with a descriptive message:

   ```bash
   git commit -m "Add your descriptive commit message here"
   ```

   Example: `git commit -m "fix: Fixed login bug and improve error messages"`

3. **Push to Your Fork**: Push your branch to your GitHub fork:

   ```bash
   git push origin feature/your-feature-name
   ```

   Replace `feature/your-feature-name` with the name of your branch (from step 3).

4. **Create the Pull Request**:

   - Go to your fork on GitHub (https://github.com/your-username/ioe-student-utils).
   - Click the "Compare & pull request" button (it might appear after pushing, or click "Pull requests" tab and "New pull request").
   - Ensure the base repository is `Shrest4647/ioe-student-utils` and base branch is `main`.
   - The head repository should be your fork and head branch your feature branch.
   - Fill in the title and description: Explain what your changes do, why they're needed, and any related issues (e.g., "Fixes #123").
   - Enable the checkbox to allow maintainer edits (so we can make small changes if needed).
   - Click "Create pull request".

5. **Wait for Review**: The project maintainers will review your PR. They might ask for changes. If so, make the changes locally, commit, and push again (the PR will update automatically).

- Ensure your PR passes all CI checks.
- Be responsive to feedback and questions.
- Also be mindful that the maintainers are volunteers and may not be able to review your PR immediately.

## Code of Conduct

Please be respectful and inclusive in all interactions. We follow a code of conduct to ensure a positive environment for all contributors.

## Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub. Provide as much detail as possible, including steps to reproduce the issue.

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

Thank you for contributing!
