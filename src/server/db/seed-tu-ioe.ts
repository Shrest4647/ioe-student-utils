import { _TU_IOE_DATA } from "../../data/tu-ioe";
import { db } from "./index";
import {
  academicPrograms,
  collegeDepartments,
  collegeDepartmentsToPrograms,
  colleges,
  departments,
  universities,
} from "./schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function seedTuIoe() {
  console.log("🌱 Seeding TU IOE data...");

  try {
    const existingUniversity = await db.query.universities.findFirst({
      where: { name: "Tribhuvan University" },
    });

    let universityId: string;

    if (!existingUniversity) {
      universityId = crypto.randomUUID();
      await db.insert(universities).values({
        id: universityId,
        name: "Tribhuvan University",
        slug: "tribhuvan-university",
        description:
          "Tribhuvan University (TU) is oldest and largest university in Nepal, established in 1959. The Institute of Engineering (IOE) is its premier engineering education institution.",
        websiteUrl: "https://www.tu.edu.np",
        location: "Kirtipur, Kathmandu, Nepal",
        country: "Nepal",
        establishedYear: "1959",
      });
      console.log("✅ Created Tribhuvan University");
    } else {
      universityId = existingUniversity.id;
      console.log("⏭️ Tribhuvan University already exists");
    }

    const uniqueDepartments = new Map<string, Set<string>>();
    const uniquePrograms = new Set<string>();

    for (const college of _TU_IOE_DATA.colleges) {
      for (const dept of college.departments) {
        if (!uniqueDepartments.has(dept.name)) {
          uniqueDepartments.set(dept.name, new Set());
        }
        for (const program of dept.programs) {
          uniqueDepartments.get(dept.name)?.add(program);
          uniquePrograms.add(program);
        }
      }
    }

    const departmentIds = new Map<string, string>();
    const existingDepartments = await db.query.departments.findMany();
    const existingDepartmentNames = new Set(
      existingDepartments.map((d) => d.name),
    );

    for (const [deptName] of uniqueDepartments) {
      let deptId: string;

      if (existingDepartmentNames.has(deptName)) {
        const existingDept = existingDepartments.find(
          (d) => d.name === deptName,
        );
        if (!existingDept) {
          deptId = crypto.randomUUID();
          await db.insert(departments).values({
            id: deptId,
            name: deptName,
            slug: slugify(deptName),
            description: `Department of ${deptName} at Tribhuvan University Institute of Engineering`,
          });
        } else {
          deptId = existingDept.id;
        }
      } else {
        deptId = crypto.randomUUID();
        await db.insert(departments).values({
          id: deptId,
          name: deptName,
          slug: slugify(deptName),
          description: `Department of ${deptName} at Tribhuvan University Institute of Engineering`,
        });
      }
      departmentIds.set(deptName, deptId);
    }
    console.log(`✅ Processed ${departmentIds.size} departments`);

    const programIds = new Map<string, string>();
    const existingPrograms = await db.query.academicPrograms.findMany();
    const existingProgramNames = new Set(existingPrograms.map((p) => p.name));

    for (const programName of uniquePrograms) {
      let programId: string;

      if (existingProgramNames.has(programName)) {
        const existingProgram = existingPrograms.find(
          (p) => p.name === programName,
        );
        if (!existingProgram) {
          programId = crypto.randomUUID();
          const code =
            programName
              .match(/\(([A-Z.]+)\)/)?.[1]
              ?.toUpperCase()
              .replace(/\./g, "")
              .substring(0, 10) || "";

          await db.insert(academicPrograms).values({
            id: programId,
            name: programName,
            code: code || slugify(programName).substring(0, 20).toUpperCase(),
            description: `${programName} program at Tribhuvan University Institute of Engineering`,
            degreeLevels: "undergraduate",
          });
        } else {
          programId = existingProgram.id;
        }
      } else {
        programId = crypto.randomUUID();
        const code =
          programName
            .match(/\(([A-Z.]+)\)/)?.[1]
            ?.toUpperCase()
            .replace(/\./g, "")
            .substring(0, 10) || "";

        await db.insert(academicPrograms).values({
          id: programId,
          name: programName,
          code: code || slugify(programName).substring(0, 20).toUpperCase(),
          description: `${programName} program at Tribhuvan University Institute of Engineering`,
          degreeLevels: "undergraduate",
        });
      }
      programIds.set(programName, programId);
    }
    console.log(`✅ Processed ${programIds.size} academic programs`);

    const existingColleges = await db.query.colleges.findMany();
    const existingCollegeNames = new Set(existingColleges.map((c) => c.name));

    for (const college of _TU_IOE_DATA.colleges) {
      let collegeId: string;

      if (existingCollegeNames.has(college.name)) {
        const existingCollege = existingColleges.find(
          (c) => c.name === college.name,
        );
        if (!existingCollege) {
          collegeId = crypto.randomUUID();
          await db.insert(colleges).values({
            id: collegeId,
            universityId,
            name: college.name,
            slug: slugify(college.name),
            type: college.type,
            description: `${college.name} - ${college.type} college of Tribhuvan University Institute of Engineering`,
          });
          console.log(`✅ Created college "${college.name}"`);
        } else {
          collegeId = existingCollege.id;
          console.log(`⏭️ College "${college.name}" already exists`);
        }
      } else {
        collegeId = crypto.randomUUID();
        await db.insert(colleges).values({
          id: collegeId,
          universityId,
          name: college.name,
          slug: slugify(college.name),
          type: college.type,
          description: `${college.name} - ${college.type} college of Tribhuvan University Institute of Engineering`,
        });
        console.log(`✅ Created college "${college.name}"`);
      }

      for (const dept of college.departments) {
        const deptId = departmentIds.get(dept.name);
        if (!deptId) continue;

        const existingCollegeDept = await db.query.collegeDepartments.findFirst(
          {
            where: {
              collegeId,
              departmentId: deptId,
            },
          },
        );

        let collegeDeptId: string;

        if (!existingCollegeDept) {
          collegeDeptId = crypto.randomUUID();
          await db.insert(collegeDepartments).values({
            id: collegeDeptId,
            collegeId,
            departmentId: deptId,
          });
        } else {
          collegeDeptId = existingCollegeDept.id;
        }

        for (const programName of dept.programs) {
          const programId = programIds.get(programName);
          if (!programId) continue;

          const existingProgram =
            await db.query.collegeDepartmentsToPrograms.findFirst({
              where: {
                collegeDepartmentId: collegeDeptId,
                programId,
              },
            });

          if (!existingProgram) {
            const cdpId = crypto.randomUUID();
            await db.insert(collegeDepartmentsToPrograms).values({
              id: cdpId,
              collegeDepartmentId: collegeDeptId,
              programId,
            });
          }
        }
      }
    }

    console.log("✨ TU IOE seeding completed!");
  } catch (error) {
    console.error("❌ TU IOE seeding failed:", error);
    throw error;
  }
}

seedTuIoe();
