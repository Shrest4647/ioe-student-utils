import { eq } from "drizzle-orm";
import { db } from "../index";
import {
  academicCourses,
  academicPrograms,
  collegeDepartmentProgramToCourses,
  collegeDepartments,
  collegeDepartmentsToPrograms,
  colleges,
  departments,
  universities,
} from "../schema";

// Configuration for IOE BCT Program
const IOE_CONFIG = {
  university: {
    name: "Tribhuvan University",
    slug: "tribhuvan-university",
    location: "Kirtipur, Kathmandu",
    country: "Nepal",
  },
  college: {
    name: "Institute of Engineering (IOE)",
    slug: "institute-of-engineering",
    type: "Constituent",
    location: "Pulchowk, Lalitpur",
  },
  department: {
    name: "Computer Engineering",
    slug: "computer-engineering",
  },
  program: {
    name: "BE Computer Engineering",
    code: "BCT",
    description:
      "Bachelor of Engineering in Computer Engineering - 4 year undergraduate program",
    credits: "140",
    degreeLevels: "undergraduate" as const,
  },
};

const ioeBCTCourses = [
  // ========================================
  // First Year - First Part (Semester 1)
  // ========================================
  {
    name: "Mathematics I",
    code: "SH401",
    description:
      "Derivatives and their applications including higher order derivatives, mean value theorems (Rolle's, Lagrange's, Cauchy's), power series (Taylor's, Maclaurin's), indeterminate forms (L'Hospital rule), asymptotes, and curvature. Integration and its applications covering definite integrals, improper integrals, beta-gamma functions, and applications for finding areas, arc length, surface and solid of revolution. Plane analytic geometry including coordinate transformations, ellipse and hyperbola. Ordinary differential equations and their applications covering first-order equations, linear differential equations, Bernoulli's equation, Clairaut's equation, and second-order linear differential equations with applications in engineering.",
    credits: "3",
    level: "1-1",
  },
  {
    name: "Computer Programming",
    code: "CT401",
    description:
      "Overview of computer software and programming languages, problem solving using computers including algorithm development and flowcharting. Introduction to C programming covering character set, keywords, data types, preprocessor directives, constants, variables, operators. Input and output operations, control statements (goto, if, if-else, switch, while, do-while, for). User-defined functions including call by value, call by reference, and recursion. Arrays and strings, structures, pointers, and data files. Programming in FORTRAN covering character set, data types, arithmetic operations, library functions, control structures, and arrays.",
    credits: "3",
    level: "1-1",
  },
  {
    name: "Engineering Drawing I",
    code: "ME401",
    description:
      "Introduction to engineering drawing principles, drawing instruments and their uses, lettering and dimensioning. Orthographic projections including first and third angle projections. Projection of points, lines, and planes. Projection of solids including prisms, pyramids, cylinders, and cones. Sectional views and development of surfaces. Isometric and perspective projections. Introduction to computer-aided drafting fundamentals.",
    credits: "2",
    level: "1-1",
  },
  {
    name: "Engineering Physics",
    code: "SH452",
    description:
      "Mechanics covering vectors, kinematics, dynamics, work-energy theorem, conservation laws. Heat and thermodynamics including laws of thermodynamics, heat transfer mechanisms. Waves and oscillations covering simple harmonic motion, wave motion, sound waves. Electricity and magnetism including electrostatics, current electricity, magnetic fields, electromagnetic induction. Optics covering geometrical optics, physical optics, interference, diffraction, polarization. Modern physics including quantum mechanics basics, atomic structure, nuclear physics, and semiconductor physics.",
    credits: "3",
    level: "1-1",
  },
  {
    name: "Applied Mechanics",
    code: "CE451",
    description:
      "Statics covering force systems, equilibrium of particles and rigid bodies, free body diagrams, moments and couples. Friction including laws of friction, applications. Centroids and center of gravity, moments of inertia. Dynamics covering kinematics of particles including rectilinear and curvilinear motion. Kinetics of particles including Newton's second law, work-energy principle, impulse-momentum principle. Kinematics and kinetics of rigid bodies. Simple machines and mechanical advantage.",
    credits: "3",
    level: "1-1",
  },
  {
    name: "Basic Electrical Engineering",
    code: "EE451",
    description:
      "DC circuits including Ohm's law, Kirchhoff's laws, mesh and nodal analysis, network theorems (Thevenin's, Norton's, superposition). AC fundamentals including sinusoidal waveforms, phasor representation, impedance, admittance. AC circuits covering series and parallel circuits, resonance, power in AC circuits. Three-phase systems including balanced and unbalanced loads. Transformers covering construction, working principle, equivalent circuit, efficiency, and voltage regulation. Electrical machines basics including DC machines and induction motors. Electrical safety and protection.",
    credits: "3",
    level: "1-1",
  },

  // ========================================
  // First Year - Second Part (Semester 2)
  // ========================================
  {
    name: "Mathematics II",
    code: "SH451",
    description:
      "Calculus of several variables including partial derivatives, total derivatives, maxima and minima of functions of several variables. Multiple integrals covering double and triple integrals, change of variables, applications. Vector calculus including gradient, divergence, curl, line integrals, surface integrals, volume integrals, Green's theorem, Gauss's divergence theorem, Stoke's theorem. Fourier series including Fourier coefficients, half-range series, Parseval's identity. Partial differential equations covering formation and solution of first-order and second-order PDEs, method of separation of variables.",
    credits: "3",
    level: "1-2",
  },
  {
    name: "Engineering Drawing II",
    code: "ME451",
    description:
      "Advanced projection techniques including auxiliary views and projections. Intersection of surfaces including intersection of cylinder-cylinder, cone-cylinder, prism-prism. Development of surfaces for various geometric shapes. Assembly and detail drawings including working drawings, exploded views. Computer-aided design and drafting practices. Dimensioning and tolerancing including geometric dimensioning and tolerancing (GD&T). Standard drawing practices and conventions.",
    credits: "2",
    level: "1-2",
  },
  {
    name: "Basic Electronics Engineering",
    code: "EX451",
    description:
      "Semiconductor devices including diodes (PN junction, Zener, LED, photodiode), transistors (BJT, FET, MOSFET). Diode applications including rectifiers, clippers, clampers, voltage multipliers. Transistor amplifiers including biasing, small-signal analysis, frequency response. Operational amplifiers covering ideal characteristics, inverting and non-inverting configurations, applications (adder, subtractor, integrator, differentiator, comparator). Digital electronics basics including number systems, logic gates, Boolean algebra, combinational logic design, flip-flops, registers, counters. Electronic instrumentation including sensors, transducers, and measurement techniques.",
    credits: "3",
    level: "1-2",
  },
  {
    name: "Engineering Chemistry",
    code: "SH403",
    description:
      "Electrochemistry including electrochemical cells, electrode potential, Nernst equation, electrolysis, corrosion and its prevention. Chemical thermodynamics including first and second laws, free energy, chemical equilibrium. Water treatment including hardness, softening methods, water quality parameters. Polymers including types, polymerization mechanisms, properties and applications. Environmental chemistry including air pollution, water pollution, and control measures. Fuels and combustion. Lubricants and their properties.",
    credits: "3",
    level: "1-2",
  },
  {
    name: "Fundamental of Thermodynamics & Heat Transfer",
    code: "ME402",
    description:
      "Thermodynamics covering basic concepts, laws of thermodynamics, thermodynamic processes, properties of pure substances, ideal gases, real gases. Carnot cycle, Otto cycle, Diesel cycle. Heat transfer including conduction (Fourier's law, thermal resistance, composite walls), convection (natural and forced, heat transfer coefficients), radiation (Stefan-Boltzmann law, black body radiation, gray bodies). Heat exchangers including types, LMTD method, effectiveness. Applications in thermal engineering systems.",
    credits: "3",
    level: "1-2",
  },
  {
    name: "Workshop Technology",
    code: "ME403",
    description:
      "Introduction to workshop practices and safety. Fitting work including marking, cutting, filing, drilling, tapping. Carpentry including timber identification, wood working tools, joints. Welding including types of welding (arc, gas), welding techniques, safety. Foundry including patterns, molding, casting processes. Sheet metal work including tools, operations, joints. Machining operations including turning, milling, drilling, grinding. Introduction to CNC machines.",
    credits: "2",
    level: "1-2",
  },

  // ========================================
  // Second Year - First Part (Semester 3)
  // ========================================
  {
    name: "Mathematics III",
    code: "SH501",
    description:
      "Linear algebra including matrices, determinants, rank, eigenvalues and eigenvectors, diagonalization, Cayley-Hamilton theorem. Complex analysis including complex numbers, analytic functions, Cauchy-Riemann equations, complex integration, Cauchy's theorem, Taylor and Laurent series, residues. Special functions including Gamma and Beta functions, Bessel functions, Legendre polynomials. Laplace transforms including properties, inverse transforms, solution of differential equations. Z-transforms and their applications.",
    credits: "3",
    level: "2-1",
  },
  {
    name: "Object Oriented Programming",
    code: "CT501",
    description:
      "Introduction to OOP concepts including objects, classes, abstraction, encapsulation, inheritance, polymorphism. C++ language constructs including program structure, character set, tokens, data types, operators, control structures. Functions including function overloading, inline functions, default arguments, pass by reference. Arrays, pointers, and strings in C++. Classes and objects including constructors, destructors, static members, friend functions. Operator overloading including unary and binary operators. Inheritance including single, multiple, multilevel, hierarchical, hybrid inheritance. Polymorphism and dynamic binding including virtual functions, pure virtual functions, abstract classes. Stream computation and file I/O. Templates including function and class templates, STL basics. Exception handling.",
    credits: "3",
    level: "2-1",
  },
  {
    name: "Electrical Circuit Theory",
    code: "EE501",
    description:
      "Circuit analysis techniques including mesh analysis, nodal analysis, network theorems (superposition, Thevenin's, Norton's, maximum power transfer). Transient analysis including RL, RC, and RLC circuits, first and second-order responses. Sinusoidal steady-state analysis including phasors, impedance, admittance, power calculations. Resonance in series and parallel circuits. Magnetically coupled circuits including self and mutual inductance, dot convention, transformers. Three-phase circuits including balanced and unbalanced systems, power measurement. Laplace transform applications in circuit analysis. Two-port networks including parameters (Z, Y, H, ABCD), interconnections.",
    credits: "3",
    level: "2-1",
  },
  {
    name: "Theory of Computation",
    code: "CT502",
    description:
      "Introduction to automata theory including alphabets, strings, languages. Finite automata including deterministic (DFA) and non-deterministic (NFA) finite automata, equivalence of DFA and NFA, minimization of DFA. Regular expressions and languages including conversion between FA and regular expressions, pumping lemma for regular languages, closure properties. Context-free grammars (CFG) including derivation trees, ambiguous grammars, simplification of CFGs, normal forms (Chomsky, Greibach). Pushdown automata (PDA) and context-free languages including equivalence of PDA and CFG. Turing machines including definition, design techniques, variants, Church-Turing thesis. Undecidability including decidability, halting problem, reducibility. Computational complexity including P and NP classes.",
    credits: "3",
    level: "2-1",
  },
  {
    name: "Electronic Devices and Circuit",
    code: "EX501",
    description:
      "Semiconductor physics including energy bands, charge carriers, transport phenomena. PN junction diodes including characteristics, analysis, applications. Bipolar junction transistors (BJT) including operation modes, characteristics, biasing, small-signal models, amplifiers. Field-effect transistors (FET) including JFET and MOSFET, characteristics, biasing, amplifiers. Multistage amplifiers including coupling methods, frequency response. Feedback amplifiers including types, effects, stability. Oscillators including Barkhausen criterion, RC and LC oscillators. Operational amplifiers including ideal characteristics, applications. Power amplifiers including class A, B, AB, C. Power supplies including rectifiers, filters, regulators.",
    credits: "3",
    level: "2-1",
  },
  {
    name: "Digital Logic",
    code: "EX502",
    description:
      "Number systems and codes including binary, octal, hexadecimal, BCD, Gray code, ASCII. Boolean algebra including postulates, theorems, logic gates, universal gates. Combinational logic including simplification using K-maps and Quine-McCluskey method, design of combinational circuits (adder, subtractor, comparator, decoder, encoder, multiplexer, demultiplexer). Sequential logic including flip-flops (SR, JK, D, T), flip-flop conversions. Registers and counters including shift registers, ripple counters, synchronous counters, ring counters. Memory devices including ROM, RAM, PROM, EPROM, EEPROM. Programmable logic devices including PAL, PLA, FPGA. Digital logic families including TTL, CMOS, ECL. Introduction to VHDL/Verilog.",
    credits: "3",
    level: "2-1",
  },
  {
    name: "Electromagnetism",
    code: "EX503",
    description:
      "Vector calculus including coordinate systems, gradient, divergence, curl. Electrostatics including Coulomb's law, electric field, Gauss's law, electric potential, conductors, dielectrics, capacitance. Magnetostatics including Biot-Savart law, Ampere's law, magnetic force, torque, magnetic materials. Time-varying fields including Faraday's law, inductance, energy. Maxwell's equations in integral and differential forms. Electromagnetic waves including wave equation, plane waves, polarization, Poynting vector. Transmission lines including parameters, equations, Smith chart, impedance matching. Waveguides including TE and TM modes, rectangular waveguides. Antennas including dipole antennas, antenna parameters, arrays.",
    credits: "3",
    level: "2-1",
  },

  // ========================================
  // Second Year - Second Part (Semester 4)
  // ========================================
  {
    name: "Electrical Machine",
    code: "EE554",
    description:
      "DC machines including construction, principle of operation, emf equation, types (generator and motor), characteristics, speed control, starters, testing. Transformers including construction, principle, equivalent circuit, losses and efficiency, voltage regulation, parallel operation, three-phase transformers, autotransformers. Synchronous machines including alternators (construction, emf, regulation, parallel operation), synchronous motors (principle, starting, applications). Induction motors including three-phase and single-phase types, principle, equivalent circuit, torque-slip characteristics, starting methods, speed control. Special machines including stepper motors, servomotors, universal motors.",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Numerical Method",
    code: "SH553",
    description:
      "Solution of algebraic and transcendental equations including bisection method, Newton-Raphson method, secant method, fixed-point iteration. Interpolation including Lagrange interpolation, Newton's divided difference, spline interpolation. Numerical differentiation and integration including trapezoidal rule, Simpson's rules, Gaussian quadrature. Solution of linear systems including Gaussian elimination, LU decomposition, Jacobi and Gauss-Seidel iterative methods. Numerical solution of ordinary differential equations including Euler's method, Runge-Kutta methods, predictor-corrector methods. Solution of partial differential equations including finite difference method. Eigenvalue problems. Error analysis and computer implementation.",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Applied Mathematics",
    code: "SH551",
    description:
      "Advanced topics in applied mathematics including transform methods (Fourier transforms, discrete Fourier transforms, fast Fourier transform), optimization techniques (linear programming, simplex method, transportation and assignment problems), numerical linear algebra, boundary value problems, variational methods. Applications of these mathematical tools to engineering problems including signal processing, control systems, structural analysis.",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Instrumentation I",
    code: "EE552",
    description:
      "Introduction to measurement systems including static and dynamic characteristics, error analysis. Sensors and transducers including classification, resistive, capacitive, inductive, piezoelectric, photoelectric, Hall effect sensors. Signal conditioning including amplification, filtering, modulation, demodulation. Data acquisition systems including ADC, DAC, sampling, multiplexing. Display devices including analog and digital meters, oscilloscopes, recorders. Measurement of physical quantities including temperature, pressure, flow, level, displacement, strain, force, torque. Virtual instrumentation and LabVIEW basics.",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Data Structure and Algorithm",
    code: "CT552",
    description:
      "Concept of data structures including data types, abstract data types, algorithms. Stacks and queues including operations, applications, evaluation of expressions. Linked lists including singly, doubly, circular linked lists, operations, applications. Trees including binary trees, BST, tree traversals, height-balanced trees (AVL), B-trees, heaps. Graphs including representations, traversals (BFS, DFS), shortest path algorithms (Dijkstra, Floyd-Warshall), minimum spanning trees (Prim's, Kruskal's), topological sorting. Sorting algorithms including bubble, selection, insertion, quicksort, mergesort, heapsort, radix sort. Searching algorithms including sequential, binary, hashing. Algorithm analysis including time and space complexity, Big-O notation, asymptotic analysis. Dynamic programming and greedy algorithms.",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Microprocessor",
    code: "EX551",
    description:
      "Introduction to microprocessors including architecture, programming model. 8085 microprocessor including architecture, instruction set, addressing modes, programming. 8086 microprocessor including architecture, memory organization, instruction set, addressing modes, assembly language programming. Memory interfacing including RAM, ROM, memory decoding. I/O interfacing including programmed I/O, interrupt-driven I/O, DMA. Peripheral devices and interfacing including 8255 PPI, 8253/8254 timer, 8259 PIC, 8251 USART, 8279 keyboard/display interface, ADC/DAC interfacing. Advanced microprocessors including 80286, 80386, Pentium architecture overview. Introduction to microcontrollers including 8051 architecture and programming.",
    credits: "3",
    level: "2-2",
  },
  {
    name: "Discrete Structure",
    code: "CT551",
    description:
      "Mathematical logic including propositional logic, predicate logic, inference rules, proof methods. Set theory including sets, operations, Venn diagrams, power sets, Cartesian products. Relations including types, properties, equivalence relations, partial orderings, lattices. Functions including types, composition, inverse, pigeonhole principle. Counting principles including permutations, combinations, binomial theorem, recurrence relations, generating functions. Graph theory including graphs, paths, cycles, connectivity, Euler and Hamiltonian paths, graph coloring, trees. Algebraic structures including groups, rings, fields, Boolean algebra. Introduction to computability and complexity.",
    credits: "3",
    level: "2-2",
  },

  // ========================================
  // Third Year - First Part (Semester 5)
  // ========================================
  {
    name: "Communication English",
    code: "EG604SH",
    description:
      "Communication skills for engineers including technical writing, report writing, business correspondence, proposal writing. Presentation skills including preparation, delivery, visual aids, handling questions. Reading comprehension and critical analysis of technical documents. Listening and speaking skills including participating in meetings, giving instructions, conducting interviews. Grammar and vocabulary for technical communication. Documentation standards and professional ethics in communication.",
    credits: "2",
    level: "3-1",
  },
  {
    name: "Probability and Statistics",
    code: "SH601",
    description:
      "Probability theory including sample space, events, axioms of probability, conditional probability, Bayes' theorem. Random variables including discrete and continuous types, probability distributions (binomial, Poisson, uniform, normal, exponential). Mathematical expectation including mean, variance, moments, moment generating functions. Joint distributions including marginal and conditional distributions, covariance, correlation. Sampling distributions including central limit theorem, t, chi-square, F distributions. Estimation including point estimation, confidence intervals. Hypothesis testing including tests for means, variances, proportions, goodness-of-fit. Regression and correlation analysis including linear regression, multiple regression. Design of experiments including ANOVA.",
    credits: "3",
    level: "3-1",
  },
  {
    name: "Computer Organization and Architecture",
    code: "CT601",
    description:
      "Digital logic fundamentals review. Register transfer and microoperations. Basic computer organization and design including instruction codes, instruction formats, addressing modes. CPU design including arithmetic logic unit, control unit (hardwired and microprogrammed), pipelining. Memory organization including hierarchy, cache memory, virtual memory, memory management. Input-output organization including I/O interface, modes of transfer, DMA, I/O processors. Pipelining including instruction pipeline, pipeline hazards, superscalar architecture. Multiprocessors including characteristics, interconnection structures, cache coherence, parallel processing. RISC vs CISC architecture. Advanced processor architectures including multicore, GPU, ARM architecture overview.",
    credits: "3",
    level: "3-1",
  },
  {
    name: "Software Engineering",
    code: "CT602",
    description:
      "Introduction to software engineering including software crisis, software process models (waterfall, iterative, agile). Software project management including planning, estimation, scheduling, risk management. Requirements engineering including elicitation, analysis, specification, validation. Software design including architectural design, object-oriented design, design patterns. Coding practices including coding standards, code review, version control. Software testing including levels (unit, integration, system), types (white-box, black-box), testing strategies. Software quality assurance including quality metrics, defect management. Software maintenance including types, re-engineering. Software configuration management. CASE tools and modern software development practices including DevOps, CI/CD.",
    credits: "3",
    level: "3-1",
  },
  {
    name: "Computer Graphics",
    code: "CT603",
    description:
      "Introduction to computer graphics including display devices, graphics software, graphics pipeline. Scan conversion including line drawing algorithms (DDA, Bresenham), circle and ellipse drawing. 2D transformations including translation, rotation, scaling, reflection, shear, composite transformations. 2D viewing including window-to-viewport mapping, clipping algorithms (Cohen-Sutherland, Liang-Barsky). 3D transformations and projections including parallel and perspective projections. 3D viewing and clipping. Hidden surface removal including z-buffer, scan-line, ray tracing. Illumination and shading models including Phong model, Gouraud shading, Phong shading. Curves and surfaces including Bezier curves, B-splines, NURBS. Animation basics. Graphics programming using OpenGL/WebGL.",
    credits: "3",
    level: "3-1",
  },
  {
    name: "Instrumentation II",
    code: "EE602",
    description:
      "Advanced measurement techniques including high-frequency measurements, microwave measurements. Signal analysis including spectrum analyzers, digital signal processing basics. Data communication in instrumentation including telemetry, wireless sensor networks. Virtual instrumentation including advanced LabVIEW programming, data acquisition and control. Smart sensors and intelligent instrumentation including smart transmitters, HART protocol, Fieldbus. Industrial instrumentation including control valves, final control elements, safety instrumentation systems (SIS). Calibration and maintenance of instruments. Computer-based instrumentation systems. Emerging trends in instrumentation including IoT sensors, MEMS.",
    credits: "3",
    level: "3-1",
  },
  {
    name: "Data Communication",
    code: "CT604",
    description:
      "Introduction to data communication including networks, protocols, standards, OSI and TCP/IP models. Physical layer including transmission media, multiplexing (FDM, TDM), switching (circuit, packet), ISDN. Data link layer including framing, error detection and correction (CRC, Hamming code), flow control (stop-and-wait, sliding window), ARQ protocols, HDLC, PPP. Medium access control including random access (ALOHA, CSMA/CD), controlled access, channelization, Ethernet, wireless LAN (IEEE 802.11). Network layer including logical addressing, subnetting, routing algorithms (distance vector, link state), routing protocols (RIP, OSPF, BGP), IP, ICMP, ARP. Transport layer including TCP, UDP, port addressing, connection management, flow and error control, congestion control. Application layer including DNS, email (SMTP, POP3, IMAP), HTTP, FTP.",
    credits: "3",
    level: "3-1",
  },

  // ========================================
  // Third Year - Second Part (Semester 6)
  // ========================================
  {
    name: "Engineering Economics",
    code: "CE655",
    description:
      "Introduction to engineering economics including principles, time value of money, cash flow diagrams. Interest and equivalence including simple and compound interest, nominal and effective interest rates, continuous compounding. Economic analysis including present worth, future worth, annual worth, rate of return methods. Comparison of alternatives including equal and unequal lives, replacement analysis. Depreciation including methods (straight-line, declining balance, MACRS), depletion. Taxes including after-tax analysis, tax credits. Inflation and price changes. Risk and uncertainty including sensitivity analysis, decision trees, expected value. Cost estimation including cost indices, learning curves. Economic decision-making in engineering projects.",
    credits: "3",
    level: "3-2",
  },
  {
    name: "Object Oriented Analysis and Design",
    code: "CT651",
    description:
      "Introduction to OOAD including concepts, UML basics. Object-oriented concepts including classes, objects, relationships, inheritance, polymorphism. Unified Process including phases, workflows, artifacts. UML diagrams including use case diagrams, class diagrams, sequence diagrams, activity diagrams, state machine diagrams, communication diagrams, component and deployment diagrams. Analysis including use case modeling, domain modeling, dynamic modeling. Design including architectural design, design patterns (creational, structural, behavioral), detailed design. Implementation considerations including mapping designs to code, testing OO systems. Case studies and project work using OOAD methodology and UML tools.",
    credits: "3",
    level: "3-2",
  },
  {
    name: "Artificial Intelligence",
    code: "CT653",
    description:
      "Introduction to AI including history, applications, intelligent agents. Problem-solving by searching including uninformed search (BFS, DFS), informed search (A*, heuristic search), local search, constraint satisfaction problems. Knowledge representation and reasoning including propositional and predicate logic, inference, knowledge-based systems. Planning including STRIPS, partial order planning. Uncertain knowledge and reasoning including probability, Bayesian networks, fuzzy logic. Machine learning including supervised learning (decision trees, neural networks, SVM), unsupervised learning, reinforcement learning basics. Natural language processing basics including syntax, semantics, parsing. Expert systems and intelligent agents. AI ethics and future directions.",
    credits: "3",
    level: "3-2",
  },
  {
    name: "Operating System",
    code: "CT656",
    description:
      "Introduction to operating systems including evolution, types, structures, system calls. Process management including process concepts, scheduling (FCFS, SJF, priority, RR), threads, multiprocessor scheduling. Process synchronization including critical section problem, semaphores, monitors, classical problems (producer-consumer, readers-writers, dining philosophers). Deadlocks including characterization, prevention, avoidance, detection, recovery. Memory management including swapping, contiguous allocation, paging, segmentation, virtual memory, page replacement algorithms (FIFO, LRU, optimal). File systems including file concepts, directory structures, allocation methods, free space management. I/O systems including I/O hardware, software, disk scheduling, RAID. Protection and security including access control, authentication, cryptography basics. Case studies including Linux, Windows architectures.",
    credits: "3",
    level: "3-2",
  },
  {
    name: "Embedded System",
    code: "CT655",
    description:
      "Introduction to embedded systems including characteristics, applications, challenges. Embedded processors including ARM architecture, microcontrollers, DSP. Embedded system design including hardware-software co-design, modeling, specification. Real-time operating systems including task scheduling, synchronization, memory management in RTOS. Interfacing including GPIO, timers, ADC, DAC, serial communication (UART, SPI, I2C), sensors and actuators. Embedded software development including cross-compilation, debugging, testing. Low-power design techniques. Embedded networking including CAN, USB, Ethernet. Case studies including automotive systems, consumer electronics, industrial control. Development tools including emulators, simulators, IDEs.",
    credits: "3",
    level: "3-2",
  },
  {
    name: "Database Management System",
    code: "CT652",
    description:
      "Introduction to DBMS including concepts, advantages, data models, system architecture. Relational model including structure, keys, relational algebra, relational calculus. SQL including DDL, DML, DCL, advanced SQL (joins, views, triggers, stored procedures). Database design including ER model, EER model, mapping to relational model. Normalization including functional dependencies, normal forms (1NF, 2NF, 3NF, BCNF), decomposition. Transaction processing including ACID properties, serializability, concurrency control (locking, timestamping, validation), deadlock handling. Recovery techniques including log-based recovery, checkpointing. Query processing and optimization including cost estimation, execution plans. Database security and integrity. Advanced topics including distributed databases, NoSQL basics, data warehousing, data mining introduction.",
    credits: "3",
    level: "3-2",
  },
  {
    name: "Minor Project",
    code: "CT654",
    description:
      "Minor project work involving design, implementation, and testing of a software/hardware system. Students work in groups under faculty supervision. Projects should demonstrate application of knowledge gained in previous courses. Deliverables include project proposal, design documents, implementation, testing, and final report with presentation. Emphasis on project management, documentation, teamwork, and technical communication skills.",
    credits: "2",
    level: "3-2",
  },

  // ========================================
  // Fourth Year - First Part (Semester 7)
  // ========================================
  {
    name: "ICT Project Management",
    code: "CT701",
    description:
      "Introduction to ICT project management including project lifecycle, knowledge areas. Project initiation including feasibility study, business case, project charter. Project planning including scope management, WBS, schedule development (CPM, PERT), resource planning, cost estimation and budgeting, quality planning, risk management. Project execution including team development, stakeholder management, procurement, communication. Project monitoring and control including earned value management, change control, configuration management. Project closure including handover, documentation, lessons learned. Agile project management including Scrum, Kanban. Software project estimation including COCOMO, function point analysis. Project management tools including MS Project, JIRA. Case studies of ICT project successes and failures.",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Organization and Management",
    code: "ME708",
    description:
      "Introduction to management including functions, theories, organizational structures. Planning including types, MBO, decision-making. Organizing including departmentalization, delegation, authority, responsibility. Staffing including recruitment, selection, training, performance appraisal. Directing including motivation theories (Maslow, Herzberg, McGregor), leadership styles, communication. Controlling including process, techniques, quality control. Financial management including financial statements, ratio analysis, capital budgeting. Marketing management including concepts, strategies, marketing mix. Operations management including productivity, supply chain, inventory control. Human resource management including HR functions, labor laws. Strategic management including SWOT analysis, strategic planning. Entrepreneurship and business plan development.",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Energy Environment and Society",
    code: "CT702",
    description:
      "Energy sources including fossil fuels, nuclear, renewable (solar, wind, hydro, biomass). Energy conversion and utilization including power generation, transmission, distribution. Energy conservation and management including energy auditing, efficiency improvement. Environmental science including ecosystem, biodiversity, pollution (air, water, soil, noise). Climate change including greenhouse effect, global warming, carbon footprint. Environmental impact assessment including methodologies, mitigation measures. Sustainable development including concepts, indicators, sustainable engineering practices. Environmental laws and regulations including national and international frameworks. Corporate social responsibility and environmental ethics. Green technologies and clean energy. Case studies on energy and environmental issues in Nepal.",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Distributed System",
    code: "CT703",
    description:
      "Introduction to distributed systems including characteristics, advantages, challenges, models. Communication in distributed systems including RPC, message passing, stream-oriented communication. Processes including threads, code migration, software agents. Naming including flat naming, structured naming, attribute-based naming. Synchronization including clock synchronization, logical clocks, mutual exclusion, distributed transactions, deadlock handling. Consistency and replication including data-centric consistency, client-centric consistency, replica management. Fault tolerance including process resilience, reliable client-server communication, distributed commit, recovery. Distributed file systems including architecture, NFS, AFS. Distributed object-based systems including CORBA, DCOM, Java RMI. Distributed Web-based systems including Web services, REST, SOAP. Peer-to-peer systems including architectures, content distribution. Case studies including distributed databases, cloud computing basics.",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Computer Networks and Security",
    code: "CT704",
    description:
      "Computer network fundamentals including OSI and TCP/IP models. Physical layer including transmission media, multiplexing, switching. Data link layer including framing, error control, flow control, MAC protocols, Ethernet, wireless LAN. Network layer including IP addressing, subnetting, routing algorithms and protocols, IP, ICMP, ARP. Transport layer including TCP, UDP, congestion control. Application layer including DNS, email, HTTP, FTP, socket programming. IPv6 including addressing, transition from IPv4. Network security including cryptography (symmetric, asymmetric), authentication, digital signatures, certificates, SSL/TLS, IPsec, VPN, firewalls, intrusion detection systems. Wireless security including WEP, WPA, WPA2. Security protocols and standards. Network management including SNMP, monitoring tools. Emerging network technologies including SDN, IoT networking.",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Digital Signal Analysis and Processing",
    code: "EX702",
    description:
      "Introduction to signals and systems including classification, operations, properties. Discrete-time signals and systems including sequences, system properties, LTI systems, convolution. Z-transform including properties, inverse, analysis of LTI systems. Fourier analysis including DTFT, DFT, FFT algorithms. Digital filter design including FIR filters (window method, frequency sampling), IIR filters (impulse invariance, bilinear transformation), filter structures. Implementation including finite word-length effects, quantization. DSP applications including audio processing, image processing, communications. DSP hardware including architecture, fixed-point vs floating-point. MATLAB programming for DSP.",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Elective I",
    code: "CT705",
    description:
      "Elective course covering advanced topics. Options include: Data Mining and Warehousing (data preprocessing, association rules, classification, clustering, data warehouse architecture, OLAP), Web Development/Technology (HTML, CSS, JavaScript, server-side programming, web frameworks, web services, security), Advanced Java Programming (JDBC, servlets, JSP, Java EE, Spring framework, Hibernate, web services), Avionics (aircraft systems, navigation, communication, flight control), Image Processing and Pattern Recognition (image enhancement, filtering, segmentation, feature extraction, pattern recognition methods), Radar (principles, systems, signal processing), Bio-Medical Instrumentation (medical instrumentation, imaging, signal processing).",
    credits: "3",
    level: "4-1",
  },
  {
    name: "Project I",
    code: "CT706",
    description:
      "First phase of major project work involving problem identification, literature review, requirements analysis, system design, and partial implementation. Students work individually or in small groups under faculty supervision. Emphasis on research methodology, technical writing, and presentation skills. Deliverables include project proposal, literature review report, design documents, and progress presentation. Project should demonstrate significant technical depth and application of engineering principles.",
    credits: "2",
    level: "4-1",
  },

  // ========================================
  // Fourth Year - Second Part (Semester 8)
  // ========================================
  {
    name: "Engineering Professional Practice",
    code: "CT751",
    description:
      "Professional ethics in engineering including codes of ethics, professional responsibility. Legal aspects including contract law, labor laws, intellectual property rights, liability. Engineering practice regulations including Nepal Engineering Council Act, professional registration. Project management including project appraisal, financing, documentation. Entrepreneurship including business planning, startup development, innovation management. Communication skills including technical writing, presentations, report preparation. Health, safety, and environment including workplace safety, risk assessment, environmental regulations. Sustainable development and social responsibility. Case studies on professional practice issues.",
    credits: "2",
    level: "4-2",
  },
  {
    name: "Information Systems",
    code: "CT752",
    description:
      "Introduction to information systems including types, strategic role, business value. Information systems in business including functional systems, cross-functional systems. Enterprise systems including ERP, SCM, CRM. E-commerce and e-business including models, technologies, security. Decision support systems including DSS, business intelligence, data warehousing, data mining. Knowledge management including concepts, systems, technologies. Information system development including methodologies, project management. Information security including threats, controls, risk management. Emerging trends including cloud computing, IoT, big data analytics, AI in business. Case studies on IS implementation.",
    credits: "3",
    level: "4-2",
  },
  {
    name: "Internet and Intranet",
    code: "CT753",
    description:
      "Internet architecture and protocols including TCP/IP suite, DNS, routing. Web technologies including HTTP, HTML, CSS, JavaScript, XML, JSON. Server-side programming including PHP, Python, Node.js, servlets. Database integration including SQL, NoSQL, ORM frameworks. Content management systems including WordPress, Drupal. Web services including REST, SOAP, microservices. Cloud computing including IaaS, PaaS, SaaS, deployment models. Intranet design and implementation including portal development, collaboration tools, knowledge management. Network security for internet/intranet including firewalls, VPN, SSL/TLS. Mobile web and responsive design. Web performance optimization. Emerging web technologies including Web 3.0, progressive web apps.",
    credits: "3",
    level: "4-2",
  },
  {
    name: "Simulation and Modeling",
    code: "CT754",
    description:
      "Introduction to simulation and modeling including types, applications, steps in simulation study. Discrete-event simulation including concepts, event scheduling, process interaction. Random number generation including methods, testing for randomness. Random variate generation including inverse transform, acceptance-rejection, composition. Input modeling including data collection, distribution fitting, goodness-of-fit tests. Verification and validation of simulation models including techniques, face validity, statistical procedures. Output analysis including transient removal, replication, batch means, comparison of alternative systems. Simulation languages and tools including MATLAB/Simulink, Arena, AnyLogic, NetLogo. Applications including manufacturing systems, computer networks, queuing systems. Monte Carlo simulation. Agent-based modeling basics.",
    credits: "3",
    level: "4-2",
  },
  {
    name: "Elective II",
    code: "CT755",
    description:
      "Elective course covering specialized topics. Options include: Agile Software Development (Agile principles, Scrum, XP, Kanban, DevOps, CI/CD pipelines), Networking With IPv6 (IPv6 addressing, protocols, transition mechanisms, deployment), Advanced Computer Architecture (superscalar processors, speculative execution, memory hierarchy, multiprocessors, GPU architecture), Big Data Technologies (Hadoop ecosystem, MapReduce, Spark, NoSQL databases, data streaming), Optical Fiber Communication System (optical fibers, transmitters, receivers, components, systems), Broadcast Engineering (radio and TV broadcasting, transmission systems, studio equipment), Wireless Communication (cellular systems, propagation, modulation, multiple access, 4G/5G), Database Management Systems (advanced database topics, data warehousing).",
    credits: "3",
    level: "4-2",
  },
  {
    name: "Elective III",
    code: "CT756",
    description:
      "Elective course covering advanced and emerging topics. Options include: Multimedia Systems (audio, video, graphics, compression, synchronization, authoring), Enterprise Application Design and Development (enterprise patterns, JEE/.NET frameworks, SOA, microservices, integration), Geographical Information System (spatial data, mapping, analysis, applications), Power Electronics (power semiconductor devices, converters, drives, applications), Remote Sensing (satellite systems, image processing, applications), XML Foundations and Applications (XML, DTD, Schema, XSLT, XPath, SOAP), Artificial Intelligence (advanced AI topics, deep learning, NLP, robotics), Speech Processing (speech recognition, synthesis, coding), Telecommunication (telecom networks, switching, signaling, services).",
    credits: "3",
    level: "4-2",
  },
  {
    name: "Project II",
    code: "CT757",
    description:
      "Continuation and completion of major project work started in Project I. Full implementation, testing, and deployment of the system. Comprehensive documentation including user manual, technical documentation, and final report. Final presentation and demonstration. Students work individually or in small groups under faculty supervision. Project should demonstrate comprehensive application of engineering knowledge, problem-solving skills, and professional competence. Emphasis on innovation, quality, and practical utility.",
    credits: "4",
    level: "4-2",
  },
];

async function seedIOEBCTCourses() {
  console.log("🌱 Seeding IOE BE Computer Engineering (BCT) courses...");
  const PROGRAM_ID = "PLACEHOLDER_BCT_PROGRAM_ID";

  if (PROGRAM_ID === "PLACEHOLDER_BCT_PROGRAM_ID") {
    console.error(
      "❌ Error: Please update PROGRAM_ID with the actual BE Computer (BCT) Program ID before running this seeder.",
    );
    console.error(
      "   You can find the program ID by querying the academicPrograms table or checking the database.",
    );
    process.exit(1);
  }

  try {
    let createdCount = 0;
    let skippedCount = 0;
    const courseLinks = [];

    for (const course of ioeBCTCourses) {
      try {
        // Check if course already exists by code
        const existingCourses = await db.query.academicCourses.findMany();
        const existingCourse = existingCourses.find(
          (c) => c.code === course.code,
        );

        let courseId: string;

        if (existingCourse) {
          courseId = existingCourse.id;
          skippedCount++;
          console.log(
            `⏭️ Course already exists: ${course.code} - ${course.name}`,
          );
        } else {
          // Generate a unique ID and slug
          courseId = crypto.randomUUID();
          const slug = course.code.toLowerCase().replace(/[^a-z0-9-]/g, "-");

          // Insert course
          await db.insert(academicCourses).values({
            id: courseId,
            name: course.name,
            slug: slug,
            code: course.code,
            description: course.description,
            credits: course.credits,
            isActive: true,
          });

          createdCount++;
          console.log(`✅ Created course: ${course.code} - ${course.name}`);
        }

        // Check if course is already linked to program
        const existingLinks =
          await db.query.collegeDepartmentProgramToCourses.findMany();
        const existingLink = existingLinks.find(
          (l) => l.programId === PROGRAM_ID && l.courseId === courseId,
        );

        if (!existingLink) {
          courseLinks.push({
            id: crypto.randomUUID(),
            programId: PROGRAM_ID,
            courseId: courseId,
            code: course.code,
            credits: course.credits,
            isActive: true,
          });
        }
      } catch (error: any) {
        console.error(
          `❌ Error creating course ${course.code}:`,
          error.message,
        );
      }
    }

    // Create program-course links
    if (courseLinks.length > 0) {
      await db.insert(collegeDepartmentProgramToCourses).values(courseLinks);
      console.log(`✅ Created ${courseLinks.length} program-course links`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${createdCount} courses`);
    console.log(`   ⏭️ Skipped: ${skippedCount} courses`);
    console.log(`   🔗 Linked: ${courseLinks.length} courses to program`);
    console.log(
      `✨ IOE BE Computer Engineering (BCT) course seeding completed!`,
    );
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seedIOEBCTCourses()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
