import { db } from "../index";
import {
  academicCourses,
  courseTopics,
  courseUnits,
  resourceTags,
  topicPrerequisites,
  topicResourceLinks,
} from "../schema";

async function seedCourseExplorer() {
  console.log("🌱 Seeding course explorer data...");

  try {
    // 1. Create Academic Course (or get existing)
    let courseId = crypto.randomUUID();
    const existingCourses = await db.query.academicCourses.findMany();
    const existingCourse = existingCourses.find((c) => c.code === "BCT-301");

    if (existingCourse) {
      courseId = existingCourse.id;
      console.log("⏭️ Course already exists, using existing ID");
    } else {
      try {
        await db.insert(academicCourses).values({
          id: courseId,
          name: "Data Structures and Algorithms",
          slug: "data-structures-algorithms",
          code: "BCT-301",
          description:
            "Comprehensive study of fundamental data structures and algorithms, including arrays, linked lists, trees, graphs, sorting, and searching techniques with emphasis on time and space complexity analysis.",
          credits: "3",
          isActive: true,
        });
        console.log("✅ Created course: Data Structures and Algorithms");
      } catch (error: any) {
        // If unique constraint violated, try to find existing course
        if (error.code === "23505") {
          const courses = await db.query.academicCourses.findMany();
          const found = courses.find((c) => c.code === "BCT-301");
          if (found) {
            courseId = found.id;
            console.log("⏭️ Course already exists, using existing ID");
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    // Seed a few additional starter courses so landing/results are not empty
    const starterCourses = [
      {
        name: "Operating Systems",
        slug: "operating-systems",
        code: "BCT-302",
        description:
          "Core operating system concepts including processes, memory management, file systems, and concurrency.",
        credits: "3",
      },
      {
        name: "Database Management Systems",
        slug: "database-management-systems",
        code: "BCT-303",
        description:
          "Relational data modeling, SQL, normalization, transactions, and indexing for robust database design.",
        credits: "3",
      },
      {
        name: "Computer Networks",
        slug: "computer-networks",
        code: "BCT-304",
        description:
          "Network architecture, routing, transport protocols, and practical network performance concepts.",
        credits: "3",
      },
      {
        name: "Software Engineering",
        slug: "software-engineering",
        code: "BCT-305",
        description:
          "Software lifecycle, requirements engineering, testing, and team-based delivery practices.",
        credits: "3",
      },
    ];

    const courseCodes = new Set(
      (await db.query.academicCourses.findMany()).map((c) => c.code),
    );
    const missingStarterCourses = starterCourses
      .filter((course) => !courseCodes.has(course.code))
      .map((course) => ({
        id: crypto.randomUUID(),
        ...course,
        isActive: true,
      }));

    if (missingStarterCourses.length > 0) {
      await db.insert(academicCourses).values(missingStarterCourses);
      console.log(`✅ Created ${missingStarterCourses.length} starter courses`);
    } else {
      console.log("⏭️ Starter courses already available.");
    }

    // 2. Check if units already exist
    const existingUnits = await db.query.courseUnits.findMany();
    const unitsExistForCourse = existingUnits.some(
      (u) => u.courseId === courseId,
    );

    if (unitsExistForCourse) {
      console.log("⏭️ Course explorer data already seeded (units exist).");
      return;
    }

    // Create Course Units (Modules)
    const units = [
      {
        id: crypto.randomUUID(),
        slug: "module-1-foundations",
        courseId,
        name: "Module 1: Foundations",
        description:
          "Introduction to algorithms, complexity analysis, and basic data structures",
        sortOrder: 1,
        unitType: "module" as const,
      },
      {
        id: crypto.randomUUID(),
        slug: "module-2-arrays-strings",
        courseId,
        name: "Module 2: Arrays and Strings",
        description:
          "Deep dive into array operations, string manipulation, and pattern matching",
        sortOrder: 2,
        unitType: "module" as const,
      },
      {
        id: crypto.randomUUID(),
        slug: "module-3-linked-lists",
        courseId,
        name: "Module 3: Linked Lists",
        description:
          "Singly, doubly, and circular linked lists with common operations",
        sortOrder: 3,
        unitType: "module" as const,
      },
      {
        id: crypto.randomUUID(),
        slug: "module-4-stacks-queues",
        courseId,
        name: "Module 4: Stacks and Queues",
        description: "LIFO and FIFO data structures with applications",
        sortOrder: 4,
        unitType: "module" as const,
      },
      {
        id: crypto.randomUUID(),
        slug: "module-5-trees",
        courseId,
        name: "Module 5: Trees",
        description:
          "Binary trees, BST, AVL trees, and tree traversal algorithms",
        sortOrder: 5,
        unitType: "module" as const,
      },
      {
        id: crypto.randomUUID(),
        slug: "module-6-graphs",
        courseId,
        name: "Module 6: Graphs",
        description:
          "Graph representations, traversal, shortest paths, and minimum spanning trees",
        sortOrder: 6,
        unitType: "module" as const,
      },
      {
        id: crypto.randomUUID(),
        slug: "module-7-sorting",
        courseId,
        name: "Module 7: Sorting Algorithms",
        description: "Comparison and non-comparison based sorting algorithms",
        sortOrder: 7,
        unitType: "module" as const,
      },
      {
        id: crypto.randomUUID(),
        slug: "module-8-searching-hashing",
        courseId,
        name: "Module 8: Searching and Hashing",
        description:
          "Binary search, hash tables, and collision resolution techniques",
        sortOrder: 8,
        unitType: "module" as const,
      },
    ];

    await db.insert(courseUnits).values(units);
    console.log(`✅ Created ${units.length} units`);

    // 3. Create Topics for each unit
    const topicsMap = new Map<string, string[]>();

    // Module 1 Topics
    const module1Topics = [
      {
        id: crypto.randomUUID(),
        slug: "algorithm-analysis",
        unitId: units[0].id,
        name: "Algorithm Analysis",
        description: "Understanding time and space complexity, Big O notation",
        priorityLevel: "core" as const,
        hours: 6,
        weightage: "10.00",
        sortOrder: 1,
      },
      {
        id: crypto.randomUUID(),
        slug: "asymptotic-notation",
        unitId: units[0].id,
        name: "Asymptotic Notation",
        description: "Big O, Omega, Theta notations and their properties",
        priorityLevel: "core" as const,
        hours: 4,
        weightage: "8.00",
        sortOrder: 2,
      },
      {
        id: crypto.randomUUID(),
        slug: "recursion",
        unitId: units[0].id,
        name: "Recursion",
        description:
          "Recursive functions, base cases, and recursion tree analysis",
        priorityLevel: "core" as const,
        hours: 8,
        weightage: "12.00",
        sortOrder: 3,
      },
      {
        id: crypto.randomUUID(),
        slug: "divide-conquer",
        unitId: units[0].id,
        name: "Divide and Conquer",
        description: "Paradigm for designing efficient algorithms",
        priorityLevel: "important" as const,
        hours: 6,
        weightage: "10.00",
        sortOrder: 4,
      },
    ];
    topicsMap.set(
      units[0].id,
      module1Topics.map((t) => t.id),
    );

    // Module 2 Topics
    const module2Topics = [
      {
        id: crypto.randomUUID(),
        slug: "array-basics",
        unitId: units[1].id,
        name: "Array Basics",
        description: "Static vs dynamic arrays, operations, and applications",
        priorityLevel: "core" as const,
        hours: 4,
        weightage: "8.00",
        sortOrder: 1,
      },
      {
        id: crypto.randomUUID(),
        slug: "string-patterns",
        unitId: units[1].id,
        name: "String Patterns",
        description: "Pattern matching algorithms (KMP, Rabin-Karp)",
        priorityLevel: "important" as const,
        hours: 6,
        weightage: "10.00",
        sortOrder: 2,
      },
      {
        id: crypto.randomUUID(),
        slug: "two-pointers",
        unitId: units[1].id,
        name: "Two Pointers Technique",
        description: "Efficient array manipulation using two pointers",
        priorityLevel: "important" as const,
        hours: 5,
        weightage: "8.00",
        sortOrder: 3,
      },
      {
        id: crypto.randomUUID(),
        slug: "sliding-window",
        unitId: units[1].id,
        name: "Sliding Window",
        description: "Fixed and variable size sliding window problems",
        priorityLevel: "important" as const,
        hours: 5,
        weightage: "8.00",
        sortOrder: 4,
      },
    ];
    topicsMap.set(
      units[1].id,
      module2Topics.map((t) => t.id),
    );

    // Module 3 Topics
    const module3Topics = [
      {
        id: crypto.randomUUID(),
        slug: "singly-linked-list",
        unitId: units[2].id,
        name: "Singly Linked List",
        description: "Implementation and operations on singly linked lists",
        priorityLevel: "core" as const,
        hours: 6,
        weightage: "10.00",
        sortOrder: 1,
      },
      {
        id: crypto.randomUUID(),
        slug: "doubly-linked-list",
        unitId: units[2].id,
        name: "Doubly Linked List",
        description: "Implementation and operations on doubly linked lists",
        priorityLevel: "important" as const,
        hours: 4,
        weightage: "8.00",
        sortOrder: 2,
      },
      {
        id: crypto.randomUUID(),
        slug: "circular-linked-list",
        unitId: units[2].id,
        name: "Circular Linked List",
        description: "Circular linked lists and their applications",
        priorityLevel: "optional" as const,
        hours: 3,
        weightage: "5.00",
        sortOrder: 3,
      },
    ];
    topicsMap.set(
      units[2].id,
      module3Topics.map((t) => t.id),
    );

    // Module 4 Topics
    const module4Topics = [
      {
        id: crypto.randomUUID(),
        slug: "stack-implementation",
        unitId: units[3].id,
        name: "Stack Implementation",
        description: "Array and linked list based stack implementations",
        priorityLevel: "core" as const,
        hours: 4,
        weightage: "8.00",
        sortOrder: 1,
      },
      {
        id: crypto.randomUUID(),
        slug: "queue-implementation",
        unitId: units[3].id,
        name: "Queue Implementation",
        description: "Array and linked list based queue implementations",
        priorityLevel: "core" as const,
        hours: 4,
        weightage: "8.00",
        sortOrder: 2,
      },
      {
        id: crypto.randomUUID(),
        slug: "stack-applications",
        unitId: units[3].id,
        name: "Stack Applications",
        description:
          "Expression evaluation, parentheses balancing, backtracking",
        priorityLevel: "important" as const,
        hours: 5,
        weightage: "10.00",
        sortOrder: 3,
      },
      {
        id: crypto.randomUUID(),
        slug: "queue-applications",
        unitId: units[3].id,
        name: "Queue Applications",
        description: "Level order traversal, BFS, scheduling",
        priorityLevel: "important" as const,
        hours: 5,
        weightage: "10.00",
        sortOrder: 4,
      },
    ];
    topicsMap.set(
      units[3].id,
      module4Topics.map((t) => t.id),
    );

    // Module 5 Topics
    const module5Topics = [
      {
        id: crypto.randomUUID(),
        slug: "binary-tree-basics",
        unitId: units[4].id,
        name: "Binary Tree Basics",
        description: "Binary tree structure, properties, and operations",
        priorityLevel: "core" as const,
        hours: 6,
        weightage: "10.00",
        sortOrder: 1,
      },
      {
        id: crypto.randomUUID(),
        slug: "tree-traversal",
        unitId: units[4].id,
        name: "Tree Traversal",
        description: "Inorder, preorder, postorder, and level order traversal",
        priorityLevel: "core" as const,
        hours: 5,
        weightage: "10.00",
        sortOrder: 2,
      },
      {
        id: crypto.randomUUID(),
        slug: "binary-search-tree",
        unitId: units[4].id,
        name: "Binary Search Tree",
        description: "BST operations and complexity analysis",
        priorityLevel: "core" as const,
        hours: 6,
        weightage: "12.00",
        sortOrder: 3,
      },
      {
        id: crypto.randomUUID(),
        slug: "avl-tree",
        unitId: units[4].id,
        name: "AVL Tree",
        description: "Self-balancing BST with rotations",
        priorityLevel: "important" as const,
        hours: 6,
        weightage: "10.00",
        sortOrder: 4,
      },
    ];
    topicsMap.set(
      units[4].id,
      module5Topics.map((t) => t.id),
    );

    // Module 6 Topics
    const module6Topics = [
      {
        id: crypto.randomUUID(),
        slug: "graph-representations",
        unitId: units[5].id,
        name: "Graph Representations",
        description: "Adjacency matrix, adjacency list, edge list",
        priorityLevel: "core" as const,
        hours: 4,
        weightage: "8.00",
        sortOrder: 1,
      },
      {
        id: crypto.randomUUID(),
        slug: "graph-traversal",
        unitId: units[5].id,
        name: "Graph Traversal",
        description: "BFS and DFS algorithms",
        priorityLevel: "core" as const,
        hours: 6,
        weightage: "12.00",
        sortOrder: 2,
      },
      {
        id: crypto.randomUUID(),
        slug: "shortest-path",
        unitId: units[5].id,
        name: "Shortest Path",
        description: "Dijkstra's, Bellman-Ford, and Floyd-Warshall algorithms",
        priorityLevel: "important" as const,
        hours: 8,
        weightage: "15.00",
        sortOrder: 3,
      },
      {
        id: crypto.randomUUID(),
        slug: "minimum-spanning-tree",
        unitId: units[5].id,
        name: "Minimum Spanning Tree",
        description: "Prim's and Kruskal's algorithms",
        priorityLevel: "important" as const,
        hours: 6,
        weightage: "12.00",
        sortOrder: 4,
      },
      {
        id: crypto.randomUUID(),
        slug: "topological-sort",
        unitId: units[5].id,
        name: "Topological Sort",
        description: "Kahn's algorithm and DFS-based approach",
        priorityLevel: "optional" as const,
        hours: 3,
        weightage: "5.00",
        sortOrder: 5,
      },
    ];
    topicsMap.set(
      units[5].id,
      module6Topics.map((t) => t.id),
    );

    // Module 7 Topics
    const module7Topics = [
      {
        id: crypto.randomUUID(),
        slug: "bubble-selection-insertion",
        unitId: units[6].id,
        name: "Basic Sorting",
        description: "Bubble, selection, and insertion sort",
        priorityLevel: "core" as const,
        hours: 5,
        weightage: "8.00",
        sortOrder: 1,
      },
      {
        id: crypto.randomUUID(),
        slug: "merge-sort",
        unitId: units[6].id,
        name: "Merge Sort",
        description: "Divide and conquer based sorting algorithm",
        priorityLevel: "core" as const,
        hours: 6,
        weightage: "10.00",
        sortOrder: 2,
      },
      {
        id: crypto.randomUUID(),
        slug: "quick-sort",
        unitId: units[6].id,
        name: "Quick Sort",
        description:
          "Partition-based sorting with average O(n log n) complexity",
        priorityLevel: "core" as const,
        hours: 6,
        weightage: "12.00",
        sortOrder: 3,
      },
      {
        id: crypto.randomUUID(),
        slug: "heap-sort",
        unitId: units[6].id,
        name: "Heap Sort",
        description: "Sorting using binary heap data structure",
        priorityLevel: "important" as const,
        hours: 5,
        weightage: "10.00",
        sortOrder: 4,
      },
      {
        id: crypto.randomUUID(),
        slug: "counting-radix-bucket",
        unitId: units[6].id,
        name: "Non-Comparison Sorting",
        description: "Counting, radix, and bucket sort",
        priorityLevel: "optional" as const,
        hours: 6,
        weightage: "8.00",
        sortOrder: 5,
      },
    ];
    topicsMap.set(
      units[6].id,
      module7Topics.map((t) => t.id),
    );

    // Module 8 Topics
    const module8Topics = [
      {
        id: crypto.randomUUID(),
        slug: "binary-search",
        unitId: units[7].id,
        name: "Binary Search",
        description: "Binary search algorithm and its variants",
        priorityLevel: "core" as const,
        hours: 4,
        weightage: "10.00",
        sortOrder: 1,
      },
      {
        id: crypto.randomUUID(),
        slug: "hash-table-basics",
        unitId: units[7].id,
        name: "Hash Table Basics",
        description: "Hash functions, direct addressing, and chaining",
        priorityLevel: "core" as const,
        hours: 6,
        weightage: "12.00",
        sortOrder: 2,
      },
      {
        id: crypto.randomUUID(),
        slug: "collision-resolution",
        unitId: units[7].id,
        name: "Collision Resolution",
        description: "Chaining, open addressing, double hashing",
        priorityLevel: "important" as const,
        hours: 5,
        weightage: "10.00",
        sortOrder: 3,
      },
      {
        id: crypto.randomUUID(),
        slug: "hash-applications",
        unitId: units[7].id,
        name: "Hash Table Applications",
        description: "Symbol tables, caching, and Bloom filters",
        priorityLevel: "optional" as const,
        hours: 4,
        weightage: "5.00",
        sortOrder: 4,
      },
    ];
    topicsMap.set(
      units[7].id,
      module8Topics.map((t) => t.id),
    );

    // Insert all topics
    const allTopics = [
      ...module1Topics,
      ...module2Topics,
      ...module3Topics,
      ...module4Topics,
      ...module5Topics,
      ...module6Topics,
      ...module7Topics,
      ...module8Topics,
    ];

    await db.insert(courseTopics).values(allTopics);
    console.log(`✅ Created ${allTopics.length} topics`);

    // 4. Create Topic Prerequisites (strong dependencies)
    const prerequisites = [
      // Module 1 internal dependencies
      {
        id: crypto.randomUUID(),
        topicId: module1Topics[1].id,
        prerequisiteTopicId: module1Topics[0].id,
        dependencyType: "strong" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module1Topics[3].id,
        prerequisiteTopicId: module1Topics[2].id,
        dependencyType: "strong" as const,
      },

      // Module 2 depends on Module 1
      {
        id: crypto.randomUUID(),
        topicId: module2Topics[1].id,
        prerequisiteTopicId: module1Topics[0].id,
        dependencyType: "strong" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module2Topics[2].id,
        prerequisiteTopicId: module1Topics[2].id,
        dependencyType: "strong" as const,
      },

      // Module 3 depends on Module 1
      {
        id: crypto.randomUUID(),
        topicId: module3Topics[0].id,
        prerequisiteTopicId: module1Topics[2].id,
        dependencyType: "strong" as const,
      },

      // Module 4 has some internal dependencies
      {
        id: crypto.randomUUID(),
        topicId: module4Topics[2].id,
        prerequisiteTopicId: module4Topics[0].id,
        dependencyType: "strong" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module4Topics[3].id,
        prerequisiteTopicId: module4Topics[1].id,
        dependencyType: "strong" as const,
      },

      // Module 5 depends on Module 3
      {
        id: crypto.randomUUID(),
        topicId: module5Topics[1].id,
        prerequisiteTopicId: module3Topics[0].id,
        dependencyType: "strong" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module5Topics[2].id,
        prerequisiteTopicId: module5Topics[1].id,
        dependencyType: "strong" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module5Topics[3].id,
        prerequisiteTopicId: module5Topics[2].id,
        dependencyType: "strong" as const,
      },

      // Module 6 depends on earlier modules
      {
        id: crypto.randomUUID(),
        topicId: module6Topics[1].id,
        prerequisiteTopicId: module4Topics[3].id,
        dependencyType: "strong" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module6Topics[2].id,
        prerequisiteTopicId: module6Topics[1].id,
        dependencyType: "strong" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module6Topics[3].id,
        prerequisiteTopicId: module5Topics[3].id,
        dependencyType: "weak" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module6Topics[4].id,
        prerequisiteTopicId: module6Topics[1].id,
        dependencyType: "strong" as const,
      },

      // Module 7 has internal dependencies
      {
        id: crypto.randomUUID(),
        topicId: module7Topics[1].id,
        prerequisiteTopicId: module1Topics[3].id,
        dependencyType: "strong" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module7Topics[2].id,
        prerequisiteTopicId: module7Topics[1].id,
        dependencyType: "weak" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module7Topics[3].id,
        prerequisiteTopicId: module5Topics[0].id,
        dependencyType: "strong" as const,
      },

      // Module 8 depends on earlier modules
      {
        id: crypto.randomUUID(),
        topicId: module8Topics[0].id,
        prerequisiteTopicId: module2Topics[0].id,
        dependencyType: "strong" as const,
      },
      {
        id: crypto.randomUUID(),
        topicId: module8Topics[2].id,
        prerequisiteTopicId: module8Topics[1].id,
        dependencyType: "strong" as const,
      },
    ];

    await db.insert(topicPrerequisites).values(prerequisites);
    console.log(
      `✅ Created ${prerequisites.length} prerequisite relationships`,
    );

    // 5. Create Resource Links and Tags
    // Get some existing resources to link to topics
    const existingResources = await db.query.resources.findMany();
    const guides = existingResources.filter(
      (r) =>
        r.title.toLowerCase().includes("guide") ||
        r.title.toLowerCase().includes("tutorial"),
    );
    const templates = existingResources.filter((r) =>
      r.title.toLowerCase().includes("template"),
    );

    const resourceLinks: any[] = [];
    const resourceTagsData: any[] = [];

    if (guides.length > 0) {
      // Link Python tutorial to recursion
      resourceLinks.push({
        id: crypto.randomUUID(),
        topicId: module1Topics[2].id,
        resourceId: guides[0].id,
        relevance: "primary" as const,
        sortOrder: 1,
      });
      resourceTagsData.push({
        id: crypto.randomUUID(),
        resourceId: guides[0].id,
        tag: "recursion",
      });

      // Link to algorithm analysis
      if (guides.length > 1) {
        resourceLinks.push({
          id: crypto.randomUUID(),
          topicId: module1Topics[0].id,
          resourceId: guides[1].id,
          relevance: "primary" as const,
          sortOrder: 1,
        });
        resourceTagsData.push({
          id: crypto.randomUUID(),
          resourceId: guides[1].id,
          tag: "algorithms",
        });
      }
    }

    if (templates.length > 0) {
      // Link CV template to stack applications
      resourceLinks.push({
        id: crypto.randomUUID(),
        topicId: module4Topics[2].id,
        resourceId: templates[0].id,
        relevance: "supplementary" as const,
        sortOrder: 1,
      });
      resourceTagsData.push({
        id: crypto.randomUUID(),
        resourceId: templates[0].id,
        tag: "interview",
      });
    }
    if (resourceLinks.length > 0) {
      await db.insert(topicResourceLinks).values(resourceLinks);
      console.log(`✅ Created ${resourceLinks.length} resource links`);
    }

    if (resourceTagsData.length > 0) {
      await db.insert(resourceTags).values(resourceTagsData);
      console.log(`✅ Created ${resourceTagsData.length} resource tags`);
    }
    console.log("✨ Course explorer data seeding completed!");
  } catch (error) {
    console.error("❌ Seeding course explorer data failed:", error);
    throw error;
  }
}

seedCourseExplorer()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
