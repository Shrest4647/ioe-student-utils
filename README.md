# IOE Student Utils

**IOE Student Utils** is an open-source web portal designed to help students from the Institute of Engineering (IOE), Tribhuvan University, bridge the gap between local academic systems and international standards.

## Objective

The primary goal of this project is to create an open source, community driven ecosystem that will assist the current students and the graduates in their corresponding academic journey, especially in the process of applying to universities abroad by providing essential tools, guidelines, and resources.

## Implemented Features

- **University Finder**: A comprehensive list of universities that accept TU credits, including specific requirements and application processes. Includes rating category support and admin endpoints.
- **Scholarship Database**: Global scholarships for international students with degree level, field of study, and country taxonomy filtering.
- **GPA Calculator**: Converts TU percentage scores to US 4.0 GPA equivalents using WES/Scholaro conversion logic.
- **Resume Builder**: Create and manage professional resumes tailored for international applications with template selections.
- **Letter of Recommendation**: Generate, customize, and edit professional recommendation letters for study applications.
- **Course Explorer**: Interactive BCT and Civil Engineering course navigation featuring chapter/topic marks breakdowns and dependency mappings via visual mindmaps.
- **Study Planner**: Creates personalized schedules, logs study sessions, tracks exams/assignments, and monitors checklist progress on a visual dashboard.
- **Resources Library**: Browse, tag, and upload academic files and URL attachments.
- **Quiz Platform**: Interactive multiple-choice quizzes with progress indicators, correct answer reveals, rationale displays, attempt history tracking, and admin dashboard controls.
- **Flashcard Platform**: Spaced repetition system (supporting SM-2 and FSRS algorithms) with an interactive card flipper UI, study sessions, local/server progress synchronization, deck/card/tag management, and detailed SRS scheduling simulators. Full MCP toolset support for AI agents.

## Planned Features

- **Alumni Network**: A platform to connect with alumni and get insights into their experiences and advice.
- **Career Guidance**: Resources and advice on career paths, job markets, and industry trends.
- **Subject Selector**: Helps students select elective subjects for their 7th and 8th semesters.
- **Credit Calculator**: Automatically converts Lecture, Tutorial, and Practical hours (L-T-P) into standard international credits.
- **Course Equivalency**: A tool to find equivalent courses for TU subjects in international universities.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + Elysia
- **Runtime & Package Manager**: [Bun](https://bun.sh)
- **Styling**: Tailwind CSS 4 + Shadcn UI + Radix UI
- **Authentication**: Better Auth
- **Icons**: Lucide React
- **Charts**: Recharts
- **Language**: TypeScript

## AI Agent Guidelines

This project includes specific instructions for AI agents (Gemini, Claude, Copilot, etc.) to ensure consistency in coding style and architecture.

- **[.cursorrules](.cursorrules)**: Global rules for AI editors.
- **[AGENTS.md](AGENTS.md)**: Detailed project-wide standards.

## Getting Started

1.  **Clone the repository**

    ```bash
    git clone https://github.com/Shrest4647/ioe-student-utils.git
    cd ioe-student-utils
    ```

2.  **Install dependencies**
    This project strictly uses **Bun**.

    ```bash
    bun install
    ```

3.  Create a local `.env` file:
    Start by copying the .env.example file

    ```bash
    cp .env.example .env
    ```

    Then update the values in the `.env` file to match your local environment.

4.  Set up Neon Local

    Neon Local creates a persistent development branch from the Neon project's
    default branch (normally production), so local development starts with
    production-like data while keeping schema changes isolated.

    ```bash
    cp .env.neon-local.example .env.neon-local
    ```

    Add your personal `NEON_API_KEY` and `NEON_PROJECT_ID` to
    `.env.neon-local`, then start the proxy:

    ```bash
    bun run db:local
    ```

    The command writes the static development `DATABASE_URL` when needed and
    applies pending migrations. Neon Local keeps one Neon branch per Git
    branch; its metadata and credentials are ignored by Git.

5.  **Run the development server**
    ```bash
    bun dev
    ```

## OpenAPI Documentation

The API documentation is available at `/api/docs` when the server is running.

## Testing

Use the root test runner script:

```bash
./ci-test.sh
```

Optional modes:

```bash
./ci-test.sh -I      # include non-MCP integration tests
./ci-test.sh -M      # include MCP tests
./ci-test.sh -I -M   # include both
```

Detailed guide: [docs/testing-workflow.md](docs/testing-workflow.md)

## Contributing

Contributions are welcome! Please refer to the [Contributing Guidelines](CONTRIBUTING.md) to get started. You can also open an issue or submit a pull request for any improvements or bug fixes.

## Roadmap

- [ ] Add support for Mechanical, Electrical and Electronics Engineering (BCT and Civil are already supported).
- [ ] Add dark mode.

## License

MIT License.
