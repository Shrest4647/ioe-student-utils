# IOE Student Utils

**IOE Student Utils** is an open-source web portal designed to help students from the Institute of Engineering (IOE), Tribhuvan University, bridge the gap between local academic systems and international standards.

## Objective

The primary goal of this project is to create an open source, community driven ecosystem that will assist the current students and the graduates in their corresponding academic journey, especially in the process of applying to universities abroad by providing essential tools, guidelines, and resources.

## Planned Features

- **University Finder**: A comprehensive list of universities that accept TU credits, including their specific requirements and application processes.
- **Scholarship Database**: A list of scholarships available for international students, including eligibility criteria and application deadlines.
- **GPA Calculator**: Converts TU percentage scores to US 4.0 GPA equivalents using WES/Scholaro logic.
- **Resume Builder**: A tool to create professional resumes tailored for international applications.
- **Letter of Recommendation**: A tool to create professional letters of recommendation tailored for international applications.
- **Course Equivalency**: A tool to find equivalent courses for TU subjects in international universities.
- **Alumni Network**: A platform to connect with alumni and get insights into their experiences and advice.
- **Career Guidance**: Resources and advice on career paths, job markets, and industry trends.
- **Subject Selector**: Helps students select subjects for their 7th and 8th semesters based on their interests and career goals.
- **Credit Calculator**: Automatically converts Lecture, Tutorial, and Practical hours into standard credit hours used by International US/European universities.
- **Syllabus Explorer**: Detailed breakdown of chapters, sub-topics, and marks distribution (Internal vs. Final) for BCT (Bachelor of Computer Engineering).
- **Study Planner**: A tool to plan and track study/application schedules, including exam dates and study goals.
- **Resources Library**: A collection of study materials, past papers, and other resources to help students prepare for exams and applications.

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

4.  Setup the local postgres database
    If you have docker installed, you can run the following command to setup the database:

    ```bash
    ./start-database.sh
    ```

    If you don't have docker installed, you can manually create a new database and update the `.env` file with the database credentials.

5.  Run the database migrations

    ```bash
    bun db:generate
    bun db:migrate
    ```

6.  **Run the development server**
    ```bash
    bun dev
    ```

## OpenAPI Documentation

The API documentation is available at `/api/docs` when the server is running.

## Contributing

Contributions are welcome! Please refer to the [Contributing Guidelines](CONTRIBUTING.md) to get started. You can also open an issue or submit a pull request for any improvements or bug fixes.

## Roadmap

- [ ] Add support for Civil, Mechanical, Electrical and Electronics Engineering.
- [ ] Add dark mode.

## License

MIT License.
